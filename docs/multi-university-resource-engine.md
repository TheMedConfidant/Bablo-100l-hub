# Bablo Hub multi-university academic engine

**Status:** Foundation committed to preview branch; migration is not applied to Supabase and no production deployment has occurred.

## Product model

Bablo Hub is one platform with institution-aware academic environments. A student's selected academic identity determines the academic resources surfaced across the app:

`University → Programme → Level → Semester → Course → Topic → Resource`

The same filtering contract must eventually be used by the dashboard, courses, notes, flashcards, questions, quizzes, practicals, specialist labs, search, recommendations and academic notifications.

## Resource visibility contract

A resource is visible only when all of the following are true:

1. It is published.
2. Its academic quality review is approved.
3. Its usage/rights status is cleared.
4. It has an explicitly verified mapping to the student's exact institution, programme, level and semester.
5. An institution-only resource is owned by that same institution.
6. A shared resource is explicitly marked `shared-after-review`; it is never shared merely because its subject looks generic.

No cross-institution, cross-programme, cross-level or cross-semester fallback is allowed. Empty results are a valid state and must be presented as "materials are not available yet", not filled with another university's content.

## Directory

The database-backed directory is designed to grow without hardcoding the university list into the app. The first directory tranche contains **69 Nigerian universities**: the 66 institutions in the MDCN 2025 medical-schools register plus FUTA, Achievers University and the Federal University of Health Sciences, Ila-Orangun, each supported by an official institutional source. This is a substantial starter directory, **not yet exhaustive of every university offering nursing-only or allied-health programmes**. The bundled selector has an offline copy and refreshes from the database directory when the migration is applied. A student can request an institution not yet listed; that selection does not unlock resources until the institution and programme are verified.

Programme options are separate per institution. A university being present in the institution dropdown does not imply every programme is available there.

## Shared Academic Resource Library

One source resource can be mapped to several universities, but each target mapping must be independently verified. This lets one well-reviewed general resource be reused without copying the file or falsely claiming it is an institution's official lecture note.

Suggested classification:
- `institution-only`: only the owning institution can map and surface it.
- `shared-after-review`: may be mapped to another institution after rights and curriculum review.
- `candidate` mapping: inventory/testing only; never shown to students.
- `verified` mapping: reviewed against the target institution's programme and course.

## Initial Notion source audit

These are existing assets discovered in Notion. They are inventory candidates, not automatically approved/published resources.

| Asset | Known context | Current handling |
|---|---|---|
| BIO 101 | Notion page describes an official FUTA course outline with 8 topics; notes and flashcard collections exist. The page is under the 100L library and its Notion verification state is unverified. | FUTA pilot candidate. Keep unpublished until the underlying outline and content are checked. |
| Elbow & Forearm notes, 200L Anatomy | Detailed notes exist, but the fetched page does not establish an institution or reuse permission. | Unclassified candidate; do not treat as shared or Bowen-exclusive until source ownership and alignment are confirmed. |
| Elbow & Forearm flashcards, 200L Anatomy | Theory, image and scenario cards exist; page is explicitly titled 200L Anatomy but has no institution in the fetched page. | Unclassified candidate; do not surface to other universities until mapped and approved. |
| 200L Physiology master course map | Broad topic hierarchy exists. It is a curriculum map, not a university-neutral course equivalency. | Reference for classification only; verify programme/institution before mapping. |

Notion references:
- FUTA BIO 101 overview: https://app.notion.com/p/3ca1834fbdba8167a959cce677f5249e
- FUTA BIO 101 notes index: https://app.notion.com/p/3ca1834fbdba81f89219d57507c99235
- FUTA BIO 101 flashcards index: https://app.notion.com/p/3ca1834fbdba81588f35d7ae7b8b5e6a
- 200L Anatomy notes: https://app.notion.com/p/4161834fbdba81fb9245e2f5193d69f1
- 200L Anatomy flashcards: https://app.notion.com/p/4161834fbdba81d8aaf7cd19f4a5ce6a
- 200L Physiology map: https://app.notion.com/p/3cc1834fbdba8152b941cac564a47e90

## Profile rule

The BSc pathway field is a narrow exception. It is hidden during registration and guest onboarding, and appears only in Profile after the user has used all three distinct landing actions (Create account, Log in, Explore as a guest):
- Bowen University + MBBS + 200L or above: eligible to see/select it in Profile after the three-action landing gate.
- Everyone else: hidden and stored as null.
- The profile save flow requires a selection only when the gate and eligibility conditions are met.
- This is not a general university or programme selector.

The migration adds database constraints and narrows both authenticated and guest profile-save RPCs to this rule. The frontend visibility condition still needs to be integrated and tested against every institution/programme/level combination.

## Migration contents

