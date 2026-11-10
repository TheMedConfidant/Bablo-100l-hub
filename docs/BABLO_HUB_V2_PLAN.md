# Bablo Hub V2 — Preview Implementation Plan

## Guardrails
- This work is isolated on `bablo-hub-v2-preview`; do not merge to `main` or alter production without explicit approval.
- Preserve all existing course content, Supabase data, Chess, Arcade, Social Corner, Challenge Arena, Maths resources, and existing navigation contracts.
- Extend the existing React/TypeScript + Supabase + Vercel application. Do not rewrite it in Flutter/React Native as part of V2.
- Ship small, verifiable increments; do not claim a feature is complete until tested against the preview deployment and real database behavior.

## Current infrastructure observations (2026-11-10)
- GitHub repository: `TheMedConfidant/Bablo-100l-hub`; production branch: `main`.
- Vercel project: `bablo-100l-hub`; latest observed production deployment was READY from `main`.
- Active Supabase project: `labgqqovggulrsmxzraj`.
- Existing custom account model: `public.hub_accounts`, keyed by `unique_id`; it currently has no email column.
- Existing premium tables: `hub_premium_catalog`, `hub_premium_orders`, `hub_premium_order_items`, and `hub_premium_entitlements`. Existing orders/entitlements currently reference `unique_id`; catalog prices are currently constrained to 50,000 kobo (₦500) for notes/flashcards.
- Existing app data is live and valuable. Never reset, truncate, or replace these tables.

## V2 workstreams

### 1. Account identity and premium ownership
- Require a verified email address for paid checkout.
- Keep the stable internal account ID as the primary owner key; email is the recovery and payment-contact identity, not a replacement for the internal ID.
- Bind every verified payment to the authenticated account ID and a normalized, verified email snapshot.
- On account recovery, verify control of the same email using a secure email link/OTP, then restore access to the existing account and its entitlements. Never grant access based only on a typed email address or a client-supplied account ID.
- Prevent duplicate account creation for an already-claimed normalized email; provide a safe linking/recovery path for existing users.
- Keep payment provider secrets and verification logic server-side. Verify webhook signatures and provider transaction status before granting entitlements. Make webhook processing idempotent.
- Maintain an auditable order and entitlement history. Refunds must be handled transparently under a published policy and applicable provider/law requirements; do not silently revoke valid purchases or promise an unconditional no-refund rule.

### 2. Hybrid monetisation
- Individual purchases: notes collection ₦500; flashcard collection ₦500.
- Add course/programme bundles and weekly, monthly, and semester subscriptions after product access rules and pricing are approved.
- Store prices in minor currency units and snapshot product/price details on each order.
- Checkout must show the exact email receiving the entitlement, itemised contents, total, currency, and refund/support policy before payment.
- Existing premium tables should be extended through reviewed migrations, not replaced.

### 3. Adaptive flashcards
- Preserve the Easy/Hard/Again/Good interaction; no Next/Previous workflow.
- Track per-user/card review history, repetitions, interval, ease/difficulty, last review, and due time.
- Use a tested spaced-repetition algorithm with configurable intervals; avoid fixed universal assumptions such as every Hard card being due in exactly 10 minutes.
- Provide due-card queues, progress summaries, and offline review with safe sync conflict handling.

### 4. Offline-first learning
- Cache explicitly selected notes, flashcards, and question sets locally.
- Show download/sync state and last successful sync.
- Queue eligible progress writes offline and reconcile them idempotently when online.
- Do not cache sensitive account/payment data or premium content in a way that bypasses entitlement checks.

### 5. AI-assisted content ingestion
- PDF/text extraction into structured notes, questions, and flashcards.
- Preserve source file/page references and provenance.
- Require validation for answer keys, duplicates, malformed items, and unsupported claims before publishing.
- Keep generated content in a review queue; AI output is not automatically trusted or published.

### 6. Bablo Buddy and growth
- Academic tutor and study-planning capabilities first; campus assistant later.
- Clearly distinguish sourced facts from generated explanations.
- Achievement-sharing graphics and referral tracking only after privacy controls and anti-abuse rules are defined.

