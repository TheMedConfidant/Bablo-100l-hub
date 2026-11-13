# Multi-university resource inventory and pilot mapping

Inventory date: 2026-11-13  
Repository: Bablo Hub  
Status: discovery baseline; no resources are published by this document alone.

## Product rule

A student's selected academic identity controls the complete resource surface:

`institution → programme → level → semester → course → topic → resource`

The same resource may be mapped to more than one institution only when its academic scope is genuinely shared and the mapping is explicitly recorded. A shared resource is not presented as an institution-authored or institution-approved course handout unless that provenance is true.

No cross-institution fallback is permitted. An empty result is a valid state.

## Resource classification

- `institution_exclusive`: visible only to the named institution.
- `shared_foundational`: institution-neutral foundational learning material; can be mapped to multiple institutions/programmes after curriculum-fit mapping.
- `curriculum_mapped`: verified against the named institution, programme, level, semester and course.
- `pending_mapping`: inventoried but not yet mapped to a precise course; never surfaced in a student's course feed.
- `restricted`: rights or access conditions prevent publication.

The user's confirmation is that the Notion study materials have been verified. This inventory preserves their source identity and maps them without re-litigating their academic correctness. Curriculum fit remains a separate question from correctness.

## Initial Notion inventory

### FUTA pilot

| Resource | Notion source | Existing scope / contents | Initial classification |
|---|---|---|---|
| BIO 101 course hub | https://app.notion.com/p/3ca1834fbdba8167a959cce677f5249e | Explicitly identified in the page as the FUTA 100L BIO 101 course; official FUTA outline; 8 topics; notes marked 8/8 complete; 75 flashcards confirmed by live Notion database query (the older 32-card progress note is stale) | `curriculum_mapped` to FUTA BIO 101, 100L; verify semester field from course record before production mapping |
| BIO 101 notes index | https://app.notion.com/p/3ca1834fbdba81f89219d57507c99235 | Eight topic pages: characteristics/classification; cell structure; reproduction; heredity/evolution; ecology; non-vascular plants; vascular plants; flowering plants | Child resources of FUTA BIO 101 |
| BIO 101 flashcards index | https://app.notion.com/p/3ca1834fbdba81588f35d7ae7b8b5e6a | Linked flashcard database | Child resource set of FUTA BIO 101 |
| BIO 101 MCQ index | https://app.notion.com/p/3ca1834fbdba81a29502f17b342aa3e4 | Index page is currently blank; do not infer an MCQ bank exists from this page | `pending_mapping` / empty |

The FUTA BIO 101 hub explicitly states that its outline is based on the official FUTA course outline and that notes are complete for all eight topics. Keep this material attached to FUTA rather than borrowing Bowen BIO 101 identity.

### Bowen-only materials

| Resource | Notion source | Scope | Initial classification |
|---|---|---|---|
| Bowen 100L BIO 101 hub | https://app.notion.com/p/3e91834fbdba8124be25c4d749158c67 | Bowen CoHES BIO 101; 9 topics; references Bowen CoHES lecture PDFs | `institution_exclusive` Bowen |
| Bowen 100L demo / content library | https://app.notion.com/p/3d71834fbdba81f7a69ed0c6396bea31 | Bowen 100L demonstration hierarchy | Bowen-only |
| Bowen 200L verified curriculum/build map | https://app.notion.com/p/3ca1834fbdba8109954ed40cae3f52db | Bowen MBBS 200L Anatomy, Physiology and Biochemistry lanes; course-code caution and curriculum map | `institution_exclusive` Bowen; map exact course codes from current course registration/handbook |
| 200L Physiology master map | https://app.notion.com/p/3cc1834fbdba8152b941cac564a47e90 | 200L physiology topic/subtopic hierarchy, ECG, cardiovascular, respiratory, renal, GI, endocrine, neurophysiology and practical/data interpretation | Bowen 200L pending exact course/semester link; do not expose to other institutions by default |
| Elbow & Forearm anatomy notes | https://app.notion.com/p/4161834fbdba81fb9245e2f5193d69f1 | 200L Anatomy notes, clinical applications and learning outcomes | Bowen-owned 200L Anatomy source; map to each target university's outline before any shared reuse |
| Elbow & Forearm flashcards | https://app.notion.com/p/4161834fbdba81d8aaf7cd19f4a5ce6a | Theory, image and scenario Anki-style cards | Shared 200L Anatomy candidate; map to each target university's outline before surfacing |

### Shared-resource candidates

The broader content library contains foundational 100L–200L material and subject resources (including biology, chemistry, physics, computing, physiology, anatomy and biochemistry). A subject label alone does not make a resource institution-neutral.

The current pilot export includes 75 FUTA BIO 101 flashcards and 180 Bowen CoHES BIO 101 MCQs (255 records total), plus five 200L Anatomy resources (notes, flashcards, quiz, vignettes and reference glossary) and six Physiology/Biochemistry course-map or architecture pages. These are staged as source-aware JSON assets, not yet live-published resources. The 200L Anatomy pack is Bowen-owned source material: its source note says it follows standard atlas order and should be reordered to Bowen's lecture sequence once the Bowen outline is confirmed. Preserve its origin and require explicit target mapping for every institution.

For each candidate, retain:
- original Notion page/database URL;
- original institution/programme/level/semester/course identity, if present;
- source and author/provenance;
- resource type and topic tags;
- explicit sharing classification;
- one or more approved institution-course mappings;
- publication state.

Only mark a resource `shared_foundational` when it can be used independently of a university-specific course sequence and the destination mapping is justified. Never strip the original provenance.

## Pilot flow and acceptance tests

1. Select FUTA → programme → 100L → semester → BIO 101. Show FUTA BIO 101 notes and its 32 flashcards; show an honest empty state for MCQs until a bank is available.
2. Select Bowen → CoHES → 100L → matching semester → BIO 101. Show the Bowen BIO 101 material, not the FUTA BIO 101 hub.
3. Switch from Bowen 100L to Bowen MBBS 200L. The 100L course/resource list must disappear; show only mapped 200L resources.
4. Select another institution with no mapped resources. Show “Resources are being prepared”; do not show Bowen or FUTA resources as substitutes.
5. Change institution after resources are loaded. Clear the previous institution's cached view and re-query using the new academic identity.
6. Search globally within the app. Results must obey the same institution/programme/level access rules as the dashboard and course pages.
7. Test direct URLs and stale local cache. A user must not bypass academic filters by opening a previously cached resource route.
8. Guest and incomplete profiles may browse only the neutral landing/onboarding surfaces; do not infer an institution from a default profile.

## Important distinctions

- Academic correctness / user verification is not the same as institution-course mapping.
- A shared foundational resource may be shown in more than one university only after a mapping decision.
- The FUTA BIO 101 page is explicitly FUTA-specific; it is not a generic BIO 101 template.
- The Bowen BIO 101 page is explicitly Bowen CoHES-specific.
- Notion page verification metadata may be unset even where the owner has confirmed the content as verified. Preserve the user's confirmation while separately recording mapping and publication status.
- Google Drive has not yet been inventoried in this build session. The inventory above is based on Notion sources only.

## Implementation boundary

This document is a source inventory and test contract. It does not apply Supabase migrations, seed database rows, alter user profiles, or publish resources. The resource engine PR must connect these mappings to the existing app before any production rollout.
