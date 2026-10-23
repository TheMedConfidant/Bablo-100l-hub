# Chess API — Phase 2A scaffold

This function is source-only in the GitHub development branch. It has **not** been deployed to Supabase and does not change production.

## Current scope
- `GET /health`: non-sensitive liveness check.
- `POST { "action": "identity", "token": "<Bablo Hub session token>" }`: validates the custom Hub session against `hub_sessions.expires_at` and joins `hub_accounts`; returns only the profile fields needed by the client.
- All other actions return `501` until participant identity mapping and the game-state contract are verified.

## Required environment
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY` (server-side secret only; never add to client code or commit secrets)

## Why this is intentionally narrow
The current chess tables identify players with `white_dev` / `black_dev`, while Hub login identifies accounts with `unique_id`. We have not yet proven a reliable, server-verifiable mapping between these identities. Therefore this scaffold refuses to expose or mutate game rows rather than incorrectly assume a device ID is an account identity.

Before implementing game reads/moves, define and migrate an explicit account-to-player binding, then validate every game action against it. Do not deploy until the client contract, CORS origins, rate limits, and tests are ready.
