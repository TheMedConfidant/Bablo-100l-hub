# Phase 2 implementation checkpoint: identity and compatibility contract

Status: source/schema investigation only. No database writes or deployments.

## Critical discovery

The existing chess schema identifies players using client-supplied `white_dev`, `black_dev`, and `target_dev` device strings. Bablo Hub login instead authenticates a session token in `hub_sessions`, joined to `hub_accounts.unique_id`. There is currently no foreign key or trusted mapping from a Hub account to a chess device identity.

Therefore, a server cannot safely conclude that a logged-in Hub account owns a legacy `dev` value just because the client submits both values. A device string is an identifier, not proof of ownership.

## Safe design decision

- New authenticated chess sessions need a server-owned, stable player identity bound to the validated Hub session/account.
- New games and challenges should store that trusted player identity as the participant key. Nicknames and device identifiers remain display/compatibility metadata only.
- Existing games must remain readable to their original participants under the legacy compatibility path, but legacy device-only identity must not grant access to new rated games or let clients claim someone else's existing game.
- Any migration of old device identities to Hub accounts needs a verified account-link flow or explicit re-authentication. Do not bulk-match by nickname, and do not infer ownership from a client-supplied device ID.
- Until the mapping and trusted API are implemented, do not deploy tightened RLS policies that could lock out current users, and do not expose rated matchmaking as secure.

## API contract for the next implementation

Every request carries the existing Hub session token in a dedicated header. The Edge Function validates it against `hub_sessions` and expiry, derives the account ID server-side, and ignores any client-supplied account ID.

Initial operations:
1. `get_state`: only return a game if the derived player identity is a participant; lobby/challenge lookup returns only minimum required fields.
2. `send_message`: require participant membership, active game, bounded text, and rate limit; derive nickname from trusted player metadata.
3. `submit_move`: validate the move against canonical server state using a pinned chess rules engine, enforce turn order, and commit with concurrency protection. The exact legacy `moves` serialization must be confirmed before supporting legacy games.
4. `finish_game`: derive the result from a legal terminal state or validated resignation/timeout, never trust a client result string.
5. `apply_rating`: server-only, idempotent per finished rated game, with separate Bullet/Blitz/Rapid pools introduced additively.

## Release blockers to clear

- [ ] Confirm the legacy move serialization and direct challenge acceptance path from the actual frontend call sites.
- [ ] Add the new player identity model through a reviewed additive migration.
- [ ] Implement session-validated Edge Function operations with no public service-role access.
- [ ] Add negative tests for expired/missing sessions, cross-game reads, nonparticipant chat, illegal/out-of-turn moves, forged result, duplicate rating application, and concurrent moves.
- [ ] Switch preview clients to the API, verify two real Hub accounts on separate devices, then plan RLS/grant tightening.
- [ ] Only then propose a production rollout and rollback plan.

## Protected invariants

No existing Hub account, session, chess game, message, rating, leaderboard, or production policy was changed in this checkpoint.
