-- Bablo Hub multi-university academic resource engine.
-- Foundation only: this migration creates the directory, provenance/reuse metadata,
-- explicit curriculum mappings, and safe read RPCs. It does not publish any resources.

begin;

create table if not exists public.hub_academic_institutions (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  name text not null check (char_length(name) between 2 and 160),
  country_code char(2) not null default 'NG',
  offers_health_sciences boolean not null default false,
  directory_status text not null default 'pending'
    check (directory_status in ('pending','active','paused')),
  official_url text,
  verification_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.hub_academic_programmes (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references public.hub_academic_institutions(id) on delete restrict,
  programme_code text not null,
  programme_name text not null check (char_length(programme_name) between 2 and 120),
  programme_group text not null default 'health-sciences'
    check (programme_group in ('health-sciences','allied-health','biomedical-sciences','other')),
  directory_status text not null default 'pending'
    check (directory_status in ('pending','active','paused')),
  official_source_url text,
  verification_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (institution_id, programme_code),
  unique (id, institution_id)
);

create table if not exists public.hub_academic_courses (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references public.hub_academic_institutions(id) on delete restrict,
  programme_id uuid not null references public.hub_academic_programmes(id) on delete restrict,
  academic_level text not null
    check (academic_level in ('100L','200L','300L','400L','500L','600L','700L','Other')),
  semester text not null check (semester in ('first','second','summer','year-round')),
  course_code text not null check (char_length(course_code) between 1 and 40),
  course_title text not null check (char_length(course_title) between 2 and 180),
  credit_units numeric(4,1),
  curriculum_status text not null default 'candidate'
    check (curriculum_status in ('candidate','verified','retired')),
  outline_source_url text,
  verification_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (institution_id, programme_id, academic_level, semester, course_code),
  foreign key (programme_id, institution_id)
    references public.hub_academic_programmes(id, institution_id) on delete restrict
);

create table if not exists public.hub_academic_resources (
  id uuid primary key default gen_random_uuid(),
  resource_key text not null unique check (char_length(resource_key) between 3 and 180),
  title text not null check (char_length(title) between 2 and 240),
  resource_type text not null
    check (resource_type in ('notes','flashcards','questions','quizzes','practicals','past-papers','image-bank','lecture-material','reference')),
  owner_institution_id uuid references public.hub_academic_institutions(id) on delete restrict,
  reuse_policy text not null default 'institution-only'
    check (reuse_policy in ('institution-only','shared-after-review')),
  rights_status text not null default 'pending'
    check (rights_status in ('pending','cleared','restricted')),
  quality_status text not null default 'draft'
    check (quality_status in ('draft','reviewed','approved','rejected')),
  content_reference text,
  source_title text,
  source_url text,
  source_updated_at timestamptz,
  provenance jsonb not null default '{}'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (
    reuse_policy = 'shared-after-review'
    or (reuse_policy = 'institution-only' and owner_institution_id is not null)
  )
);

create table if not exists public.hub_academic_resource_mappings (
  id uuid primary key default gen_random_uuid(),
  resource_id uuid not null references public.hub_academic_resources(id) on delete cascade,
  course_id uuid not null references public.hub_academic_courses(id) on delete restrict,
  topic text,
  mapping_status text not null default 'candidate'
    check (mapping_status in ('candidate','verified','rejected')),
  mapping_source text,
  verified_by text,
  verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (resource_id, course_id, topic),
  check (mapping_status <> 'verified' or verified_at is not null)
);

create index if not exists hub_academic_institutions_directory_idx
  on public.hub_academic_institutions (directory_status, offers_health_sciences, name);
create index if not exists hub_academic_programmes_directory_idx
  on public.hub_academic_programmes (institution_id, directory_status, programme_name);
create index if not exists hub_academic_courses_lookup_idx
  on public.hub_academic_courses (institution_id, programme_id, academic_level, semester, curriculum_status);
create index if not exists hub_academic_resources_publish_idx
  on public.hub_academic_resources (is_published, quality_status, rights_status, reuse_policy);
create index if not exists hub_academic_resource_mappings_lookup_idx
  on public.hub_academic_resource_mappings (course_id, mapping_status, verified_at, resource_id);

-- Initial directory entries only. Programme offerings are added after source verification.
insert into public.hub_academic_institutions
  (slug, name, offers_health_sciences, directory_status, official_url, verification_note)
values
  ('abia-state-university-uturu', 'Abia State University, Uturu', true, 'active', null, 'Listed in the MDCN 2025 accredited medical-schools register. This confirms a health-sciences institutional entry; verify the exact programme and current admission status separately.'),
  ('abubakar-tafawa-balewa-university', 'Abubakar Tafawa Balewa University', true, 'active', null, 'Listed in the MDCN 2025 accredited medical-schools register. This confirms a health-sciences institutional entry; verify the exact programme and current admission status separately.'),
  ('afe-babalola-university', 'Afe Babalola University', true, 'active', null, 'Listed in the MDCN 2025 accredited medical-schools register. This confirms a health-sciences institutional entry; verify the exact programme and current admission status separately.'),
  ('ahmadu-bello-university-zaria', 'Ahmadu Bello University, Zaria', true, 'active', null, 'Listed in the MDCN 2025 accredited medical-schools register. This confirms a health-sciences institutional entry; verify the exact programme and current admission status separately.'),
  ('alex-ekwueme-federal-university-ndufu-alike', 'Alex Ekwueme Federal University, Ndufu-Alike', true, 'active', null, 'Listed in the MDCN 2025 accredited medical-schools register. This confirms a health-sciences institutional entry; verify the exact programme and current admission status separately.'),
  ('ambrose-alli-university', 'Ambrose Alli University', true, 'active', null, 'Listed in the MDCN 2025 accredited medical-schools register. This confirms a health-sciences institutional entry; verify the exact programme and current admission status separately.'),
  ('babcock-university', 'Babcock University', true, 'active', null, 'Listed in the MDCN 2025 accredited medical-schools register. This confirms a health-sciences institutional entry; verify the exact programme and current admission status separately.'),
  ('bayelsa-medical-university', 'Bayelsa Medical University', true, 'active', null, 'Listed in the MDCN 2025 accredited medical-schools register. This confirms a health-sciences institutional entry; verify the exact programme and current admission status separately.'),
  ('bayero-university-kano', 'Bayero University Kano', true, 'active', null, 'Listed in the MDCN 2025 accredited medical-schools register. This confirms a health-sciences institutional entry; verify the exact programme and current admission status separately.'),
  ('baze-university', 'Baze University', true, 'active', null, 'Listed in the MDCN 2025 accredited medical-schools register. This confirms a health-sciences institutional entry; verify the exact programme and current admission status separately.'),
  ('benson-idahosa-university', 'Benson Idahosa University', true, 'active', null, 'Listed in the MDCN 2025 accredited medical-schools register. This confirms a health-sciences institutional entry; verify the exact programme and current admission status separately.'),
  ('benue-state-university', 'Benue State University', true, 'active', null, 'Listed in the MDCN 2025 accredited medical-schools register. This confirms a health-sciences institutional entry; verify the exact programme and current admission status separately.'),
  ('bingham-university', 'Bingham University', true, 'active', null, 'Listed in the MDCN 2025 accredited medical-schools register. This confirms a health-sciences institutional entry; verify the exact programme and current admission status separately.'),
  ('bowen-university', 'Bowen University', true, 'active', 'https://bowen.edu.ng', 'Listed in the MDCN 2025 accredited medical-schools register. This confirms a health-sciences institutional entry; verify the exact programme and current admission status separately.'),
  ('chukwuemeka-odumegwu-ojukwu-university', 'Chukwuemeka Odumegwu Ojukwu University', true, 'active', null, 'Listed in the MDCN 2025 accredited medical-schools register. This confirms a health-sciences institutional entry; verify the exact programme and current admission status separately.'),
  ('david-umahi-federal-university-of-health-sciences', 'David Umahi Federal University of Health Sciences', true, 'active', null, 'Listed in the MDCN 2025 accredited medical-schools register. This confirms a health-sciences institutional entry; verify the exact programme and current admission status separately.'),
  ('delta-state-university-abraka', 'Delta State University, Abraka', true, 'active', null, 'Listed in the MDCN 2025 accredited medical-schools register. This confirms a health-sciences institutional entry; verify the exact programme and current admission status separately.'),
  ('ebonyi-state-university', 'Ebonyi State University', true, 'active', null, 'Listed in the MDCN 2025 accredited medical-schools register. This confirms a health-sciences institutional entry; verify the exact programme and current admission status separately.'),
  ('edo-university-uzairue', 'Edo University, Uzairue', true, 'active', null, 'Listed in the MDCN 2025 accredited medical-schools register. This confirms a health-sciences institutional entry; verify the exact programme and current admission status separately.'),
  ('ekiti-state-university', 'Ekiti State University', true, 'active', null, 'Listed in the MDCN 2025 accredited medical-schools register. This confirms a health-sciences institutional entry; verify the exact programme and current admission status separately.'),
  ('eko-university-of-medicine-and-health-sciences', 'Eko University of Medicine and Health Sciences', true, 'active', null, 'Listed in the MDCN 2025 accredited medical-schools register. This confirms a health-sciences institutional entry; verify the exact programme and current admission status separately.'),
  ('enugu-state-university-of-science-and-technology', 'Enugu State University of Science and Technology', true, 'active', null, 'Listed in the MDCN 2025 accredited medical-schools register. This confirms a health-sciences institutional entry; verify the exact programme and current admission status separately.'),
  ('federal-university-of-health-sciences-azare', 'Federal University of Health Sciences, Azare', true, 'active', null, 'Listed in the MDCN 2025 accredited medical-schools register. This confirms a health-sciences institutional entry; verify the exact programme and current admission status separately.'),
  ('federal-university-of-technology-owerri', 'Federal University of Technology, Owerri', true, 'active', null, 'Listed in the MDCN 2025 accredited medical-schools register. This confirms a health-sciences institutional entry; verify the exact programme and current admission status separately.'),
  ('federal-university-birnin-kebbi', 'Federal University, Birnin Kebbi', true, 'active', null, 'Listed in the MDCN 2025 accredited medical-schools register. This confirms a health-sciences institutional entry; verify the exact programme and current admission status separately.'),
  ('federal-university-dutse', 'Federal University, Dutse', true, 'active', null, 'Listed in the MDCN 2025 accredited medical-schools register. This confirms a health-sciences institutional entry; verify the exact programme and current admission status separately.'),
  ('federal-university-lafia', 'Federal University, Lafia', true, 'active', null, 'Listed in the MDCN 2025 accredited medical-schools register. This confirms a health-sciences institutional entry; verify the exact programme and current admission status separately.'),
  ('federal-university-wukari', 'Federal University, Wukari', true, 'active', null, 'Listed in the MDCN 2025 accredited medical-schools register. This confirms a health-sciences institutional entry; verify the exact programme and current admission status separately.'),
  ('godfrey-okoye-university', 'Godfrey Okoye University', true, 'active', null, 'Listed in the MDCN 2025 accredited medical-schools register. This confirms a health-sciences institutional entry; verify the exact programme and current admission status separately.'),
  ('gombe-state-university', 'Gombe State University', true, 'active', null, 'Listed in the MDCN 2025 accredited medical-schools register. This confirms a health-sciences institutional entry; verify the exact programme and current admission status separately.'),
  ('gregory-university-uturu', 'Gregory University, Uturu', true, 'active', null, 'Listed in the MDCN 2025 accredited medical-schools register. This confirms a health-sciences institutional entry; verify the exact programme and current admission status separately.'),
  ('igbinedion-university', 'Igbinedion University', true, 'active', null, 'Listed in the MDCN 2025 accredited medical-schools register. This confirms a health-sciences institutional entry; verify the exact programme and current admission status separately.'),
  ('imo-state-university', 'Imo State University', true, 'active', null, 'Listed in the MDCN 2025 accredited medical-schools register. This confirms a health-sciences institutional entry; verify the exact programme and current admission status separately.'),
  ('kaduna-state-university', 'Kaduna State University', true, 'active', null, 'Listed in the MDCN 2025 accredited medical-schools register. This confirms a health-sciences institutional entry; verify the exact programme and current admission status separately.'),
  ('ladoke-akintola-university-of-technology', 'Ladoke Akintola University of Technology', true, 'active', null, 'Listed in the MDCN 2025 accredited medical-schools register. This confirms a health-sciences institutional entry; verify the exact programme and current admission status separately.'),
  ('lagos-state-university', 'Lagos State University', true, 'active', null, 'Listed in the MDCN 2025 accredited medical-schools register. This confirms a health-sciences institutional entry; verify the exact programme and current admission status separately.'),
  ('lead-city-university', 'Lead City University', true, 'active', null, 'Listed in the MDCN 2025 accredited medical-schools register. This confirms a health-sciences institutional entry; verify the exact programme and current admission status separately.'),
  ('madonna-university', 'Madonna University', true, 'active', null, 'Listed in the MDCN 2025 accredited medical-schools register. This confirms a health-sciences institutional entry; verify the exact programme and current admission status separately.'),
  ('niger-delta-university', 'Niger Delta University', true, 'active', null, 'Listed in the MDCN 2025 accredited medical-schools register. This confirms a health-sciences institutional entry; verify the exact programme and current admission status separately.'),
  ('nile-university-of-nigeria', 'Nile University of Nigeria', true, 'active', null, 'Listed in the MDCN 2025 accredited medical-schools register. This confirms a health-sciences institutional entry; verify the exact programme and current admission status separately.'),
  ('nnamdi-azikiwe-university', 'Nnamdi Azikiwe University', true, 'active', null, 'Listed in the MDCN 2025 accredited medical-schools register. This confirms a health-sciences institutional entry; verify the exact programme and current admission status separately.'),
  ('novena-university', 'Novena University', true, 'active', null, 'Listed in the MDCN 2025 accredited medical-schools register. This confirms a health-sciences institutional entry; verify the exact programme and current admission status separately.'),
  ('obafemi-awolowo-university', 'Obafemi Awolowo University', true, 'active', null, 'Listed in the MDCN 2025 accredited medical-schools register. This confirms a health-sciences institutional entry; verify the exact programme and current admission status separately.'),
  ('olabisi-onabanjo-university', 'Olabisi Onabanjo University', true, 'active', null, 'Listed in the MDCN 2025 accredited medical-schools register. This confirms a health-sciences institutional entry; verify the exact programme and current admission status separately.'),
  ('osun-state-university', 'Osun State University', true, 'active', null, 'Listed in the MDCN 2025 accredited medical-schools register. This confirms a health-sciences institutional entry; verify the exact programme and current admission status separately.'),
  ('pamo-university-of-medical-sciences', 'PAMO University of Medical Sciences', true, 'active', null, 'Listed in the MDCN 2025 accredited medical-schools register. This confirms a health-sciences institutional entry; verify the exact programme and current admission status separately.'),
  ('rhema-university', 'Rhema University', true, 'active', null, 'Listed in the MDCN 2025 accredited medical-schools register. This confirms a health-sciences institutional entry; verify the exact programme and current admission status separately.'),
  ('rivers-state-university', 'Rivers State University', true, 'active', null, 'Listed in the MDCN 2025 accredited medical-schools register. This confirms a health-sciences institutional entry; verify the exact programme and current admission status separately.'),
  ('state-university-of-medical-and-applied-sciences-igbo-eno', 'State University of Medical and Applied Sciences, Igbo-Eno', true, 'active', null, 'Listed in the MDCN 2025 accredited medical-schools register. This confirms a health-sciences institutional entry; verify the exact programme and current admission status separately.'),
  ('university-of-abuja', 'University of Abuja', true, 'active', null, 'Listed in the MDCN 2025 accredited medical-schools register. This confirms a health-sciences institutional entry; verify the exact programme and current admission status separately.'),
  ('university-of-benin', 'University of Benin', true, 'active', null, 'Listed in the MDCN 2025 accredited medical-schools register. This confirms a health-sciences institutional entry; verify the exact programme and current admission status separately.'),
  ('university-of-calabar', 'University of Calabar', true, 'active', null, 'Listed in the MDCN 2025 accredited medical-schools register. This confirms a health-sciences institutional entry; verify the exact programme and current admission status separately.'),
  ('university-of-ibadan', 'University of Ibadan', true, 'active', null, 'Listed in the MDCN 2025 accredited medical-schools register. This confirms a health-sciences institutional entry; verify the exact programme and current admission status separately.'),
  ('university-of-ilorin', 'University of Ilorin', true, 'active', null, 'Listed in the MDCN 2025 accredited medical-schools register. This confirms a health-sciences institutional entry; verify the exact programme and current admission status separately.'),
  ('university-of-jos', 'University of Jos', true, 'active', null, 'Listed in the MDCN 2025 accredited medical-schools register. This confirms a health-sciences institutional entry; verify the exact programme and current admission status separately.'),
  ('university-of-lagos', 'University of Lagos', true, 'active', null, 'Listed in the MDCN 2025 accredited medical-schools register. This confirms a health-sciences institutional entry; verify the exact programme and current admission status separately.'),
  ('university-of-maiduguri', 'University of Maiduguri', true, 'active', null, 'Listed in the MDCN 2025 accredited medical-schools register. This confirms a health-sciences institutional entry; verify the exact programme and current admission status separately.'),
  ('university-of-medical-sciences-ondo', 'University of Medical Sciences, Ondo', true, 'active', null, 'Listed in the MDCN 2025 accredited medical-schools register. This confirms a health-sciences institutional entry; verify the exact programme and current admission status separately.'),
  ('university-of-nigeria-nsukka', 'University of Nigeria, Nsukka', true, 'active', null, 'Listed in the MDCN 2025 accredited medical-schools register. This confirms a health-sciences institutional entry; verify the exact programme and current admission status separately.'),
  ('university-of-port-harcourt', 'University of Port Harcourt', true, 'active', null, 'Listed in the MDCN 2025 accredited medical-schools register. This confirms a health-sciences institutional entry; verify the exact programme and current admission status separately.'),
  ('university-of-uyo', 'University of Uyo', true, 'active', null, 'Listed in the MDCN 2025 accredited medical-schools register. This confirms a health-sciences institutional entry; verify the exact programme and current admission status separately.'),
  ('university-on-the-niger', 'University on the Niger', true, 'active', null, 'Listed in the MDCN 2025 accredited medical-schools register. This confirms a health-sciences institutional entry; verify the exact programme and current admission status separately.'),
  ('usmanu-danfodiyo-university', 'Usmanu Danfodiyo University', true, 'active', null, 'Listed in the MDCN 2025 accredited medical-schools register. This confirms a health-sciences institutional entry; verify the exact programme and current admission status separately.'),
  ('veritas-university', 'Veritas University', true, 'active', null, 'Listed in the MDCN 2025 accredited medical-schools register. This confirms a health-sciences institutional entry; verify the exact programme and current admission status separately.'),
  ('yobe-state-university', 'Yobe State University', true, 'active', null, 'Listed in the MDCN 2025 accredited medical-schools register. This confirms a health-sciences institutional entry; verify the exact programme and current admission status separately.'),
  ('yusuf-maitama-sule-university-kano', 'Yusuf Maitama Sule University, Kano', true, 'active', null, 'Listed in the MDCN 2025 accredited medical-schools register. This confirms a health-sciences institutional entry; verify the exact programme and current admission status separately.'),
  ('futa', 'Federal University of Technology, Akure', true, 'active', 'https://futa.edu.ng', 'Official FUTA School of Health and Health Technology listing: https://shht.futa.edu.ng/home. Programme availability is separately controlled by the verified programme catalogue.'),
  ('achievers-university', 'Achievers University', true, 'active', 'https://achievers.edu.ng', 'Official undergraduate programme listing includes MBBS and allied/basic health-science programmes: https://achievers.edu.ng/undergraduate_programmes/.'),
  ('federal-university-of-health-sciences-ila-orangun', 'Federal University of Health Sciences, Ila-Orangun', true, 'active', 'https://fuhsi.edu.ng', 'Official 2026/2027 admissions page lists health-science undergraduate programmes: https://fuhsi.edu.ng/admissions.html.')
on conflict (slug) do update set
  name = excluded.name,
  offers_health_sciences = excluded.offers_health_sciences,
  directory_status = excluded.directory_status,
  official_url = excluded.official_url,
  verification_note = excluded.verification_note,
  updated_at = now();

-- Enforce the narrow BSc pathway exception: Bowen MBBS students in 200L+ only.
update public.hub_accounts
set bsc_pathway = null
where bsc_pathway is not null
  and not (
    upper(trim(coalesce(institution,''))) in ('BOWEN UNIVERSITY','BOWEN')
    and upper(trim(coalesce(programme,''))) = 'MBBS'
    and academic_level in ('200L','300L','400L','500L','600L','700L')
  );

update public.guest_academic_profiles
set bsc_pathway = null
where bsc_pathway is not null
  and not (
    upper(trim(coalesce(institution,''))) in ('BOWEN UNIVERSITY','BOWEN')
    and upper(trim(coalesce(programme,''))) = 'MBBS'
    and academic_level in ('200L','300L','400L','500L','600L','700L')
  );

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'hub_accounts_bsc_pathway_scope_check') then
    alter table public.hub_accounts add constraint hub_accounts_bsc_pathway_scope_check
      check (
        bsc_pathway is null or (
          upper(trim(coalesce(institution,''))) in ('BOWEN UNIVERSITY','BOWEN')
          and upper(trim(coalesce(programme,''))) = 'MBBS'
          and academic_level in ('200L','300L','400L','500L','600L','700L')
        )
      );
  end if;
  if not exists (select 1 from pg_constraint where conname = 'guest_academic_profiles_bsc_pathway_scope_check') then
    alter table public.guest_academic_profiles add constraint guest_academic_profiles_bsc_pathway_scope_check
      check (
        bsc_pathway is null or (
          upper(trim(coalesce(institution,''))) in ('BOWEN UNIVERSITY','BOWEN')
          and upper(trim(coalesce(programme,''))) = 'MBBS'
          and academic_level in ('200L','300L','400L','500L','600L','700L')
        )
      );
  end if;
