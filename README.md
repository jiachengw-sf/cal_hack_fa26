# PandaHacks

A miniature hackathon application portal: applicants sign up and apply as a **Hacker** or a
**Judge**, and organizers review, grade, and track every application from one dashboard.
Styled as a Minecraft panda/bamboo-jungle pixel-art theme.

Built for the Cal Hacks tech team take-home assessment.

## Stack

- **Next.js 16** (App Router) + **TypeScript**
- **Tailwind CSS 4**
- **Supabase** (Postgres + Auth + Storage, with Row Level Security)
- Deployed on **Vercel**

## Features

- Email/password auth via Supabase, with a `profiles` table (`applicant` | `organizer` role).
  The header always shows who's signed in ("Signed in as ...", with an Organizer tag when
  applicable) so it's obvious which account a given session is on.
- Two application tracks (Hacker, Judge), each with its own form, backed by one `applications`
  table (`track` + `form_data` jsonb). Applicants can save a draft and come back later; once
  submitted, the row locks (enforced by RLS, not just the UI).
- **Resume upload** (Hacker track, required): the applicant's choice of pasting a link or
  uploading a PDF/Word file directly, validated client-side (type, 5MB limit) and stored in a
  private Supabase Storage bucket scoped by user. Organizers view it via a short-lived signed
  URL, whichever form the applicant chose.
- `/status` — applicant-facing page showing the live status of every application they've started.
- `/organizer` — searchable, filterable table of every submitted application.
- `/organizer/applications/[id]` — full application detail + a grading panel (score, notes,
  accept/waitlist/reject).
- **`/organizer/analytics`** (the added feature): a live read on application volume, the
  status funnel (submitted → accepted/waitlisted/rejected), and grading progress across both
  tracks. Built for the organizer's actual bottleneck at scale — knowing how much grading is
  left and how it's trending — without needing to page through every row.
- **Applications open/closed switch**: any organizer can close (or reopen) applications sitewide
  with one click from the dashboard. It's a real, database-backed global setting — not a
  per-browser flag — and it's enforced server-side: the homepage badge and `/apply` picker
  reflect it live, and the submit action itself rejects new submissions while closed (drafts
  are preserved either way).
- Row Level Security enforced in Postgres: applicants can only ever read/write their own rows
  (and only while still a draft); organizers can read/update every row; a database trigger
  blocks any non-organizer from granting themselves the organizer role. This holds at the
  database layer even if the app's UI/route checks were bypassed entirely.

## Local setup

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Create a Supabase project** at [supabase.com](https://supabase.com) (free tier is enough).

3. **Run the schema migration**: open your project's SQL editor and run the contents of
   [`supabase/migration.sql`](./supabase/migration.sql). This creates `profiles`, `applications`,
   and `settings`, the RLS policies and triggers, the resume storage bucket, and the trigger
   that creates a profile row on signup.

4. **Copy env vars**: duplicate `.env.local.example` to `.env.local` and fill in
   `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` from Project Settings → API.

5. **Run the dev server**

   ```bash
   npm run dev
   ```

6. **Create an organizer account**: sign up normally through the app, then in the Supabase SQL
   editor run:

   ```sql
   update public.profiles set role = 'organizer' where email = 'you@example.com';
   ```

   That account can now see `/organizer`. Every other account defaults to `applicant`.

## Deploying

1. Push this repo to GitHub.
2. Create a new Vercel project from that repo.
3. Add the same two environment variables from `.env.local` to the Vercel project settings.
4. Deploy. Because Supabase Auth cookies are domain-based, no extra config is needed for
   production vs. local.

## Project structure

```
src/
  app/
    page.tsx                     landing page (auth-aware CTA, applications-open badge)
    login/, signup/               auth pages + server actions
    apply/                        track picker, hacker/judge forms, resume upload
    status/                       applicant status page
    organizer/                    dashboard, analytics, application detail/grading
  components/
    ui.tsx                        shared primitives (Button, Card, Field, Input/Select/Textarea)
    nav.tsx                       header (auth-aware links, "signed in as" display)
    status-badge.tsx              per-status colored chip
    pixel-icons.tsx                hand-built bamboo/panda icons (no images/emoji)
    applications-toggle.tsx       organizer's open/close-applications button
  lib/
    actions/                      server actions (auth, application CRUD/grading, settings)
    supabase/                     browser/server/middleware Supabase clients
    database.types.ts             hand-written Supabase table types
  proxy.ts                        session refresh + route protection (auth, organizer-only)
supabase/migration.sql            full schema + RLS policies + triggers + storage bucket
```

Note: Next.js 16 renamed the `middleware.ts` convention to `proxy.ts` — same feature
(runs before every request), new name. It must live at `src/proxy.ts` in this project since
it uses `--src-dir`; a project-root `middleware.ts`/`proxy.ts` is silently ignored when an
`src/` layout is in use.

## Design notes / why these choices

- **One `applications` table instead of one per track**: the two tracks share almost everything
  (status, review fields, submission flow) and differ only in their form fields, which live
  naturally in `form_data jsonb`. This keeps grading, listing, and filtering logic uniform across
  tracks instead of duplicating it.
- **RLS instead of only app-level checks**: access control lives in Postgres policies, so it's
  enforced no matter which client hits the database — not just requests that go through the
  Next.js server. Caught a real bug this way: the original "update own profile" policy let any
  applicant set their own `role` to `organizer` with a single authenticated request. Fixed with
  a database trigger that only allows a role change when the person making it is already an
  organizer, independent of which policy permitted the underlying UPDATE.
- **The applications-open switch is a database row, not an env var or in-memory flag**: it needs
  to be flippable at runtime by an organizer and visible identically to every visitor, so it has
  to live somewhere all of them read from — the database, gated by the same RLS pattern as
  everything else (anyone can read it, only organizers can write it).

## Demo Video
<https://youtu.be/Ww9PGOI1Gy4>