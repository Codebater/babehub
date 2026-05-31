-- Migration 0020: auto-set onboarded_at at signup time
--
-- Previously new users landed on /app/onboarding to fill in a form before
-- being marked as onboarded. That form used a Next.js Server Action which
-- broke for users with stale browser caches after a deployment (
-- "Failed to find Server Action" error).
--
-- Fix: set onboarded_at = now() directly in the handle_new_user trigger
-- so every new user is immediately considered onboarded. Profile editing
-- happens in /app/professional/edit which they land on right after signup.
--
-- Also backfills all existing profiles where onboarded_at IS NULL so
-- those users are no longer bounced to the broken onboarding route.

-- 1. Update the trigger function to set onboarded_at at row creation.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  desired_handle text;
  base_handle text;
  candidate text;
  attempt int := 0;
  now_ts timestamptz := now();
begin
  -- Try the user-supplied handle first (only valid signup-time path).
  desired_handle := lower(coalesce(new.raw_user_meta_data->>'handle', ''));
  if desired_handle ~ '^[a-z0-9_]{3,30}$' then
    begin
      insert into public.profiles (id, handle, display_name, onboarded_at)
      values (
        new.id, desired_handle,
        coalesce(
          new.raw_user_meta_data->>'display_name',
          new.raw_user_meta_data->>'name',
          desired_handle
        ),
        now_ts
      );
      return new;
    exception when unique_violation then
      -- Handle taken — fall through to email-based generation.
      null;
    end;
  end if;

  -- Fallback: derive a base from the email local-part + a 6-char suffix.
  base_handle := lower(regexp_replace(
    coalesce(split_part(new.email, '@', 1), 'user'),
    '[^a-z0-9_]', '', 'g'
  ));
  if length(base_handle) < 3 then base_handle := base_handle || 'user'; end if;
  loop
    candidate := base_handle || '_' || substr(md5(random()::text || clock_timestamp()::text), 1, 6);
    begin
      insert into public.profiles (id, handle, display_name, onboarded_at)
      values (
        new.id, candidate,
        coalesce(
          new.raw_user_meta_data->>'display_name',
          new.raw_user_meta_data->>'name',
          split_part(new.email, '@', 1),
          'New user'
        ),
        now_ts
      );
      exit;
    exception when unique_violation then
      attempt := attempt + 1;
      if attempt > 5 then raise; end if;
    end;
  end loop;
  return new;
end;
$$;

-- 2. Backfill: mark all existing un-onboarded profiles as onboarded now.
--    These users either never completed the old form, or the server action
--    failed for them. They can edit their profile at /app/professional/edit.
update public.profiles
set onboarded_at = now()
where onboarded_at is null;
