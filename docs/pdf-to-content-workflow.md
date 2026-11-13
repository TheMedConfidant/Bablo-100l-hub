# PDF-to-Bablo Hub Academic Content Workflow

**Status:** Proposed operating workflow; automated PDF ingestion is not yet implemented.  
**Primary audience:** Bowen University College of Health Sciences (CoHES).  
**Academic hierarchy:** Institution → College → Programme → Level → Semester → Course → Topic.

## 1. Intake: one PDF, one source record

Record the original filename, checksum, source owner/lecturer/department where known, institution and college, programme/level/semester/course only when evidenced, document type, date/version, scope, usage authority, and known quality issues. Do not infer a programme or semester from a course code. Store CoHES separately from programme.

## 2. Full-document inspection

1. Read metadata and count pages.
2. Extract text in page order.
3. Visually inspect every page when scanned, image-heavy, or containing tables, equations or diagrams; also inspect when extraction appears incomplete.
4. OCR only pages that need it and compare OCR against the page image.
5. Capture figures, charts, anatomy/histology images, apparatus diagrams, tables and worked examples as structured evidence.
6. Maintain a page ledger: text-extracted, visually-reviewed, intentionally blank, duplicate or unreadable.
7. Record uncertainty. Never silently reconstruct obscured text.

**Gate:** Do not begin content production until every page is accounted for and the document scope is understood.

## 3. Source-faithful topic map

Preserve the source's topic order. For every topic record page range, learning objectives, concepts/definitions/mechanisms, formulae, figures/tables, prerequisites, cross-topic links and unresolved gaps. If reordering is useful, retain the original order and document the reason.

## 4. Generate assets by topic

### Teaching notes
Use an explanatory structure: learning outcomes; terminology; stepwise mechanisms; equations/derivations/worked examples; tables and diagram interpretation; clinical/practical relevance; misconceptions; summary; self-check questions; source page references. Explain concepts rather than merely reformatting slide bullets.

### Active-recall flashcards
One testable idea per card; concise prompt and complete answer; image/diagram interpretation where useful; topic and difficulty tags. Flashcards use recall, not MCQ options.

### Question bank
Use A–D single-best-answer MCQs unless the source specifies otherwise. Mix recall, interpretation, application, calculations and integrated scenarios. Include answer, teaching explanation, and why distractors are wrong where useful. Tag topic, difficulty and cognitive level. Distinguish source-derived questions from newly authored questions.

### Practicals and laboratory assets
Where relevant, produce aim, principle, apparatus/materials, safety notes, procedure, observation tables, expected patterns, calculations with units, worked examples, graphing/interpretation, errors/limitations, specimen or image identification, and viva/station prompts. Do not force non-practical topics into a lab template.

### Revision and assessment
Create revision sheets, mixed-topic quizzes, essay prompts, vignettes or CBT sets only where appropriate to the course and assessment style.

## 5. Verification and QA

Every asset must pass coverage, traceability, fidelity, accuracy, distractor quality, diagram integrity, no-fabrication, duplication, level-fit and rights checks. Recalculate numerical examples independently; verify answer keys. Mark missing information as not stated in source. Check labels and orientation against original diagrams. Keep advanced enrichment separate from core level content. User confirmation of a PDF does not automatically grant redistribution rights; check permission/licensing and write original explanations rather than reproducing substantial copyrighted passages.

Use two passes: extraction/authoring, then independent verification against the PDF.

## 6. Review pack before publication

Return: source report; page coverage ledger; ordered topic map; teaching notes; flashcards; MCQs; practical assets; QA report; mapping proposal with evidence/confidence; and publication manifest containing provenance, rights, review and mapping states. The user reviews uncertainties. Only approved, rights-cleared, quality-checked and explicitly mapped assets can be published.

## 7. Efficient upload protocol

Upload the original PDF directly in chat. State the institution/college/course/level/semester if known, identify the document type, and name the most urgent deliverable. If the PDF is large, process coherent page ranges/topic batches while maintaining one master page ledger. Avoid splitting in ways that lose diagram/table context or continuity.

## 8. Status vocabulary

Use these states consistently: received; page-audit-in-progress; source-extracted; topic-mapped; draft-assets-created; qa-in-progress; owner-review-required; approved-for-mapping; rights-cleared; mapped; published.

Extracted does not mean verified. Verified does not mean rights-cleared. Mapped does not mean published.
