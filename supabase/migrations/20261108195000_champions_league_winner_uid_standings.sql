-- Champions League wins must follow the canonical match winner,
-- including tie-breaks (correct answers, response time), rather than raw score alone.
create or replace function public.hub_challenge_leaderboard(p_token text, p_period text default 'overall')
returns jsonb
language plpgsql
stable
security definer
set search_path to 'public'
as $function$
declare
 v_actor text;
 v_rows jsonb;
 v_since timestamptz;
begin
 v_actor:=public.hub_challenge_actor(p_token);
 if v_actor is null then raise exception 'Please log in again.'; end if;
 v_since:=case lower(coalesce(p_period,'overall'))
   when 'weekly' then now()-interval '7 days'
   when 'monthly' then now()-interval '30 days'
   else '-infinity'::timestamptz end;
 select coalesce(jsonb_agg(jsonb_build_object(
   'rank',rank_no,'username',username,'nickname',nickname,'programme',programme,
   'wins',wins,'matches',matches,'points',points,'accuracy',accuracy
 ) order by rank_no),'[]'::jsonb)
 into v_rows
 from (
   select row_number() over(order by wins desc,points desc,accuracy desc,matches desc) rank_no,
     a.username,a.nickname,a.programme,
     count(*) filter(where m.winner_uid=p.player_uid) as wins,
     count(*) as matches,
     sum(p.score)::int as points,
     round(100.0*sum(p.correct_count)/nullif(sum(p.correct_count+p.incorrect_count),0),1) as accuracy
   from public.hub_challenge_players p
   join public.hub_challenge_matches m on m.id=p.match_id
   join public.hub_accounts a on a.unique_id=p.player_uid
   where p.opted_into_leaderboard
     and p.status='completed'
     and p.hidden_at is null
     and m.status='completed'
     and p.completed_at>=v_since
   group by a.unique_id,a.username,a.nickname,a.programme
 ) ranked;
 return jsonb_build_object('ok',true,'period',p_period,'entries',v_rows);
end
$function$;
