-- Phase 1.9 — likes / favorites / comments for any video source.
--
-- Every row is keyed by (provider, content_id):
--   provider = 'creator_post' → content_id = posts.id (uuid as text)
--   provider = 'eporner'      → content_id = eporner video id
--
-- Same shape for both sources, so a single set of tables covers the
-- whole platform without a content-aggregation join table.

create type public.content_provider as enum ('creator_post', 'eporner');

-- ─── Likes ──────────────────────────────────────────────────────────
create table public.video_likes (
  user_id uuid not null references auth.users(id) on delete cascade,
  provider public.content_provider not null,
  content_id text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, provider, content_id)
);

create index video_likes_content_idx
  on public.video_likes (provider, content_id);

alter table public.video_likes enable row level security;

create policy "video_likes_read_all"
  on public.video_likes for select using (true);

create policy "video_likes_insert_own"
  on public.video_likes for insert
  with check (auth.uid() = user_id);

create policy "video_likes_delete_own"
  on public.video_likes for delete
  using (auth.uid() = user_id);

-- ─── Favorites ──────────────────────────────────────────────────────
-- We cache title + thumb_url so the user's Favorites list renders
-- without an extra eporner round-trip or storage signed-URL lookup.
create table public.video_favorites (
  user_id uuid not null references auth.users(id) on delete cascade,
  provider public.content_provider not null,
  content_id text not null,
  title text,
  thumb_url text,
  -- Eporner cards need the iframe embed URL + the public watch URL to
  -- re-open them from the Favorites list; null for creator posts.
  embed_url text,
  source_url text,
  created_at timestamptz not null default now(),
  primary key (user_id, provider, content_id)
);

create index video_favorites_user_idx
  on public.video_favorites (user_id, created_at desc);

alter table public.video_favorites enable row level security;

-- Favorites are private — only the owner can see what they've saved.
create policy "video_favorites_select_own"
  on public.video_favorites for select using (auth.uid() = user_id);

create policy "video_favorites_insert_own"
  on public.video_favorites for insert
  with check (auth.uid() = user_id);

create policy "video_favorites_delete_own"
  on public.video_favorites for delete
  using (auth.uid() = user_id);

-- ─── Comments ───────────────────────────────────────────────────────
create table public.video_comments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  provider public.content_provider not null,
  content_id text not null,
  body text not null check (char_length(body) between 1 and 2000),
  created_at timestamptz not null default now(),
  edited_at timestamptz
);

create index video_comments_content_idx
  on public.video_comments (provider, content_id, created_at desc);

create index video_comments_user_idx
  on public.video_comments (user_id, created_at desc);

alter table public.video_comments enable row level security;

create policy "video_comments_read_all"
  on public.video_comments for select using (true);

create policy "video_comments_insert_own"
  on public.video_comments for insert
  with check (auth.uid() = user_id);

create policy "video_comments_update_own"
  on public.video_comments for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "video_comments_delete_own"
  on public.video_comments for delete
  using (auth.uid() = user_id);
