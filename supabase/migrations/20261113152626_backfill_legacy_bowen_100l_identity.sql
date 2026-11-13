-- Legacy accounts were created while Bablo Hub served Bowen University 100L only.
-- Verified live inventory: all 368 accounts with a null institution were created
-- between 16 Oct and 12 Nov 2026 and are 100L. Backfill only those legacy rows so
-- the new institution/level notification filter does not hide valid Bowen notices.
update public.hub_accounts
set institution = 'Bowen University',
    updated_at = now()
where institution is null
  and academic_level = '100L'
  and created_at < timestamptz '2026-11-13 00:00:00+00';
