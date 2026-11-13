# Notion resource ingestion pipeline

## Current stage: metadata-only staging

The source manifest is `data/notion-resource-manifest.json`. It records source page IDs and URLs, original institution/programme/level/semester/course metadata, declared resource types, and collection references.

Run the local checks with Node 22:

```sh
node scripts/validate-notion-manifest.mjs
node scripts/build-notion-ingestion-preview.mjs
node --test tests/academic-engine.test.mjs tests/notion-ingestion-preview.test.mjs
```

The generator writes `data/notion-ingestion-preview.json`. This output is derived and should be reviewed as a CI artifact rather than committed as source data.

## Candidate state model

- `source-indexed-content-not-extracted`: a Notion source page is known, but its content has not been exported.
- `collection-indexed-rows-not-exported`: a Notion collection is known, but database rows have not been exported.
- `content-exported-review-required`: content rows have been exported and still require review.
- `publicationState: blocked`: all generated candidates remain unavailable to students.

The preview preserves source provenance and separates three independent attestations:

1. Content quality: user-confirmed verification.
2. Rights: pending clearance.
3. Curriculum fit: pending explicit destination mapping.

No destination mappings are generated automatically. Matching course codes, titles, or topic names are not evidence of curriculum equivalence. Shared reuse must be reviewed and mapped to an exact institution, programme, level, semester, course and (where applicable) topic. Institution-exclusive sources remain isolated.

## Deliberate non-goals

This stage does not call the Notion API, extract page bodies or database rows, infer reuse rights, generate target mappings, seed Supabase, or publish resources. Those operations require source-level extraction and separate review. In particular, the ingestion preview must never be used as a student-facing content feed.

## Next stage

After Notion Query Data Source access is available, export collection rows with their exact source IDs and field values. Then build typed adapters for notes, flashcards and MCQs, preserve stable source-row identifiers, validate required fields and option correctness, and generate explicit mapping review queues. Keep Supabase seeding and student publication as separate, later steps.
