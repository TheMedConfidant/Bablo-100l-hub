# Bablo Hub Profile UX — Implementation Specification

**Date:** 2026-11-13  
**Branch:** `p1-offline-course-packs`  
**Status:** Approved direction from prior product discussion; implementation and browser verification pending.

## Goal

Turn Profile into a useful student identity and activity page. Profile is not Settings. It should answer: who is this account, what academic context has it declared, what has it achieved, and what can it do next?

## Information architecture

### 1. Identity card
- Avatar (use initials when no avatar is set).
- Full/display name.
- `@username`.
- Copyable Bablo ID for registered accounts.
- Clear account badge: **Student** or **Guest**.
- Membership badge: **Standard** or **Premium**.
- Account creation date when available.

### 2. Academic profile
Display available fields without inventing values:
- Institution.
- Faculty.
- Department.
- Programme.
- Academic level.
- Academic session and semester.
- BSc pathway only when applicable (MBBS students in the relevant 200L+ pathway).

Allow the account holder to edit permitted academic details and save them persistently. Show an explicit **Self-declared — not verified** label for guest-supplied academic information and any profile whose verification flag is false. Never imply that self-declared data is institutionally verified.

### 3. Activity and learning
Use compact, readable metrics/cards for data that actually exists:
- Questions attempted.
- Accuracy.
- Study streak.
- Course progress.
- Challenges played / results.
- Leaderboard standing.
- Programme Cup participation.

Hide unavailable metrics instead of showing fabricated zeroes or placeholder achievements. Make each metric open its relevant area when a destination exists.

### 4. Account status
- Email address and verification status, when available.
- Premium/Standard membership state.
- Sync state or last successful sync when available.
- A clear route to create/claim a registered account for guests.

Do not expose passwords, session tokens, or other secrets.

## Guest experience

Guests should have a real Profile, not an empty placeholder:
- Show **Guest** status clearly.
- Permit academic details to be entered and retained against the guest session.
- Preserve guest learning/activity data where supported.
- Label guest academic details as self-declared.
- Provide a clear **Create account** / **Save my progress with an account** action.
- Do not display a fabricated Bablo ID or registered-account email status.
- Keep guest analytics distinguishable from registered-student analytics.

Guest-declared academic records must remain separate from verified account identity. On account conversion, preserve the guest's learning history only through an explicit, safe account-linking flow; do not silently merge identities.

## Academic classification rules

- Bablo Hub's primary supported student audience remains Bowen University College of Health Sciences (CoHES).
- Guests and students in other programmes may declare their academic context for research, tracking and future expansion; this does not make those institutions supported Bablo Hub course environments.
- For any future institution picker, only list institutions with a health-sciences or medical-sciences offering, and retain **Other / Not listed** for a legitimate missing entry.
- 200L+ academic-level eligibility is restricted to CoHES programmes, except the explicitly supported MBBS students undertaking BSc Biochemistry.
- Do not show FUTA or other institutions as supported student destinations on the landing page, onboarding or course navigation. External institutions may appear only as source provenance for adapted learning resources.

## Navigation and visual behavior

- Profile remains separate from Settings.
- Profile is reachable from the avatar/profile entry point.
- Settings contains preferences and account controls, not a duplicate of the student's identity page.
- Use the existing charcoal/classic visual system, restrained gold emphasis and high-contrast text.
- Keep the page mobile-first: no horizontal overflow, compact cards, clear section hierarchy, touch targets at least 44px high.
- Include visible save state, validation feedback and a non-destructive retry path when network sync fails.
- Do not block reading the locally available profile when offline; queue supported edits for later sync and show their pending state.

## Data integrity and privacy

- Preserve existing Bablo IDs, usernames, authentication sessions, academic records and learning progress.
- Never infer faculty, department, programme, verification or membership status from an incomplete profile.
- Use existing academic profile fields and secure RPCs where possible; do not duplicate profile data into a second source of truth.
- Guest profile data must remain associated with the guest identifier and must not be publicly readable.
- Only show email details when the app actually has a verified email value for that account.
- Do not expose internal analytics or admin-only metadata on the student profile.

## Acceptance criteria

1. A registered student sees identity, Bablo ID, username, account type and membership state without entering Settings.
2. A guest sees a useful Guest Profile and can enter academic context without being forced to register.
3. Guest-declared academic details are visibly marked self-declared / unverified.
4. A profile with missing fields shows a clear completion prompt, not guessed data.
5. Academic fields persist after refresh and recover cleanly after a temporary network failure.
6. Profile and Settings are separate destinations with no duplicate identity panels.
7. Profile works at 360px and 390px viewport widths without horizontal scrolling.
8. Keyboard focus, labels, contrast and touch targets remain accessible.
9. Existing account IDs, sessions and progress remain unchanged.
10. Browser smoke tests cover registered profile, guest profile, edit/save, offline read, pending sync and account conversion.

## Implementation note

The main application UI currently lives inside a very large, single-line `index.html`. Do not attempt a wholesale rewrite. First identify the existing profile renderer, its data source and navigation contract; then make the smallest targeted change and test it against both guest and registered sessions.
