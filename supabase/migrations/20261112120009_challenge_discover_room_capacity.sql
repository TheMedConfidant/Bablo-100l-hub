-- Keep public room discovery capacity-aware for Quick Play matchmaking.
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
  v_expired := public.hub_challenge_expire_stale_rooms();

  select coalesce(jsonb_agg(jsonb_build_object(
    'id',m.id,'invite_code',m.invite_code,'mode',m.mode,'courses',m.courses,
    'question_count',m.question_count,'duration_seconds',m.duration_seconds,
    'created_at',m.created_at,'creator_username',a.username,'creator_nickname',a.nickname,
    'player_count',coalesce(pc.player_count,0),
    'max_players',greatest(2,least(8,coalesce((m.settings->>'max_players')::integer,2)))
  ) order by m.created_at desc),'[]'::jsonb) into v_rows
  from public.hub_challenge_matches m
  join public.hub_accounts a on a.unique_id=m.created_by
  left join lateral (
    select count(*)::integer as player_count
    from public.hub_challenge_players p
    where p.match_id=m.id and p.status in ('joined','ready')
  ) pc on true
  where m.status='waiting' and m.invited_uid is null and m.created_by<>v_actor
    and coalesce(pc.player_count,0)<greatest(2,least(8,coalesce((m.settings->>'max_players')::integer,2)))
    and not exists(select 1 from public.hub_challenge_players p where p.match_id=m.id and p.player_uid=v_actor)
    and not exists(select 1 from public.hub_user_blocks b where
      (b.blocker_uid=v_actor and b.blocked_uid=m.created_by) or
      (b.blocker_uid=m.created_by and b.blocked_uid=v_actor))
  order by m.created_at desc limit 40;

  return jsonb_build_object('ok',true,'challenges',v_rows,'expired_rooms',v_expired);
end
$function$;
