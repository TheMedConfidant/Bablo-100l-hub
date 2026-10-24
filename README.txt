BUI-LIB 101 — GST103 STUDY HUB
================================

Included:
- gst103-study-hub.html: standalone, mobile-friendly study hub with the existing
  module notes, flashcards, and MCQ quiz activities.

HOW TO ADD IT TO THE BABLO HUB REPOSITORY
1. Upload gst103-study-hub.html to the repository root (the same folder as index.html).
2. In the BUI-LIB 101 course page, add a button/link to:
   /gst103-study-hub.html
3. Commit the change. If the repository is connected to Vercel, the deployment
   should update automatically.

Important:
- This package does not replace index.html or change any existing app data.
- Keep the existing filename/path exact so the link resolves.


BABLO CHESS — GAME ANALYSIS PREVIEW
====================================

Included:
- chess-analysis.html: standalone mobile-friendly PGN review screen.
- Paste or load a PGN, replay moves, jump to a move, inspect captures/checks/checkmate,
  track material balance, and copy or export the PGN.
- Keyboard navigation: left/right arrows step through the move list when focus is not in a text field.

Preview route when this branch is served by the project's preview host:
  /chess-analysis.html

Important:
- This is a preview-only addition on preview/gold-heartbeat-cup-vote.
- It does not replace index.html and has not been merged into main or production.
- Material and move notes are heuristics; Stockfish-powered evaluation and blunder
  detection are not implemented in this phase.
