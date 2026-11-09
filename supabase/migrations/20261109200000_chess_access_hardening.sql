-- Bablo Hub chess access hardening (2026-11-09)
begin;

-- Match creation, joining, moves and results are handled by session-validated
-- RPCs / the hub-chess-action Edge Function. Clients may read only the match
-- state needed by the existing lobby UI; they cannot forge or rewrite rows.
revoke insert, update, delete on table public.chess_games from anon, authenticated;
drop policy if exists "create chess games" on public.chess_games;

-- Chess chat is now session-validated and participant-scoped.
create or replace function public.hub_chess_chat_list(p_token text, p_game_id uuid, p_dev text)
returns jsonb language plpgsql security definer set search_path=public
as $$
declare account_id text; g public.chess_games%rowtype; messages jsonb;
begin
  select unique_id into account_id from public.hub_sessions
   where token=p_token and expires_at>now() limit 1;
  if account_id is null then return jsonb_build_object('ok',false,'error','Your session has expired.'); end if;
  select * into g from public.chess_games where id=p_game_id;
  if not found then return jsonb_build_object('ok',false,'error','Game not found.'); end if;
  if not (g.white_uid=account_id or g.black_uid=account_id
    or (g.white_uid is null and g.white_dev=p_dev)
    or (g.black_uid is null and g.black_dev=p_dev)) then
    return jsonb_build_object('ok',false,'error','You are not a player in this game.');
  end if;
  select coalesce(jsonb_agg(jsonb_build_object('id',m.id,'nick',m.nick,'body',m.body,'created_at',m.created_at) order by m.created_at asc),'[]'::jsonb)
    into messages from (select * from public.chess_messages where game_id=p_game_id order by created_at desc limit 100) m;
  return jsonb_build_object('ok',true,'messages',messages);
end $$;

create or replace function public.hub_chess_chat_send(p_token text, p_game_id uuid, p_dev text, p_body text)
returns jsonb language plpgsql security definer set search_path=public
as $$
declare account_id text; acc public.hub_accounts%rowtype; g public.chess_games%rowtype; body_text text;
begin
  select unique_id into account_id from public.hub_sessions
   where token=p_token and expires_at>now() limit 1;
  if account_id is null then return jsonb_build_object('ok',false,'error','Your session has expired.'); end if;
  select * into acc from public.hub_accounts where unique_id=account_id;
  select * into g from public.chess_games where id=p_game_id;
  if not found then return jsonb_build_object('ok',false,'error','Game not found.'); end if;
  if g.status<>'active' or not (g.white_uid=account_id or g.black_uid=account_id
    or (g.white_uid is null and g.white_dev=p_dev)
    or (g.black_uid is null and g.black_dev=p_dev)) then
    return jsonb_build_object('ok',false,'error','Only players in an active game can chat.');
  end if;
  body_text:=btrim(coalesce(p_body,''));
  if char_length(body_text)<1 or char_length(body_text)>200 or body_text ~ '[[:cntrl:]]' then
    return jsonb_build_object('ok',false,'error','Message must be 1–200 characters.');
  end if;
  if (select count(*) from public.chess_messages where game_id=p_game_id and nick=coalesce(acc.username,acc.nickname) and created_at>now()-interval '1 minute')>=12 then
    return jsonb_build_object('ok',false,'error','Slow down a little before sending another message.');
  end if;
  insert into public.chess_messages(game_id,nick,body) values(p_game_id,left(coalesce(acc.username,acc.nickname),30),body_text);
  return jsonb_build_object('ok',true);
end $$;

create or replace function public.hub_chess_chat_clear(p_token text, p_game_id uuid, p_dev text)
returns jsonb language plpgsql security definer set search_path=public
as $$
declare account_id text; g public.chess_games%rowtype;
begin
  select unique_id into account_id from public.hub_sessions
   where token=p_token and expires_at>now() limit 1;
  if account_id is null then return jsonb_build_object('ok',false,'error','Your session has expired.'); end if;
  select * into g from public.chess_games where id=p_game_id;
  if not found or g.status<>'finished' or not (g.white_uid=account_id or g.black_uid=account_id
    or (g.white_uid is null and g.white_dev=p_dev)
    or (g.black_uid is null and g.black_dev=p_dev)) then
    return jsonb_build_object('ok',false,'error','Only players may clear chat after a finished game.');
  end if;
  delete from public.chess_messages where game_id=p_game_id;
  return jsonb_build_object('ok',true);
end $$;

revoke all on table public.chess_messages from anon, authenticated;
drop policy if exists "clear finished chat" on public.chess_messages;
drop policy if exists "read chess chat" on public.chess_messages;
drop policy if exists "send chess chat" on public.chess_messages;
revoke all on function public.hub_chess_chat_list(text,uuid,text) from public;
revoke all on function public.hub_chess_chat_send(text,uuid,text,text) from public;
revoke all on function public.hub_chess_chat_clear(text,uuid,text) from public;
grant execute on function public.hub_chess_chat_list(text,uuid,text) to anon, authenticated;
grant execute on function public.hub_chess_chat_send(text,uuid,text,text) to anon, authenticated;
grant execute on function public.hub_chess_chat_clear(text,uuid,text) to anon, authenticated;
commit;
