-- Bablo Hub security hardening (2026-11-09)
-- The affected tables are accessed through owner-checked SECURITY DEFINER RPCs
-- and service-side Edge Functions. RLS remains enabled; direct client grants
-- are removed as defense in depth.
begin;

revoke all on table public.admin_config,
  public.hub_failed_logins,
  public.hub_sessions,
  public.hub_accounts
from anon, authenticated;

-- Admin analytics is exposed only through hub_admin_analytics, which checks
-- both the active admin session and the admin passcode before calling it.
revoke execute on function public.analytics_dashboard(text, integer)
from public, anon, authenticated;

-- Chess mutations must pass through hub-chess-action, which validates the
-- Bablo session, game membership, legal move, turn, and optimistic concurrency.
-- Remove the legacy unrestricted direct UPDATE policy that allowed any
-- anonymous client to alter any game row.
drop policy if exists "update chess games" on public.chess_games;

commit;
