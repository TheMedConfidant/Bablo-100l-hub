-- Remove all direct Data API access to chess game rows.
-- Participant-checked RPCs and the service-side action function are the only
-- supported path for lobby, game state, moves and results.
begin;
revoke all on table public.chess_games from anon, authenticated;
drop policy if exists "read chess games" on public.chess_games;
drop policy if exists "create chess games" on public.chess_games;
commit;
