-- HackPortal schema: profiles, applications, RLS policies, and the
-- auth.users -> profiles bootstrap trigger.
-- Run this once in the Supabase SQL editor for a fresh project.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  full_name text,
  role text not null default 'applicant' check (role in ('applicant', 'organizer')),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles: read own" on public.profiles
  for select using (auth.uid() = id);

create policy "profiles: organizers read all" on public.profiles
  for select using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'organizer')
  );

create policy "profiles: update own" on public.profiles
  for update using (auth.uid() = id);

-- Auto-create a profile row whenever a new auth user signs up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data ->> 'full_name');
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ---------------------------------------------------------------------------
-- applications
-- ---------------------------------------------------------------------------
create table if not exists public.applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  track text not null check (track in ('hacker', 'judge')),
  status text not null default 'draft'
    check (status in ('draft', 'submitted', 'accepted', 'waitlisted', 'rejected')),
  form_data jsonb not null default '{}'::jsonb,
  ai_score numeric,
  ai_summary text,
  organizer_score numeric,
  organizer_notes text,
  reviewed_by uuid references public.profiles (id),
  reviewed_at timestamptz,
  submitted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, track)
);

alter table public.applications enable row level security;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists applications_set_updated_at on public.applications;
create trigger applications_set_updated_at
  before update on public.applications
  for each row execute procedure public.set_updated_at();

-- Applicants can see and create their own applications.
create policy "applications: read own" on public.applications
  for select using (auth.uid() = user_id);

create policy "applications: insert own" on public.applications
  for insert with check (auth.uid() = user_id);

-- Applicants may only edit their own application while it's still a draft.
create policy "applications: update own draft" on public.applications
  for update
  using (auth.uid() = user_id and status = 'draft')
  with check (auth.uid() = user_id);

-- Organizers can read and update every application (grading).
create policy "applications: organizers read all" on public.applications
  for select using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'organizer')
  );

create policy "applications: organizers update all" on public.applications
  for update using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'organizer')
  );

-- ---------------------------------------------------------------------------
-- After running this file: sign up your own organizer account through the
-- app, then run the following once (with your email) to grant it access to
-- the /organizer dashboard:
--
--   update public.profiles set role = 'organizer' where email = 'you@example.com';
-- ---------------------------------------------------------------------------
