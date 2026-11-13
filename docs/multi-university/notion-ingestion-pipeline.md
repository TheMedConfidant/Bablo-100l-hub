# Notion resource ingestion pipeline

## Current stage: content-exported staging

The source manifest is `data/notion-resource-manifest.json`. It currently records 52 Notion source pages and collections, preserving source IDs, URLs, original institution/programme/level/semester/course metadata, declared resource types and collection references.

Existing exported content is held in four reviewed source files:

- `data/notion-100l-physics-chemistry-shared-pilot.json`
- `data/notion-200l-anatomy-shared-pilot.json`
- `data/notion-futa-bio101-notes.json`
- `data/notion-content-pilot.json`

The typed importer `scripts/build-notion-content-ingestion.mjs` combines these into `data/notion-content-ingestion-preview.json`. It currently reads the 100L Physics/Chemistry shared candidate pack, 200L Anatomy pack, 200L course-map pack, 200L Physiology/Biochemistry topic pack, FUTA BIO 101 notes, and Bowen 200L course-map pack. Current CI-validated inventory: 36 unique page-level resources (two identical duplicate exports safely skipped) plus 255 database rows. The database rows currently comprise 75 FUTA BIO 101 flashcards and 180 Bowen CoHES BIO 101 MCQs. This is a partial export of the library, not the full Notion inventory.

Run locally with Node 22:

```sh
node scripts/validate-notion-manifest.mjs
node scripts/build-notion-ingestion-preview.mjs
node scripts/build-notion-content-ingestion.mjs
node --test tests/academic-engine.test.mjs tests/notion-ingestion-preview.test.mjs tests/notion-content-ingestion.test.mjs
```

Both generated previews are derived staging artifacts and should be reviewed as CI artifacts, not committed as source data.

## Provenance and publication controls

Each record preserves the original Notion page or row URL, stable source ID, source container/data-source reference, resource type, and original institution/programme/level/course where known. General Content Library material remains unassigned to an institution where the source does not name one. Bowen-origin Anatomy content retains Bowen provenance even when explicitly staged as a possible non-Bowen reuse candidate. FUTA and Bowen CoHES content remain institution-specific.

Three attestations are independent:

1. Content quality: user-confirmed verification.
2. Rights: pending clearance.
3. Curriculum fit: pending explicit destination mapping.

Every generated record has an empty `targetMappings` array and `publicationState: blocked`. No course-code or title similarity is treated as evidence of curriculum equivalence. Shared reuse requires review and a mapping to an exact institution, programme, level, semester, course and (where applicable) topic. Institution-exclusive sources remain isolated.

## Candidate state model

- `source-indexed-content-not-extracted`: source page is known, but content is not in an export.
- `collection-indexed-rows-not-exported`: a collection is known, but its rows are not exported.
- `content-exported-review-required`: content is exported and awaits review.
- `publicationState: blocked`: unavailable to students regardless of export state.

## Notion query allowance

The current Notion workspace Query Data Source allowance was reached during the 2026-11-13 export session. Further SQL/rows-mode exports remain queued until access is available again; do not treat the existing checked-in exports as missing. The existing exported files above are already in the repository and can be processed locally; do not describe them as missing. Additional collections still need source-row exports when access is available. Saved database views may remain usable where a suitable view URL is known.

## Deliberate non-goals

The importer does not clear rights, generate destination mappings, seed Supabase, or publish resources. It is a deterministic staging adapter only. The preview must never be used as a student-facing content feed.

## Next stage

Expand the same typed adapters to remaining Notion collections (Bowen BIO 101 flashcards, PHY 101 flashcards and MCQs, COS 101 flashcards, CHM 101 MCQs, Mathematics, General Studies, Agriculture, additional Physiology/Biochemistry collections, laboratory/practical collections and other medical-science resources). Export each collection with its fetched schema and stable row IDs; validate option completeness, answer correctness, flashcard fields and note bodies; then prepare explicit destination mapping review queues. Supabase seeding and student publication remain separate later stages.