end $$;

-- Enforce the BSc pathway only for Bowen MBBS students in 200L+.
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
  if upper(trim(p_institution)) in ('BOWEN UNIVERSITY','BOWEN')
     and upper(trim(p_programme)) = 'MBBS'
     and p_academic_level in ('200L','300L','400L','500L','600L','700L')
     and coalesce(length(trim(p_bsc_pathway)),0) = 0 then
    return json_build_object('ok',false,'error','Select the BSc pathway for Bowen MBBS students in 200L and above.');
  end if;
  pathway := case
    when upper(trim(p_institution)) in ('BOWEN UNIVERSITY','BOWEN')
      and upper(trim(p_programme)) = 'MBBS'
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
  if upper(trim(p_institution)) in ('BOWEN UNIVERSITY','BOWEN')
     and upper(trim(p_programme)) = 'MBBS'
     and p_academic_level in ('200L','300L','400L','500L','600L','700L')
     and coalesce(length(trim(p_bsc_pathway)),0) = 0 then
    return json_build_object('ok',false,'error','Select the BSc pathway for Bowen MBBS students in 200L and above.');
  end if;
  pathway := case
    when upper(trim(p_institution)) in ('BOWEN UNIVERSITY','BOWEN')
      and upper(trim(p_programme)) = 'MBBS'
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


