begin;

alter table public.hub_accounts
  add column if not exists institution text,
  add column if not exists academic_level text not null default '100L',
  add column if not exists programme_category text not null default 'cohes',
  add column if not exists bsc_pathway text,
  add column if not exists academic_details_verified boolean not null default false;

update public.hub_accounts
set programme_category = 'other'
where programme = 'Guest (other programme)';

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.hub_accounts'::regclass
      and conname = 'hub_accounts_academic_level_check'
  ) then
    alter table public.hub_accounts
      add constraint hub_accounts_academic_level_check
      check (academic_level in ('100L','200L','300L','400L','500L','600L','700L','Other'));
  end if;
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.hub_accounts'::regclass
      and conname = 'hub_accounts_programme_category_check'
  ) then
    alter table public.hub_accounts
      add constraint hub_accounts_programme_category_check
      check (programme_category in ('cohes','other'));
  end if;
end $$;

create table if not exists public.guest_academic_profiles (
  anon_id text primary key check (anon_id ~ '^[A-Za-z0-9_-]{8,64}$'),
  institution text not null check (char_length(institution) between 2 and 100),
  programme text not null check (char_length(programme) between 2 and 80),
  programme_category text not null check (programme_category in ('cohes','other')),
  academic_level text not null check (academic_level in ('100L','200L','300L','400L','500L','600L','700L','Other')),
  bsc_pathway text,
  source text not null default 'self_declared' check (source = 'self_declared'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (bsc_pathway is null or char_length(bsc_pathway) <= 100)
);

alter table public.guest_academic_profiles enable row level security;
revoke all on table public.guest_academic_profiles from public, anon, authenticated;

create or replace function public.hub_save_academic_profile(
  p_token text,
  p_institution text,
  p_programme text,
  p_programme_category text,
  p_academic_level text,
  p_bsc_pathway text default null
) returns json
language plpgsql
security definer
set search_path to 'public'
as $function$
declare account_id text; pathway text;
begin
  if coalesce(length(trim(p_institution)),0) < 2 or length(trim(p_institution)) > 100 then
    return json_build_object('ok',false,'error','Enter a valid institution name.');
  end if;
  if coalesce(length(trim(p_programme)),0) < 2 or length(trim(p_programme)) > 80 then
    return json_build_object('ok',false,'error','Enter a valid programme name.');
  end if;
  if p_programme_category not in ('cohes','other') then
    return json_build_object('ok',false,'error','Choose a valid programme group.');
  end if;
  if p_academic_level not in ('100L','200L','300L','400L','500L','600L','700L','Other') then
    return json_build_object('ok',false,'error','Choose a valid academic level.');
  end if;
  if coalesce(length(trim(p_bsc_pathway)),0) > 100 then
    return json_build_object('ok',false,'error','BSc pathway is too long.');
  end if;
  pathway := case
    when upper(trim(p_programme)) = 'MBBS'
      and p_academic_level in ('200L','300L','400L','500L','600L','700L')
    then nullif(trim(p_bsc_pathway),'')
    else null
  end;

  update public.hub_sessions
     set expires_at = now() + interval '30 days'
   where token = p_token and expires_at > now()
   returning unique_id into account_id;
  if account_id is null then
    return json_build_object('ok',false,'error','Please log in again.');
  end if;

  update public.hub_accounts
     set institution = trim(p_institution),
         programme = trim(p_programme),
         programme_category = p_programme_category,
         academic_level = p_academic_level,
         bsc_pathway = pathway,
         academic_details_verified = false,
         updated_at = now()
   where unique_id = account_id;
  if not found then
    return json_build_object('ok',false,'error','Account profile could not be found.');
  end if;

  return json_build_object(
    'ok',true,'institution',trim(p_institution),'programme',trim(p_programme),
    'programmeCategory',p_programme_category,'academicLevel',p_academic_level,
    'bscPathway',pathway,'academicDetailsVerified',false
  );
end;
$function$;

revoke all on function public.hub_save_academic_profile(text,text,text,text,text,text) from public, authenticated;
grant execute on function public.hub_save_academic_profile(text,text,text,text,text,text) to anon, service_role;

create or replace function public.hub_save_guest_academic_profile(
  p_anon_id text,
  p_institution text,
  p_programme text,
  p_programme_category text,
  p_academic_level text,
  p_bsc_pathway text default null
) returns json
language plpgsql
security definer
set search_path to 'public'
as $function$
declare pathway text;
begin
  if coalesce(p_anon_id,'') !~ '^[A-Za-z0-9_-]{8,64}$' then
    return json_build_object('ok',false,'error','Invalid guest session.');
  end if;
  if coalesce(length(trim(p_institution)),0) < 2 or length(trim(p_institution)) > 100 then
    return json_build_object('ok',false,'error','Enter a valid institution name.');
  end if;
  if coalesce(length(trim(p_programme)),0) < 2 or length(trim(p_programme)) > 80 then
    return json_build_object('ok',false,'error','Enter a valid programme name.');
  end if;
  if p_programme_category not in ('cohes','other') then
    return json_build_object('ok',false,'error','Choose a valid programme group.');
  end if;
  if p_academic_level not in ('100L','200L','300L','400L','500L','600L','700L','Other') then
    return json_build_object('ok',false,'error','Choose a valid academic level.');
  end if;
  if coalesce(length(trim(p_bsc_pathway)),0) > 100 then
    return json_build_object('ok',false,'error','BSc pathway is too long.');
  end if;
  pathway := case
    when upper(trim(p_programme)) = 'MBBS'
      and p_academic_level in ('200L','300L','400L','500L','600L','700L')
    then nullif(trim(p_bsc_pathway),'')
    else null
  end;

  insert into public.guest_academic_profiles
    (anon_id,institution,programme,programme_category,academic_level,bsc_pathway,updated_at)
  values
    (p_anon_id,trim(p_institution),trim(p_programme),p_programme_category,p_academic_level,pathway,now())
  on conflict (anon_id) do update set
    institution = excluded.institution,
    programme = excluded.programme,
    programme_category = excluded.programme_category,
    academic_level = excluded.academic_level,
    bsc_pathway = excluded.bsc_pathway,
    updated_at = now();

  return json_build_object('ok',true,'saved',true,'source','self_declared');
end;
$function$;

revoke all on function public.hub_save_guest_academic_profile(text,text,text,text,text,text) from public, authenticated;
grant execute on function public.hub_save_guest_academic_profile(text,text,text,text,text,text) to anon, service_role;

create or replace function public.hub_login(p_unique_id text,p_password text)
returns json language plpgsql security definer
set search_path to 'public','extensions'
as $function$
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
 return json_build_object(
  'ok',true,'token',tok,'uniqueId',acc.unique_id,'fullName',acc.full_name,
  'nickname',acc.nickname,'username',acc.username,'programme',acc.programme,
  'programmeCategory',acc.programme_category,'institution',acc.institution,
  'academicLevel',acc.academic_level,'bscPathway',acc.bsc_pathway,
  'academicDetailsVerified',acc.academic_details_verified,
  'isGuest',acc.is_guest,'premium',acc.premium,'progress',acc.progress
 );
end;
$function$;

create or replace function public.hub_admin_summary(p_token text, p_pass text)
returns json
language plpgsql
security definer
set search_path to 'public','extensions'
as $function$
declare ok boolean; out json;
begin
 select (c.passcode_hash is not null and c.passcode_hash=extensions.crypt(p_pass,c.passcode_hash))
  and exists(select 1 from public.hub_sessions s where s.token=p_token and s.unique_id='MBB-4635' and s.expires_at>now())
 into ok from public.admin_config c where c.id=1;
 if not coalesce(ok,false) then
  return json_build_object('ok',false,'error','Admin access denied. Sign in to the authorized account and check the admin password.');
 end if;
 select json_build_object(
  'ok',true,
  'feedback',coalesce((select json_agg(f) from (select kind,programme,nick,ref,left(body,300) as body,created_at from public.feedback order by created_at desc limit 100) f),'[]'::json),
  'reports',coalesce((select json_agg(r) from (select question_id,reports from public.question_reports order by reports desc limit 30) r),'[]'::json),
  'weakest_questions',coalesce((select json_agg(s) from (select question_id,attempts,percent_correct from public.item_stats where attempts>=5 order by percent_correct asc limit 30) s),'[]'::json),
  'corrections',coalesce((select json_agg(c) from (select question_id,correct_text,source,status,created_at from public.question_corrections order by created_at desc limit 50) c),'[]'::json),
  'poll',coalesce((select json_agg(p) from (select option_id,count(*) as votes from public.poll_votes where poll_id='qualifications-2026-s1' group by option_id) p),'[]'::json),
  'accounts',(select count(*) from public.hub_accounts),
  'programme_counts',coalesce((select json_agg(p) from (select programme,count(*) as people from public.hub_accounts group by programme order by people desc) p),'[]'::json),
  'guest_profiles',(select count(*) from public.guest_academic_profiles),
  'academic_profile_counts',coalesce((
    select json_agg(p order by p.people desc)
    from (
      select institution,programme,programme_category,academic_level,bsc_pathway,'registered'::text as account_type,count(*) as people
      from public.hub_accounts
      group by institution,programme,programme_category,academic_level,bsc_pathway
      union all
      select institution,programme,programme_category,academic_level,bsc_pathway,'guest'::text as account_type,count(*) as people
      from public.guest_academic_profiles
      group by institution,programme,programme_category,academic_level,bsc_pathway
    ) p
  ),'[]'::json)
 ) into out;
 return out;
end;
$function$;

commit;
