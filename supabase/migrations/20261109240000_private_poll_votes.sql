-- Poll votes contain individual account choices; keep them private.
-- The UI uses hub_poll_vote and hub_poll_counts RPCs, which validate the
-- Bablo session and return only aggregate counts plus the caller's own vote.
begin;
revoke all on table public.poll_votes from public, anon, authenticated;
drop policy if exists "cast a vote" on public.poll_votes;
commit;
