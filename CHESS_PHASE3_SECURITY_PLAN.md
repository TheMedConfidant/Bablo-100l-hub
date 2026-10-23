# Bablo Chess — Phase 3 Security Hardening Plan

Status: audit and proposed design only. No production database policy or function has been changed.

## Why this is next

The current public policies allow any anonymous or authenticated client to read and update every chess game, post chat messages to any unfinished game, and insert/update rating rows without proving ownership. This makes live-game integrity, private chat, and ratings vulnerable to tampering.

## Confirmed current schema

- `chess_games`: `id`, `code`, `white_nick`, `white_dev`, `black_nick`, `black_dev`, `status`, `moves`, `result`, timestamps, `rating_applied`, `target_dev`.
- `chess_messages`: `id`, `game_id`, `nick`, `body`, `created_at`.
- `chess_ratings`: `dev`, `nick`, `rating`, `wins`, `draws`, `losses`, `updated_at`.

## Current risky policies

- `chess_games`: public SELECT and unrestricted UPDATE; INSERT only checks waiting status and empty moves.
- `chess_messages`: public SELECT; INSERT checks message length and unfinished game status, but not whether the sender is a participant.
- `chess_ratings`: public SELECT, and INSERT/UPDATE can alter ratings without proving ownership.

## Recommended architecture

1. **Keep the existing Hub login/session model in mind.** Do not write policies that assume `auth.uid()` identifies a player unless the app is migrated to Supabase Auth. Current chess records use device identity fields.
2. **Route state-changing actions through a trusted server/Edge Function.** It must validate the existing Hub session, verify that the caller is a participant, validate the move/game transition, and derive the sender from the validated session rather than trusting a client-supplied nickname.
3. **Protect ratings from clients.** Only the trusted server should apply rated results, once per completed game, after verifying the final result. Clients must not directly insert or update ratings.
4. **Scope reads.** Players should only retrieve games and chat they are entitled to see. Challenge lookup should use a high-entropy code and return only the minimum fields needed to accept or decline.
5. **Keep chat participant-bound.** Confirm the validated sender belongs to the game, enforce message limits, and prevent sending after the game ends.
6. **Avoid broad policy changes in production until the app call sites are migrated.** First add and test the trusted actions in a staging environment; then switch clients; then tighten direct table grants/policies. This avoids breaking existing challenges unexpectedly.

## Rollout gates

- Verify challenge creation, accept/decline, reconnect, chat, reactions, move sync, rematch, and finished-game history with two devices.
- Attempt cross-game reads/writes with unrelated sessions and confirm they fail.
- Confirm a player cannot set another player's nickname/device identity or alter ratings.
- Confirm duplicate result submissions cannot apply Elo twice.
- Run Supabase security advisors and regression tests before production rollout.

## Explicitly out of scope for this audit

No production SQL, RLS policy, database function, rating, login, or challenge data was modified. The current live app remains unchanged by this document.
