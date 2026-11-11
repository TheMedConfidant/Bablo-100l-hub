begin;
do $$
declare fn text;
begin
  select pg_get_functiondef('public.hub_save_academic_profile(text,text,text,text,text,text)'::regprocedure) into fn;
  execute replace(fn, 'length(trim(p_programme)) > 80', 'length(trim(p_programme)) > 60');
  select pg_get_functiondef('public.hub_save_guest_academic_profile(text,text,text,text,text,text)'::regprocedure) into fn;
  execute replace(fn, 'length(trim(p_programme)) > 80', 'length(trim(p_programme)) > 60');
end $$;
alter table public.guest_academic_profiles
  drop constraint if exists guest_academic_profiles_programme_check;
alter table public.guest_academic_profiles
  add constraint guest_academic_profiles_programme_check
  check (char_length(programme) between 2 and 60);
commit;