alter table public.hub_academic_institutions enable row level security;
alter table public.hub_academic_programmes enable row level security;
alter table public.hub_academic_courses enable row level security;
alter table public.hub_academic_resources enable row level security;
alter table public.hub_academic_resource_mappings enable row level security;

revoke all on public.hub_academic_institutions from public, anon, authenticated;
revoke all on public.hub_academic_programmes from public, anon, authenticated;
revoke all on public.hub_academic_courses from public, anon, authenticated;
revoke all on public.hub_academic_resources from public, anon, authenticated;
revoke all on public.hub_academic_resource_mappings from public, anon, authenticated;

-- The RPCs run as the caller (SECURITY INVOKER). RLS permits read access only
-- to active directory entries and approved/published academic catalogue rows.
create policy "Active health-science institutions are readable"
  on public.hub_academic_institutions for select to anon, authenticated
  using (directory_status = 'active' and offers_health_sciences = true);

create policy "Active programmes are readable"
  on public.hub_academic_programmes for select to anon, authenticated
  using (
    directory_status = 'active'
    and exists (
      select 1 from public.hub_academic_institutions i
      where i.id = institution_id
        and i.directory_status = 'active'
        and i.offers_health_sciences = true
    )
  );

create policy "Verified courses are readable"
  on public.hub_academic_courses for select to anon, authenticated
  using (
    curriculum_status = 'verified'
    and exists (
      select 1
      from public.hub_academic_programmes p
      join public.hub_academic_institutions i on i.id = p.institution_id
      where p.id = programme_id
        and p.institution_id = hub_academic_courses.institution_id
        and p.directory_status = 'active'
        and i.directory_status = 'active'
    )
  );

