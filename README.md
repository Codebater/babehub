<div align="center">
<img width="1200" height="475" alt="BabeHub" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />

# BabeHub

**Creator-economy + jobs marketplace platform for the adult industry.**

Production: [babehub.net](https://babehub.net)

</div>

---

## What it is

A two-sided platform combining a **creator discovery feed**, a **subscription / paywall layer**, a **jobs marketplace**, an **admin CMS**, and a **brand-side ad inventory** — all under one shell.

- **Creators** publish posts (text / image / video), set subscription tiers, accept tips, apply for paid casting calls
- **Fans** browse via category surfaces (Casting / Live Cams / Luxury Shoots), subscribe to creators in crypto, like + comment + favorite
- **Recruiters / agencies / brands** post jobs with budgets + deadlines, browse the talent directory, buy sponsored placements
- **Admins** verify creators, freeze / ban users, feature jobs, review submissions, publish blog posts
- **Premium ($10/mo)** unlocks the full Casting catalog + higher content caps + creator-locked posts

## Tech stack

| Layer | Choice |
|---|---|
| Framework | Next.js 15 App Router (RSC + Server Actions), TypeScript, Tailwind CSS v3 |
| Auth + DB + Storage | Supabase (Postgres + RLS, Auth, Storage) |
| Payments | NOWPayments (crypto subscriptions + premium top-ups); CCBill planned for cards |
| External video catalog | eporner v2 API (cached 5 min, AI-filtered) |
| Submissions | Survey + B2B inquiry forms → Supabase tables (Airtable mirror optional) |
| Hosting | Vercel (linked to this repo via `.vercel/project.json`) |
| i18n | next-intl, 7 locales (en/de/es/fr/ja/pt/th), `localePrefix: 'as-needed'`, locale-detection off |

## Quick start

**Prerequisites:** Node.js 20+

```bash
git clone https://github.com/Codebater/babehub.git
cd babehub
git checkout phase-1-supabase-auth
npm install
cp .env.example .env.local        # then fill in the values below
npm run dev
```

The dev server boots at [http://localhost:3000](http://localhost:3000) (or 3001 if 3000 is busy).

## Environment variables

`.env.local` is git-ignored. Required values (ask the project owner for keys):

```env
# Supabase — shared dev project; ask for the service-role key
NEXT_PUBLIC_SUPABASE_URL=https://gpewtvzaatcqyquogxlh.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_...
SUPABASE_SERVICE_ROLE_KEY=...      # server-only, never expose

# NOWPayments — sandbox keys; ask the project owner
NOWPAYMENTS_API_KEY=...
NOWPAYMENTS_IPN_SECRET=...
NOWPAYMENTS_SANDBOX=true

# Optional — Airtable mirror for survey + inquiry submissions
AIRTABLE_API_KEY=
AIRTABLE_BASE_ID=appci65Qsp0KLHRNr
AIRTABLE_TABLE_NAME=Survey Submissions
AIRTABLE_BANNER_TABLE=B2B Inquiries

# Admin allow-list — comma-separated emails auto-promoted to role='admin'
# on next sign-in. Requires SUPABASE_SERVICE_ROLE_KEY to be set.
ADMIN_EMAILS=you@example.com
```

On Vercel: mirror the same variables under **Project → Settings → Environment Variables** for Production + Preview + Development scopes.

## Project structure

```
babehub/
├── app/
│   ├── [locale]/
│   │   ├── (marketing)/           # public marketing home + B2B / Apply modals
│   │   ├── (social)/              # main app shell (sidebar + bottom-tab nav)
│   │   │   ├── explore/           # video discovery (eporner + creator feed)
│   │   │   ├── c/[handle]/        # public creator profile + tier paywall
│   │   │   ├── jobs/              # board + detail (JobPosting JSON-LD)
│   │   │   ├── blog/              # static registry + admin-published posts
│   │   │   ├── creators/, favorites/, marketing/, ...
│   │   │   └── app/(authed)/      # authenticated user surfaces
│   │   │       ├── dashboard/     # creator dashboard + posts + tiers
│   │   │       ├── professional/  # professional profile editor
│   │   │       ├── recruiter/     # job composer + applications inbox
│   │   │       ├── creator/applications/   # applicant outbox
│   │   │       ├── settings/, onboarding/, subscriptions/
│   │   │       └── admin/         # admin hub (Users / Jobs / Apps / Inquiries / Blog)
│   │   └── app/(public)/login/    # magic-link + Google OAuth + admin login
│   ├── api/                       # route handlers (survey, nowpayments, etc.)
│   ├── auth/callback/             # Supabase magic-link / OAuth callback
│   ├── sitemap.ts                 # includes jobs + blog dynamically
│   └── robots.ts
├── lib/
│   ├── supabase/{server,client,admin}.ts    # 3 client factories
│   ├── auth/guards.ts             # requireUser / requireOnboarded / requireCreator / requireRecruiter / requireAdmin
│   ├── jobs/{actions,featured,stats}.ts
│   ├── blog/{posts,db,types}.ts
│   ├── limits/                    # free vs elevated content caps
│   ├── admin/counts.ts            # hub badges
│   ├── eporner/client.ts          # external video catalog wrapper (AI-filtered)
│   ├── nowpayments/, interactions/, storage/, casting/, site.ts
├── supabase/migrations/           # 16 applied migrations (Phase 1 + Phase 2)
├── types/supabase.ts              # generated DB types (regen on schema change)
├── locales/{de,en,es,fr,ja,pt,th}.ts
├── components/, content/, i18n/, public/
└── README.md, package.json, tsconfig.json, next.config.ts
```

## Database

The Supabase project is shared across all devs (no per-dev DB). Migrations live under `supabase/migrations/` for history; the **canonical state is in the live Supabase project** — applied via the Supabase MCP tooling, not the Supabase CLI.

To regenerate `types/supabase.ts` after a schema change, run the `generate_typescript_types` MCP call (project ID `gpewtvzaatcqyquogxlh`) and paste the output into the file.

**Tables:**
`profiles`, `posts`, `media`, `subscription_tiers`, `subscriptions`, `payment_invoices`, `creator_settings`, `professional_profiles`, `portfolio_items`, `jobs`, `job_applications`, `survey_submissions`, `banner_inquiries`, `blog_posts`, `video_likes`, `video_favorites`, `video_comments`.

**RLS is enabled on every user-touched table.** The app's three Supabase clients in `lib/supabase/`:
- `createClient()` — cookie-aware, RLS-enforcing, used in 99% of paths
- `createBrowserClient()` — client-side equivalent
- `createAdminClient()` — service-role bypass; only for webhooks + admin bootstrap

## Auth model + admin access

Sign-in is via Supabase Auth — magic link or Google OAuth from `/app/login`.

To become admin:

1. **Sign in** with the email you want to grant admin
2. Either:
   - Add that email to `ADMIN_EMAILS` in `.env.local` — the next sign-in auto-promotes (requires `SUPABASE_SERVICE_ROLE_KEY`)
   - Or run in Supabase SQL editor: `update profiles set role = 'admin' where handle = 'YOUR_HANDLE';`
3. Refresh — the **Admin hub** entry appears in the sidebar ProfileMenu

A dedicated admin sign-in page exists at `/app/admin/login` (amber chrome, deep-links to `/app/admin/users` after auth).

## Content caps + Premium

Every user has content caps enforced both server-side (in actions) and DB-side (via trigger on `media`):

|  | Free | Elevated (Verified / Premium / Admin) |
|---|---:|---:|
| Videos | 2 | 10 |
| Pictures | 5 | 25 |
| Public posts | 5 | 25 |
| Private posts | 2 | 10 |
| Jobs | 5 | 25 |

**Premium** ($10/mo) and **BabeHub Verified** (admin-granted) both unlock the elevated tier. Premium also unlocks the Casting catalog blur on `/explore` and creator-locked posts.

## Running migrations

This repo uses the **Supabase MCP** for migrations (not the Supabase CLI). Adding a migration is two steps:

1. Apply via the MCP `apply_migration` call — the tool runs the SQL against the live project and records it under `supabase_migrations.schema_migrations`
2. Save the same SQL locally under `supabase/migrations/00NN_name.sql` for history

After any schema change, regenerate `types/supabase.ts` (see Database section).

## Deployment

The Vercel project (`babehub` under `Codebater's projects`) is linked to this repo via `.vercel/project.json`. Pushes to `phase-1-supabase-auth` create preview deployments; pushes to `main` deploy to production at `babehub.net`.

Promote a branch by merging its PR. Vercel auto-builds.

## Useful surfaces (signed-in dev tour)

- `/` — marketing home (English-only B2B copy at the bottom card)
- `/explore?q=casting` — main discovery surface
- `/jobs` — table-style board with Industry Budget Flow chip + sort filter
- `/c/babehub` — admin's own creator profile
- `/blog` — merged static + admin-published posts
- `/app/dashboard` — signed-in creator dashboard
- `/app/admin` — admin hub (only visible if `role='admin'`)
- `/app/admin/jobs` — feature manual picks for the calendar / blog / jobs surfaces
- `/app/admin/blog/new` — publish a blog post
- `/sitemap.xml` — confirm it lists locale homes + public surfaces + blog + jobs

## License

Private. All rights reserved.
