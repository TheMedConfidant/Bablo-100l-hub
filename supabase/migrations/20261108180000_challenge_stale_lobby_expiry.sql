create or replace function public.hub_challenge_expire_stale_rooms()
returns integer
language plpgsql
security definer
set search_path to 'public'
as $function$
declare v_count integer;
begin
  update public.hub_challenge_matches m
     set status = 'abandoned',
         completed_at = coalesce(m.completed_at, now())
   where m.status in ('waiting','ready')
     and m.created_at < now() - interval '30 minutes'
     and not exists (
       select 1 from public.hub_challenge_players p
        where p.match_id = m.id
          and p.status in ('joined','ready')
          and coalesce(p.last_seen_at,p.joined_at) > now() - interval '5 minutes'
     );
  get diagnostics v_count = row_count;
  return v_count;
end
$function$;

create or replace function public.hub_challenge_discover(p_token text)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $function$
declare v_actor text; v_rows jsonb; v_expired integer;
begin
 v_actor := public.hub_challenge_actor(p_token);
 if v_actor is null then raise exception 'Please log in again.'; end if;

 -- Expire abandoned lobbies before showing public rooms.
 v_expired := public.hub_challenge_expire_stale_rooms();

 select coalesce(jsonb_agg(jsonb_build_object(
  'id',m.id,'invite_code',m.invite_code,'mode',m.mode,'courses',m.courses,
  'question_count',m.question_count,'duration_seconds',m.duration_seconds,
  'created_at',m.created_at,'creator_username',a.username,'creator_nickname',a.nickname
 ) order by m.created_at desc),'[]'::jsonb) into v_rows
 from public.hub_challenge_matches m
 join public.hub_accounts a on a.unique_id=m.created_by
 where m.status='waiting' and m.invited_uid is null and m.created_by<>v_actor
 and not exists(select 1 from public.hub_challenge_players p where p.match_id=m.id and p.player_uid=v_actor)
 and not exists(select 1 from public.hub_user_blocks b where (b.blocker_uid=v_actor and b.blocked_uid=m.created_by) or (b.blocker_uid=m.created_by and b.blocked_uid=v_actor))
 order by m.created_at desc limit 40;

 return jsonb_build_object('ok',true,'challenges',v_rows,'expired_rooms',v_expired);
end
$function$;

revoke all on function public.hub_challenge_expire_stale_rooms() from public, anon, authenticated;
grant execute on function public.hub_challenge_expire_stale_rooms() to service_role;