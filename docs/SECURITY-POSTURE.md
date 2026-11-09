# Bablo Hub security posture

Last reviewed: 2026-11-09

## Controls verified in the live Supabase project
- Account, session, admin, failed-login and upload-processing tables are not directly readable by the anonymous Data API role.
- Chess game rows cannot be directly updated by anonymous clients; online chess mutations are routed through the session-validated server action.
- Social posts, comments and likes are written through Bablo-session-validated RPCs. Like identities are not directly readable; the app receives counts and its own like state through a summary RPC.
- Poll votes are private at the table layer and are read/cast through session-validated RPCs. A unique poll_id/voter constraint prevents repeat voting by one account.
- Question reports require a valid Bablo session and are unique per account/question. Direct report-count writes are revoked.
- Quiz-answer telemetry cannot be written directly by clients.
- Qualifier starts/results are routed through session-validated RPCs.
- Premium catalogue, orders, order items and entitlements have RLS enabled with direct client table access revoked.
- Uploaded files are stored in a private Storage bucket. Public downloads require an approved upload record and receive a short-lived signed URL; admin previews require admin verification.
- Public feedback, correction and analytics inserts are constrained by RLS checks and bounded field lengths.
- Browser response headers include HSTS, nosniff, anti-framing, strict referrer policy, restricted browser permissions, a baseline CSP, and disabled cross-domain policy files.
- Bablo account login uses password hashes and a per-account failed-login cooldown.

## Public endpoints that are intentional
The app uses a custom Bablo session token rather than Supabase Auth JWTs for its account system. Consequently, some RPCs are callable by the Supabase anon role but validate the Bablo session token inside the function. The Supabase linter flags SECURITY DEFINER RPCs as externally callable; that warning must be interpreted alongside their internal session/admin checks, not treated as proof of an exploitable bypass.

Anonymous analytics events, feedback, correction suggestions, public chat, public approved-upload metadata, public leaderboard data, and public social feed reads remain available by design. Their write policies are constrained where applicable.

## Important remaining work
- This review is not a professional penetration test and cannot guarantee that Bablo Hub is unhackable.
- The Notes and Flashcards assets are still shipped in public client-side bundles. A user can inspect downloaded assets. Do not accept payment for premium packs until those assets are moved behind entitlement-checked server delivery.
- Payment checkout is not configured. No provider secret key is present in Vercel project environment variables. Do not mark an order paid from a browser redirect; only a verified provider webhook may do that.
- Continue testing upload/download, admin, social, poll, challenge and chess flows on real Android devices.
- Review rate limits and abuse controls for anonymous public chat, analytics, feedback and correction submissions as usage grows.
