# Bablo Hub startup performance audit

**Audit date:** 2026-11-13  
**Audited revision:** `08566d43065e683d4600c38f585990038550517c` (offline-course-pack branch)  
**Status:** Audit complete; optimization implementation not yet started.

## Measured payload

Repository blob sizes at the audited revision:

| Asset | Bytes | Observation |
|---|---:|---|
| `index.html` | 1,272,672 | Large HTML document with embedded data and application code |
| Inline script: `window.__BANK__` | 640,472 | Full question-bank payload parsed during initial document load |
| Inline script: CHM thermodynamics/application block | 476,529 | Large synchronous inline block; needs finer attribution before splitting |
| Inline BIO notes block | 31,792 | Embedded course notes |
| `phy101-data.js` | 631,477 | Large external course payload |
| `gst111-source-bank.js` | 377,710 | Large external question-bank payload |
| `cos101plus-extracted.js` | 204,146 | Large external course payload |
| `SOC101-data.js` | 65,602 | External course payload |

Most data scripts are parser-blocking classic scripts. Only the final university-directory and academic-engine scripts were marked `defer` in the audited HTML. The page therefore downloads/parses substantial course data before the app can complete its normal boot path.

## User-visible risk

- Slow first load on weak campus networks.
- Unnecessary transfer and JavaScript parsing for courses the student is not opening.
- A large HTML response makes navigation and recovery more expensive.
- Offline support is incomplete if a required course payload was not fetched and cached before the device loses connectivity.

## Recommended implementation sequence

1. **Keep the first paint small.** Render the app shell, authentication/guest entry and dashboard frame without waiting for every question bank.
2. **Separate course data from the app runtime.** Move embedded question banks and large course packs into versioned, independently cacheable assets without changing their source provenance.
3. **Load by selected academic context.** Resolve institution → college → programme → level → semester → course, then load only the active student's eligible course packs.
4. **Use a course-data loader contract.** Each loader should expose loading/ready/error states, avoid duplicate requests, validate schema/version, and preserve the existing course API expected by practice, quiz, notes and flashcards.
5. **Preserve offline behavior.** Reuse the selective course-pack caches; when offline, load from the selected course's saved pack and show a precise unavailable state when it is not saved.
6. **Regression coverage.** Test initial boot without course payloads, direct course deep links, 100L/200L access, guest mode, offline reload, interrupted downloads and stale-cache upgrades.
7. **Measure before/after.** Record compressed transfer size, first contentful paint, time to interactive, and course-open latency under a throttled mobile connection. Verify on Android Chrome before promotion.

## Guardrails

- Do not remove or rewrite verified question content as a performance shortcut.
- Do not mix Bowen and other-institution content.
- Do not infer programme/semester mappings from course codes.
- Preserve question IDs, explanations, notes, flashcards and practical links.
- Do not change production until the new loader passes automated tests and Android offline verification.

## Immediate next implementation target

Build a small boot/data-loader boundary first. Avoid a broad rewrite of the 1.2 MB page in one commit. Start with one high-payload course pack behind a loader, validate the full course flow, then migrate the remaining payloads incrementally.