create policy "Approved published resources are readable"
  on public.hub_academic_resources for select to anon, authenticated
  using (
    is_published = true
    and quality_status = 'approved'
    and rights_status = 'cleared'
  );

create policy "Verified resource mappings are readable"
  on public.hub_academic_resource_mappings for select to anon, authenticated
  using (
    mapping_status = 'verified'
    and verified_at is not null
    and exists (
      select 1 from public.hub_academic_courses c
      where c.id = course_id and c.curriculum_status = 'verified'
    )
  );

grant select on public.hub_academic_institutions to anon, authenticated;
grant select on public.hub_academic_programmes to anon, authenticated;
-- Course and resource rows are exposed only through the exact-match resource RPC.
-- Direct table reads would bypass the app's selected academic identity filter.

create or replace function public.hub_list_health_institutions()
returns table (slug text, name text)
language sql
stable
security invoker
set search_path = public
as $$
  select i.slug, i.name
  from public.hub_academic_institutions i
  where i.directory_status = 'active'
    and i.offers_health_sciences = true
  order by i.name;
$$;

create or replace function public.hub_list_academic_programmes(p_institution_slug text)
returns table (programme_code text, programme_name text, programme_group text)
language sql
stable
security invoker
set search_path = public
as $$
  select p.programme_code, p.programme_name, p.programme_group
  from public.hub_academic_programmes p
  join public.hub_academic_institutions i on i.id = p.institution_id
  where i.slug = lower(trim(p_institution_slug))
    and i.directory_status = 'active'
    and p.directory_status = 'active'
  order by p.programme_name;