## Delivery order
1. Audit existing auth, premium checkout, RLS, migrations, and frontend entry points.
2. Design verified-email account linking/recovery without breaking current ID-based accounts.
3. Harden payment verification and entitlement ownership; test duplicate webhook delivery and account recovery.
4. Add hybrid products and subscriptions.
5. Implement and test adaptive flashcard scheduling.
6. Add offline cache/sync.
7. Add content ingestion and Bablo Buddy.

## Acceptance gates
- No production deployment or main-branch merge during preview work.
- No client-side authority to mark orders paid or grant premium.
- A user who loses their display ID can recover the same account through verified email and retain purchases.
- A payment made for one account cannot be claimed by another account merely by entering its email or order reference.
- Existing users and existing premium records remain intact.
- Every database change has a migration, RLS review, and verification query.


## Preview build log — 2026-11-10

### Implemented on `bablo-hub-v2-preview`
- `v2/calculator.html`: standalone responsive scientific calculator prototype with DEG/RAD, common scientific functions, memory, local calculation history, keyboard input, and a non-eval expression parser.
- `v2/smart-pq-engine.js`: pure adaptive question-selection engine. It ranks unseen questions, weak-topic performance, repeated errors, coverage gaps, revision recency and frequency metadata; it also applies topic diversity and returns selection reasons.
- `v2/analytics-dashboard.js`: student analytics adapter and renderer using the existing session-validated `hub_course_analytics` RPC. It passes the active session token from the host application and does not store or expose it.
- Regression test files:
  - `v2/smart-pq-engine.test.js`
  - `v2/analytics-dashboard.test.js`

### Verified
- All three implementation files were fetched back from GitHub after commit.
- Calculator inline JavaScript syntax check passed.
- Smart PQ selection and duplicate-prevention smoke tests passed in the tool runtime.
- Analytics RPC request shape and dashboard-render smoke tests passed in the tool runtime.
- Existing `hub_course_analytics` function was inspected; it validates the supplied token against `hub_sessions` and returns per-course attempt/accuracy aggregates.
- Existing Supabase schema and migrations were inspected read-only. No production database migration or data write was made.

### Not yet done
- These are V2 preview modules, not yet integrated into the live V1 dashboard or app navigation.
- Smart PQ engine still needs a verified adapter to the current question-bank and answer-history formats before it can replace or drive the existing Smart PQ flow.
- Calculator needs browser/device interaction testing.
- Analytics needs testing with a real signed-in test account and then integration into the existing dashboard.
- No preview deployment or production deployment has been performed.
- No changes were made to `main`, production data, authentication, payment configuration, or Supabase policies.

### Next implementation gates
1. Inspect the existing app's login/session handoff and integrate analytics without changing account identity.
2. Map the live question-bank and answer-history formats; connect Smart PQ using the existing question sources.
3. Integrate calculator entry into the existing calculator/navigation location.
4. Run the repository static checks and browser tests on a Vercel preview.
5. Review security/performance advisor findings separately; do not bulk-change RLS policies because several tables intentionally expose data only through guarded RPCs.


### Preview build log — 2026-11-10 (Build 03)

- Added `v2/smart-pq-adapter.js` to translate the existing V1 question shape (`i,c,u,q,o,a,e`) and per-question progress (`DB.stats`, `DB.missed`) into the Smart PQ engine contract.
- Added `v2/smart-pq-adapter.test.js` covering legacy question mapping, per-question attempt reconstruction, mistake preservation, selection uniqueness, and output metadata.
- The adapter is deliberately pure and accepts snapshots from the host app; it does not read localStorage, mutate DB, or transmit progress.
- Integration into the monolithic application entry point remains gated because the current `index.html` is a 1.2 MB single-file application and must not be replaced through a blind full-file write. The host must pass its existing question-bank array and progress snapshots after authentication.
- No production branch, account, database, RLS policy, or deployment changed.


### Preview build log — 2026-11-10 (Build 04)

- Integrated the Smart PQ engine and V1 adapter into the existing app's Weak spots page.
- Added a Smart PQ action that selects 20 questions using the existing `BANK`, `DB.stats`, and `DB.missed` snapshots, then starts the existing `Core.buildSession` / `startSession` practice flow. It does not create a parallel quiz runner or change account/session handling.
- Added script loading for the engine, adapter, and bridge after the main application script so the bridge can reuse the existing app's lexical state and session runner.
- Runtime smoke test passed against a representative legacy bank/progress snapshot; it verified that the bridge calls the existing practice runner with a unique ID set.
- Browser/device interaction and deployed preview checks remain outstanding. Production branch and database remain untouched.


