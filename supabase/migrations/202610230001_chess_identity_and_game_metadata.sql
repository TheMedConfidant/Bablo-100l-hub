-- Additive-only migration for the chess redesign.
-- Review and apply only to a development database first; do not apply to production yet.
-- Existing device IDs, games, messages, ratings and accounts are deliberately untouched.

create table if not exists public.chess_players (
  player_id uuid primary key default gen_random_uuid(),
  account_unique_id text not null unique references public.hub_accounts(unique_id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.chess_players enable row level security;

-- No browser role receives direct access. The server API uses the service role
-- only after validating the existing Hub session and account.
revoke all on table public.chess_players from anon, authenticated;

alter table public.chess_games
  add column if not exists white_player_id uuid references public.chess_players(player_id),
  add column if not exists black_player_id uuid references public.chess_players(player_id),
  add column if not exists time_control text not null default '10+0',
  add column if not exists rated boolean not null default false;

alter table public.chess_games
  add constraint chess_games_time_control_check
  check (time_control in ('1+0','2+1','3+0','3+2','5+0','10+0','10+5','15+10','unlimited'))
  not valid;

-- Legacy rows remain nullable for player IDs and are not silently linked to accounts.
-- Constraint is NOT VALID to avoid rewriting or rejecting historic rows during rollout.
