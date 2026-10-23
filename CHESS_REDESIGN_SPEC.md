# Bablo Chess Redesign — Approved Specification

Status: approved product direction; implementation has not begun on this branch.
Production baseline: `3e39848a41e7955baa9e1dcb835fa7a292be5c9b`.
Do not merge or deploy this branch until implementation and verification are complete.

## Product principle
Build a multi-page chess environment inside Bablo Hub with premium usability, a distinctive Bablo identity, legitimate chess logic, reliable multiplayer, and no regressions to the study hub. Avoid copying another platform's exact interface.

## Navigation and pages
Primary navigation: Home, Play, Learn, Compete, Profile.
Supporting pages: Live Game, Game Results, Game History, Analysis Board, Puzzle Rush, Opening Explorer, Chess Settings, Friend Management.
Home is personalised and user-controlled. On mobile, game layouts are board-first; on wide screens, use a split layout.

## Visual direction
Follow the user's selected Bablo theme. Gold receives a deep futuristic treatment with layered glass, restrained holographic highlights, subtle glow and smooth purposeful animation. Keep the board and pieces highly legible. Glass, Pink, Purple and Classic remain distinct. Users can choose board and piece styles. Standard sounds; no elaborate sound-settings panel. No board rotation during online games.

## Play modes
- Online automatic matchmaking; find any available opponent rather than requiring strict rating matching.
- Quick Play and a settings-first matchmaking flow.
- Direct friend challenges through username search, friend list and shareable links.
- Dr ECG single-player games.
- Casual and rated games, with rating status clearly disclosed before play.
- Time controls: Bullet 1+0 and 2+1; Blitz 3+0, 3+2 and 5+0; Rapid 10+0, 10+5 and 15+10; Unlimited; Custom. Classical is out of initial scope.

## Online game requirements
Show clocks, move history, captured pieces, legal-move indicators, last-move highlights, resign, rematch, premoves, chat and temporary emoji reactions. No draw offers or spectator mode in the initial scope. Invitations must show sender, mode, time control and rated/casual status; support accept, decline, cancellation and expiry. Both players must enter the same authoritative game record. Reconnection grace period: 60 seconds, with automatic reconnect and visible connection status. Duplicate moves/results/rating updates must be prevented.

## Dr ECG
One recognisable opponent identity; difficulty controls both strength and personality. Difficulty can be set per game or as a default, with an optional recommendation based on previous chess performance. Five experience targets: Beginner, Easy, Intermediate, Advanced and Expert. Text-only, contextual commentary with short popups (about two seconds maximum), balanced frequency and playful Nigerian/Bowen/student-life humour. Use only profile details the player supplied; never imply access to private information. Commentary should be based on actual moves and reliable game events. Remember chess performance and notable match moments, with a visible option to reset saved chess-learning history.
Post-game review includes result/reason, rating change when applicable, move count/duration, rematch, and reliable engine analysis of key mistakes and stronger alternatives. Never fabricate engine evaluations.

## Puzzles and learning
Puzzle features: one shared daily puzzle; unlimited puzzles by difficulty; tactical categories (forks, pins, skewers, discovered attacks, mates); progressive difficulty; streaks and records; timed Puzzle Rush; solution explanations; weakness tracking and recommendations. Puzzle positions and solutions must be validated.
Learning features: fundamentals, tactics, strategy, opening explorer, checkmates, endgames, interactive lessons, training against Dr ECG, position/game analysis, saved/resumable progress, and an adaptive recommended path. Combine text, diagrams and interactive board practice. Automatically recommend practice for repeated weaknesses, while allowing users to choose their path.

## Competition, profile and privacy
Separate Bullet, Blitz, Rapid and Puzzle ratings; Unlimited casual by default. Provisional ratings for new players. Lifetime and seasonal records, global/mode/programme/university leaderboards, champions, titles, badges and cosmetic profile rewards. Profile may show ratings, records, recent games, achievements, openings, statistics and learning progress, all subject to privacy controls. Online visibility, friend requests and challenges are configurable. Reporting supports inappropriate chat and suspected cheating with a review process. Players can export game records and learning statistics.

## Accounts and persistence
Guest access for Dr ECG and selected puzzles. Accounts required for persistent competitive ratings, friend challenges, leaderboards and cross-device saved progress. Restore valid sessions across normal browser restarts without storing passwords in plain text or bypassing authentication. Preserve the existing Bablo Hub account/session system unless audit proves a change is necessary. Provide clear expired-session handling and sign-out.

## Engineering and quality gates
Audit and preserve existing implementation before replacement. Build in controlled stages. Use a proven engine such as Stockfish after verifying integration, licensing and mobile performance. Online game state and rating changes must be authoritative and idempotent; use server-side validation rather than trusting the browser. Inspect existing Supabase schema/RLS before planning migrations. Do not alter production database permissions casually.
Required verification: static checks; route and responsive checks; two-account/two-device challenge test; legal-move and game-state consistency; reconnect and duplicate-request tests; rated/casual and rating-idempotency tests; engine legality and analysis reliability; puzzle validation; session restoration; regression checks for the rest of Bablo Hub; production deployment verification. Report incomplete tests honestly.

## Delivery order
1. Audit and preservation.
2. Navigation, visual system and responsive page foundation.
3. Core game lifecycle and live-game UI.
4. Online challenges, matchmaking and synchronisation.
5. Dr ECG and engine analysis.
6. Puzzles and learning.
7. Ratings, leaderboards and achievements.
8. Session/privacy hardening, accessibility, performance and regression verification.

This file records approved requirements; it is not evidence that any feature has been implemented or tested.
