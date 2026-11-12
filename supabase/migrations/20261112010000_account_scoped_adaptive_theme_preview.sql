-- Temporary, account-scoped Adaptive Theme acceptance access.
-- Expires automatically after 48 hours; does not alter the paid premium flag.
begin;

alter table public.hub_accounts
  add column if not exists adaptive_theme_preview_until timestamptz;

update public.hub_accounts
set adaptive_theme_preview_until = now() + interval '48 hours',
    updated_at = now()
where unique_id = 'MBB-4635'
  and username = 'bablo'
  and premium = true
  and is_guest = false;

create or replace function public.hub_login(p_unique_id text, p_password text)
returns json
language plpgsql
security definer
set search_path to 'public', 'extensions'
as $function$
declare
  acc public.hub_accounts%rowtype;
  tok text;
  recent int;
begin
  if char_length(coalesce(p_password,'')) > 128 then
    return json_build_object('ok',false,'error','ID or password is not right.');
  end if;

  select count(*) into recent
  from public.hub_failed_logins
  where unique_id = upper(coalesce(p_unique_id,''))
    and at > now() - interval '15 minutes';

  if recent >= 5 then
    return json_build_object('ok',false,'error','Too many wrong tries. Wait 15 minutes and try again.');
  end if;

  select * into acc
  from public.hub_accounts
  where unique_id = upper(coalesce(p_unique_id,''));

  if not found or acc.password_hash <> extensions.crypt(coalesce(p_password,''),acc.password_hash) then
    insert into public.hub_failed_logins(unique_id) values(upper(coalesce(p_unique_id,'')));
    return json_build_object('ok',false,'error','ID or password is not right.');
  end if;

  delete from public.hub_failed_logins where unique_id = acc.unique_id;
  tok := encode(extensions.gen_random_bytes(32),'hex');
  insert into public.hub_sessions(token,unique_id) values(tok,acc.unique_id);

  return json_build_object(
    'ok',true,'token',tok,'uniqueId',acc.unique_id,'fullName',acc.full_name,
    'nickname',acc.nickname,'username',acc.username,'programme',acc.programme,
    'programmeCategory',acc.programme_category,'institution',acc.institution,
    'academicLevel',acc.academic_level,'bscPathway',acc.bsc_pathway,
    'academicDetailsVerified',acc.academic_details_verified,
    'isGuest',acc.is_guest,'premium',acc.premium,
    'fullPremium',coalesce(acc.adaptive_theme_preview_until > now(),false),
    'progress',acc.progress
  );
end;
$function$;

commit;