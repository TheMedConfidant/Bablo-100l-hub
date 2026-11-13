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

The database-backed directory is designed to grow without hardcoding the university list into the app. This first migration seeds Bowen University and FUTA as the two pilot environments. It is **not yet an exhaustive national directory**. Additional universities and their health-science programme options should be added only after confirming current official offerings.

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

The BSc pathway field is a narrow exception:
- Bowen University + MBBS + 200L or above: eligible to see/select it in Profile.
- Everyone else: hidden and stored as null.
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

- The directory currently contains only the two pilot institutions, not every eligible Nigerian university.
- No FUTA resource is published by this migration.
- Existing static course banks are not yet filtered by this database engine.
- The migration has been committed to a preview branch but has not been run against Supabase.
- No browser acceptance tests or production deployment have been completed.
