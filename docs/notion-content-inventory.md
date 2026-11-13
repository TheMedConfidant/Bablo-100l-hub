# Notion content inventory — Bablo Hub expansion

**Inventory date:** 2026-11-13  
**Source:** User's Notion workspace  
**Authority note:** The user explicitly confirms that the materials they built in Notion are verified. Some source pages carry old Notion verification badges/status fields that predate this confirmation. Do not treat those stale fields as evidence that the academic material is unverified.

## What the first inventory pass found

The workspace already contains much more than a small 100L sample. Search surfaced separate 100L course packs and substantial 200L course structures across Anatomy, Physiology and Biochemistry, including detailed topic pages, flashcards, MCQ databases, clinical vignettes, practical resources, past-paper sections and course maps.

A first content tranche has now been exported to `data/notion-content-pilot.json`: 75 FUTA BIO 101 flashcards and 180 Bowen CoHES BIO 101 MCQs (255 records total). A second shared-use tranche is staged in `data/notion-200l-anatomy-shared-pilot.json` (five 200L Anatomy resources: notes, flashcards, quiz, vignettes and reference glossary) and `data/notion-200l-course-maps.json` (six Physiology/Biochemistry course-map and architecture pages). These 200L shared-use candidates explicitly exclude Bowen and remain unpublished until mapped to target universities. The multi-university profile selector now has 69 source-backed Nigerian university entries, with more nursing-only and allied-health universities to be added from regulator lists. This is a first-pass index, not a complete count of the workspace. Notion search returned capped result sets for several broad queries; database rows and Drive files still need systematic extraction.

## Critical separation discovered: same course code does not mean same course

Two BIO 101 resources illustrate why academic identity must include the institution and programme:

- **FUTA BIO 101:** an eight-topic outline, with eight topic notes and **75 flashcards in the live Notion database**. The parent page's older 32-card progress note is stale.
- **Bowen CoHES BIO 101:** a separate nine-topic course sourced from Bowen lecture material, with its own topic sequence and **180 MCQ database records**.

These must remain separate. A course code match is not sufficient evidence of equivalence.

## First-pass source register

| Resource | Academic identity / scope | Resource types | Handling |
|---|---|---|---|
| FUTA BIO 101 | FUTA, 100L, BIO 101 | Notes, flashcards, MCQs, past-paper index | Preserve as FUTA-specific. The page records 8/8 notes and 32 flashcards; MCQs/past papers were not yet built at the last recorded update. |
| Bowen CoHES BIO 101 | Bowen, CoHES, 100L, BIO 101 | Notes index, flashcards, MCQ database, past papers | Separate Bowen resource set; never merge with FUTA BIO 101. |
| Bowen 100L Demo | Bowen MBBS, 100L, first semester | Course catalogue and question-style rules | Use to preserve Bowen's distinct course and exam style. |
| 200L Anatomy | 200L Anatomy | Notes, flashcards, quizzes, scenarios/vignettes, course index, practical/dissection, resources | Five Elbow & Forearm resources are staged for shared reuse outside Bowen; target university mapping remains explicit. |
| 200L Physiology | 200L Physiology | Master course map, notes, flashcards, MCQs, past papers, vignettes | Master course map and index staged as shared-use candidates outside Bowen; topic hierarchy preserved. |
| 200L Biochemistry | 200L Biochemistry | Notes, flashcards, MCQs, past papers, practicals/calculations, research/resources | Course hub, notes index and architecture staged as shared-use candidates outside Bowen. |
| Med School Workspace | Mixed personal academic workspace | MedNotes and related databases | Inventory database rows before importing; do not assume all rows are app-ready course resources. |

## Shared 200L pilot exports

- `data/notion-200l-anatomy-shared-pilot.json` — five user-confirmed verified Elbow & Forearm resources; shared reuse excludes Bowen until target mappings are explicitly created.
- `data/notion-200l-course-maps.json` — six Physiology/Biochemistry master maps, course indexes and architecture pages; shared reuse excludes Bowen.

These are staged source exports, not yet loaded into the live application. No university receives these resources until a verified mapping exists for its programme, level, semester and course.

## Source links

- FUTA BIO 101: https://app.notion.com/p/3ca1834fbdba8167a959cce677f5249e
- FUTA BIO 101 Notes: https://app.notion.com/p/3ca1834fbdba81f89219d57507c99235
- FUTA BIO 101 Flashcards: https://app.notion.com/p/3ca1834fbdba81588f35d7ae7b8b5e6a
- Bowen 100L Demo: https://app.notion.com/p/3d71834fbdba81f7a69ed0c6396bea31
- Bowen CoHES BIO 101: https://app.notion.com/p/3e91834fbdba8124be25c4d749158c67
- 200L course architecture: https://app.notion.com/p/3ca1834fbdba81da89a7f8607c3fecfe
- 200L Physiology master map: https://app.notion.com/p/3cc1834fbdba8152b941cac564a47e90
- 200L Anatomy hub: https://app.notion.com/p/3d11834fbdba81328612dc2d9aebb3fb
- 200L Biochemistry hub: https://app.notion.com/p/3d11834fbdba81d7942ac264892957ac
- 200L Elbow & Forearm notes: https://app.notion.com/p/4161834fbdba81fb9245e2f5193d69f1
- 200L Elbow & Forearm flashcards: https://app.notion.com/p/4161834fbdba81d8aaf7cd19f4a5ce6a
- Med School Workspace: https://app.notion.com/p/a55df9d5aed24afc86492751543ec07d

## Reuse policy

The user's confirmation establishes that the content they created is verified. It does **not** mean every resource is automatically curriculum-equivalent across every university.

- A university-specific resource remains exclusive to that university.
- A resource can be reused elsewhere only after an explicit mapping to the target institution, programme, level, semester and course.
- Shared resources are stored once and mapped to multiple verified course records.
- Keep source attribution and original Notion page IDs.
- Do not duplicate whole pages into separate university folders when a shared resource mapping is sufficient.
- No automatic cross-university, cross-programme or cross-level fallback.

## Next ingestion sequence

1. Enumerate each course hub and its child pages/databases.
2. Read database rows for notes, flashcards, MCQs, past papers, vignettes and practicals.
3. Preserve source IDs, title, content, topic, type, level, programme and current university attribution.
4. Build a resource manifest and detect duplicates without deleting or moving any Notion content.
5. Create institution/course mappings. Preserve known distinctions such as FUTA BIO 101 versus Bowen CoHES BIO 101. FUTA BIO 101 still needs programme and semester mapping before it can be served to students.
6. Load the first pilot content into the Bablo Hub resource catalogue only after its source and target mapping are explicit.
