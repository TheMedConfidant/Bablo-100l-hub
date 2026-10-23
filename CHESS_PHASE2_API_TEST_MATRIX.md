# Chess Phase 2 API — regression test matrix

Status: implementation draft on `chess-redesign/phase-1-foundation`. Not deployed and not connected to the production client.

## Setup requirements
- Apply `supabase/migrations/202610230001_chess_identity_and_game_metadata.sql` to an isolated development database only.
- Deploy the function to an isolated Supabase development project with `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` set by the platform.
- Invoke using an unexpired `hub_sessions.token` belonging to a non-guest `hub_accounts` record.
- Do not test by writing to production chess tables.

## Authentication and identity
- Missing token returns 401.
- Random token returns 401.
- Expired Hub session returns 401.
- Guest account returns 403.
- Two valid Hub accounts receive distinct stable chess player IDs.
- Repeated identity requests for one account return the same chess player ID.
- Client-supplied nickname, device ID, player ID, result, and rating never override the account identity resolved from the Hub session.

## Challenges
- Unsupported time control returns 400.
- Unlimited games cannot be marked rated.
- A signed-in player can create a waiting challenge.
- A player cannot accept their own challenge.
- Unknown/expired challenge returns 404.
- Two simultaneous accept attempts: exactly one succeeds; the other gets 409.
- Legacy device-only games are not silently assigned to a Hub account.

## Moves and game state
- Non-participant state/move request returns 404.
- Out-of-turn move returns 409.
- Invalid UCI shape returns 400.
- Illegal chess move returns 422 and leaves game unchanged.
- A valid move advances canonical server history exactly once.
- Two concurrent moves against the same old history: only one compare-and-swap update succeeds.
- Stored move history that cannot be legally replayed is rejected.
- Fool's Mate produces checkmate result; stalemate produces a draw result.
- Client cannot set a winner by sending a result field.
- Resignation records the opposite player's win; arbitrary finish reasons are rejected.
- Finished games reject additional moves.

## Chat
- Non-participant cannot read or post messages.
- Empty and >240-character messages are rejected.
- Chat posting after game end is rejected.
- Chat reads are capped at 100 messages.

## Release blockers still outstanding
- Integrate frontend challenge/move/chat calls with this API; remove browser writes for games/messages/ratings.
- Implement and test server-authoritative, idempotent rating application.
- Add request rate limiting and stronger transaction-level concurrency handling (the REST compare-and-swap is a useful first guard, not a full transaction).
- Validate the API against the actual development schema and execute all tests.
- Tighten production RLS only after the migrated client is verified.
- Do not deploy this draft or apply its migration to production until all blockers pass.