`20261113143000_multi_university_resource_engine.sql` adds:
- Health-science institution directory.
- Institution-specific programme directory.
- Institution-bound course catalogue (programme, level, semester, course code and verified curriculum status).
- Resource provenance, ownership, reuse and review metadata.
- Explicit institution/programme/level/semester/course mappings.
- Read RPCs for the directory, programmes and approved resources.
- Strict BSc pathway constraints and profile RPC guard.

The resource RPC returns only published, rights-cleared, quality-approved resources with an exact verified mapping to a verified course record. The course record itself is bound by a composite foreign key to the same institution as its programme. Tables have RLS enabled with read policies for approved catalogue rows and no client write grants. RPCs use `SECURITY INVOKER`; RLS remains active.

## Implementation sequence

1. Apply migration in a controlled Supabase preview/staging environment.
2. Validate migration and RPC behavior, including negative cross-institution tests.
3. Inventory Notion and Drive resources, preserving source URLs and permission status.
4. Add the full verified Nigerian health-science university directory and each institution's actual programme list.
5. Classify candidate resources and map each to verified curriculum targets.
6. Integrate directory selection into registration/profile and make all resource surfaces consume the same academic identity contract.
7. Test Bowen 100L, Bowen MBBS 200L+, FUTA, empty catalogues, offline cached resources and legacy accounts.
8. Only then prepare a production migration and deployment.

## Current limits

- The directory currently contains 69 source-backed starter entries, but is not yet exhaustive of all Nigerian universities with nursing-only and allied-health programmes.
- The first Notion pilot export contains 75 FUTA BIO 101 flashcards and 180 Bowen CoHES BIO 101 MCQs (255 records total), staged in `data/notion-content-pilot.json`; it is not yet loaded into the live app.
- FUTA BIO 101 still needs exact programme and semester mapping before it can be student-visible.
- No FUTA resource is published by the migration.
- Existing static course banks are not yet filtered by the database resource engine. A frontend course-access gate now scopes the course catalogue, course pages, notes, flashcards, CBT, 100L laboratory, Challenge Arena and local Wi-Fi challenge selection. This is not a substitute for resource-level provenance filtering.
- The profile UI has separate University, Faculty / College, Programme, Level and Semester controls. Bowen exposes CoHES as a distinct faculty/college choice; unmapped programmes do not inherit another programme's courses.
- The BSc selector is profile-only, gated by three distinct landing actions, and restricted to Bowen MBBS 200L+.
- The migration has been committed to a preview branch but has not been run against Supabase.
- The user has confirmed offline course packs work on an Android device. Browser acceptance of the new landing page and profile selectors remains outstanding; production has not been updated with these latest UI changes.


## 2026-11-13 — 100L-first implementation update

### Implemented in the preview branch

- Full-screen public landing page with a product preview, connected-learning workflow, feature explanations and an explicit Bowen CoHES 100L focus.
- Separate academic selectors for university, faculty/college and programme, followed by level and semester.
- Academic identity is displayed on the dashboard, course catalogue and course overview.
- Course access is gated by the selected programme. Challenge Arena and local Wi-Fi battles use the same course-access gate; the 100L laboratory only lists mapped practical subjects.
- The current Bowen 100L frontend map is MBBS-only. Other CoHES programmes do not inherit a generic shared core until their own curriculum is verified.
- No 200L expansion should begin until the 100L course and resource loop is complete.

### Curriculum source checks

- Bowen BIO 101 is explicitly labelled Bowen CoHES and has a nine-topic source outline: https://app.notion.com/p/3e91834fbdba8124be25c4d749158c67
- Bowen PHY 101 has a corrected nine-topic mechanics syllabus sourced from Prof. Emetere's official module and supplementary notes: https://app.notion.com/p/3d71834fbdba818e937dc2623728efe8
- Bowen COS 101 is labelled 100L CoHES and has ten theory chapters plus six lab exercises: https://app.notion.com/p/3e21834fbdba81258663e240c3427ec5
- CHM 102 has a separate second-semester 100L Bowen course map: https://app.notion.com/p/4171834fbdba81bc8b22e1739a006f45
- CHM 101 is described as a 100L guinea-pig course; its Notion page does not itself establish Bowen ownership. Its exact Bowen course/semester provenance must be checked before its resources are represented as institution-verified: https://app.notion.com/p/3c11834fbdba81b48bcfd9c9f8e58ae1
- The curriculum expansion plan says MBBS, Anatomy, Physiology and Biochemistry are distinct tracks; shared course codes and semester sequences must not be assumed: https://app.notion.com/p/4131834fbdba8186ac42ff89578a2373

The MBBS 100L pilot is the only current frontend programme map. Other CoHES programmes remain selectable as identities but receive no MBBS course materials by fallback. Before 100L is considered complete, verify the full MBBS course list for both semesters and complete each course's source review, notes, flashcards, QBank, practicals and downstream challenge/Cup/analytics/offline integration.
