-- Migration 0024: anonymous funnel analytics
--
-- Lightweight, privacy-friendly event table powering the admin apply-funnel
-- dashboard. No PII — just an event name, an anonymous local session id,
-- and the path. Events are inserted server-side via /api/track (service
-- role); admins read the aggregates.

create table public.analytics_events (
  id          bigint generated always as identity primary key,
  name        text not null,
  session_id  text,
  path        text,
  created_at  timestamptz not null default now()
);

create index analytics_events_name_time_idx on public.analytics_events(name, created_at desc);
create index analytics_events_time_idx on public.analytics_events(created_at desc);

alter table public.analytics_events enable row level security;

create policy "admin reads analytics"
  on public.analytics_events for select to authenticated
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));