### Preview build log — 2026-11-10 (Build 05)

- Audited the existing Analytics dashboard integration in `index.html`: the dashboard card routes to `#/analytics`, the view checks the existing signed-in account, and passes the existing `DB.account.token` to `BabloV2Analytics` without placing it in a URL.
- Verified that `v2/analytics-dashboard.js` calls the existing `hub_course_analytics` RPC with the expected `p_token` and `p_days` body, renders course-level summaries and weak-course priorities, and escapes course labels before HTML insertion.
- Added the Scientific calculator to the existing Study & Practise dashboard and connected `#/calculator` to the existing scientific calculator view (the previous route redirected back home).
- Calculator runtime smoke tests passed for arithmetic precedence, square roots, degree and radian trigonometry, logarithms, pi multiplication, factorials, and exponent associativity.
- Analytics RPC adapter smoke tests passed for endpoint construction, token handoff, aggregate attempt calculation, weak-course rendering, and HTML escaping.
- No production deployment, database write, authentication change, or `main` branch change.
- Browser/device interaction and real signed-in account verification remain outstanding.


### Preview build log — 2026-11-10 (Profile and navigation cleanup)

- Removed the scientific calculator from the dashboard and placed it under the hamburger menu's More Options group.
- Removed duplicate calculator AC and ANS keys; retained one AC key and one ANS key, and removed the obsolete AC button handler.
- Removed the course-level Practicals tile so laboratory resources live only in the separate Laboratory hub.
- Removed the duplicate CHM Quizzes tile; CHM question practice remains accessible through the course question workflow, while worked questions remain a distinct resource.
- Expanded Profile with editable programme text, academic level, Bablo ID / guest status, and the account create/login section so local guests can create an account from Profile.
- Added a custom programme path to guest onboarding and account registration. Custom programme registrations are tagged as Guest programme values so the existing guest registration path is used; programme-specific course mapping still falls back to the shared core until the programme is mapped.
- Improved course analytics with recent momentum versus course averages, strongest and most-practised course summaries, and accessible accuracy progress bars. It remains course-level; topic-level analytics require topic-tagged attempt data.
- No production branch, production deployment, Supabase schema, or account records changed. Device testing remains outstanding.


### Preview build log — 2026-11-10 (Phase 5: adaptive flashcard scheduling)

- Extended the existing local flashcard scheduler from two ratings to four: Again, Hard, Good and Easy.
- Added per-card repetition count and ease factor, with bounded ease values and distinct review intervals. Again resets the repetition streak and schedules a short retry; successful reviews increase intervals progressively.
- Preserved existing local review records (`intervalDays` and `dueAt`) so previously reviewed cards remain scheduled rather than being discarded.
- Scheduling remains local-device/offline at this stage; cross-device review sync is not claimed or enabled.
- Existing flashcard deck content and the active-recall reveal flow are unchanged.
- The Profile, custom programme, calculator, Laboratory/practical, CHM navigation and PHY 24 November reminder corrections were already present on this preview branch and were retained.
- Automated source-level regression checks are pending; browser/device testing remains outstanding.


### Phase 05 — Profile and navigation corrections (source audit)

- Fixed the guest Profile account CTA to scroll to and focus the embedded account form without changing the hash-router route.
- Source audit confirms calculator is absent from the dashboard and remains under More Options; its active keypad has one AC and one ANS control.
- Source audit confirms course practicals are centralised in Laboratory and the duplicate course-level practical tile is absent.
- Source audit confirms CHM no longer exposes a duplicate Quizzes tile; question practice and worked questions remain distinct.
- Profile includes editable name, nickname, programme and level, Bablo ID / guest status, and account registration/login. Custom programme entry is available in onboarding and account registration.
- Analytics remains course-level where that is what the available attempt data supports; no unsupported topic-level analytics are invented.
- PHY101 Test reminder dated 24 November 2026 is merged into the client schedule and fallback schedule. It appears in the schedule panel on clients that load the schedule; browser push alerts depend on notification permission. This is not a Supabase schedule-table write.
- Preview branch only. No production branch, database or production deployment was changed.


