-- Persist the semester dimension of a student's academic identity.
-- Legacy six-argument profile RPCs remain available; v2 wrappers add semester safely.

begin;

alter table public.hub_accounts
  add column if not exists academic_semester text;

alter table public.guest_academic_profiles
  add column if not exists academic_semester text;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid='public.hub_accounts'::regclass
      and conname='hub_accounts_academic_semester_check'
  ) then
    alter table public.hub_accounts
      add constraint hub_accounts_academic_semester_check
      check (academic_semester is null or academic_semester in ('first','second','summer','year-round'));
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid='public.guest_academic_profiles'::regclass
      and conname='guest_academic_profiles_academic_semester_check'
  ) then
    alter table public.guest_academic_profiles
      add constraint guest_academic_profiles_academic_semester_check
      check (academic_semester is null or academic_semester in ('first','second','summer','year-round'));
  end if;
end $$;

create or replace function public.hub_save_academic_profile_v2(
  p_token text,
  p_institution text,
  p_programme text,
  p_programme_category text,
  p_academic_level text,
  p_academic_semester text,
  p_bsc_pathway text default null
) returns json
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  account_id text;
  result json;
begin
  if p_academic_semester not in ('first','second','summer','year-round') then
    return json_build_object('ok',false,'error','Choose a valid academic semester.');
  end if;

  select unique_id into account_id
  from public.hub_sessions
  where token=p_token and expires_at>now();

  if account_id is null then
    return json_build_object('ok',false,'error','Please log in again.');
  end if;

  result := public.hub_save_academic_profile(
    p_token,p_institution,p_programme,p_programme_category,p_academic_level,p_bsc_pathway
  );

  if not coalesce((result->>'ok')::boolean,false) then
    return result;
  end if;

  update public.hub_accounts
    set academic_semester=p_academic_semester,updated_at=now()
    where unique_id=account_id;

  return (result::jsonb || jsonb_build_object('academicSemester',p_academic_semester))::json;
end;
$function$;

create or replace function public.hub_save_guest_academic_profile_v2(
  p_anon_id text,
  p_institution text,
  p_programme text,
  p_programme_category text,
  p_academic_level text,
  p_academic_semester text,
  p_bsc_pathway text default null
) returns json
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  result json;
begin
  if p_academic_semester not in ('first','second','summer','year-round') then
    return json_build_object('ok',false,'error','Choose a valid academic semester.');
  end if;

  result := public.hub_save_guest_academic_profile(
    p_anon_id,p_institution,p_programme,p_programme_category,p_academic_level,p_bsc_pathway
  );

  if not coalesce((result->>'ok')::boolean,false) then
    return result;
  end if;

  update public.guest_academic_profiles
    set academic_semester=p_academic_semester,updated_at=now()
    where anon_id=p_anon_id;

  return (result::jsonb || jsonb_build_object('academicSemester',p_academic_semester))::json;
end;
$function$;

revoke all on function public.hub_save_academic_profile_v2(text,text,text,text,text,text,text) from public;
revoke all on function public.hub_save_guest_academic_profile_v2(text,text,text,text,text,text,text) from public;
grant execute on function public.hub_save_academic_profile_v2(text,text,text,text,text,text,text) to anon, authenticated, service_role;
grant execute on function public.hub_save_guest_academic_profile_v2(text,text,text,text,text,text,text) to anon, authenticated, service_role;

-- Return the persisted semester on subsequent logins.
do $$
declare fn text;
begin
  select pg_get_functiondef('public.hub_login(text,text)'::regprocedure) into fn;
  fn := replace(
    fn,
    '''academicLevel'',acc.academic_level,',
    '''academicLevel'',acc.academic_level,''academicSemester'',acc.academic_semester,'
  );
  if position('academicSemester' in fn)=0 then
    raise exception 'Could not add academic semester to login response';
  end if;
  execute fn;
end $$;

commit;
