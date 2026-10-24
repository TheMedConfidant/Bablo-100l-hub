# Bablo Chess — Standalone Product & UI Blueprint

**Cross-chat progress tracker:** [Bablo Chess Progress Hub](./BABLO_CHESS_PROGRESS_HUB.md)
Status: design baseline for the isolated chess lab. Do not integrate into Bablo Hub until the screens and core flows are reviewed and tested.

## Non-negotiable product identity
- Bablo Chess feels like entering a separate chess application inside Bablo Hub, not another Hub page.
- One fixed visual identity: futuristic deep-gold glassmorphism on a near-black graphite background. No theme picker and no alternate chess colors.
- The previously approved first preview is the visual direction and reference point. Refine its layout and board; do not replace it with a generic dashboard.
- Shared account/backend services are acceptable; Hub themes, layout conventions and quick-access patterns must not leak into the chess shell.
- Keep Dr ECG as the recognizable signature opponent. His identity is fixed; difficulty and match format are chosen before play, never adjusted through an in-game personality/style panel.
- Do not deploy into the production Bablo Hub while the standalone experience is still being designed and tested.

## Product navigation
Persistent chess-only navigation:
1. **Home** — personal chess dashboard and continue-playing entry.
2. **Play** — choose offline Dr ECG, online match, friend challenge, or local practice.
3. **Learn** — lessons and guided practice.
4. **Compete** — daily puzzle, puzzle rush, challenge ladder, and leaderboards as each becomes functional.
5. **Profile** — rating, results, stats, achievements and account preferences.

Desktop: compact left rail or top navigation plus a spacious content canvas. Mobile: restrained top brand bar and fixed bottom navigation; keep the board and primary action prominent. Never stack every feature on the home screen.

## Professional UI principles
- Clear hierarchy: one primary action per screen; secondary actions visually quieter.
- Use a consistent spacing scale, typography scale, corner radii, gold border opacity and motion timing.
- Gold is an accent and action color, not a flood of glowing yellow. Glass panels need readable contrast and restrained blur.
- Use real chess-piece glyphs or a consistent piece set, clear coordinates, legal-move indicators, last-move highlight, check highlight and captured-piece trays.
- The board is the main event during a match. Desktop may use board + right-side opponent/game panel; mobile should prioritize a large board with collapsible or vertically ordered details.
- No layout shift when the clock, chat, move list or captured pieces update. Reduced-motion preferences must be respected.
- Use consistent empty, loading, error, reconnecting and completed-game states. Never display fake stats, dead cards or controls that do nothing.
- Every screen must work at narrow phone width and wide laptop width, with visible keyboard focus and accessible contrast.

## Dr ECG: one signature opponent, many ways to play
Do not solve the “only one bot” concern by inventing several shallow bot identities. Keep Dr ECG as the recognizable opponent and give him genuinely different game experiences.

### Strength presets (chosen before the game)
Use themed levels that are clear even to beginners: **Student → Intern → House Officer → Registrar → Consultant → Professor**. Map them to tested engine settings and calibrated approximate ratings only when verified. Difficulty must change actual play strength, not just the label or banter. Dr ECG remains the same character throughout.

### Offline match formats
1. **Quick Match** — one-tap standard game with sensible remembered defaults.
2. **Timed Match** — Bullet, Blitz, Rapid, Classical and Unlimited, with presets and a custom clock.
3. **Training Match** — optional hints and take-backs; explicitly unranked.
4. **Challenge Ladder** — a sequence of increasingly difficult Dr ECG matches with progress and unlocks.
5. **Tactical Rounds** — curated positions to solve against a move limit or objective.
6. **Opening Lab** — choose an opening line, play it out, and review where the line diverged.
7. **Endgame Lab** — focused rook, pawn, and king endgame scenarios.
8. **Survival / Streak** — continue through a run of challenges; track streak separately from rating.
9. **Daily Challenge** — one repeatable daily position or match with a clear completion state.
10. **Custom Match** — pre-game choice of side, clock, strength and training aids.

These are separate formats, not a crowded row of ten buttons. Home surfaces Quick Match, Continue, and a Daily Challenge; the Play screen organizes the remaining formats into clear groups. Ship only a mode whose underlying rules, state and completion tracking work.

### Personality and feedback rules
- Dr ECG's character and medical-student/Bowen context remain recognizable; his lines can vary by match context and difficulty, but do not turn personality into an in-game slider.
- Configure match strength, time and training aids before starting. Once the board opens, keep those controls out of the game.
- Post-game review can explain key turning points, blunders and missed tactics. Do not claim engine analysis unless a real analysis engine is connected.

## Core screen sequence
1. Chess Home → primary **Play Dr ECG** or **Continue**.
2. Play → choose a format.
3. Match setup → strength, time control, side, and training aids relevant to that format.
4. Match → board-first interface, player cards/clocks, captured pieces, move list, discreet chat/reactions, resign/draw controls.
5. Result → result summary, rating change only where applicable, key moments/review, rematch and home.
6. Learn, Compete and Profile use the same gold-glass shell and navigation, with no visual theme switching.

