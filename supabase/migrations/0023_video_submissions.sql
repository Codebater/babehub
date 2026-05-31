-- Migration 0023: creator video submissions + admin approval queue
--
-- Users upload a video file to the `posts` storage bucket, then create a
-- video_submissions row (status='pending'). It lands in the admin queue
-- (/app/admin/videos). On approval the admin action creates the live
-- media + posts rows so the video appears on the creator's profile and
-- the /explore featured row; on rejection a reason is recorded. The user
-- is notified in their BabeHub chat at every step.

create table public.video_submissions (
  id                 uuid        primary key default gen_random_uuid(),
  user_id            uuid        not null references public.profiles(id) on delete cascade,
  title              text        not null check (char_length(title) between 1 and 140),
  storage_bucket     text        not null default 'posts',
  storage_path       text        not null,
  mime_type          text,
  byte_size          bigint,
  status             text        not null default 'pending'
                       check (status in ('pending', 'approved', 'rejected')),
  rejection_reason   text,
  reviewed_at        timestamptz,
  reviewed_by        uuid        references public.profiles(id) on delete set null,
  published_post_id  uuid        references public.posts(id) on delete set null,
  created_at         timestamptz not null default now()
);

create index video_submissions_user_idx   on public.video_submissions(user_id, created_at desc);
create index video_submissions_status_idx on public.video_submissions(status, created_at desc);

alter table public.video_submissions enable row level security;

-- Users read their own submissions
create policy "user reads own submissions"
  on public.video_submissions for select to authenticated
  using (user_id = auth.uid());

-- Users create their own submissions (always pending)
create policy "user creates own submission"
  on public.video_submissions for insert to authenticated
  with check (user_id = auth.uid() and status = 'pending');

-- Admins have full access (queue + approve/reject)
create policy "admin all submissions"
  on public.video_submissions for all to authenticated
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'))
  with check (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));
