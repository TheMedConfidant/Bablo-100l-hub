-- Bablo Hub Premium Library order and entitlement foundation.
-- ₦500 per course Notes pack or Flashcards deck. Checkout remains disabled
-- until the provider checkout + signature-verified webhook are configured.
begin;
create table if not exists public.hub_premium_catalog (
  course_code text not null,
  resource_type text not null check(resource_type in ('notes','flashcards')),
  amount_kobo integer not null default 50000 check(amount_kobo=50000),
  is_active boolean not null default true,
  updated_at timestamptz not null default now(),
  primary key(course_code,resource_type)
);
insert into public.hub_premium_catalog(course_code,resource_type,amount_kobo,is_active) values
 ('BIO','notes',50000,true),('CHM','notes',50000,true),('CHM','flashcards',50000,true),
 ('AGR','notes',50000,true),('AGR','flashcards',50000,true)
on conflict(course_code,resource_type) do update set
 amount_kobo=excluded.amount_kobo,is_active=excluded.is_active,updated_at=now();

create table if not exists public.hub_premium_orders (
 id uuid primary key default gen_random_uuid(),
 order_ref text not null unique,
 unique_id text not null references public.hub_accounts(unique_id) on delete cascade,
 programme text not null,
 amount_kobo integer not null check(amount_kobo>0),
 currency text not null default 'NGN' check(currency='NGN'),
 status text not null default 'pending' check(status in ('pending','paid','failed','cancelled','refunded')),
 provider text,provider_reference text unique,checkout_url text,
 created_at timestamptz not null default now(),paid_at timestamptz,updated_at timestamptz not null default now()
);
create table if not exists public.hub_premium_order_items (
 id bigint generated always as identity primary key,
 order_id uuid not null references public.hub_premium_orders(id) on delete cascade,
 course_code text not null,resource_type text not null check(resource_type in ('notes','flashcards')),
 amount_kobo integer not null check(amount_kobo=50000),
 unique(order_id,course_code,resource_type)
);
create table if not exists public.hub_premium_entitlements (
 id bigint generated always as identity primary key,
 unique_id text not null references public.hub_accounts(unique_id) on delete cascade,
 course_code text not null,resource_type text not null check(resource_type in ('notes','flashcards')),
 order_id uuid not null references public.hub_premium_orders(id),
 granted_at timestamptz not null default now(),
 unique(unique_id,course_code,resource_type)
);
alter table public.hub_premium_catalog enable row level security;
alter table public.hub_premium_orders enable row level security;
alter table public.hub_premium_order_items enable row level security;
alter table public.hub_premium_entitlements enable row level security;
revoke all on public.hub_premium_catalog,public.hub_premium_orders,
 public.hub_premium_order_items,public.hub_premium_entitlements from public,anon,authenticated;

