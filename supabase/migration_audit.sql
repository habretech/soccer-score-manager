-- Audit Log Migration
-- Run this in the Supabase SQL Editor AFTER the initial schema.sql

-- Add audit columns to all tables
alter table leagues
  add column if not exists created_by text,
  add column if not exists updated_by text,
  add column if not exists updated_at timestamptz default now();

alter table teams
  add column if not exists created_by text,
  add column if not exists updated_by text,
  add column if not exists updated_at timestamptz default now();

alter table matches
  add column if not exists created_by text,
  add column if not exists updated_by text,
  add column if not exists updated_at timestamptz default now();

alter table players
  add column if not exists created_by text,
  add column if not exists updated_by text,
  add column if not exists updated_at timestamptz default now();

alter table goals
  add column if not exists created_by text;

-- Trigger function: auto-stamp updated_at on every row update
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Attach trigger to each table
drop trigger if exists trg_leagues_updated_at on leagues;
create trigger trg_leagues_updated_at
  before update on leagues
  for each row execute function set_updated_at();

drop trigger if exists trg_teams_updated_at on teams;
create trigger trg_teams_updated_at
  before update on teams
  for each row execute function set_updated_at();

drop trigger if exists trg_matches_updated_at on matches;
create trigger trg_matches_updated_at
  before update on matches
  for each row execute function set_updated_at();

drop trigger if exists trg_players_updated_at on players;
create trigger trg_players_updated_at
  before update on players
  for each row execute function set_updated_at();
