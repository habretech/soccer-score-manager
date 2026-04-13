-- Soccer Score Manager — Supabase PostgreSQL Schema
-- Run this in the Supabase SQL Editor (supabase.com → your project → SQL Editor)

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Trigger function: auto-stamp updated_at on every row update
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Leagues
create table if not exists leagues (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  season text not null,
  created_by text,
  updated_by text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create trigger trg_leagues_updated_at before update on leagues
  for each row execute function set_updated_at();

-- Teams
create table if not exists teams (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  league_id uuid references leagues(id) on delete cascade,
  created_by text,
  updated_by text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create trigger trg_teams_updated_at before update on teams
  for each row execute function set_updated_at();

-- Matches
create table if not exists matches (
  id uuid primary key default uuid_generate_v4(),
  league_id uuid references leagues(id) on delete cascade,
  home_team_id uuid references teams(id) on delete cascade,
  away_team_id uuid references teams(id) on delete cascade,
  home_score integer not null default 0,
  away_score integer not null default 0,
  status text not null default 'scheduled' check (status in ('scheduled', 'in_progress', 'finished')),
  match_date timestamptz not null,
  created_by text,
  updated_by text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create trigger trg_matches_updated_at before update on matches
  for each row execute function set_updated_at();

-- Players
create table if not exists players (
  id uuid primary key default uuid_generate_v4(),
  team_id uuid references teams(id) on delete cascade,
  name text not null,
  position text,
  created_by text,
  updated_by text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create trigger trg_players_updated_at before update on players
  for each row execute function set_updated_at();

-- Goals
create table if not exists goals (
  id uuid primary key default uuid_generate_v4(),
  match_id uuid references matches(id) on delete cascade,
  player_id uuid references players(id) on delete set null,
  team_id uuid references teams(id) on delete cascade,
  minute integer not null check (minute >= 1 and minute <= 120),
  created_by text,
  created_at timestamptz default now()
);

-- Row Level Security
alter table leagues enable row level security;
alter table teams enable row level security;
alter table matches enable row level security;
alter table players enable row level security;
alter table goals enable row level security;

-- Policies: allow full access (Express backend uses the service_role key)
create policy "Allow all leagues" on leagues for all using (true) with check (true);
create policy "Allow all teams" on teams for all using (true) with check (true);
create policy "Allow all matches" on matches for all using (true) with check (true);
create policy "Allow all players" on players for all using (true) with check (true);
create policy "Allow all goals" on goals for all using (true) with check (true);
