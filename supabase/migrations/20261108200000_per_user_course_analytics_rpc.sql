-- Token-scoped course analytics from the existing per-user score history.
-- Topic-level analytics will require question-level user/course/topic attempt records.
create or replace function public.hub_course_analytics(p_token text, p_days integer default 365)
returns jsonb
language plpgsql
stable
security definer
set search_path to 'public'
as $function$
declare
 v_actor text;
 v_days integer;
 v_courses jsonb;
 v_total integer;
begin
 v_actor:=public.hub_challenge_actor(p_token);
 if v_actor is null then raise exception 'Please log in again.'; end if;
 v_days:=greatest(1,least(coalesce(p_days,365),3650));
 select count(*) into v_total
 from public.scores s
 where s.uid=v_actor
   and s.course is not null and btrim(s.course)<>''
   and (s.ts is null or to_timestamp(s.ts/1000.0)>=now()-make_interval(days=>v_days));
 select coalesce(jsonb_agg(jsonb_build_object(
   'course',course,'attempts',attempts,'average_accuracy',average_accuracy,
   'best_accuracy',best_accuracy,'average_seconds',average_seconds,
   'last_attempt_at',last_attempt_at,'latest_accuracy',latest_accuracy
 ) order by attempts desc,average_accuracy desc),'[]'::jsonb)
 into v_courses
 from (
   select s.course,count(*)::int attempts,
     round(avg(s.pct),1) average_accuracy,
     round(max(s.pct),1) best_accuracy,
     round(avg(s.secs))::int average_seconds,
     max(to_timestamp(s.ts/1000.0)) last_attempt_at,
     (array_agg(s.pct order by s.ts desc nulls last))[1] latest_accuracy
   from public.scores s
   where s.uid=v_actor
     and s.course is not null and btrim(s.course)<>''
     and (s.ts is null or to_timestamp(s.ts/1000.0)>=now()-make_interval(days=>v_days))
   group by s.course
 ) course_rows;
 return jsonb_build_object('ok',true,'days',v_days,'total_attempts',v_total,'courses',v_courses);
end
$function$;
revoke all on function public.hub_course_analytics(text,integer) from public;
grant execute on function public.hub_course_analytics(text,integer) to anon,authenticated;
