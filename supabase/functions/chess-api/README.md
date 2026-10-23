# Chess API — Phase 2 draft

This function is source-only on `chess-redesign/phase-1-foundation`. It has **not** been deployed to Supabase and does not change production.

## Implemented in source (not yet runtime-tested)
- Validates the existing custom Bablo Hub session against `hub_sessions.expires_at` and verifies the account in `hub_accounts`.
- Creates/returns a stable chess-player identity from the additive `chess_players` mapping. Device IDs and nicknames are not used as proof of identity.
- Creates and accepts challenges using server-derived player identity.
- Restricts game state and chat reads/posts to mapped participants.
- Replays stored UCI history with pinned chess.js, validates turn and legality, and uses compare-and-swap on stored move history to reject stale concurrent moves.
- Derives checkmate/stalemate outcomes from server-replayed game state.
- Allows resignation but does not accept client-supplied winners.
- Bounds request bodies, chat length, and chat history responses.
- Uses an explicit CORS allowlist; set `CHESS_ALLOWED_ORIGINS` to comma-separated preview origins in the development function environment.

## Required environment
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY` (server-side secret only; never add to client code or commit secrets)
- Optional `CHESS_ALLOWED_ORIGINS` for explicitly approved preview origins.

## Additive database migration
`supabase/migrations/202610230001_chess_identity_and_game_metadata.sql` adds the account-to-player mapping and optional metadata to existing game rows. It leaves old player identities unlinked and does not migrate historic device IDs by nickname. It also updates the Elo trigger to understand canonical chess results and skip rating changes for new games marked unrated. Existing legacy rows retain the previous rated behavior through the column default.

**Apply this migration only to an isolated development database first. Do not apply it to production yet.**

## Explicitly not finished
- The production frontend still writes directly to chess tables; it has not been migrated to this API.
- Rating changes are performed by the existing database trigger for eligible rated games; this behavior still requires isolated-database tests, including exactly-once updates and unrated games.
- Request rate limiting, stronger transactional concurrency guarantees, API integration tests, and full runtime/type checks remain release blockers.
- The migration and function have not been applied/deployed or tested against a development database.

Do not merge or deploy until the frontend no longer performs privileged direct writes, development-schema and negative tests pass, ratings are verified, and production RLS changes have a reviewed rollout plan.
