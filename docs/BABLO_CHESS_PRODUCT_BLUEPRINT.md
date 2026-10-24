# Bablo Chess — Standalone Product & UI Blueprint
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
