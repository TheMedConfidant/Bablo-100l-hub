# Bablo Hub — Expanded Notion Resource Catalogue

Inventory pass: 2026-11-13  
Branch: `build/multi-university-resource-engine-2026-11-13`  
Status: source discovery and classification baseline; no resources published by this document.

## Coverage correction

The Notion library is not a BIO/Anatomy-only collection. The current search and source-page inspection surfaced resources across physical sciences, chemistry, computing, foundational biology, mathematics-related material, medical/preclinical sciences, practicals and clinical/laboratory interpretation. This catalogue intentionally records the wider scope rather than narrowing the product to two subjects.

The owner's confirmation is that the study materials are verified. This catalogue preserves that confirmation. It separately tracks whether each item is mapped to a destination university's course/semester and whether its reuse permissions allow cross-institution distribution.

## Discovered course and subject collections

| Collection | Source / Notion page | Scope evidenced in source | Resource state evidenced | Initial routing |
|---|---|---|---|---|
| CHM 101 | https://app.notion.com/p/3c11834fbdba81b48bcfd9c9f8e58ae1 | Atomic Theory, Thermochemistry, Chemical Kinetics, Chemical Equilibria, Electrochemistry, Radiochemistry, Solutions & Solubility | Notes 7/7 complete; flashcards expanding; MCQ and past-paper indexes exist; source page says real question banks are available in Drive | Preserve source institution/course metadata; candidates for shared foundational chemistry only after destination course mapping |
| PHY 101 | https://app.notion.com/p/3c41834fbdba81b8a6fbea6a88fbda9f | Dimensional Analysis, Vectors, Kinematics, Projectile Motion, Circular Motion, Mechanics; extension topics include Gravitation, Momentum/Collisions, Heat Transfer, SHM | Notes, flashcard, MCQ and past-paper child indexes exist; source page says real past-question files exist | Foundational physics candidate; map each destination syllabus before surfacing |
| COS 101 | https://app.notion.com/p/3e21834fbdba81258663e240c3427ec5 | Bowen CoHES 100L Introduction to Computing; 10 theory chapters, 6 lab exercises, glossary | Notes 10/10 complete; flashcards and MCQs built; linked databases | Institution-exclusive by default because source identifies Bowen and a Bowen departmental study guide |
| FUTA BIO 101 | https://app.notion.com/p/3ca1834fbdba8167a959cce677f5249e | FUTA 100L BIO 101, official outline and eight topics | Eight topic notes complete; 75 flashcards confirmed from live Notion database query | FUTA-specific course mapping; retain FUTA provenance |
| Bowen CoHES BIO 101 | https://app.notion.com/p/3e91834fbdba8124be25c4d749158c67 | Bowen CoHES 100L BIO 101 | Nine-topic course hub; 180 MCQ records previously confirmed | Bowen-exclusive by default |
| 200L Anatomy | https://app.notion.com/p/4161834fbdba81fb9245e2f5193d69f1 | Elbow and forearm notes; associated flashcards, quiz, vignettes, glossary | Five resource collections discovered | Shared foundational candidate, not auto-shared; source follows standard atlas order and needs destination lecture-sequence mapping |
| 200L Physiology | https://app.notion.com/p/3cc1834fbdba8152b941cac564a47e90 | Cardiovascular, respiratory, renal, GI, endocrine, neurophysiology, ECG, practical/data interpretation | Master course map and linked topic resources | Retain Bowen 200L origin until destination mapping is explicitly approved |
| Biochemistry | https://app.notion.com/p/3d11834fbdba81d7942ac264892957ac | Dedicated biochemistry topic library; linked detailed metabolic and clinical topics | Multiple topic pages found, including fatty-acid oxidation, metabolic integration, enzyme defects, nucleotide metabolism and clinical interpretation | Foundational candidate; map to each target programme/course before publication |
| Physiology | https://app.notion.com/p/3ca1834fbdba81119c40d56f55b8b295 | Dedicated physiology library with detailed systems topics | Topic pages found across cardiovascular, respiratory, renal, endocrine and other systems | Foundational candidate; exact destination mapping required |
| Practicals & Calculations — Physiology | https://app.notion.com/p/3d11834fbdba81f985a0f61bceecc8b7 | Physiology practicals, experiments, graphs, calculations, interpretation and practical exam preparation | Dedicated practical collection | Programme and course mapping required |
| Practicals & Calculations — Biochemistry | https://app.notion.com/p/3d11834fbdba81819ed7fdc2e42d0ff6 | Biochemistry practicals, calculations, laboratory methods, result interpretation and practical exam preparation | Dedicated practical collection | Programme and course mapping required |
| Computing chapter library | https://app.notion.com/p/3e21834fbdba81258663e240c3427ec5 | History, computer components, hardware/software/humanware, applications, information processing, internet, disciplines and careers | Ten theory chapters, six lab exercises, glossary | Bowen-exclusive unless separately mapped and approved |
| 100L content catalogue | https://app.notion.com/p/3c11834fbdba8134b991d36636446600 | PHY, CHM, BIO, GNS, GST, MTS, FPIO/PHS | CHM has complete notes; other course hubs have differing progress states | Do not treat the listed course names as proof that each course's materials are complete |
| 200L course architecture | https://app.notion.com/p/3ca1834fbdba81da89a7f8607c3fecfe | Anatomy, Physiology, Biochemistry; notes, flashcards, MCQs, past papers, vignettes, practicals, research and resources | Architecture page plus topic-level assets | Bowen-specific starting scope; map exact destination curriculum before any cross-university reuse |