## Engineering and acceptance gates
- Keep this work on an isolated branch/preview until approved; do not modify the production Hub landing page to test chess design.
- Preserve existing game mechanics, usernames, friend/challenge flow, online clocks, sounds, and learning progress unless a specific regression is identified.
- Before any production integration, test route entry/exit, mobile and desktop layouts, all buttons, offline legal moves/check/checkmate/stalemate, clock expiry, pause/resume behavior, new game, take-back rules, rating rules, and two-account online challenges.
- No “done” claim based only on a successful build or HTTP 200. Verify the rendered screens and key interactions.
- Integrate only after Home, Play/setup, Match, Result and the core flows have been reviewed against the approved preview.


---

# Claude Artifact Build Brief — Design and Interaction Prototype

This section is the handoff brief for a strong product/UI architect building the full Bablo Chess artifact. The artifact should be a reviewable, navigable product prototype—not a static landing-page mockup. Build the entire UI/UX system first, then have it inspected, corrected and selectively implemented in the isolated code branch. The artifact is a design source of truth, not permission to replace production code blindly.

## Assignment and delivery

Build a cohesive, high-fidelity Bablo Chess application artifact covering all principal screens and journeys below. It must look and behave like a polished standalone chess product on mobile and desktop. Use the approved first gold-glass preview as the design anchor.

Deliver:
- A complete navigable artifact, not a single hero screen and not disconnected screenshots.
- All screens, shared components, responsive states, dialogs, empty/loading/error states, and believable interaction prototypes.
- A short implementation map: screen/component, interaction, required data, existing backend/mechanics dependency, and whether it is prototype-only or already backed by working functionality.
- A concise list of assumptions and unresolved integrations. Do not fake connected functionality or label prototype-only interactions as production-ready.
- Clear screenshots/preview links for Home, Play, setup, in-game board, Learn lesson, Daily Puzzle, leaderboard, result, and Profile.

## Required screens and user journeys

### 1. Chess Home
- Distinct Bablo Chess identity, not the Bablo Hub homepage restyled.
- Clear primary action: Play Dr ECG; secondary: Continue Game where applicable.
- Compact player rating/progress summary only when real data exists; otherwise show a clearly identified preview state.
- Daily Puzzle card with difficulty/status and a direct entry point.
- Recent games and a restrained shortcut to Learn/Compete.
- Do not crowd Home with every mode or create decorative cards that lead nowhere.

### 2. Play and pre-game setup
Organize modes into clear categories rather than a wall of buttons:
- Play Dr ECG: Quick Match, Timed Match, Training Match, Challenge Ladder, Tactical Rounds, Opening Lab, Endgame Lab, Survival/Streak, Custom Match.
- Play people: Online Match and Friend Challenge.
- Setup screen adapts to selected mode. Offer only relevant controls before the board opens: Dr ECG strength preset, time control, side/color, hints/takebacks for unranked training, and mode-specific goals.
- Keep Dr ECG a single recognizable character. Strength presets Student, Intern, House Officer, Registrar, Consultant, Professor must map to genuine tested engine settings when implemented; do not fabricate Elo values.
- Do not place a bot personality/style selector inside the active game. The character is fixed; pre-game settings define match conditions.
- Explain whether a match is ranked, timed, training-only, or contributes to a streak before the user starts.

### 3. In-game board
- Make the board the focal point: large, readable squares, crisp pieces, coordinates, selected square, legal-move destinations, last-move highlight, check/checkmate highlight, promotion picker, and captured-piece trays.
- Include clocks and clear player/opponent identity; stable layout as the clock ticks or move list changes.
- Desktop: board with compact opponent/status and move-list panel. Mobile: board-first layout with secondary details stacked or collapsible; never shrink the board to fit every panel.
- Controls should be discoverable but not clutter the board: new game, resign, offer draw where applicable, sound, move history and permitted takeback/training aids.
- Online play must preserve existing no-board-rotation behavior, player identity, challenge flow and clock semantics.
- Chat/reactions must respect the existing design requirements: short text bubbles, no voice; online chat persists through the game, single-player messages clear on the appropriate move/takeback; reaction emoji animate briefly without polluting chat history.
- Never show controls that are not wired or explain clearly that the artifact is demonstrating a future feature.

### 4. Learn — actual on-board teaching, not vague text
Learning must be an interactive chess lesson with a real, clickable board and guided legal moves. Text-only descriptions or a list of chess tips do not satisfy this requirement.