create or replace function public.hub_premium_create_order(p_token text,p_items jsonb)
returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare v_uid text;v_programme text;v_order_id uuid;v_ref text;v_total integer;v_count integer;v_allowed text[];
begin
 if p_token is null or length(p_token)<32 or length(p_token)>256 then
  return jsonb_build_object('ok',false,'error','Please sign in again.'); end if;
 select s.unique_id,a.programme into v_uid,v_programme from public.hub_sessions s
 join public.hub_accounts a on a.unique_id=s.unique_id
 where s.token=p_token and s.expires_at>now() and a.is_guest=false limit 1;
 if v_uid is null then return jsonb_build_object('ok',false,'error','A registered account is required.'); end if;
 if jsonb_typeof(p_items)<>'array' or jsonb_array_length(p_items)<1 or jsonb_array_length(p_items)>20 then
  return jsonb_build_object('ok',false,'error','Choose between 1 and 20 resource packs.'); end if;
 v_allowed:=case v_programme
  when 'MBBS' then array['BIO','CHM','AGR','PHY','COS','GST111','GEL101','LIB101','MTH101']
  when 'Medical Laboratory Science' then array['BIO','CHM','PHY','COS','GST111','GEL101','LIB101','MTH101','MLS101']
  when 'Doctor of Physiotherapy (DPT)' then array['BIO','CHM','PHY','COS','GST111','GEL101','LIB101']
  when 'Public Health' then array['BIO','CHM','PHY','COS','GST111','GEL101','LIB101']
  else array['BIO','CHM','PHY','COS','GST111','GEL101','LIB101','MTH101'] end;
 if exists(select 1 from jsonb_array_elements(p_items) as item(value)
  where coalesce(value->>'course_code','')='' or coalesce(value->>'resource_type','') not in ('notes','flashcards')
  or not ((value->>'course_code')=any(v_allowed))) then
  return jsonb_build_object('ok',false,'error','One or more packs are not available for your programme.'); end if;
 select count(*),coalesce(sum(c.amount_kobo),0) into v_count,v_total
 from (select distinct value->>'course_code' course_code,value->>'resource_type' resource_type
  from jsonb_array_elements(p_items) as item(value)) requested
 join public.hub_premium_catalog c on c.course_code=requested.course_code
  and c.resource_type=requested.resource_type and c.is_active=true;
 if v_count<>jsonb_array_length(p_items) then
  return jsonb_build_object('ok',false,'error','A selected resource pack is unavailable or duplicated.'); end if;
 if exists(select 1 from jsonb_array_elements(p_items) as item(value)
  join public.hub_premium_entitlements e on e.unique_id=v_uid
   and e.course_code=value->>'course_code' and e.resource_type=value->>'resource_type') then
  return jsonb_build_object('ok',false,'error','You already own one of the selected packs.'); end if;
 if (select count(*) from public.hub_premium_orders where unique_id=v_uid and created_at>now()-interval '1 hour')>=10 then
  return jsonb_build_object('ok',false,'error','Too many checkout attempts. Please try again later.'); end if;
 v_order_id:=gen_random_uuid();v_ref:='BH-'||upper(substr(replace(gen_random_uuid()::text,'-',''),1,16));
 insert into public.hub_premium_orders(id,order_ref,unique_id,programme,amount_kobo)
 values(v_order_id,v_ref,v_uid,v_programme,v_total);
 insert into public.hub_premium_order_items(order_id,course_code,resource_type,amount_kobo)
 select v_order_id,value->>'course_code',value->>'resource_type',c.amount_kobo
 from jsonb_array_elements(p_items) as item(value)
 join public.hub_premium_catalog c on c.course_code=value->>'course_code'
  and c.resource_type=value->>'resource_type' and c.is_active=true;
 return jsonb_build_object('ok',true,'order_id',v_order_id,'order_ref',v_ref,
  'amount_kobo',v_total,'currency','NGN','status','pending',
  'message','Order prepared. Payment checkout is not configured yet.');
end; $$;
revoke all on function public.hub_premium_create_order(text,jsonb) from public;
grant execute on function public.hub_premium_create_order(text,jsonb) to anon,authenticated;

create or replace function public.hub_premium_grant_paid_order()
returns trigger language plpgsql security definer set search_path=public,pg_temp as $$
begin
 if new.status='paid' and old.status is distinct from 'paid' then
  new.paid_at:=coalesce(new.paid_at,now());new.updated_at:=now();
  insert into public.hub_premium_entitlements(unique_id,course_code,resource_type,order_id)
  select new.unique_id,i.course_code,i.resource_type,new.id from public.hub_premium_order_items i
  where i.order_id=new.id on conflict(unique_id,course_code,resource_type) do nothing;
 end if;
 return new;
end; $$;
revoke all on function public.hub_premium_grant_paid_order() from public,anon,authenticated;
drop trigger if exists hub_premium_paid_order_grant on public.hub_premium_orders;
create trigger hub_premium_paid_order_grant before update of status on public.hub_premium_orders
for each row execute function public.hub_premium_grant_paid_order();
commit;
