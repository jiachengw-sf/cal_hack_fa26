# HackPortal

A miniature hackathon application portal: applicants sign up and apply as a **Hacker** or a
**Judge**, and organizers review, AI-triage, and grade every application from one dashboard.

Built for the Cal Hacks tech team take-home assessment.

## Stack

- **Next.js 16** (App Router) + **TypeScript**
- **Tailwind CSS 4**
- **Supabase** (Postgres + Auth, with Row Level Security)
- **Anthropic Claude API** for AI-assisted application triage
- Deployed on **Vercel**

## Features

- Email/password auth via Supabase, with a `profiles` table (`applicant` | `organizer` role).
- Two application tracks (Hacker, Judge), each with its own form, backed by one `applications`
  table (`track` + `form_data` jsonb). Applicants can save a draft and come back later; once
  submitted, the row locks (enforced by RLS, not just the UI).
- `/status` — applicant-facing page showing the live status of every application they've started.
- `/organizer` — searchable, filterable table of every submitted application.
- `/organizer/applications/[id]` — full application detail + a grading panel (score, notes,
  accept/waitlist/reject).
- **AI-assisted review**: on submission, the application is sent to Claude to generate a short
  summary and a 1–10 fit-score suggestion. This is shown *only* to organizers, as a starting
  point next to their own manual grade — it never makes the decision and is never shown to the
  applicant.
- Row Level Security enforced in Postgres: applicants can only ever read/write their own rows
  (and only while still a draft); organizers can read/update every row. This is enforced at the
  database layer, so it holds even if the app's UI/route checks were bypassed.

## Local setup

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Create a Supabase project** at [supabase.com](https://supabase.com) (free tier is enough).

3. **Run the schema migration**: open your project's SQL editor and run the contents of
   [`supabase/migration.sql`](./supabase/migration.sql). This creates `profiles` and
   `applications`, the RLS policies, and the trigger that creates a profile row on signup.

4. **Copy env vars**: duplicate `.env.local.example` to `.env.local` and fill in:
   - `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` — from Project Settings → API.
   - `ANTHROPIC_API_KEY` — from [console.anthropic.com](https://console.anthropic.com/settings/keys).
     The app works fine without this key; AI summaries are just skipped.

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
3. Add the same three environment variables from `.env.local` to the Vercel project settings.
4. Deploy. Because Supabase Auth cookies are domain-based, no extra config is needed for
   production vs. local.

## Project structure

```
src/
  app/
    page.tsx                     landing page
    login/, signup/               auth pages + server actions
    apply/                        track picker, hacker/judge forms
    status/                       applicant status page
    organizer/                    dashboard + application detail/grading
  components/                     shared UI primitives (Button, Card, Field, StatusBadge, Nav)
  lib/
    actions/                      server actions (auth, application CRUD/grading)
    supabase/                     browser/server/middleware Supabase clients
    ai-review.ts                  Claude API call for AI-assisted triage
    database.types.ts             hand-written Supabase table types
supabase/migration.sql            full schema + RLS policies + triggers
middleware.ts                     session refresh + route protection (auth, organizer-only)
```

## Design notes / why these choices

- **One `applications` table instead of one per track**: the two tracks share almost everything
  (status, review fields, submission flow) and differ only in their form fields, which live
  naturally in `form_data jsonb`. This keeps grading, listing, and filtering logic uniform across
  tracks instead of duplicating it.
- **RLS instead of only app-level checks**: access control lives in Postgres policies, so it's
  enforced no matter which client hits the database — not just requests that go through the
  Next.js server.
- **AI triage is assistive, not decisive**: organizers always see and can override the AI's
  score/summary; the applicant never sees it. This targets the real bottleneck (grading volume at
  scale) without removing human judgment from the decision.