Build at least these lesson experiences:
- **Opening walkthrough:** guide the learner through a legal opening line move by move. Highlight the piece to move and legal destinations, show whose turn it is, label the next move, and explain the purpose of that specific move in plain language.
- **Tactics trainer:** present a real position with a clear objective (for example, win material or find checkmate in one/two). Let the learner make a move on the board, give feedback, reveal a hint without immediately exposing the answer, and show the solution line after an attempt.
- **Endgame practice:** an actual board position with a concrete goal, legal moves, move-by-move feedback and a restart option.
- Provide Back, Next, Restart and hint controls where appropriate. Keep board state, move notation, side to move and explanation synchronized.
- Learners can select a square and a legal destination; support legal move rules, castling, en passant, promotion selection, check/checkmate/stalemate and terminal positions. Do not implement only basic piece movement.
- Guided Next advances only the next verified legal lesson move. A learner move outside the guided line can end guided continuation while retaining legal free play. Back must restore the full prior state; Restart restores the exact lesson starting position.
- Show why a move matters at the moment it is played: e.g. centre control, development, king safety, a threat or a tactical motif. Feedback should refer to the current position and the move just made, not generic motivational filler.
- Provide progressive difficulty and visible lesson progress. Completion should show what was learned and a sensible next lesson.
- Validate every scripted lesson line against its starting position before shipping; never force an illegal move to match written narration.

### 5. Daily Puzzle and puzzle progression
- Dedicated Daily Puzzle screen with a real board position, side to move, objective, difficulty, and a clear start/attempt state.
- User makes moves on the board. Validate moves against a real legal chess position and the puzzle solution; provide useful attempt feedback and a non-spoiling hint system.
- After completion, show the solution line, explain the tactical idea, and offer retry/review/next appropriate action.
- Define one puzzle per date and consistent daily reset semantics; prevent accidental repeated attempts from falsely counting as separate completions.
- Track completed/not completed, attempts, solve time and streak only if these are genuinely persisted. Show the user's local date/time clearly enough to avoid ambiguity.
- Include Puzzle Rush/Tactical Rounds only as distinct modes with explicit rules and working completion states; do not present placeholder puzzle cards as functional features.

### 6. Leaderboards, Compete and profile
- Create a real leaderboard UI with understandable tabs/filters, such as overall rating, weekly activity, puzzle performance and friends—only where the data model supports them.
- Each row should show rank, player identity, rating/score, relevant change or metric, and the current user's own position. Handle loading, empty, failed-load and duplicate-row states.
- Define ranking eligibility, tie-breaks, season/reset period and the difference between chess rating, puzzle score, streak and activity. Do not mix incomparable metrics into one ranking.
- Prevent duplicate player rows by stable user identity, not display name. Use usernames consistently; do not create duplicate entries for the same account.
- Keep rankings server-authoritative for online/ranked play. Do not invent user scores or simulate a live leaderboard in production.
- Profile should include rating/history, game record, win/draw/loss summary, puzzle and lesson progress, achievements and privacy/preferences where backed by data. Use clear empty states for new users.
- Compete should make Daily Puzzle, Puzzle Rush, Challenge Ladder and leaderboards easy to find without overcrowding Home.

### 7. Results and post-game review
- Clear win/draw/loss result, opponent, mode and time control.
- Rating change only for ranked games with a verified rating calculation; no fake Elo delta for practice.
- Show move list and key-moment review only if a real evaluation source exists. Otherwise provide a truthful move-history recap without claiming engine analysis.
- Actions: rematch with the same settings, review board, return Home. Ensure all actions have clear outcomes.

## Visual system and quality bar
- One theme only: deep gold glassmorphism on near-black graphite. No theme switcher and no unrelated palette variants.
- Keep gold selective: primary actions, active navigation, focus, meaningful status. Use high-contrast neutral text for long explanations; avoid white-on-white, washed-out glass or glowing borders everywhere.
- Use a consistent type scale, spacing, icon family, radius, shadow, blur and motion system. Use accessible labels and visible focus; respect reduced-motion settings.
- The board and piece set must be crisp at phone width and laptop size. Avoid cramped desktop panels and tiny mobile controls.
- Design real app states: loading, no games yet, offline/reconnecting, failed challenge, puzzle completed, no leaderboard results, lesson complete and signed-out/guest where relevant.
- Navigation and back paths must be coherent. Do not trap the user in a screen or send them to a separate external page for a core learning interaction.
- Avoid fake metrics, nonfunctional toggles, dead buttons, lorem ipsum and vague copy.

## Implementation boundaries for the reviewing architect
- First deliver the artifact and its navigation/visual system for review. Do not directly change production Bablo Hub as part of artifact creation.
- Inspect existing repository code and behavior before proposing replacement. Preserve working game rules, user identity, online challenges, clocks, sound, ratings and data flows unless a specific tested defect justifies a change.
- When moving from artifact to implementation, map each artifact screen to existing routes/components and identify missing services separately. Reuse working logic when safe; do not rewrite working chess rules merely to make the UI resemble the artifact.
- Keep all implementation changes on the isolated chess branch/preview. Production integration requires review of the artifact and regression tests.
- Verify at least one narrow phone layout and one desktop layout, and manually test the core interactions. A successful build or HTTP 200 is not proof that the interface works.
- Prioritize the shell and the key journeys first: Home → Play/setup → board → result, then interactive Learn, Daily Puzzle, Compete/leaderboard and Profile. The UI should feel coherent across all of them before feature depth is expanded.
