# Bablo Hub — Phase A review build

This ZIP contains the current app files plus a small, non-deploying GitHub Actions static-check workflow.

## Changes in this review build
- Calendar bottom navigation now marks Calendar as the active tab instead of Home.
- Calendar event migration preserves an existing user's saved events when the internal schema version changes.
- Calendar comparisons use the device's local date rather than UTC date slicing.
- Service-worker cache version is bumped so clients fetch the updated app shell when this build is eventually released.
- Added `.github/workflows/bablo-checks.yml` and `scripts/check-app.mjs` for static checks on pushes/PRs.

## Safety status
- This ZIP is not deployed.
- Supabase/database permissions were not changed.
- The GitHub integration refused branch creation (403: Resource not accessible by integration), so no remote branch or pull request was created.
- The workflow has not run on GitHub yet. Run `node scripts/check-app.mjs` locally or after adding these files to a branch.
- Static checks do not prove live chess matchmaking, private invitations, notifications while the app is closed, or database access control work end-to-end.
