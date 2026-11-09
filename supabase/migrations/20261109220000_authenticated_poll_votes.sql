-- One poll vote per signed-in Bablo account; prevent forged voter IDs.
begin;
delete from public.poll_votes a using public.poll_votes b
where a.poll_id=b.poll_id and a.voter=b.voter and a.id>b.id;
create unique index if not exists poll_votes_poll_voter_uidx on public.poll_votes(poll_id,voter);
revoke insert,update,delete,truncate,references,trigger on public.poll_votes from public,anon,authenticated;
grant select on public.poll_votes to anon,authenticated;
drop function if exists public.hub_poll_counts(text,text);
create or replace function public.hub_poll_counts(p_token text,p_poll_id text)
returns json language plpgsql security definer set search_path=public,pg_temp as $$
declare v_uid text;v_counts json;v_mine text;v_total integer;
begin
 v_uid:=public.hub_challenge_actor(p_token);
 if v_uid is null then return json_build_object('ok',false,'error','Please sign in to view the poll.'); end if;
 if coalesce(length(p_poll_id),0)<1 or length(p_poll_id)>40 then return json_build_object('ok',false,'error','Invalid poll.'); end if;
 select coalesce(json_object_agg(x.option_id,x.n),'{}'::json),coalesce(sum(x.n),0)::integer into v_counts,v_total
 from (select option_id,count(*)::integer n from public.poll_votes where poll_id=p_poll_id group by option_id) x;
 select option_id into v_mine from public.poll_votes where poll_id=p_poll_id and voter=v_uid limit 1;
 return json_build_object('ok',true,'counts',v_counts,'mine',v_mine,'total',v_total);
end; $$;
revoke all on function public.hub_poll_counts(text,text) from public;
grant execute on function public.hub_poll_counts(text,text) to anon,authenticated;
create or replace function public.hub_poll_vote(p_token text,p_poll_id text,p_option_id text)
returns json language plpgsql security definer set search_path=public,pg_temp as $$
declare v_uid text;v_rows integer;
begin
 v_uid:=public.hub_challenge_actor(p_token);
 if v_uid is null then return json_build_object('ok',false,'error','Please sign in to vote.'); end if;
 if p_poll_id<>'qualifications-2026-s1' then return json_build_object('ok',false,'error','This poll is closed or unavailable.'); end if;
 if p_option_id not in ('today-8pm','today-9pm','tomorrow-7pm','tomorrow-8pm')
   and not (p_option_id like 'write:%' and length(p_option_id) between 7 and 36) then
  return json_build_object('ok',false,'error','Invalid poll option.'); end if;
 insert into public.poll_votes(poll_id,option_id,voter) values(p_poll_id,p_option_id,v_uid)
 on conflict(poll_id,voter) do nothing;
 get diagnostics v_rows=row_count;
 if v_rows=0 then return json_build_object('ok',false,'error','You have already voted.'); end if;
 return json_build_object('ok',true);
end; $$;
revoke all on function public.hub_poll_vote(text,text,text) from public;
grant execute on function public.hub_poll_vote(text,text,text) to anon,authenticated;
commit;
