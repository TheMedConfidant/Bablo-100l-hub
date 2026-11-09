-- Bablo Hub security hardening (2026-11-09)
-- Keep custom-session RPCs as the supported app boundary. RLS remains enabled.
begin;

-- Sensitive records are accessed through owner-checked RPCs or server-side
-- Edge Functions; public Data API table access is not required.
revoke all on table public.admin_config, public.hub_failed_logins,
  public.hub_sessions, public.hub_accounts, public.chess_games,
  public.chess_messages
from anon, authenticated;

-- Admin analytics is available only through the guarded admin RPC.
revoke execute on function public.analytics_dashboard(text, integer)
from public, anon, authenticated;

-- Chess tables no longer expose direct client CRUD. Creation/join/read use
-- account-session RPCs; moves use the membership- and legality-checked
-- hub-chess-action Edge Function; chat uses player-checked RPCs.
drop policy if exists "create chess games" on public.chess_games;
drop policy if exists "read chess games" on public.chess_games;
drop policy if exists "update chess games" on public.chess_games;
drop policy if exists "read chess chat" on public.chess_messages;
drop policy if exists "send chess chat" on public.chess_messages;
drop policy if exists "clear finished chat" on public.chess_messages;

create or replace function public.hub_chess_open_challenges(p_token text)
returns json language plpgsql security definer set search_path to 'public'
as $$
declare account_id text; rows_json json;
begin
 select unique_id into account_id from public.hub_sessions
 where token=p_token and expires_at>now() limit 1;
 if account_id is null then return json_build_object('ok',false,'error','Your session has expired.'); end if;
 select coalesce(json_agg(json_build_object(
  'id',g.id,'code',g.code,'white_nick',g.white_nick,'white_dev',g.white_dev,
  'created_at',g.created_at,'clock_seconds',coalesce(g.clock_seconds,0)
 ) order by g.created_at desc),'[]'::json)
 into rows_json from public.chess_games g
 where g.status='waiting' and g.target_uid is null
   and g.white_uid is distinct from account_id;
 return json_build_object('ok',true,'challenges',rows_json);
end $$;

create or replace function public.hub_chess_challenge_lookup(p_token text,p_code text,p_dev text)
returns json language plpgsql security definer set search_path to 'public'
as $$
declare account_id text; g public.chess_games%rowtype;
begin
 select unique_id into account_id from public.hub_sessions
 where token=p_token and expires_at>now() limit 1;
 if account_id is null then return json_build_object('ok',false,'error','Your session has expired.'); end if;
 if coalesce(p_code,'') !~ '^[A-Z0-9]{6}$' or coalesce(length(p_dev),0)<1 or length(p_dev)>64 then
  return json_build_object('ok',false,'error','Invalid challenge code or device.');
 end if;
 select * into g from public.chess_games
 where code=upper(btrim(p_code)) and status='waiting' for update;
 if not found then return json_build_object('ok',false,'error','That challenge is no longer available.'); end if;
 if g.white_uid=account_id or g.white_dev=p_dev then return json_build_object('ok',false,'error','You cannot join your own challenge.'); end if;
 if g.target_uid is not null and g.target_uid<>account_id then return json_build_object('ok',false,'error','This challenge was sent to another player.'); end if;
 if g.target_dev is not null and g.target_dev<>p_dev then return json_build_object('ok',false,'error','This challenge was sent to another device.'); end if;
 return json_build_object('ok',true,'challenge',json_build_object(
  'id',g.id,'code',g.code,'white_nick',g.white_nick,'white_dev',g.white_dev,
  'white_uid',g.white_uid,'target_uid',g.target_uid,'clock_seconds',g.clock_seconds,
  'clock_white_ms',g.clock_white_ms,'clock_black_ms',g.clock_black_ms,
  'clock_side',g.clock_side,'clock_updated_at',g.clock_updated_at
 ));
end $$;

create or replace function public.hub_chess_game_state(p_token text,p_game_id uuid,p_dev text)
returns json language plpgsql security definer set search_path to 'public'
as $$
declare account_id text; g public.chess_games%rowtype;
begin
 select unique_id into account_id from public.hub_sessions
 where token=p_token and expires_at>now() limit 1;
 if account_id is null then return json_build_object('ok',false,'error','Your session has expired.'); end if;
 select * into g from public.chess_games where id=p_game_id;
 if not found then return json_build_object('ok',false,'error','Game not found.'); end if;
 if not (g.white_uid=account_id or g.black_uid=account_id
   or (g.white_uid is null and g.white_dev=p_dev)
   or (g.black_uid is null and g.black_dev=p_dev)) then
  return json_build_object('ok',false,'error','You are not a player in this game.');
 end if;
 return json_build_object('ok',true,'game',json_build_object(
  'id',g.id,'code',g.code,'white_nick',g.white_nick,'black_nick',g.black_nick,
  'white_dev',g.white_dev,'black_dev',g.black_dev,'white_uid',g.white_uid,
  'black_uid',g.black_uid,'target_uid',g.target_uid,'status',g.status,'moves',g.moves,
  'result',g.result,'clock_seconds',g.clock_seconds,'clock_white_ms',g.clock_white_ms,
  'clock_black_ms',g.clock_black_ms,'clock_side',g.clock_side,
  'clock_updated_at',g.clock_updated_at,'clock_increment_seconds',g.clock_increment_seconds
 ));
end $$;

-- Remove default PUBLIC execution from anonymous-facing definer RPCs.
-- The app uses the anon publishable key plus its own opaque session token;
-- the server role retains access for trusted Edge Function calls.
do $$
declare f record;
begin
 for f in
  select p.oid::regprocedure as signature
  from pg_proc p join pg_namespace n on n.oid=p.pronamespace
  where n.nspname='public' and p.prosecdef
    and has_function_privilege('anon',p.oid,'EXECUTE')
 loop
  execute format('revoke execute on function %s from public, authenticated',f.signature);
  execute format('grant execute on function %s to anon, service_role',f.signature);
 end loop;
end $$;

commit;
