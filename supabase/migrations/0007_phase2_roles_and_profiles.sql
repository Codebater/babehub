-- Phase 2 Sprint 1 — multi-role support + professional profile + portfolio.
--
-- Adds:
--   - 4 new values to user_role: recruiter, agency, brand, service_provider
--   - profiles.roles user_role[] (backfilled from existing profiles.role)
--   - professional_profiles (1:1 with profiles, business identity)
--   - portfolio_items (many per pro profile, references media or external URL)
--
-- Phase 1's profiles.role stays as the "primary/active role" used by the
-- existing requireCreator() guard. roles[] is additive: a user can be
-- both 'creator' and 'recruiter' simultaneously without breaking guards.
--
-- IMPORTANT: PostgreSQL requires ALTER TYPE ... ADD VALUE to commit
-- before the new value is usable in subsequent DDL. The migration was
-- therefore split into TWO MCP apply_migration calls in production:
--   1. The four ALTER TYPE statements (committed alone)
--   2. The rest of this file (tables, triggers, RLS)
-- When replaying locally, run the whole file in TWO transactions for the
-- same reason.

-- ─── Step 1: extend the user_role enum ───────────────────────────────
alter type public.user_role add value if not exists 'recruiter';
alter type public.user_role add value if not exists 'agency';
alter type public.user_role add value if not exists 'brand';
alter type public.user_role add value if not exists 'service_provider';

-- ─── Step 2: profiles.roles[] + the new tables (separate transaction) ─

-- profiles.role stays as the "active role" for Phase 1 guards;
-- roles[] is the set the user has unlocked.
alter table public.profiles
  add column if not exists roles public.user_role[] not null
    default array['fan']::public.user_role[];

-- Backfill from the existing singular role.
update public.profiles set roles = array[role]
  where roles = array['fan']::public.user_role[];

-- ─── professional_profiles ────────────────────────────────────────────
create table if not exists public.professional_profiles (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  headline text not null default '',
  about text not null default '',
  hourly_rate_cents int,
  currency text not null default 'USD',
  region text,
  languages text[] not null default '{}',
  skills text[] not null default '{}',
  categories text[] not null default '{}',
  collaboration_status text not null default 'open'
    check (collaboration_status in ('open','selective','closed')),
  availability text not null default 'available'
    check (availability in ('available','busy','unavailable')),
  experience jsonb not null default '[]'::jsonb,
  links jsonb not null default '{}'::jsonb,
  visibility text not null default 'public'
    check (visibility in ('public','recruiters_only','private')),
  -- Plain tsvector column maintained by a trigger. We can't use a
  -- GENERATED column here because to_tsvector() is STABLE, not
  -- IMMUTABLE — Postgres rejects STABLE functions in generated columns.
  search_doc tsvector,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists professional_profiles_search_idx
  on public.professional_profiles using gin (search_doc);
create index if not exists professional_profiles_skills_idx
  on public.professional_profiles using gin (skills);
create index if not exists professional_profiles_categories_idx
  on public.professional_profiles using gin (categories);

-- Refresh search_doc on every write.
create or replace function public.professional_profiles_refresh_search()
returns trigger language plpgsql as $$
begin
  new.search_doc :=
       setweight(to_tsvector('simple', coalesce(new.headline,'')), 'A')
    || setweight(to_tsvector('simple', array_to_string(new.skills,' ')), 'B')
    || setweight(to_tsvector('simple', array_to_string(new.categories,' ')), 'B')
    || setweight(to_tsvector('simple', coalesce(new.about,'')), 'C');
  return new;
end $$;

drop trigger if exists professional_profiles_search on public.professional_profiles;
create trigger professional_profiles_search
  before insert or update on public.professional_profiles
  for each row execute function public.professional_profiles_refresh_search();

-- Reuse the Phase 1 touch_updated_at() trigger.
drop trigger if exists professional_profiles_touch_updated_at on public.professional_profiles;
create trigger professional_profiles_touch_updated_at
  before update on public.professional_profiles
  for each row execute function public.touch_updated_at();

-- ─── portfolio_items ──────────────────────────────────────────────────
create table if not exists public.portfolio_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  media_id uuid references public.media(id) on delete set null,
  external_url text,
  title text not null default '',
  description text not null default '',
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  -- Each portfolio item references either an uploaded media row OR an
  -- external URL (Vimeo, YouTube, behance) — never neither.
  check (media_id is not null or external_url is not null)
);

create index if not exists portfolio_items_user_idx
  on public.portfolio_items (user_id, sort_order, created_at desc);

-- ─── RLS ──────────────────────────────────────────────────────────────
alter table public.professional_profiles enable row level security;
alter table public.portfolio_items enable row level security;

drop policy if exists "pro_profiles_read" on public.professional_profiles;
create policy "pro_profiles_read" on public.professional_profiles for select
  using (
    visibility = 'public'
    or auth.uid() = user_id
    or (visibility = 'recruiters_only' and auth.uid() is not null)
  );

drop policy if exists "pro_profiles_upsert_own" on public.professional_profiles;
create policy "pro_profiles_upsert_own" on public.professional_profiles
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Portfolio items inherit the parent professional profile's visibility.
drop policy if exists "portfolio_read" on public.portfolio_items;
create policy "portfolio_read" on public.portfolio_items for select
  using (
    exists (
      select 1 from public.professional_profiles p
      where p.user_id = portfolio_items.user_id
        and (
          p.visibility = 'public'
          or auth.uid() = p.user_id
          or (p.visibility = 'recruiters_only' and auth.uid() is not null)
        )
    )
  );

drop policy if exists "portfolio_write_own" on public.portfolio_items;
create policy "portfolio_write_own" on public.portfolio_items
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
