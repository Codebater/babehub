-- Migration 0021: admin ↔ user chat (beta)
--
-- One thread per user (user_id is unique). Admin can open a thread from
-- the users table; users can start their own from /app/chat.
-- Rate limiting is enforced in the server action (10 msgs / 24h per user).

-- ── Tables ─────────────────────────────────────────────────────────────

create table public.admin_threads (
  id                  uuid         primary key default gen_random_uuid(),
  user_id             uuid         not null unique references public.profiles(id) on delete cascade,
  created_at          timestamptz  not null default now(),
  updated_at          timestamptz  not null default now(),
  -- Last-read timestamps so we can compute unread badges without counts
  admin_last_read_at  timestamptz,
  user_last_read_at   timestamptz
);

create index admin_threads_updated_idx on public.admin_threads(updated_at desc);

create table public.admin_messages (
  id            uuid         primary key default gen_random_uuid(),
  thread_id     uuid         not null references public.admin_threads(id) on delete cascade,
  sender_id     uuid         not null references public.profiles(id) on delete cascade,
  is_from_admin boolean      not null default false,
  body          text         not null check (char_length(body) >= 1 and char_length(body) <= 2000),
  created_at    timestamptz  not null default now()
);

create index admin_messages_thread_time_idx on public.admin_messages(thread_id, created_at);
create index admin_messages_sender_time_idx on public.admin_messages(sender_id, created_at desc);

-- Auto-touch updated_at on admin_threads when a new message arrives
create or replace function public.touch_admin_thread()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  update public.admin_threads
  set updated_at = now()
  where id = NEW.thread_id;
  return NEW;
end;
$$;

create trigger admin_messages_touch_thread
  after insert on public.admin_messages
  for each row execute function public.touch_admin_thread();

-- ── RLS ────────────────────────────────────────────────────────────────

alter table public.admin_threads enable row level security;
alter table public.admin_messages enable row level security;

-- Admin sees and writes everything
create policy "admin all on threads"
  on public.admin_threads for all to authenticated
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  )
  with check (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

create policy "admin all on messages"
  on public.admin_messages for all to authenticated
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  )
  with check (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- Users can read and create their own thread
create policy "user read own thread"
  on public.admin_threads for select to authenticated
  using (user_id = auth.uid());

create policy "user create own thread"
  on public.admin_threads for insert to authenticated
  with check (user_id = auth.uid());

create policy "user update own thread last_read"
  on public.admin_threads for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Users can read messages in their own thread
create policy "user read own thread messages"
  on public.admin_messages for select to authenticated
  using (
    thread_id in (select id from public.admin_threads where user_id = auth.uid())
  );

-- Users can insert their own non-admin messages
create policy "user send message"
  on public.admin_messages for insert to authenticated
  with check (
    sender_id = auth.uid()
    and is_from_admin = false
    and thread_id in (select id from public.admin_threads where user_id = auth.uid())
  );