$$;

-- Only approved, rights-cleared, published resources with an explicitly verified
-- mapping to the student's exact institution/programme/level/semester are returned.
create or replace function public.hub_list_academic_resources(
  p_institution_slug text,
  p_programme_code text,
  p_academic_level text,
  p_semester text
)
returns table (
  resource_key text,
  title text,
  resource_type text,
  course_code text,
  course_title text,
  topic text,
  content_reference text,
  metadata jsonb
)
language sql
stable
security definer
set search_path = public
as $$
  select r.resource_key, r.title, r.resource_type,
         c.course_code, c.course_title, m.topic,
         r.content_reference, r.metadata
  from public.hub_academic_resources r
  join public.hub_academic_resource_mappings m on m.resource_id = r.id
  join public.hub_academic_courses c on c.id = m.course_id
  join public.hub_academic_institutions i on i.id = c.institution_id
  join public.hub_academic_programmes p on p.id = c.programme_id
  where i.slug = lower(trim(p_institution_slug))
    and i.directory_status = 'active'
    and p.programme_code = upper(trim(p_programme_code))
    and p.directory_status = 'active'
    and c.academic_level = p_academic_level
    and p_semester in ('first','second','summer','year-round')
    and c.semester = p_semester
    and c.curriculum_status = 'verified'
    and m.mapping_status = 'verified'
    and m.verified_at is not null
    and r.is_published = true
    and r.quality_status = 'approved'
    and r.rights_status = 'cleared'
    and (
      (r.reuse_policy = 'shared-after-review')
      or
      (r.reuse_policy = 'institution-only' and r.owner_institution_id = i.id)
    )
  order by c.course_code, r.resource_type, r.title;
$$;

revoke all on function public.hub_list_health_institutions() from public;
revoke all on function public.hub_list_academic_programmes(text) from public;
revoke all on function public.hub_list_academic_resources(text,text,text,text) from public;
grant execute on function public.hub_list_health_institutions() to anon, authenticated;
grant execute on function public.hub_list_academic_programmes(text) to anon, authenticated;
grant execute on function public.hub_list_academic_resources(text,text,text,text) to anon, authenticated;

commit;
