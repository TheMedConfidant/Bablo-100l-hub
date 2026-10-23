# Chess API — Phase 2 draft

This function is source-only on `chess-redesign/phase-1-foundation`. It has **not** been deployed to Supabase and does not change production.

## Implemented in source (not yet runtime-tested)
- Validates the existing custom Bablo Hub session against `hub_sessions.expires_at` and verifies the account in `hub_accounts`.
- Creates/returns a stable chess-player identity from the additive `chess_players` mapping. Device IDs and nicknames are not used as proof of identity.
- Defines challenge create/accept actions using server-derived player identity.
- Restricts game state and chat reads/posts to mapped participants.
- Replays stored UCI history with pinned chess.js, validates turn and legality, and uses compare-and-swap on the stored move history to reject stale concurrent moves.
- Derives checkmate/stalemate outcomes from server-replayed game state.
- Allows resignation but does not accept client-supplied winners.
- Bounds request size, chat length, and chat history responses.

## Required environment
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY` (server-side secret only; never add to client code or commit secrets)

## Additive database migration
`supabase/migrations/202610230001_chess_identity_and_game_metadata.sql` adds the account-to-player mapping and optional metadata to existing game rows. It leaves old player identities unlinked and does not migrate historic device IDs by nickname.

**Apply this migration only to an isolated development database first. Do not apply it to production yet.**

## Explicitly not finished
- The existing production frontend still writes directly to chess tables; it has not been migrated to this API.
- Rating updates are not implemented in this draft. No rating action is exposed.
- Request rate limiting, transactional concurrency guarantees, API integration tests, and full runtime/type checks remain release blockers.
- CORS is currently pinned to the production origin; configure explicit preview/test origins before browser-based preview testing.
- The database migration and function have not been applied/deployed or tested against a development database.

Do not merge or deploy until the frontend no longer performs privileged direct writes, the development schema and negative tests pass, rating updates are implemented server-side and idempotently, and production RLS changes have a reviewed rollout plan.
