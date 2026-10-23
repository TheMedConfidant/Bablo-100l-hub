# Bablo Chess — Phase 2: Multiplayer Security Hardening

Status: design and audit only. No production database changes have been made.

## Verified baseline

- The chess-engine preview's 11 checks pass.
- Production is not being modified as part of this development phase.
- The app uses Bablo Hub's custom session/token model; do not assume Supabase Auth `auth.uid()` identifies a chess player.
- Tables `public.chess_games`, `public.chess_messages`, and `public.chess_ratings` currently have RLS enabled, but their current policies are not participant-scoped.
- `chess_games`: public/anon and authenticated roles can read all rows; update policy uses `true` for both USING and WITH CHECK.
- `chess_messages`: public/anon and authenticated roles can read all messages; insert checks only message length and that the game is not finished, not whether the sender is a participant.
- `chess_ratings`: public/anon and authenticated roles can read all rows, insert a rating row with client-provided values in bounds, and update any row.
- `public.apply_chess_elo_rating()` is SECURITY DEFINER and callable through the exposed API. It is a trigger function, and the advisor flags it. Do not blanket-revoke privileges or rewrite shared Hub SECURITY DEFINER functions without checking their callers and authorization model.
- Current schema has no dedicated trusted chess Edge Function.

## Security invariants for release

1. The browser must never be authoritative for game state, result, participant identity, or rating changes.
2. Every action must authenticate a valid, unexpired Bablo Hub session on the server. Never trust a client-supplied `dev`, nickname, player side, or game participant ID as proof of identity.
3. Every game mutation must verify the authenticated actor is a participant (or an explicitly authorized waiting-game host), the game is active and not expired, it is that actor's turn, and the proposed move is legal against the server's canonical position.
4. The server owns game status, result, timestamps, and rating-applied flags.
5. Chat and reactions must be scoped to a game participant, validate payload length/content, and be rate-limited.
6. Ratings can only be applied server-side after a valid finished game, once per game, with idempotency and concurrency protection.
7. Public matchmaking may expose only the minimum lobby fields needed to join; private challenges and active game details must not be globally readable.
8. Existing Hub login, admin, upload, study progress, and social features must not be broken by broad privilege changes.

## Staged implementation

### Phase 2A — Complete read-only contract inspection
- Inspect the exact definitions, grants, triggers, and call sites for all chess policies/functions and the Hub session validation routines.
- Trace the frontend's game creation, join, move, chat, finish, and rating requests.
- Determine whether device IDs are stable identity hints or security credentials; treat them as untrusted until proven otherwise.
- Map required public reads (e.g. leaderboard) separately from private game state.

### Phase 2B — Trusted chess API on a development environment
- Add a dedicated Edge Function/API surface for create/join/challenge, move, resign/finish, read-state, chat/reaction, and rating summary.
- Validate Hub session token server-side against `hub_sessions` and its expiry, joining to `hub_accounts`; never return password hashes or raw session rows.
- Keep service credentials server-only. Validate all payloads and use request IDs/idempotency keys for retried moves and finish operations.
- Store or derive canonical board position server-side. Validate move legality with a pinned, tested chess rules implementation before persisting the move.
- Enforce game participants in every query and mutation; rate-limit challenge creation, joining, moves, and chat.
- Preserve existing schema fields where possible; use additive migrations and avoid deleting or rewriting historical games.

### Phase 2C — Test and tighten direct database access
- Add regression tests for unauthenticated reads/writes, nonparticipant reads/writes, out-of-turn/illegal moves, forged results, duplicate rating application, and cross-game chat.
- Migrate the preview client to the trusted API first.
- Only after all required reads/writes are routed through the API, tighten direct table grants and RLS policies in a reviewed migration. Do not remove access needed by the current production client before migration.
- Verify matchmaking, reconnect, chat, leaderboard, ratings, and the ordinary Hub login flow against a test environment.

### Phase 2D — Release gate
- Confirm all tests pass, run Supabase security/performance advisors, and inspect logs.
- Deploy preview; manually test two distinct accounts on separate devices.
- Merge to production only after an explicit final review and verified rollback plan.

## Explicit non-actions in this phase

- No production SQL or RLS policy changes.
- No changes to existing accounts, sessions, games, chat history, ratings, or leaderboard rows.
- No blanket revocation of SECURITY DEFINER function grants.
- No claim of secure multiplayer until the API and negative authorization tests are implemented and verified.