## Additional subject areas to inventory in the next pass

Search surfaced references or possible collections for:
- Mathematics (MTH/MTS), including sets, induction and quantitative problem-solving.
- General studies (GNS/GST).
- Agriculture (AGR).
- Medical laboratory and laboratory-facing topics: haematology, haemostasis, CBC interpretation, renal function tests and biochemical investigations.
- Embryology, histology, clinical anatomy and integrated organ-system physiology.
- Practical manuals, experiment protocols, calculations, graphs, result interpretation and past-paper collections.

These are search-discovered subject areas, not yet a complete item-level inventory. Each needs its own source-page/database fetch and counts before claiming completeness.

## Routing and reuse rules

1. Keep source institution, programme, level, semester, course, author/provenance and original Notion URL.
2. Use `institution-exclusive` for content whose source identity or rights restrict it to one institution.
3. Use `shared-foundational` only for genuinely portable learning resources; preserve original ownership/provenance.
4. A shared item is visible to a student only when an explicit, verified target mapping exists for that student's institution, programme, level, semester and course.
5. Same course code or subject name does not establish equivalence.
6. A resource can be academically verified and still be unmapped to a destination curriculum. Keep those states separate.
7. Do not expose incomplete course collections as complete. Display per-resource availability honestly.
8. No fallback to Bowen or another institution when the selected academic identity has no mapped resources.

## Immediate integration tests

- FUTA BIO 101: FUTA notes and 75 flashcards only; do not show Bowen BIO content.
- Bowen CoHES BIO 101: Bowen notes/MCQs only; do not show FUTA BIO content.
- CHM 101 and PHY 101: map to a second institution only after course-outline comparison; then test exact mappings and no unapproved leakage.
- COS 101: remains Bowen-only unless an explicit independent destination mapping and reuse decision is recorded.
- 200L Anatomy/Physiology/Biochemistry: do not show in 100L feeds; do not automatically share across institutions.
- Practicals: appear in the appropriate programme/course laboratory area, not duplicated as a separate practical section inside every course unless the course UX explicitly calls for it.
- Search, dashboard, course pages, quizzes, past papers and offline cache must all enforce the same academic identity.

## Source limitation

This pass searched Notion and fetched the listed source pages. Google Drive has not been inventoried here. Some course pages link to Drive question banks/past papers; those are leads, not imported files. No Supabase migration was applied and no student-facing resources were published.
