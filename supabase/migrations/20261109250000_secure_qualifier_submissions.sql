-- Protect Programme Cup qualification attempts and scores from client spoofing.
begin;
revoke all on table public.qualifier_starts,public.qualifier_results from public,anon,authenticated;
drop policy if exists "start qualifier" on public.qualifier_starts;
drop policy if exists "submit qualifier" on public.qualifier_results;

create or replace function public.hub_qualifier_start(p_token text,p_batch text)
returns json language plpgsql security definer set search_path=public,pg_temp
as $$
declare v_uid text;v_now timestamp;v_window_ok boolean;
begin
 v_uid:=public.hub_challenge_actor(p_token);
 if v_uid is null then return json_build_object('ok',false,'error','Please log in first.'); end if;
 if not exists(select 1 from public.hub_accounts where unique_id=v_uid and is_guest=false) then
  return json_build_object('ok',false,'error','A registered account is required.');
 end if;
 if p_batch not in ('A','B') then return json_build_object('ok',false,'error','Invalid qualification batch.'); end if;
 v_now:=now() at time zone 'Africa/Lagos';
 v_window_ok:=v_now::date=date '2026-10-17' and
   ((p_batch='A' and v_now::time>=time '14:00' and v_now::time<time '18:00')
    or (p_batch='B' and v_now::time>=time '22:00' and v_now::time<time '23:00'));
 if not v_window_ok then return json_build_object('ok',false,'error','The qualification window is closed.'); end if;
 if exists(select 1 from public.qualifier_starts where uid=v_uid) or exists(select 1 from public.qualifier_results where uid=v_uid) then
  return json_build_object('ok',false,'error','This account has already started or completed its attempt.');
 end if;
 insert into public.qualifier_starts(uid,batch) values(v_uid,p_batch);
 return json_build_object('ok',true);
exception when unique_violation then
 return json_build_object('ok',false,'error','This account has already started its attempt.');
end $$;

create or replace function public.hub_qualifier_submit(p_token text,p_correct integer,p_n integer,p_secs integer,p_batch text)
returns json language plpgsql security definer set search_path=public,pg_temp
as $$
declare v_uid text;acc public.hub_accounts%rowtype;started public.qualifier_starts%rowtype;v_start timestamp;
begin
 v_uid:=public.hub_challenge_actor(p_token);
 if v_uid is null then return json_build_object('ok',false,'error','Please log in again.'); end if;
 select * into acc from public.hub_accounts where unique_id=v_uid;
 if not found or acc.is_guest then return json_build_object('ok',false,'error','A registered account is required.'); end if;
 if p_n<>60 or p_correct<0 or p_correct>p_n or p_secs<180 or p_secs>2400 or p_batch not in ('A','B') then
  return json_build_object('ok',false,'error','The submitted qualification result is invalid.');
 end if;
 select * into started from public.qualifier_starts where uid=v_uid and batch=p_batch;
 if not found then return json_build_object('ok',false,'error','No matching qualification attempt was started.'); end if;
 v_start:=started.created_at at time zone 'Africa/Lagos';
 if v_start::date<>date '2026-10-17'
    or not ((p_batch='A' and v_start::time>=time '14:00' and v_start::time<time '18:00')
      or (p_batch='B' and v_start::time>=time '22:00' and v_start::time<time '23:00'))
    or now()>started.created_at+interval '50 minutes' then
  return json_build_object('ok',false,'error','The qualification attempt is outside its valid submission window.');
 end if;
 insert into public.qualifier_results(uid,programme,nickname,pct,correct,n,secs,batch)
 values(v_uid,acc.programme,left(acc.nickname,30),round((p_correct::numeric/p_n::numeric)*100,1),p_correct,p_n,p_secs,p_batch);
 return json_build_object('ok',true,'pct',round((p_correct::numeric/p_n::numeric)*100,1));
exception when unique_violation then
 return json_build_object('ok',false,'error','A result has already been recorded for this account.');
end $$;

revoke all on function public.hub_qualifier_start(text,text) from public;
revoke all on function public.hub_qualifier_submit(text,integer,integer,integer,text) from public;
grant execute on function public.hub_qualifier_start(text,text) to anon,authenticated;
grant execute on function public.hub_qualifier_submit(text,integer,integer,integer,text) to anon,authenticated;
commit;
