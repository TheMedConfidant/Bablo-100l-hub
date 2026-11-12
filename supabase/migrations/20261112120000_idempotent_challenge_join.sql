-- Make challenge joins idempotent so reopening a shared link/code never resets a player's Ready state.
create or replace function public.hub_challenge_accept(p_token text, p_match_id uuid)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_actor text;
  v_match public.hub_challenge_matches%rowtype;
  v_count integer;
  v_capacity integer;
  v_existing_status text;
begin
  v_actor := public.hub_challenge_actor(p_token);
  if v_actor is null then raise exception 'Please log in again.'; end if;

  select * into v_match
    from public.hub_challenge_matches
   where id = p_match_id
   for update;
  if not found then raise exception 'Challenge not found.'; end if;

  v_capacity := greatest(2, least(8, coalesce((v_match.settings->>'max_players')::integer, 2)));
  select status into v_existing_status
    from public.hub_challenge_players
   where match_id = p_match_id and player_uid = v_actor;

  -- A participant reopening their own invitation should resume, not be rejoined.
  if v_existing_status in ('joined','ready','completed') then
    select count(*) into v_count
      from public.hub_challenge_players
     where match_id = p_match_id and status in ('joined','ready','completed');
    return jsonb_build_object(
      'ok', true, 'match_id', p_match_id, 'status', v_match.status,
      'player_count', v_count, 'max_players', v_capacity,
      'already_joined', true
    );
  end if;

  if v_match.status <> 'waiting' then
    raise exception 'This challenge is no longer accepting players.';
  end if;
  if v_match.invited_uid is not null and v_match.invited_uid <> v_actor then
    raise exception 'This challenge is private.';
  end if;
  if v_actor = v_match.created_by then
    raise exception 'You cannot accept your own challenge.';
  end if;
  if exists (
    select 1 from public.hub_user_blocks
     where (blocker_uid = v_actor and blocked_uid = v_match.created_by)
        or (blocker_uid = v_match.created_by and blocked_uid = v_actor)
  ) then
    raise exception 'This challenge is unavailable.';
  end if;

  select count(*) into v_count
    from public.hub_challenge_players
   where match_id = p_match_id and status in ('joined','ready');
  if v_count >= v_capacity then raise exception 'This room is full.'; end if;

  insert into public.hub_challenge_players(match_id, player_uid, status)
  values (p_match_id, v_actor, 'joined')
  on conflict (match_id, player_uid) do update set status = 'joined';

  select count(*) into v_count
    from public.hub_challenge_players
   where match_id = p_match_id and status in ('joined','ready');
  update public.hub_challenge_matches
     set status = case when v_count >= v_capacity then 'ready' else 'waiting' end,
         starts_at = null,
         ends_at = null
   where id = p_match_id
   returning * into v_match;

  insert into public.hub_challenge_notifications(
    recipient_uid, actor_uid, kind, title, body, target_id
  ) values (
    v_match.created_by, v_actor, 'challenge_accepted',
    'Player joined your challenge',
    'A student joined your room. The match starts when every player is ready.',
    p_match_id::text
  );

  return jsonb_build_object(
    'ok', true, 'match_id', p_match_id, 'status', v_match.status,
    'ready_count', 0, 'player_count', v_count, 'max_players', v_capacity
  );
end
$function$;

-- Reopening a code for an existing participant resumes the room even after it
-- has filled or started. New participants are still admitted only in waiting rooms.
create or replace function public.hub_challenge_join_code(p_token text, p_code text)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_actor text;
  v_match uuid;
begin
  v_actor := public.hub_challenge_actor(p_token);
  if v_actor is null then raise exception 'Please log in again.'; end if;

  select id into v_match
    from public.hub_challenge_matches
   where upper(invite_code) = upper(regexp_replace(trim(coalesce(p_code,'')), '[[:space:]-]', '', 'g'))
   limit 1;

  if v_match is null then raise exception 'No challenge matches that room code.'; end if;
  return public.hub_challenge_accept(p_token, v_match);
end
$function$;
