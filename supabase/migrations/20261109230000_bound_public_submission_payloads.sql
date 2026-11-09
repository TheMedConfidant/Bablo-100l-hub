-- Bound anonymous submissions so public forms cannot write oversized payloads.
begin;
drop policy if exists "send feedback" on public.feedback;
create policy "send feedback" on public.feedback for insert to anon,authenticated
with check (char_length(trim(body)) between 2 and 1000 and char_length(trim(kind)) between 1 and 40
 and char_length(trim(nick)) between 1 and 30 and char_length(trim(programme)) between 1 and 80
 and (ref is null or char_length(ref)<=200));
drop policy if exists "suggest corrections" on public.question_corrections;
create policy "suggest corrections" on public.question_corrections for insert to anon,authenticated
with check (status='pending' and sources_count=1 and char_length(trim(question_id)) between 1 and 80
 and char_length(trim(correct_text)) between 1 and 300 and char_length(trim(source)) between 2 and 500
 and char_length(trim(nick)) between 1 and 30);
drop policy if exists "anonymous analytics event insert" on public.analytics_events;
create policy "anonymous analytics event insert" on public.analytics_events for insert to anon,authenticated
with check (event_type=any(array['page_view','quiz_start','quiz_complete','feature_view','purchase_interest','adaptive_start','flashcard_session'])
 and char_length(anon_id) between 8 and 80 and char_length(page)<=80 and char_length(feature)<=50
 and (duration_seconds is null or duration_seconds between 0 and 86400)
 and (score_percent is null or score_percent between 0 and 100));
commit;
