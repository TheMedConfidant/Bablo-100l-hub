# CHM 107 Practical CBT — Source Audit

**Audit date:** 14 November 2026  
**Repository:** TheMedConfidant/Bablo-100l-hub  
**Working branch:** chm107-practical-cbt-2026-11

## Scope confirmed from the existing Bablo Hub practical material

The repository contains:
- `practicals/chm107-practicals.html` — experiment-by-experiment practical guide based on readable portions of the supplied 30-page scan.
- `chm-practicals-native.js` — native in-app CHM practical data; its current experiment array contains eight sections.
- `practicals/chm107-practical.html` — an earlier/shorter companion guide.

The eight readable experiment areas are:

| # | Manual experiment | CBT coverage |
|---|---|---|
| 1 | Experiment 3 — Calibration of pipette, burette and thermometer | Apparatus, calibration procedure, mass-by-difference, water density, delivered volume, accuracy, precision, error and thermometer fixed points |
| 2 | Experiment 4 — Graph plotting and errors of a fitted line | Tables, axes/units, scale, best-fit line, gradient, intercept, scatter and uncertainty |
| 3 | Experiment 5 — Theory of indicators | Indicator equilibrium, transition range, pH, universal-indicator colours, endpoint vs equivalence point and indicator selection |
| 4 | Experiment 6 — Strong acid against strong base | HNO3/NaOH neutralisation, phenolphthalein endpoint, concordant titres, mole ratios, concentration and mass concentration |
| 5 | Experiment 7 — Weak acid against strong base | Acetic acid/NaOH, 1:1 stoichiometry, hydrolysis, equivalence-point pH, phenolphthalein and concentration calculations |
| 6 | Experiment 8 — Determine pKa of a weak acid using a pH meter | Henderson–Hasselbalch equation, acid/salt ratios, pKa calculation, mean, standard deviation and standard error |
| 7 | Experiment 9 — Determine titration curves using a pH meter | pH meter calibration, HCl/NaOH titration, cumulative volume, pH table, curve plotting, equivalence region and indicator endpoint comparison |
| 8 | Experiment 10 — Redox titrations | Permanganate/Fe2+ titration, acidic medium, self-indication, iodine liberation, starch endpoint, thiosulfate and balanced redox mole ratios |

## Source limitations and exclusions

- The existing practical page explicitly says the supplied scan has faint sections and is not a complete transcription of every page.
- The guide mentions additional titration-related work and filtration among remaining pages, but does not provide enough readable detail to define a separate confirmed experiment or its exact procedure.
- Do not promote filtration, gravimetric analysis, qualitative cation/anion tests, or other generic chemistry-lab topics into the confirmed CHM 107 bank unless a readable source page or course instruction verifies them.
- Do not invent experimental readings, reagent concentrations, masses, pH values or titres. Numerical questions may use clearly stated hypothetical data, with units and internally consistent answer keys.

## Question-bank acceptance criteria

- Target: 30 original, practical/scenario-based CBT questions per confirmed experiment area (240 total across the eight areas).
- Each item must have four options, one defensible correct answer, and an explanation that teaches why the answer is correct. Distractors should be plausible and explanations should address the underlying misconception.
- Mix apparatus/procedure, observation/interpretation, calculations, graph/data handling, indicator/reagent reasoning, precautions and experimental-error questions as appropriate to each experiment.
- Keep questions within the source-supported scope. Mark any extension beyond the readable manual as supplementary, not confirmed manual content.
- Preserve the existing placement: Laboratory → CHM → CHM 107 Test Practice. Do not create a new dashboard module or overwrite the practical guide.
- Before integration, inspect the existing test-practice loader and question schema; then validate counts, answer keys, rendering, scoring and explanations in a preview deployment.

## Current status

- Source files located and inspected: **complete**.
- Eight readable experiment areas inventoried: **complete**.
- Entire 30-page scan independently re-OCRed/reviewed: **not complete**; faint pages remain a coverage limitation.
- 30-question sets per experiment: **not yet built**.
- App integration, CBT validation and deployment: **not yet done**.
