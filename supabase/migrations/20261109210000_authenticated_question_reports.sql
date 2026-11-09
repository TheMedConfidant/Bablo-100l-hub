-- Require an authenticated Bablo session for question reports and allow
-- only one report per account/question to prevent anonymous report inflation.
begin;
create table if not exists public.question_report_events (
 id bigint generated always as identity primary key,
 reporter_uid text not null references public.hub_accounts(unique_id) on delete cascade,
 question_id text not null,
 created_at timestamptz not null default now(),
 unique(reporter_uid,question_id)
);
alter table public.question_report_events enable row level security;
revoke all on public.question_report_events from public,anon,authenticated;
create or replace function public.report_question(p_token text,qid text)
returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare v_actor text;v_inserted integer;
begin
 v_actor:=public.hub_challenge_actor(p_token);
 if v_actor is null then return jsonb_build_object('ok',false,'error','Please log in to report a question.'); end if;
 if qid is null or char_length(qid)=0 or char_length(qid)>80 then
  return jsonb_build_object('ok',false,'error','Invalid question reference.'); end if;
 insert into public.question_report_events(reporter_uid,question_id)
 values(v_actor,qid) on conflict(reporter_uid,question_id) do nothing;
 get diagnostics v_inserted=row_count;
 if v_inserted=0 then return jsonb_build_object('ok',true,'duplicate',true); end if;
 insert into public.question_reports(question_id,reports) values(qid,1)
 on conflict(question_id) do update set reports=public.question_reports.reports+1,updated_at=now();
 return jsonb_build_object('ok',true,'duplicate',false);
end; $$;
revoke all on function public.report_question(text,text) from public;
grant execute on function public.report_question(text,text) to anon,authenticated;
drop function if exists public.report_question(text);
commit;
