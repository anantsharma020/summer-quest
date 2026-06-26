-- ===========================================================================
-- Summer Quest — Supabase schema
-- ===========================================================================
-- Safe to run inside a Supabase project that already hosts another app:
-- everything here is namespaced with the `summerquest_` prefix, so it can't
-- collide with your existing tables/policies. Auth (auth.users) is shared at
-- the project level — that's how Supabase works (one user pool per project) —
-- but each app's DATA stays in its own prefixed tables, isolated by RLS.
--
-- Run this once in the Supabase SQL editor (Dashboard → SQL → New query).
-- ===========================================================================

-- One row per user holding that user's entire Summer Quest state as JSON
-- (profiles, quests, logs, programs, custom exercises, settings). Simple,
-- robust, and trivially future-proof — add more summerquest_* tables later if
-- you ever want to normalise/report on the data.
create table if not exists public.summerquest_user_state (
  user_id    uuid        primary key references auth.users (id) on delete cascade,
  state      jsonb       not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

comment on table public.summerquest_user_state is 'Summer Quest: full per-user app state (JSON blob), synced from the PWA.';

-- Row-level security: each user can only see and write their own row.
alter table public.summerquest_user_state enable row level security;

drop policy if exists "summerquest_state_select_own" on public.summerquest_user_state;
create policy "summerquest_state_select_own"
  on public.summerquest_user_state for select
  using (auth.uid() = user_id);

drop policy if exists "summerquest_state_insert_own" on public.summerquest_user_state;
create policy "summerquest_state_insert_own"
  on public.summerquest_user_state for insert
  with check (auth.uid() = user_id);

drop policy if exists "summerquest_state_update_own" on public.summerquest_user_state;
create policy "summerquest_state_update_own"
  on public.summerquest_user_state for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "summerquest_state_delete_own" on public.summerquest_user_state;
create policy "summerquest_state_delete_own"
  on public.summerquest_user_state for delete
  using (auth.uid() = user_id);
