-- Phase 2 Sprint 2 — jobs marketplace + applications.

create type public.job_location_kind as enum ('remote','onsite','hybrid');
create type public.job_status as enum ('draft','published','paused','expired','closed');
create type public.moderation_status as enum ('pending','approved','rejected','flagged');
create type public.application_status as enum
  ('pending','viewed','shortlisted','accepted','rejected','withdrawn');

-- ─── jobs ─────────────────────────────────────────────────────────────
create table public.jobs (
  id uuid primary key default gen_random_uuid(),
  poster_id uuid not null references public.profiles(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 200),
  description text not null default '',
  budget_min_cents int,
  budget_max_cents int,
  currency text not null default 'USD',
  location_kind public.job_location_kind not null default 'remote',
  location_text text,
  tags text[] not null default '{}',
  categories text[] not null default '{}',
  requires_verification boolean not null default false,
  visibility text not null default 'public'
    check (visibility in ('public','verified_only','invite')),
  -- token_cost is stored from Sprint 2 onward; Sprint 3 wires the
  -- consume_tokens() spend on publish. v1 keeps posting free.
  token_cost int not null default 0,
  status public.job_status not null default 'draft',
  -- Defaults to 'approved' so MVP-1 is friction-free; flips to
  -- 'pending' once the Sprint 5 admin queue exists.
  moderation_status public.moderation_status not null default 'approved',
  featured_until timestamptz,
  promoted_score int not null default 0,
  expires_at timestamptz,
  published_at timestamptz,
  -- Plain tsvector + trigger because to_tsvector() is STABLE, not
  -- IMMUTABLE — Postgres rejects STABLE functions in GENERATED columns.
  search_doc tsvector,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index jobs_search_idx on public.jobs using gin (search_doc);
create index jobs_status_idx
  on public.jobs (status, moderation_status, published_at desc);
create index jobs_categories_idx on public.jobs using gin (categories);
create index jobs_poster_idx on public.jobs (poster_id, created_at desc);

create or replace function public.jobs_refresh_search()
returns trigger language plpgsql as $$
begin
  new.search_doc :=
       setweight(to_tsvector('simple', coalesce(new.title,'')), 'A')
    || setweight(to_tsvector('simple', array_to_string(new.tags,' ')), 'B')
    || setweight(to_tsvector('simple', array_to_string(new.categories,' ')), 'B')
    || setweight(to_tsvector('simple', coalesce(new.description,'')), 'C');
  return new;
end $$;

drop trigger if exists jobs_search on public.jobs;
create trigger jobs_search
  before insert or update on public.jobs
  for each row execute function public.jobs_refresh_search();

drop trigger if exists jobs_touch_updated_at on public.jobs;
create trigger jobs_touch_updated_at
  before update on public.jobs
  for each row execute function public.touch_updated_at();

-- ─── job_applications ─────────────────────────────────────────────────
create table public.job_applications (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs(id) on delete cascade,
  applicant_id uuid not null references public.profiles(id) on delete cascade,
  intro_message text not null default '',
  -- References uploaded media in the existing media table — Sprint 1
  -- portfolio uses the same shape.
  intro_media_ids uuid[] not null default '{}',
  status public.application_status not null default 'pending',
  token_boost int not null default 0,
  viewed_at timestamptz,
  decided_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (job_id, applicant_id)
);

create index job_applications_job_idx
  on public.job_applications (job_id, status, created_at desc);
create index job_applications_applicant_idx
  on public.job_applications (applicant_id, created_at desc);

drop trigger if exists job_applications_touch_updated_at on public.job_applications;
create trigger job_applications_touch_updated_at
  before update on public.job_applications
  for each row execute function public.touch_updated_at();

-- ─── RLS ──────────────────────────────────────────────────────────────
alter table public.jobs enable row level security;
alter table public.job_applications enable row level security;

-- Public job board: published+approved+not-expired AND (public OR
-- verified_only with verified viewer); poster always reads own.
drop policy if exists "jobs_read" on public.jobs;
create policy "jobs_read" on public.jobs for select using (
  (
    status = 'published'
    and moderation_status = 'approved'
    and (expires_at is null or expires_at > now())
    and (
      visibility = 'public'
      or (
        visibility = 'verified_only'
        and exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_verified)
      )
    )
  )
  or auth.uid() = poster_id
);

drop policy if exists "jobs_insert_own" on public.jobs;
create policy "jobs_insert_own" on public.jobs for insert
  with check (auth.uid() = poster_id);

drop policy if exists "jobs_update_own" on public.jobs;
create policy "jobs_update_own" on public.jobs for update
  using (auth.uid() = poster_id) with check (auth.uid() = poster_id);

drop policy if exists "jobs_delete_own" on public.jobs;
create policy "jobs_delete_own" on public.jobs for delete
  using (auth.uid() = poster_id);

-- Applications: only the applicant + the job poster can read.
drop policy if exists "applications_read" on public.job_applications;
create policy "applications_read" on public.job_applications for select using (
  auth.uid() = applicant_id
  or exists (
    select 1 from public.jobs j
    where j.id = job_id and j.poster_id = auth.uid()
  )
);

drop policy if exists "applications_insert_own" on public.job_applications;
create policy "applications_insert_own" on public.job_applications for insert
  with check (auth.uid() = applicant_id);

-- Updates: applicants can withdraw; poster can move status forward.
drop policy if exists "applications_update" on public.job_applications;
create policy "applications_update" on public.job_applications for update using (
  auth.uid() = applicant_id
  or exists (
    select 1 from public.jobs j
    where j.id = job_id and j.poster_id = auth.uid()
  )
);

drop policy if exists "applications_delete_own" on public.job_applications;
create policy "applications_delete_own" on public.job_applications for delete
  using (auth.uid() = applicant_id);
