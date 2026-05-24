-- Track whether a user has completed the onboarding form (role pick,
-- handle, display_name, bio). The (authed) layout uses this to bounce
-- brand-new accounts to /app/onboarding before they hit the dashboard.
--
-- Nullable on purpose: existing rows from the auth trigger are not
-- onboarded yet, and `null` is the sentinel for "needs onboarding".

alter table public.profiles
  add column onboarded_at timestamptz;

comment on column public.profiles.onboarded_at is
  'Set to now() when the user submits the onboarding form. NULL = needs onboarding.';
