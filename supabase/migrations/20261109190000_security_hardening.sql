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

-- Pending uploads are private; approved files are exposed only through the
-- hub-download Edge Function, which verifies approval and issues a short URL.
update storage.buckets set public=false where id='hub-uploads';
drop policy if exists "read hub-uploads" on storage.objects;

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


-- Custom Bablo account passwords are bcrypt-hashed. Require stronger
-- passwords for new accounts while preserving existing-account login.
create or replace function public.hub_register(
 p_unique_id text,p_password text,p_full_name text,p_nickname text,p_programme text,p_is_guest boolean
) returns json language plpgsql security definer
set search_path to 'public','extensions'
as $
declare id text; tries int := 0;
begin
 if char_length(coalesce(p_password,'')) < 8 or char_length(coalesce(p_password,'')) > 128 then
  return json_build_object('ok',false,'error','Password must be 8–128 characters.');
 end if;
 if char_length(coalesce(trim(p_full_name),'')) < 2 then return json_build_object('ok',false,'error','Enter your full name.'); end if;
 if char_length(coalesce(trim(p_nickname),'')) < 1 then return json_build_object('ok',false,'error','Pick a nickname.'); end if;
 if p_unique_id is null then
  loop
   id := hub_code_for(p_programme) || '-' || lpad((floor(random()*10000))::int::text,4,'0');
   exit when not exists(select 1 from public.hub_accounts where unique_id=id);
   tries:=tries+1;
   if tries>50 then return json_build_object('ok',false,'error','Could not create an ID. Try again.'); end if;
  end loop;
 else id:=upper(p_unique_id);
 end if;
 if id !~ '^[A-Z]{2,4}-[0-9]{4,6}
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
 then return json_build_object('ok',false,'error','Your ID must look like MBB-7342.'); end if;
 if exists(select 1 from public.hub_accounts where unique_id=id) then return json_build_object('ok',false,'error','That ID is already taken.'); end if;
 insert into public.hub_accounts(unique_id,password_hash,full_name,nickname,programme,is_guest)
 values(id,extensions.crypt(p_password,extensions.gen_salt('bf')),trim(p_full_name),left(trim(p_nickname),20),p_programme,coalesce(p_is_guest,false));
 return json_build_object('ok',true,'uniqueId',id);
end $;

create or replace function public.hub_login(p_unique_id text,p_password text)
returns json language plpgsql security definer
set search_path to 'public','extensions'
as $
declare acc public.hub_accounts%rowtype; tok text; recent int;
begin
 if char_length(coalesce(p_password,''))>128 then
  return json_build_object('ok',false,'error','ID or password is not right.');
 end if;
 select count(*) into recent from public.hub_failed_logins
 where unique_id=upper(coalesce(p_unique_id,'')) and at>now()-interval '15 minutes';
 if recent>=5 then return json_build_object('ok',false,'error','Too many wrong tries. Wait 15 minutes and try again.'); end if;
 select * into acc from public.hub_accounts where unique_id=upper(coalesce(p_unique_id,''));
 if not found or acc.password_hash<>extensions.crypt(coalesce(p_password,''),acc.password_hash) then
  insert into public.hub_failed_logins(unique_id) values(upper(coalesce(p_unique_id,'')));
  return json_build_object('ok',false,'error','ID or password is not right.');
 end if;
 delete from public.hub_failed_logins where unique_id=acc.unique_id;
 tok:=encode(extensions.gen_random_bytes(32),'hex');
 insert into public.hub_sessions(token,unique_id) values(tok,acc.unique_id);
 return json_build_object('ok',true,'token',tok,'uniqueId',acc.unique_id,'fullName',acc.full_name,
  'nickname',acc.nickname,'username',acc.username,'programme',acc.programme,'isGuest',acc.is_guest,
  'premium',acc.premium,'progress',acc.progress);
end $;


-- Push subscription records are private and account-bound. The sender also
-- allowlists official push service hosts to prevent server-side request forgery.
alter table public.push_subscriptions add column if not exists unique_id text;
create index if not exists push_subscriptions_unique_id_idx on public.push_subscriptions(unique_id);
drop policy if exists "subscribe to alerts" on public.push_subscriptions;
revoke all on table public.push_subscriptions from anon, authenticated;

create or replace function public.hub_push_subscribe(
 p_token text,p_endpoint text,p_p256dh text,p_auth text
) returns json language plpgsql security definer set search_path to 'public'
as $
declare account_id text;
begin
 select unique_id into account_id from public.hub_sessions where token=p_token and expires_at>now() limit 1;
 if account_id is null then return json_build_object('ok',false,'error','Please log in again to enable alerts.'); end if;
 if coalesce(length(p_endpoint),0)<20 or length(p_endpoint)>1000
   or p_endpoint !~ '^https://(fcm\.googleapis\.com|updates\.push\.services\.mozilla\.com|wns\.windows\.com|web\.push\.apple\.com|push\.services\.mozilla\.com)(:[0-9]+)?/'
 then return json_build_object('ok',false,'error','Unsupported push provider endpoint.'); end if;
 if coalesce(length(p_p256dh),0)<20 or length(p_p256dh)>200 or p_p256dh !~ '^[A-Za-z0-9_-]+
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

   or coalesce(length(p_auth),0)<10 or length(p_auth)>100 or p_auth !~ '^[A-Za-z0-9_-]+
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

 then return json_build_object('ok',false,'error','Invalid push subscription keys.'); end if;
 if (select count(*) from public.push_subscriptions where unique_id=account_id and endpoint<>p_endpoint)>=5 then
  return json_build_object('ok',false,'error','This account already has the maximum number of alert devices.');
 end if;
 insert into public.push_subscriptions(unique_id,endpoint,p256dh,auth)
 values(account_id,p_endpoint,p_p256dh,p_auth)
 on conflict(endpoint) do update set unique_id=excluded.unique_id,p256dh=excluded.p256dh,auth=excluded.auth,created_at=now();
 return json_build_object('ok',true);
end $;

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
