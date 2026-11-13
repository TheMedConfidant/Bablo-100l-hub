# Bablo Hub UI/UX Design Handoff

**Date:** 2026-11-13  
**Design file:** https://www.figma.com/design/Ts77v3GAdfRIvNtDYx4VJ2/Bablo-Hub-Professional-UI-System-Product-Screens  
**Working branch:** `p1-offline-course-packs`  
**Status:** Figma design work created; code integration and deployment pending.

## Product direction

A professional, calm academic workspace. Keep the interface functional and fast rather than decorative. Use solid charcoal surfaces, restrained warm-gold emphasis, clear typography, strong contrast, and minimal motion. Avoid heavy glass effects and excessive gradients.

Primary institutional focus:
- Bowen University — College of Health Sciences (CoHES) only.

Bablo Hub is built for Bowen CoHES students. Do not present FUTA or other universities as supported institutions in the landing page, onboarding, institution picker, dashboards or course navigation. Where a Bowen resource is adapted from an external source (including FUTA-origin material), retain that institution only in internal source-provenance metadata; it is not a supported student institution.

## Figma structure

- **Page 1 — Page 1**
  - Design Foundations board: frame `2:29`
  - Reusable components: primary button `2:84`, secondary button `2:86`, study metric card `2:88`, course card `2:92`
  - Landing desktop: `4:2`
  - Landing mobile: `4:94`
  - Authentication desktop: `6:7`
- **Page 2 — 02 — Student Dashboard**
  - Desktop dashboard: `5:8`
- **Page 3 — 03 — Mobile Dashboard**
  - Mobile dashboard: `5:162`

## Design tokens

Figma variable collection: `Bablo / Core Tokens`

### Colors
- Canvas: `#0B0E13`
- Surface: `#151B23`
- Elevated surface: `#202936`
- Border: `#303B49`
- Primary text: `#F4F6F8`
- Secondary text: `#AAB5C2`
- Brand gold: `#D8B66A`
- Gold soft: `#342A19`
- Success: `#75D6B2`
- Info: `#82A8F8`
- Warning: `#F2C879`

### Typography
Inter type ramp:
- Display large: 44 / 52, Extra Bold
- Heading large: 32 / 40, Bold
- Heading medium: 24 / 32, Bold
- Heading small: 18 / 26, Semi Bold
- Body large: 16 / 25, Regular
- Body medium: 14 / 22, Regular
- Label medium: 12 / 16, Semi Bold
- Label small: 10 / 14, Bold

Spacing tokens: 8, 12, 16, 24, 32.  
Radius tokens: card 18, control 12.

## UX principles and constraints

1. Prioritise task hierarchy: one clear primary action per view.
2. Maintain accessible text contrast and visible focus states.
3. Use responsive, touch-friendly controls and avoid horizontal overflow on 390px mobile screens.
4. Keep navigation consistent with the existing product information architecture; do not duplicate Challenge Arena in the bottom navigation and dashboard.
5. Keep Profile separate from Settings.
6. Do not place Chess in the hamburger or global navigation; it belongs inside Arcade.
7. Keep Practical/Laboratory work separate from individual course navigation where the current product model requires it.
8. Show offline status and distinguish locally available content from content that still requires a network.
9. Never show guessed programme mappings or unverified course provenance as confirmed.
10. Preserve the existing original app icon (`icon-192.png` / `icon-512.png`) and Bablo Hub™ naming.

## Landing and onboarding content

- Primary message: “Make every study session count.”
- Explain structured course resources, active recall, CBT practice and practical learning.
- Clearly identify Bowen University College of Health Sciences (CoHES) as the sole student audience.
- Primary CTA: Create account.
- Secondary CTA: Explore as guest.
- Separate Log in from Create account and keep a clear route back to the welcome screen.
- Programme and course selection must use verified Bowen CoHES mappings. Preserve external source institution names only in provenance metadata, never as supported student institutions.

## Dashboard information architecture

Desktop layout:
- Left navigation rail
- Page title and search/profile controls
- Welcome panel and study streak
- Compact study metrics
- Continue learning/course progress
- Quick actions
- Today's focus
- Offline availability status

Mobile layout:
- Compact top bar
- Welcome/streak panel
- Three compact study metrics
- Continue-learning course cards
- Quick actions
- Offline status
- Bottom navigation kept concise; Profile/Settings remain distinct from course actions.

## Implementation handoff

The current app is a plain HTML/CSS/JavaScript project with a large inline application document and separate premium landing assets. Before porting:
1. Inspect the live source selectors and current layout functions; do not replace the large application document wholesale.
2. Map the Figma tokens to existing CSS custom properties and preserve current theme preferences.
3. Port reusable card/button patterns incrementally.
4. Implement landing and authentication states without breaking guest mode, account creation, or login.
5. Port desktop and mobile dashboard structures while preserving existing route/navigation contracts.
6. Check Android small-screen layout, back-button behavior, keyboard focus, and offline rendering.
7. Run the existing app checks and a real browser smoke test before considering merge/deployment.

## Validation state

- Figma frames and component structures were created and metadata was fetched for the main landing and dashboard frames.
- Screenshots were generated for desktop/mobile landing and dashboards.
- A Figma Starter plan tool-call limit was reached during further refinement. The Figma canvas still needs its old FUTA copy replaced with CoHES-only messaging when editing access is available.
- Landing implementation now uses the original `icon-192.png`, names Bowen University College of Health Sciences (CoHES) as the sole student audience, and removes the FUTA audience claim.
- The offline course catalogue now treats Bowen CoHES as the only supported student institution while retaining FUTA only as internal source provenance for adapted BIO 101 and CHM 101 resources. Unassigned PHY 101 remains unpublished pending source verification.
- Landing and catalogue changes are committed on `p1-offline-course-packs`; no production deployment or successful runtime/browser test is claimed.
