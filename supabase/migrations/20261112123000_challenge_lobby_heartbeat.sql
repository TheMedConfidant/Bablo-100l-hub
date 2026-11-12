create or replace function public.hub_challenge_heartbeat(p_token text,p_match_id uuid)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $function$
declare v_actor text; v_status text; v_seen timestamptz;
begin
  v_actor:=public.hub_challenge_actor(p_token);
  if v_actor is null then raise exception 'Please log in again.'; end if;
  select status into v_status from public.hub_challenge_matches where id=p_match_id;
  if v_status is null then raise exception 'Challenge not found.'; end if;
  if v_status not in ('waiting','ready','active') then
    return jsonb_build_object('ok',true,'status',v_status,'present',false);
  end if;
  update public.hub_challenge_players
     set last_seen_at=now()
   where match_id=p_match_id and player_uid=v_actor and status in ('joined','ready')
   returning last_seen_at into v_seen;
  if v_seen is null then raise exception 'You are not an active participant in this challenge.'; end if;
  return jsonb_build_object('ok',true,'status',v_status,'present',true,'last_seen_at',v_seen);
end
$function$;