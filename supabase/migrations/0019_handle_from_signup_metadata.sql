-- Email/password signup form lets the user pick their @handle up front.
-- Pass it through Supabase Auth as raw_user_meta_data->>'handle' and
-- read it here. Falls back to the existing email-based generator when:
--   - no handle provided (e.g. OAuth, magic-link without signup form)
--   - format invalid (must match [a-z0-9_]{3,30})
--   - already taken (collision → retry with email-based base)
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
begin
  -- Try the user-supplied handle first (only valid signup-time path).
  desired_handle := lower(coalesce(new.raw_user_meta_data->>'handle', ''));
  if desired_handle ~ '^[a-z0-9_]{3,30}$' then
    begin
      insert into public.profiles (id, handle, display_name)
      values (
        new.id, desired_handle,
        coalesce(
          new.raw_user_meta_data->>'display_name',
          new.raw_user_meta_data->>'name',
          desired_handle
        )
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
      insert into public.profiles (id, handle, display_name)
      values (
        new.id, candidate,
        coalesce(
          new.raw_user_meta_data->>'display_name',
          new.raw_user_meta_data->>'name',
          split_part(new.email, '@', 1),
          'New user'
        )
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
