-- AImusik schema: profiles, tracks, likes, reports + RLS.
-- Run in the Supabase SQL editor after creating the project.

create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null,
  avatar_url text,
  created_at timestamptz not null default now()
);

create type public.track_status as enum ('queued', 'generating', 'ready', 'failed');

create table if not exists public.tracks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  prompt text not null,
  genre text,
  duration_ms integer not null default 30000,
  instrumental boolean not null default false,
  status public.track_status not null default 'queued',
  error_message text,
  audio_path text,
  cover_path text,
  is_public boolean not null default true,
  like_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint duration_ms_range check (duration_ms >= 3000 and duration_ms <= 180000)
);

create table if not exists public.likes (
  user_id uuid not null references public.profiles (id) on delete cascade,
  track_id uuid not null references public.tracks (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, track_id)
);

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  track_id uuid not null references public.tracks (id) on delete cascade,
  reason text not null,
  created_at timestamptz not null default now()
);

create index if not exists tracks_status_public_created_idx
  on public.tracks (status, is_public, created_at desc);

create index if not exists tracks_user_created_idx
  on public.tracks (user_id, created_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists tracks_set_updated_at on public.tracks;
create trigger tracks_set_updated_at
before update on public.tracks
for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data ->> 'display_name',
      split_part(new.email, '@', 1),
      'listener'
    )
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

create or replace function public.refresh_like_count()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'INSERT' then
    update public.tracks set like_count = like_count + 1 where id = new.track_id;
    return new;
  elsif tg_op = 'DELETE' then
    update public.tracks set like_count = greatest(like_count - 1, 0) where id = old.track_id;
    return old;
  end if;
  return null;
end;
$$;

drop trigger if exists likes_refresh_count on public.likes;
create trigger likes_refresh_count
after insert or delete on public.likes
for each row execute function public.refresh_like_count();

alter table public.profiles enable row level security;
alter table public.tracks enable row level security;
alter table public.likes enable row level security;
alter table public.reports enable row level security;

drop policy if exists "profiles are readable" on public.profiles;
create policy "profiles are readable"
on public.profiles for select
using (true);

drop policy if exists "users update own profile" on public.profiles;
create policy "users update own profile"
on public.profiles for update
using (auth.uid() = id)
with check (auth.uid() = id);

drop policy if exists "public ready tracks readable" on public.tracks;
create policy "public ready tracks readable"
on public.tracks for select
using (
  (is_public = true and status = 'ready')
  or user_id = auth.uid()
);

drop policy if exists "users insert own tracks" on public.tracks;
create policy "users insert own tracks"
on public.tracks for insert
with check (auth.uid() = user_id);

drop policy if exists "users update own tracks" on public.tracks;
create policy "users update own tracks"
on public.tracks for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "users delete own tracks" on public.tracks;
create policy "users delete own tracks"
on public.tracks for delete
using (auth.uid() = user_id);

drop policy if exists "likes readable" on public.likes;
create policy "likes readable"
on public.likes for select
using (true);

drop policy if exists "users insert own likes" on public.likes;
create policy "users insert own likes"
on public.likes for insert
with check (auth.uid() = user_id);

drop policy if exists "users delete own likes" on public.likes;
create policy "users delete own likes"
on public.likes for delete
using (auth.uid() = user_id);

drop policy if exists "users insert own reports" on public.reports;
create policy "users insert own reports"
on public.reports for insert
with check (auth.uid() = user_id);

drop policy if exists "users read own reports" on public.reports;
create policy "users read own reports"
on public.reports for select
using (auth.uid() = user_id);
