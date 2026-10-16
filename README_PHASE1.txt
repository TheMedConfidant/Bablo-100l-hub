Bablo Hub — Calendar & navigation repair

Bundle is based on the latest available index.html source.

Changes in this pass:
- Added Calendar to the bottom navigation, including active-tab state and calendar icon.
- Added defensive handling for malformed saved calendar event data and date validation.
- Improved route errors to show a useful error message.
- Fixed online chess turn text and refreshes the actual opponent name from the live game record.
- Preserved the app HTML, service worker, manifest, and Vercel configuration.

Upload the contents of this ZIP to the existing project root. This does not automatically change the live deployment.

Still outstanding: synchronized online chess clocks and server-backed emoji reactions. They need coordinated online-game data support and are not claimed as complete here.

Note: original binary icon assets were not available in the workspace, so this bundle includes replacement Bablo-letter icons for installability.
