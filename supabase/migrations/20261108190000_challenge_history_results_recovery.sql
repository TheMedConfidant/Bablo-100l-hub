create or replace function public.hub_challenge_history(p_token text)
returns jsonb language plpgsql stable security definer set search_path = public
as $function$
declare v_actor text; v_matches jsonb;
begin
  v_actor := public.hub_challenge_actor(p_token);
  if v_actor is null then raise exception 'Please log in again.'; end if;
  select coalesce(jsonb_agg(jsonb_build_object(
    'id',m.id,'status',m.status,'courses',m.courses,'question_count',m.question_count,
    'mode',m.mode,'created_at',m.created_at,'completed_at',m.completed_at,
    'winner_uid',m.winner_uid,'my_score',mine.score,
    'players',coalesce((select jsonb_agg(jsonb_build_object(
      'username',a.username,'nickname',a.nickname,'score',p.score,
      'correct',p.correct_count,'incorrect',p.incorrect_count,'status',p.status
    ) order by p.score desc,p.correct_count desc,p.total_response_ms asc)
    from public.hub_challenge_players p
    join public.hub_accounts a on a.unique_id=p.player_uid
    where p.match_id=m.id and p.hidden_at is null),'[]'::jsonb)
  ) order by coalesce(m.completed_at,m.created_at) desc),'[]'::jsonb)
  into v_matches
  from public.hub_challenge_matches m
  join public.hub_challenge_players mine on mine.match_id=m.id and mine.player_uid=v_actor
  where m.status in ('completed','abandoned') and mine.hidden_at is null;
  return jsonb_build_object('ok',true,'matches',v_matches);
end;
$function$;
revoke all on function public.hub_challenge_history(text) from public;
grant execute on function public.hub_challenge_history(text) to anon, authenticated;