### Preview build log — 2026-11-10 (Profile, Laboratory and offline progress follow-up)

- Expanded the Profile form with institution, faculty/college, department, academic session and semester fields, while retaining name, nickname, programme, level, Bablo ID and guest/account status.
- Fixed a literal escaped newline in the Profile markup that caused an inline JavaScript parse error. All 11 inline application script blocks now pass source-level syntax compilation.
- Confirmed the course `sectionTiles` renderer contains no Practicals tile; practical resources remain grouped under the central Laboratory hub (PHY, CHM, BIO and COS).
- Preserved extended local academic profile fields when an existing account signs in.
- Added the academic profile fields to the existing account progress payload and remote merge path. This is wired to the existing progress RPC but has not yet been verified against a real signed-in account or a second device.
- Improved offline progress handling: local changes are marked pending when offline, progress sync retries on the browser's online event, and Profile displays pending/last-synced status.
- The existing service worker already caches the app shell and listed learning assets for offline launch; this build does not yet add per-resource download controls.
- Updated regression checks for the profile fields, guest account CTA, central Laboratory separation, escaped-newline regression, account profile preservation and reconnect sync.
- Vercel preview deployment for commit `b0527fcf64bc257a7da95d687256e7441d759851` reached READY at `bablo-100l-mk5ron5ig-mosesbama4-3146s-projects.vercel.app`.
- No changes to `main`, production deployment, Supabase schema, RLS policies or student records.
- Remaining verification: execute the repository regression script in its Node environment, test profile/account sync with a real test account on two devices, and perform Android offline/online interaction checks.

### Preview build log — 2026-11-10 (Calculator and Bablo Arcade)

- Improved the standalone scientific calculator's state continuity: memory value, angle mode (DEG/RAD), and last answer now persist locally across reloads. No account data is accessed.
- Added a clipboard fallback for browsers/devices where the Clipboard API is unavailable, including Android-style manual copy guidance if the fallback is blocked.
- Added a playable first Bablo Arcade game, **Bablo Rush**, as a standalone page. Players choose a runner and challenge lane; a 60-second quiz sprint presents the question and all answer options together. Correct answers increase speed and progress; incorrect answers reduce momentum. Score, accuracy and a device-local best score are shown at the end.
- Replaced the disabled Cow Dash placeholder in the Arcade hub with a direct Bablo Rush launch card. Chess and chess-learning links remain intact.
- Source-level JavaScript compilation passed for the calculator and game scripts. Source checks confirmed persistent calculator state, clipboard fallback, game question bank, speed scoring and Arcade launch link.
- Vercel preview deployment for commit `7ae3f7c988a7a1b25b326e9559945c7f47eb8d99` reached READY at `bablo-100l-amijif57e-mosesbama4-3146s-projects.vercel.app`.
- Not yet verified: real Android/browser interaction, gameplay balance, keyboard/screen-reader accessibility, or end-to-end use on a physical device. No production branch, production deployment, Supabase schema/data, or account records were changed.

### Arcade and calculator continuation — 2026-11-10

- Calculator: added absolute value and exponential function keys, square, reciprocal, and sign-toggle operations to the scientific keypad. Existing safe expression parser, DEG/RAD, memory, local history, persisted state and clipboard fallback remain.
- Arcade now exposes three playable standalone learning games: Bablo Rush (timed sprint quiz), Memory Matrix (8 academic term/definition pairs across Biology, Physics, Computing and Chemistry), and Reflex Arena (15 rapid-fire questions with time-based bonus scoring and streak tracking). Existing Bablo Chess and Chess learning entries remain.
- The three new game pages are standalone and use device-local best-score storage; they do not yet sync performance to Bablo Hub accounts or course analytics. Their starter question decks are hand-authored and are not yet connected to the verified course question banks.
- JavaScript source compilation checks passed for calculator and all three game pages. The index page and arcade entries were verified in the preview source. GitHub combined status for commit `50556c045878dd69ef598e67e66027f7aa0c041f` reported Vercel success; deployment reached READY at `bablo-100l-kg9wi9kvq-mosesbama4-3146s-projects.vercel.app`.
- Still pending: physical Android interaction tests, accessibility review, gameplay QA/balance, course-bank integration, account-level score sync, and deeper calculator numerical edge-case tests. Production remains untouched; no Supabase schema/data changes were made.
