-- Additive-only migration for the chess redesign.
-- Review and apply only to an isolated development database first; do not apply to production yet.
-- Existing device IDs, games, messages, ratings and accounts are deliberately untouched.

create table if not exists public.chess_players (
  player_id uuid primary key default gen_random_uuid(),
  account_unique_id text not null unique references public.hub_accounts(unique_id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.chess_players enable row level security;
revoke all on table public.chess_players from anon, authenticated;

alter table public.chess_games
  add column if not exists white_player_id uuid references public.chess_players(player_id),
  add column if not exists black_player_id uuid references public.chess_players(player_id),
  add column if not exists time_control text not null default '10+0',
  -- Existing legacy games should preserve their previous rating behavior.
  -- New API-created games always explicitly set rated=true/false.
  add column if not exists rated boolean not null default true;


-- The server-authoritative API records canonical chess results, while legacy games use w/b/draw.
-- Permit both formats so checkmate results can be stored without breaking older clients.
alter table public.chess_games drop constraint if exists chess_games_result_check;
alter table public.chess_games
  add constraint chess_games_result_check
  check (result in ('w','b','draw','1-0','0-1','1/2-1/2')) not valid;
alter table public.chess_games validate constraint chess_games_result_check;

alter table public.chess_games
  add constraint chess_games_time_control_check
  check (time_control in ('1+0','2+1','3+0','3+2','5+0','10+0','10+5','15+10','unlimited'))
  not valid;

-- Keep legacy games compatible, but apply ratings only to explicitly rated new games.
-- Supports legacy result values (w/b/draw) and canonical chess results (1-0/0-1/1/2-1/2).
create or replace function public.apply_chess_elo_rating()
returns trigger
language plpgsql
security definer
set search_path = public
as $function$
declare
  white_rating integer;
  black_rating integer;
  white_score numeric;
  expected_white numeric;
  white_new integer;
  black_new integer;
begin
  if new.status <> 'finished'
     or old.status = 'finished'
     or new.result is null
     or new.white_dev is null
     or new.black_dev is null
     or new.white_dev = new.black_dev
     or new.rating_applied then
    return new;
  end if;

  -- For redesigned games, unrated matches never touch the rating table.
  -- Historic rows receive rated=true by the additive column default to preserve legacy behavior.
  if not coalesce(new.rated, true) then
    return new;
  end if;

  insert into public.chess_ratings (dev, nick, rating)
  values (new.white_dev, coalesce(nullif(new.white_nick, ''), 'Player'), 1000)
  on conflict (dev) do nothing;

  insert into public.chess_ratings (dev, nick, rating)
  values (new.black_dev, coalesce(nullif(new.black_nick, ''), 'Player'), 1000)
  on conflict (dev) do nothing;

  select rating into white_rating
  from public.chess_ratings where dev = new.white_dev for update;

  select rating into black_rating
  from public.chess_ratings where dev = new.black_dev for update;

  white_score := case new.result
    when 'w' then 1.0
    when '1-0' then 1.0
    when 'b' then 0.0
    when '0-1' then 0.0
    when 'draw' then 0.5
    when '1/2-1/2' then 0.5
    else null
  end;

  if white_score is null then
    return new;
  end if;

  expected_white := 1.0 / (1.0 + power(10.0, (black_rating - white_rating)::numeric / 400.0));
  white_new := greatest(400, least(3000, round(white_rating + 32.0 * (white_score - expected_white))::integer));
  black_new := greatest(400, least(3000, round(black_rating + 32.0 * ((1.0 - white_score) - (1.0 - expected_white)))::integer));

  update public.chess_ratings
  set rating = white_new,
      nick = coalesce(nullif(new.white_nick, ''), nick),
      wins = wins + case when white_score = 1.0 then 1 else 0 end,
      draws = draws + case when white_score = 0.5 then 1 else 0 end,
      losses = losses + case when white_score = 0.0 then 1 else 0 end,
      updated_at = now()
  where dev = new.white_dev;

  update public.chess_ratings
  set rating = black_new,
      nick = coalesce(nullif(new.black_nick, ''), nick),
      wins = wins + case when white_score = 0.0 then 1 else 0 end,
      draws = draws + case when white_score = 0.5 then 1 else 0 end,
      losses = losses + case when white_score = 1.0 then 1 else 0 end,
      updated_at = now()
  where dev = new.black_dev;

  update public.chess_games
  set rating_applied = true
  where id = new.id and rating_applied = false;

  return new;
end;
$function$;

-- Legacy rows remain nullable for player IDs and are not silently linked to accounts.
