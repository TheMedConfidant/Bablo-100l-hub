# Claude Handoff — Build the Complete Bablo Chess UI/UX Artifact

**Cross-chat progress tracker:** [Bablo Chess Progress Hub](./BABLO_CHESS_PROGRESS_HUB.md)

**Purpose:** Claude is the lead product designer and prototype builder for the complete Bablo Chess experience. Build the entire UI/UX as one cohesive, navigable Artifact first. ChatGPT will then act as the independent architect/reviewer: inspect the artifact against this brief, identify UX and logic flaws, request/fix refinements, and then help implement the approved design in the isolated code branch. Do not integrate into production Bablo Hub yet.

## The assignment

Create a polished, professional, high-fidelity **interactive application prototype**, not a mood board, static mockup, vague wireframe, or collection of disconnected screens. It should feel like a real chess product with deliberate information architecture, complete core flows, responsive behavior, and credible chess-specific UI.

Use the approved visual direction: **futuristic deep-gold glassmorphism on a near-black graphite background**. Keep one visual identity throughout. No theme switcher, no pink/purple alternatives, no generic Hub layout, no excessive gold glow, no walls of vague explanatory text. Gold is a precise accent; text and game states must remain highly readable.

The original product blueprint is here:
https://github.com/TheMedConfidant/Bablo-100l-hub/blob/bablo-chess-standalone-lab/docs/BABLO_CHESS_PRODUCT_BLUEPRINT.md

Treat that document as the product baseline and this handoff as the detailed acceptance brief.

## Required shell and navigation

Create a chess-only shell that feels like a separate application inside Bablo Hub:
- **Home** — personalized chess dashboard, primary play action, continue game/lesson, daily challenge preview, recent results and progress.
- **Play** — choose Dr ECG, online match, friend challenge, local practice and the different match formats.
- **Learn** — a structured chess academy with actual on-board instruction and practice.
- **Compete** — Daily Puzzle, puzzle streak/rush, challenge ladder, leaderboards and competition status.
- **Profile** — rating, results, performance charts, favorite openings, achievements and preferences.

Desktop: compact left navigation or carefully designed top navigation with a spacious main canvas. Mobile: concise top bar and fixed bottom navigation. The chessboard and the main action must remain prominent on phones. Keep Home focused; do not cram every feature into one dashboard.

## Dr ECG: one character, many meaningful modes

Dr ECG remains the fixed signature opponent; do not create shallow alternative bot identities. He should feel recognizable, witty, context-aware and consistent. His difficulty is chosen **before** the match, never changed with a personality/style slider while a game is in progress.

Use six pre-game strength tiers:
**Student → Intern → House Officer → Registrar → Consultant → Professor**.

The UI should communicate that these are actual strength presets, not cosmetic labels. Do not display invented Elo values as facts; label sample values as illustrative until a real engine has been calibrated.

Design a clear format chooser, grouped by player intent rather than a row of ten equally loud buttons:
1. Quick Match
2. Timed Match — Bullet, Blitz, Rapid, Classical, Unlimited/custom clock
3. Training Match — optional hints and take-backs, clearly unranked
4. Challenge Ladder — progress through increasingly difficult matches
5. Tactical Rounds — solve a position against a move limit/objective
6. Opening Lab — learn and play a selected opening line
7. Endgame Lab — focused king/pawn, rook and other endgames
8. Survival/Streak — consecutive challenges, tracked separately from rating
9. Daily Challenge — one daily position/match, with clear completion state
10. Custom Match — choose side, time, strength and training aids before the board opens

Every card and CTA must either navigate to a meaningful prototype flow or be clearly marked as a future/inactive feature. No fake buttons.

## Non-negotiable: Learn means learning ON THE BOARD

Do not build a Learn screen that only presents paragraphs such as “control the centre” and calls it a lesson.

Create a working guided-learning experience where the learner sees and interacts with a chessboard:
- A lesson catalogue grouped by beginner foundations, tactics, opening principles, check/checkmate, strategy and endgames.
- A lesson player with a real 8×8 board, correctly oriented pieces, coordinates, legal-move targets, last-move highlights, current turn, lesson progress and a visible objective.
- Step-by-step guided moves. The learner can play the expected move on the board; after a correct move, show a concise explanation tied to the actual position and advance. If the learner chooses a different legal move, explain why it misses the lesson objective without making the UI feel punitive.
- Back, Next, Restart and Hint controls with predictable state. Next must not silently skip an uncompleted interactive task.
- Show the move sequence and notation from the same board state; do not invent disconnected move labels.
- Include at least one complete playable sample lesson (for example, developing pieces and controlling the centre) and one tactical lesson (for example, a fork or pin). If a full chess-rules engine is unavailable in the artifact, be transparent and keep the sample's legal line valid; do not falsely imply full legality checking.
- For tactical lessons, let the learner choose/move a piece on the board, then explain the tactical idea in context. Do not reveal the solution before the learner attempts it.
- Include clear feedback: what changed on the board, why the move matters, and what the learner should notice next.
- Make the board usable on a phone; board squares must be large enough to tap. Avoid tiny side panels beside a cramped board.

