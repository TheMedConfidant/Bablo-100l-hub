-- Bablo Chess: targeted friend challenges and protected online ratings.
-- Applied to the linked Bablo Hub Supabase project on 2026-10-24.
-- Both RPCs validate the existing Hub session token because Hub accounts use
-- the application's token/session tables rather than Supabase Auth sessions.

create or replace function public.hub_create_chess_challenge(
  p_token text,
  p_code text,
  p_dev text,
  p_target_username text default null
)
returns json
language plpgsql
security definer
set search_path = public, extensions
as $function$
declare
  acc public.hub_accounts%rowtype;
  target_acc public.hub_accounts%rowtype;
  created public.chess_games%rowtype;
  target_name text := nullif(lower(btrim(coalesce(p_target_username, ''))), '');
begin
  select a.* into acc
  from public.hub_sessions s
  join public.hub_accounts a on a.unique_id = s.unique_id
  where s.token = p_token and s.expires_at > now();

  if not found then
    return json_build_object('ok', false, 'error', 'Your session has expired. Please log in again.');
  end if;

  if coalesce(p_code, '') !~ '^[A-Z0-9]{6}$' then
    return json_build_object('ok', false, 'error', 'Could not create a valid challenge code. Try again.');
  end if;

  if coalesce(length(p_dev), 0) < 1 or length(p_dev) > 64 then
    return json_build_object('ok', false, 'error', 'This device identity is invalid. Refresh and try again.');
  end if;

  if target_name is not null then
    select a.* into target_acc
    from public.hub_accounts a
    where lower(a.username) = target_name;

    if not found then
      return json_build_object('ok', false, 'error', 'No player found with that username.');
    end if;

    if target_acc.unique_id = acc.unique_id then
      return json_build_object('ok', false, 'error', 'You cannot challenge your own account.');
    end if;
  end if;

  insert into public.chess_games(
    code, white_nick, white_dev, white_uid,
    target_uid, target_dev, status, moves
  )
  values (
    p_code, left(acc.nickname, 30), p_dev, acc.unique_id,
    case when target_name is null then null else target_acc.unique_id end,
    null, 'waiting', ''
  )
  returning * into created;

  return json_build_object(
    'ok', true,
    'id', created.id,
    'code', created.code,
    'white_nick', created.white_nick,
    'target_uid', created.target_uid,
    'target_username', case when target_name is null then null else target_acc.username end
  );
exception
  when unique_violation then
    return json_build_object('ok', false, 'error', 'That challenge code was just used. Please try again.');
end;
$function$;

create or replace function public.hub_join_chess_challenge(
  p_token text,
  p_code text,
  p_dev text
)
returns json
language plpgsql
security definer
set search_path = public, extensions
as $function$
declare
  acc public.hub_accounts%rowtype;
  game public.chess_games%rowtype;
  joined public.chess_games%rowtype;
begin
  select a.* into acc
  from public.hub_sessions s
  join public.hub_accounts a on a.unique_id = s.unique_id
  where s.token = p_token and s.expires_at > now();

  if not found then
    return json_build_object('ok', false, 'error', 'Your session has expired. Please log in again.');
  end if;

  if coalesce(length(p_dev), 0) < 1 or length(p_dev) > 64 then
    return json_build_object('ok', false, 'error', 'This device identity is invalid. Refresh and try again.');
  end if;

  select g.* into game
  from public.chess_games g
  where g.code = upper(btrim(coalesce(p_code, '')))
    and g.status = 'waiting'
  for update;

  if not found then
    return json_build_object('ok', false, 'error', 'That challenge is no longer available.');
  end if;

  if game.white_dev = p_dev or game.white_uid = acc.unique_id then
    return json_build_object('ok', false, 'error', 'You cannot join your own challenge.');
  end if;

  if game.target_uid is not null and game.target_uid <> acc.unique_id then
    return json_build_object('ok', false, 'error', 'This challenge was sent to another player.');
  end if;

  if game.target_dev is not null and game.target_dev <> p_dev then
    return json_build_object('ok', false, 'error', 'This challenge was sent to another device.');
  end if;

  update public.chess_games
  set status = 'active',
      black_nick = left(acc.nickname, 30),
      black_dev = p_dev,
      black_uid = acc.unique_id,
      updated_at = now()
  where id = game.id and status = 'waiting'
  returning * into joined;

  if not found then
    return json_build_object('ok', false, 'error', 'That challenge was just taken.');
  end if;

  return json_build_object(
    'ok', true,
    'id', joined.id,
    'code', joined.code,
    'white_nick', joined.white_nick,
    'black_nick', joined.black_nick,
    'status', joined.status
  );
end;
$function$;

revoke all on function public.hub_create_chess_challenge(text, text, text, text) from public;
revoke all on function public.hub_join_chess_challenge(text, text, text) from public;
grant execute on function public.hub_create_chess_challenge(text, text, text, text) to anon, authenticated;
grant execute on function public.hub_join_chess_challenge(text, text, text) to anon, authenticated;

-- Public clients may read leaderboard rows, but only the trusted Elo trigger
-- may insert or change rating records.
drop policy if exists chess_ratings_insert_own on public.chess_ratings;
drop policy if exists chess_ratings_update_all on public.chess_ratings;
revoke insert, update, delete on table public.chess_ratings from anon, authenticated;
