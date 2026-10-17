-- Sonari database: plain PostgreSQL 13+ (Timeweb Cloud managed Postgres or any other).
-- Every statement is idempotent: the API runs this file on every start, so a fresh
-- database needs no manual setup and an existing one is left as it is.

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  display_name text not null,
  avatar_url text,
  -- E.164, e.g. +79001234567; null for Telegram-only accounts.
  phone text unique,
  telegram_id bigint unique,
  telegram_username text,
  created_at timestamptz not null default now()
);

-- Opaque bearer tokens. Only a SHA-256 of the token is stored, so a leaked table
-- cannot be replayed as sessions.
create table if not exists sessions (
  token_hash text primary key,
  user_id uuid not null references users (id) on delete cascade,
  created_at timestamptz not null default now(),
  last_used_at timestamptz not null default now(),
  expires_at timestamptz not null
);

create index if not exists sessions_user_idx on sessions (user_id);

-- One pending SMS code per phone number.
create table if not exists phone_codes (
  phone text primary key,
  code_hash text not null,
  attempts integer not null default 0,
  sent_at timestamptz not null default now(),
  expires_at timestamptz not null
);

-- Track ids come from the catalog (catalog/tracks.json), so there is no foreign key to a
-- tracks table: likes keep working whichever way the catalog is stored.
create table if not exists likes (
  user_id uuid not null references users (id) on delete cascade,
  track_id text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, track_id)
);

create index if not exists likes_track_idx on likes (track_id);

-- Reports outlive the account that sent them, so moderation history is not lost
-- when a listener deletes their account.
create table if not exists reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users (id) on delete set null,
  track_id text not null,
  reason text not null,
  created_at timestamptz not null default now()
);

create index if not exists reports_track_idx on reports (track_id, created_at desc);