The user specifically requires **in-board learning**, not vague words. Treat this as a core feature, not a future nice-to-have.

## Daily Puzzles must be a real flow

Design a complete daily-puzzle experience:
- Dedicated Daily Puzzle page reachable from Home and Compete.
- Date/day label, difficulty, puzzle objective, board position, hint ladder, move submission, success/failure feedback, solution replay and a short explanation of the tactic.
- Clear states: not attempted, in progress, solved, failed/retry available, completed for today.
- Daily completion streak and historical puzzle calendar/list; never pretend data is real if it is prototype data.
- A post-solve panel with “Replay solution”, “Try another puzzle” where appropriate, and “Back to Compete”.
- Use a valid, coherent example position and solution. Clearly identify sample/demo puzzle data until connected to a real puzzle source. No random board positions presented as verified puzzles.
- Show move quality/attempts only if tracked by the prototype. Don't invent performance claims.

Also design Puzzle Rush/Tactical Rounds as separate formats, not duplicate copies of the daily puzzle screen.

## Leaderboards and competition

Design the **Compete** area with:
- Overall leaderboard and useful filters/tabs such as friends, programme/campus community, weekly and all-time where data exists.
- Player rank, username, rating/score, wins and trend; highlight the signed-in player's row clearly without making the entire table gold.
- Loading, empty, error and offline/demo states.
- No duplicate user rows. Do not display invented real users, live rankings, or claims of connected data; seed obvious demo data and label it as such.
- A competition overview for Daily Puzzle, Challenge Ladder and future events. Only show live participation or event status when actually connected.
- Profile and leaderboard values should use a consistent rating/score model; explain separate puzzle streaks versus chess rating.

## Match board and match lifecycle

Build the full screen sequence:
**Home → Play → Match Setup → Match → Result**.

Match setup:
- Select Dr ECG strength, clock/time control, playing side and format-relevant training aids.
- Explain ranked/unranked status before starting.
- Once the game begins, remove strength/personality setup controls from the game screen.

Match:
- Board-first, no visual clutter, player/opponent cards and clocks, move list, captured-piece trays, last move/check indication, discreet chat/reactions and accessible game actions.
- Responsive: desktop can use board + side panel; mobile should prioritize a large board and place secondary content below or in a collapsible drawer.
- Include clear resign/draw/new-game confirmation behavior in the prototype.
- Keep the board stable as clocks or side panels update. No layout jumps.

Result:
- Clear win/draw/loss outcome, reason, moves played, rematch, return to Home and review key moments.
- Rating changes appear only in a clearly marked demo state until a real rating service exists.
- No fake engine review. Label illustrative analysis as sample.

## Design quality bar

- Cohesive typography, spacing, borders, radii, icons and interaction patterns.
- Sophisticated, restrained glass panels; adequate contrast and readable small text.
- Distinct visual hierarchy and one primary CTA per screen.
- Realistic empty, loading, error, completion and disabled states.
- Smooth but restrained transitions; respect reduced-motion preferences where supported.
- Accessible focus states, keyboard interaction for controls, semantic labels and touch-friendly targets.
- Responsive at narrow phone, tablet and wide laptop widths.
- No horizontal overflow, cramped chessboard, dead-end navigation, fake interactive controls, meaningless stat cards or placeholder “coming soon” copy as a substitute for the required flows.
- Make the product feel designed as a whole, not as separately styled pages.

## Artifact deliverables

1. One cohesive Artifact that lets the reviewer navigate all major screens and try the main flows.
2. A short **screen inventory** showing every screen implemented and its entry path.
3. A short **functionality ledger** separating:
   - genuinely interactive prototype behavior,
   - sample/demo data,
   - functionality that requires a real chess engine, backend, authentication or live data.
4. A short **known limitations** list. Be explicit; do not overclaim.
5. A short **design decisions** note for any major interpretation of this brief.

Prioritize the UI/UX and interaction flow first, but include the board interactions required above. Do not wire into production services or change the production Bablo Hub.

## Review process

ChatGPT will inspect the Artifact against this brief and the original blueprint, including:
- information architecture and visual consistency,
- on-board learning quality and state transitions,
- puzzle validity and solution feedback,
- board usability and mobile layout,
- leaderboard trustworthiness and data states,
- missing screens, dead controls, contradictory navigation and edge cases,
- whether each mode feels meaningfully different.

Expect a revision pass after inspection. **Do not simplify or omit the board-learning experience, daily puzzle, leaderboard, or result flow to finish faster.** Build the whole cohesive experience so we can critique the actual artifact, not argue about imagined screens.
