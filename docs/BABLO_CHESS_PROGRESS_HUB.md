# Bablo Chess — Cross-Chat Progress Hub

Last consolidated: 2026-10-24

This file is the single handoff point for work discussed across the recent Bablo Chess conversations. It links the product baseline, Claude Artifact brief, and the implementation/review sequence so future chats can resume without re-litigating settled decisions.

## Canonical project documents

- [Product and UI/UX blueprint](./BABLO_CHESS_PRODUCT_BLUEPRINT.md)
- [Claude Artifact handoff and acceptance checklist](./CLAUDE_BABLO_CHESS_ARTIFACT_HANDOFF.md)
- [Isolated development branch](https://github.com/TheMedConfidant/Bablo-100l-hub/tree/bablo-chess-standalone-lab)
- [Production Bablo Hub](https://bablo-100l-hub.vercel.app/)

## Settled decisions — preserve across chats

1. Build Bablo Chess as a coherent, chess-first experience, not a generic Bablo Hub dashboard.
2. Visual direction is fixed: deep gold accents and restrained glassmorphism on near-black graphite. No theme picker or alternate pink/purple chess themes.
3. Dr ECG is the one signature bot identity. Six pre-match strength tiers: Student, Intern, House Officer, Registrar, Consultant, Professor. No in-game personality/difficulty controls.
4. Required destinations: Home, Play, Learn, Compete, Profile, plus Match Setup, Match, and Result flows.
5. Learn must include genuinely interactive board lessons with valid sample lines, move feedback, hints, progress, and tactical lessons. Text-only “tips” are insufficient.
6. Daily Puzzle must include a coherent sample position and solution, attempts, hints, feedback, replay, completion states and streak/history UI. Mark demo data clearly.
7. Compete must include useful leaderboard filters, the current-player highlight, clear loading/empty/error/demo states, and no duplicate or fabricated real-user claims.
8. Keep board usability first on mobile; desktop can use board plus side panel. No board rotation in online play, no layout jumps, and no tiny board on phones.
9. Preserve existing Hub functionality (online challenges, usernames, clocks, sounds and learning progress) when implementation begins. Prototype work stays isolated until reviewed.
10. Never present mock ratings, fake live rankings, puzzle validity, engine analysis or online state as production-backed facts.

## Progress carried forward from other chats

- The existing Bablo Chess product blueprint and Claude handoff were committed to the isolated branch.
- The handoff requires Claude to create one navigable, high-fidelity Artifact with all major screens and real prototype interactions, plus a screen inventory, functionality ledger, limitations list and design-decision note.
- The intended workflow is: Claude builds Artifact → ChatGPT audits it against the handoff and blueprint → revise weak or missing flows → implement in the isolated branch → test mobile and desktop → integrate only after explicit review.
- Production must not be replaced by a prototype or updated before the isolated work is reviewed.

## Status snapshot

| Workstream | Status | Next acceptance gate |
|---|---|---|
| Product baseline | Defined | Preserve decisions above |
| Claude Artifact brief | Committed | Build the Artifact from the handoff |
| Full Artifact | Not yet supplied/reviewed in this project branch | Obtain shareable Artifact or exported source |
| Independent UX/logic audit | Pending Artifact | Check every required screen and interaction |
| Implementation in isolated app | Not started from the Artifact | Build only after review/refinement |
| Mobile/desktop QA | Pending implementation | Test board sizing, navigation, state, and overflow |
| Production integration | Not approved / not started | Only after tests and explicit approval |

## Review checklist for the Artifact

- [ ] Home, Play, Learn, Compete, Profile
- [ ] Match Setup → Match → Result
- [ ] Dr ECG six-tier pre-match selection; no mid-game style controls
- [ ] At least one complete guided board lesson and one tactical board lesson
- [ ] Daily Puzzle with valid example position, hint ladder, attempts, solution replay and explanation
- [ ] Separate Puzzle Rush/Tactical Rounds behavior
- [ ] Leaderboard filters and honest demo/loading/empty/error states
- [ ] Friend/online/local flows represented without pretending demo state is live
- [ ] Move list, clocks, captured pieces, check/last-move indication and game actions
- [ ] Responsive phone/tablet/desktop layouts, accessible controls and no horizontal overflow
- [ ] Screen inventory, functionality ledger, limitations and design decisions included

## Source-of-truth rule

If another chat proposes a conflicting direction, use the product blueprint and handoff as the baseline. New requirements can be added, but do not silently remove existing requirements or rewrite settled decisions. Keep this progress hub updated whenever a review gate is completed.
