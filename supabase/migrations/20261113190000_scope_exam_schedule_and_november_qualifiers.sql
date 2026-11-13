-- Exam reminders are scoped to a university and academic level.
-- Existing legacy reminders are Bowen 100L notices; remove the completed/withdrawn
-- MTH 101, COS 101 and GST 111 reminders from the public schedule.
alter table public.hub_public_exam_schedule
  add column if not exists institution_slug text,
  add column if not exists academic_level text,
  add column if not exists programme text;

update public.hub_public_exam_schedule
set institution_slug = 'bowen-university',
    academic_level = '100L'
where institution_slug is null and academic_level is null;

delete from public.hub_public_exam_schedule
where id in ('test-mth101-2026','test-cos101-2026','test-gst111-2026');

create or replace function public.hub_public_exam_schedule()
returns jsonb
language sql
stable
security definer
set search_path to 'public'
as $function$
  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'id', id,
        'course_code', course_code,
        'assessment_type', assessment_type,
        'scheduled_date', scheduled_date,
        'date_status', date_status,
        'note', note,
        'sort_order', sort_order,
        'institution_slug', institution_slug,
        'academic_level', academic_level,
        'programme', programme
      )
      order by sort_order
    ),
    '[]'::jsonb
  )
  from public.hub_public_exam_schedule;
$function$;

create or replace function public.hub_qualifier_start(p_token text, p_batch text)
returns json
language plpgsql
security definer
set search_path to 'public','pg_temp'
as $function$
declare v_uid text; v_now timestamp; v_window_ok boolean;
begin
  v_uid:=public.hub_challenge_actor(p_token);
  if v_uid is null then return json_build_object('ok',false,'error','Please log in first.'); end if;
  if not exists(select 1 from public.hub_accounts where unique_id=v_uid and is_guest=false) then
    return json_build_object('ok',false,'error','A registered student account is required.');
  end if;
  if p_batch not in ('A','B') then return json_build_object('ok',false,'error','Invalid qualification batch.'); end if;
  v_now:=now() at time zone 'Africa/Lagos';
  v_window_ok:=(p_batch='A' and v_now::date=date '2026-11-14')
    or (p_batch='B' and v_now::date=date '2026-11-15');
  if not v_window_ok then return json_build_object('ok',false,'error','This qualification batch is not open today.'); end if;
  if exists(select 1 from public.qualifier_starts where uid=v_uid and season='2026-11')
     or exists(select 1 from public.qualifier_results where uid=v_uid and season='2026-11') then
    return json_build_object('ok',false,'error','This account has already started or completed its November qualifier.');
  end if;
  insert into public.qualifier_starts(uid,batch,season) values(v_uid,p_batch,'2026-11');
  return json_build_object('ok',true,'batch',p_batch);
exception when unique_violation then
  return json_build_object('ok',false,'error','This account has already started its November qualifier.');
end
$function$;

create or replace function public.hub_qualifier_submit(p_token text, p_correct integer, p_n integer, p_secs integer, p_batch text)
returns json
language plpgsql
security definer
set search_path to 'public','pg_temp'
as $function$
declare v_uid text; acc public.hub_accounts%rowtype; started public.qualifier_starts%rowtype;
  v_start timestamp; v_pct numeric; v_lagos_date date;
begin
  v_uid:=public.hub_challenge_actor(p_token);
  if v_uid is null then return json_build_object('ok',false,'error','Please log in again.'); end if;
  select * into acc from public.hub_accounts where unique_id=v_uid;
  if not found or acc.is_guest then return json_build_object('ok',false,'error','A registered student account is required.'); end if;
  if p_n is null or p_n<>60 or p_correct is null or p_correct<0 or p_correct>p_n
     or p_secs is null or p_secs<1 or p_secs>2400 or p_batch not in ('A','B') then
    return json_build_object('ok',false,'error','The submitted qualification result is invalid.');
  end if;
  select * into started from public.qualifier_starts where uid=v_uid and batch=p_batch and season='2026-11';
  if not found then return json_build_object('ok',false,'error','No matching November qualification attempt was started.'); end if;
  v_start:=started.created_at at time zone 'Africa/Lagos';
  v_lagos_date:=v_start::date;
  if (p_batch='A' and v_lagos_date<>date '2026-11-14')
     or (p_batch='B' and v_lagos_date<>date '2026-11-15')
     or now()>started.created_at+interval '50 minutes' then
    return json_build_object('ok',false,'error','The qualification attempt is outside its valid submission window.');
  end if;
  v_pct:=round((p_correct::numeric/p_n::numeric)*100,1);
  insert into public.qualifier_results(uid,programme,nickname,pct,correct,n,secs,batch,season)
  values(v_uid,acc.programme,left(acc.nickname,30),v_pct,p_correct,p_n,p_secs,p_batch,'2026-11');
  return json_build_object('ok',true,'pct',v_pct);
exception when unique_violation then
  return json_build_object('ok',false,'error','A November qualifier result has already been recorded for this account.');
end
$function$;
