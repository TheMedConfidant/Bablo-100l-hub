create index if not exists hub_challenge_matches_winner_uid_idx
  on public.hub_challenge_matches (winner_uid)
  where winner_uid is not null;
create index if not exists scores_uid_course_ts_idx
  on public.scores (uid, course, ts desc)
  where uid is not null and course is not null;
