# Bablo Chess — Backend Integration Audit

Status: read-only audit; no production database or production deployment was changed.
Target project: Bablo Hub Supabase project (existing project ID held by deployment tooling; do not hardcode it in frontend code).

## Existing chess tables confirmed

- `chess_games`: UUID game ID, 6-character code, white/black nickname and device IDs, waiting/active/finished status, move history, result, target device, rating_applied and timestamps.
- `chess_messages`: game-linked chat/reaction messages.
- `chess_ratings`: one rating per device identity today, with wins/draws/losses. This is not yet the approved separate Bullet/Blitz/Rapid/Puzzle rating model.
- Existing games: 31 rows at audit time; chat: 36 rows; ratings: 2 rows. Counts are diagnostic only, not user-facing metrics.

## Security blockers discovered (read-only inspection of pg_policies)

Current policies allow public `anon` and `authenticated` clients to:
- read every chess game;
- update any chess game, with no participant/field restriction;
- read every chess chat message;
- insert messages into any unfinished game, without verifying that the sender is a participant;
- insert/update chess ratings without proving ownership, and update all rating rows.

These broad policies are not suitable for the planned competitive/rated system. They create risks of game-state tampering, forged chat, and rating manipulation. Do not expose new rated matchmaking or trusted rating awards on top of these policies.

## Integration rules

1. Preserve the existing `chess_games`, `chess_messages`, and `chess_ratings` data; do not drop or rename them.
2. Keep the existing direct challenge/game-code path working, including the known recipient join path that must not rely only on `target_dev`.
3. Do not let the browser directly award rated results. Use a trusted server-side operation with authorization, idempotency, and validated final game state.
4. Add per-time-control ratings (Bullet, Blitz, Rapid) and puzzle rating without breaking legacy `chess_ratings`; migration/backfill must be explicit and reversible.
5. Verify ownership/participant identity server-side. Device IDs and nicknames are identifiers, not authentication proofs.
6. Keep public chat and reactions scoped to the two game participants. Enforce message size, allowed reaction format, and finished-game restrictions.
7. Use a development/preview database branch for schema changes first. Do not apply speculative policy changes to production during UI work.
8. Before launch, test two-device challenge delivery, acceptance/decline/expiry, reconnect grace period, concurrent moves, duplicate result submissions, ratings idempotency, and RLS denial cases.

## Recommended build sequence

- Phase 1: integrate the dashboard into the existing chess entry point while preserving legacy game functions.
- Phase 2: build explicit routes/states for matchmaking, friend challenge, Dr ECG, puzzles, learning, history, profile, and settings.
- Phase 3: introduce trusted game-state/result operations and hardened RLS policies in a development branch.
- Phase 4: add separate rating pools, game history, persistence, and real engine-backed analysis.
- Phase 5: test the complete flow on desktop Chrome and mobile before production promotion.

## Current limitation

The visual preview is a separate deployment and is not connected to live gameplay. The integrated dashboard patch exists only in a local sandbox snapshot; it has not been pushed to this branch. Production remains unchanged. This file records the backend facts and safety gates so the integration can proceed without pretending the prototype is already live.
