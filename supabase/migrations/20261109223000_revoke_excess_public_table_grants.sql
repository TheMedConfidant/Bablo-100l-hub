-- Remove unnecessary direct write grants from public submission tables.
begin;
revoke update,delete,truncate,references,trigger on public.analytics_events,
 public.feedback,public.hub_chat,public.question_corrections,
 public.qualifier_results,public.qualifier_starts
from public,anon,authenticated;
revoke all on public.profiles from public,anon;
commit;
