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

-- A plain subquery on profiles inside a profiles policy would recurse into
-- itself. SECURITY DEFINER runs as the function's owner (who created the
-- table and so bypasses its RLS), breaking the recursion.
create or replace function public.is_organizer()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and role = 'organizer'
  );
$$;

create policy "profiles: read own" on public.profiles
  for select using (auth.uid() = id);

create policy "profiles: organizers read all" on public.profiles
  for select using (public.is_organizer());

create policy "profiles: update own" on public.profiles
  for update using (auth.uid() = id);

-- The policy above lets a user update any column on their own row,
-- including role - which would let any applicant grant themselves
-- organizer access with a single authenticated request. Block that at
-- the trigger level (independent of which policy allowed the UPDATE):
-- a role change is only allowed when the person making it is already
-- an organizer.
create or replace function public.prevent_role_self_escalation()
returns trigger
language plpgsql
as $$
begin
  if new.role is distinct from old.role and not public.is_organizer() then
    raise exception 'Only organizers can change a profile''s role.';
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_prevent_role_self_escalation on public.profiles;
create trigger profiles_prevent_role_self_escalation
  before update on public.profiles
  for each row execute procedure public.prevent_role_self_escalation();

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
  for select using (public.is_organizer());

create policy "applications: organizers update all" on public.applications
  for update using (public.is_organizer());

-- ---------------------------------------------------------------------------
-- site settings (singleton row)
-- ---------------------------------------------------------------------------
-- "id integer primary key check (id = 1)" enforces there is ever only one
-- row - a simple way to model global, site-wide switches.
create table if not exists public.settings (
  id integer primary key default 1 check (id = 1),
  applications_open boolean not null default true,
  updated_by uuid references public.profiles (id),
  updated_at timestamptz not null default now()
);

insert into public.settings (id) values (1) on conflict (id) do nothing;

alter table public.settings enable row level security;

-- Readable by anyone (including signed-out visitors) so the homepage can
-- show the current state; only organizers can flip it.
create policy "settings: anyone can read" on public.settings
  for select using (true);

create policy "settings: organizers can update" on public.settings
  for update using (public.is_organizer());

drop trigger if exists settings_set_updated_at on public.settings;
create trigger settings_set_updated_at
  before update on public.settings
  for each row execute procedure public.set_updated_at();

-- ---------------------------------------------------------------------------
-- resume uploads (Supabase Storage)
-- ---------------------------------------------------------------------------
-- Private bucket: files are only reachable via a signed URL generated
-- server-side for the owner or an organizer, never a public URL.
insert into storage.buckets (id, name, public)
values ('resumes', 'resumes', false)
on conflict (id) do nothing;

-- Uploaded paths are namespaced "<user_id>/<filename>" so ownership can be
-- checked from the path alone via storage.foldername().
create policy "resumes: applicants upload own" on storage.objects
  for insert with check (
    bucket_id = 'resumes' and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "resumes: applicants replace own" on storage.objects
  for update using (
    bucket_id = 'resumes' and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "resumes: read own or organizer" on storage.objects
  for select using (
    bucket_id = 'resumes'
    and ((storage.foldername(name))[1] = auth.uid()::text or public.is_organizer())
  );

-- ---------------------------------------------------------------------------
-- After running this file: sign up your own organizer account through the
-- app, then run the following once (with your email) to grant it access to
-- the /organizer dashboard:
--
--   update public.profiles set role = 'organizer' where email = 'you@example.com';
-- ---------------------------------------------------------------------------
