-- Presence heartbeat for online Challenge Arena rooms.
alter table public.hub_challenge_players
  add column if not exists last_seen_at timestamptz not null default now();

create or replace function public.hub_challenge_presence(
  p_token text,
  p_match_id uuid
) returns jsonb
language plpgsql
security definer
set search_path = public
as $function$
declare
  v_actor text;
  v_match public.hub_challenge_matches%rowtype;
  v_players jsonb;
  v_host_online boolean;
begin
  v_actor := public.hub_challenge_actor(p_token);
  if v_actor is null then raise exception 'Please log in again.'; end if;

  select * into v_match from public.hub_challenge_matches where id = p_match_id;
  if not found or not exists (
    select 1 from public.hub_challenge_players
    where match_id = p_match_id and player_uid = v_actor
      and status in ('joined','ready','completed')
  ) then raise exception 'You are not a participant in this challenge.'; end if;

  update public.hub_challenge_players set last_seen_at = now()
  where match_id = p_match_id and player_uid = v_actor;

  select coalesce(jsonb_agg(jsonb_build_object(
    'username', a.username, 'status', p.status, 'score', p.score,
    'online', p.last_seen_at > now() - interval '25 seconds',
    'is_host', p.player_uid = v_match.created_by
  ) order by p.joined_at), '[]'::jsonb)
  into v_players
  from public.hub_challenge_players p
  join public.hub_accounts a on a.unique_id = p.player_uid
  where p.match_id = p_match_id and p.status <> 'invited';

  select coalesce(bool_or(last_seen_at > now() - interval '25 seconds'), false)
  into v_host_online
  from public.hub_challenge_players
  where match_id = p_match_id and player_uid = v_match.created_by;

  return jsonb_build_object('ok', true, 'players', v_players,
    'host_online', v_host_online, 'server_time', now());
end
$function$;

revoke all on function public.hub_challenge_presence(text, uuid) from public;
grant execute on function public.hub_challenge_presence(text, uuid) to anon, authenticated;
