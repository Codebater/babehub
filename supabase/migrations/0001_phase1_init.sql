-- Phase 1: foundation schema for the creator-monetization platform.
--
-- Covers: profiles (1:1 with auth.users), creator_settings, subscription_tiers,
-- subscriptions (provider-agnostic over stripe + nowpayments), posts, media.
-- Includes the auth.users → profiles trigger, an `updated_at` trigger,
-- a `has_active_subscription` helper, and RLS policies for every table.
-- Storage RLS for the avatars / covers / posts buckets is at the bottom.
--
-- Later phases will add: agencies + agency_members (Phase 3), livestreams
-- (Phase 3), messages + tips + stories + requests (Phase 2), referrals (Phase 4).

-- ─────────────────────────────────────────────────────────────────────────────
-- Extensions
-- ─────────────────────────────────────────────────────────────────────────────

create extension if not exists citext;
create extension if not exists pgcrypto;

-- ─────────────────────────────────────────────────────────────────────────────
-- Helpers
-- ─────────────────────────────────────────────────────────────────────────────

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- Enums
-- ─────────────────────────────────────────────────────────────────────────────

create type public.user_role as enum ('fan', 'creator', 'chatter', 'admin');

create type public.payment_provider as enum ('stripe', 'nowpayments');

create type public.subscription_status as enum ('active', 'past_due', 'canceled', 'incomplete', 'trialing');

create type public.post_kind as enum ('text', 'image', 'video', 'gallery');

create type public.media_kind as enum ('image', 'video');

-- ─────────────────────────────────────────────────────────────────────────────
-- profiles — 1:1 with auth.users
-- ─────────────────────────────────────────────────────────────────────────────

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  handle citext unique not null,
  display_name text not null default '',
  bio text not null default '',
  avatar_url text,
  cover_url text,
  role public.user_role not null default 'fan',
  is_verified boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint handle_format check (handle ~* '^[a-z0-9_]{3,30}$')
);

create index profiles_role_idx on public.profiles (role) where role <> 'fan';
create index profiles_created_at_idx on public.profiles (created_at desc);

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.touch_updated_at();

-- Auto-create a profile row whenever Supabase Auth creates a new user.
-- Default handle = email local part + 4 random chars (collision-resistant).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  base_handle text;
  candidate text;
  attempt int := 0;
begin
  base_handle := lower(regexp_replace(coalesce(split_part(new.email, '@', 1), 'user'), '[^a-z0-9_]', '', 'g'));
  if length(base_handle) < 3 then
    base_handle := base_handle || 'user';
  end if;

  loop
    candidate := base_handle || '_' || substr(md5(random()::text || clock_timestamp()::text), 1, 6);
    begin
      insert into public.profiles (id, handle, display_name)
      values (
        new.id,
        candidate,
        coalesce(
          new.raw_user_meta_data->>'display_name',
          new.raw_user_meta_data->>'name',
          split_part(new.email, '@', 1),
          'New user'
        )
      );
      exit;  -- success
    exception when unique_violation then
      attempt := attempt + 1;
      if attempt > 5 then raise; end if;
    end;
  end loop;

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;

create policy "profiles are public read"
  on public.profiles for select
  using (true);

create policy "users update own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- ─────────────────────────────────────────────────────────────────────────────
-- creator_settings — extends profiles for accounts that have opted into creator role
-- ─────────────────────────────────────────────────────────────────────────────

create table public.creator_settings (
  creator_id uuid primary key references public.profiles(id) on delete cascade,
  commission_pct numeric(5,2) not null default 30.00 check (commission_pct >= 0 and commission_pct <= 100),
  payout_currency text not null default 'USD',
  stripe_account_id text,
  nowpayments_subaccount_id text,
  is_accepting_subscribers boolean not null default true,
  -- Reserved for Phase 3 agency assignment; FK added in agencies migration.
  agency_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger creator_settings_updated_at
  before update on public.creator_settings
  for each row execute function public.touch_updated_at();

alter table public.creator_settings enable row level security;

create policy "creator settings public read"
  on public.creator_settings for select
  using (true);

create policy "creator manages own settings"
  on public.creator_settings for all
  using (auth.uid() = creator_id)
  with check (auth.uid() = creator_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- subscription_tiers
-- ─────────────────────────────────────────────────────────────────────────────

create table public.subscription_tiers (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  description text not null default '',
  price_cents integer not null check (price_cents >= 0),
  currency text not null default 'USD',
  perks jsonb not null default '[]'::jsonb,
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index subscription_tiers_creator_idx
  on public.subscription_tiers (creator_id)
  where active = true;

create trigger subscription_tiers_updated_at
  before update on public.subscription_tiers
  for each row execute function public.touch_updated_at();

alter table public.subscription_tiers enable row level security;

create policy "active tiers are public read"
  on public.subscription_tiers for select
  using (active = true or auth.uid() = creator_id);

create policy "creator manages own tiers"
  on public.subscription_tiers for all
  using (auth.uid() = creator_id)
  with check (auth.uid() = creator_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- subscriptions — payment-provider agnostic
-- ─────────────────────────────────────────────────────────────────────────────

create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  subscriber_id uuid not null references public.profiles(id) on delete cascade,
  creator_id uuid not null references public.profiles(id) on delete cascade,
  tier_id uuid not null references public.subscription_tiers(id) on delete restrict,
  status public.subscription_status not null default 'incomplete',
  provider public.payment_provider not null,
  provider_subscription_id text not null,
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  canceled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint subscriptions_no_self_sub check (subscriber_id <> creator_id),
  constraint subscriptions_provider_id_unique unique (provider, provider_subscription_id)
);

create index subscriptions_subscriber_idx on public.subscriptions (subscriber_id, status);
create index subscriptions_creator_idx on public.subscriptions (creator_id, status);
create index subscriptions_period_idx on public.subscriptions (current_period_end) where status = 'active';

create trigger subscriptions_updated_at
  before update on public.subscriptions
  for each row execute function public.touch_updated_at();

alter table public.subscriptions enable row level security;

-- Subscriber + creator can read their own sub rows. Webhooks write via service_role.
create policy "view own subscriptions"
  on public.subscriptions for select
  using (auth.uid() = subscriber_id or auth.uid() = creator_id);

-- No client INSERT / UPDATE / DELETE — payment webhooks use service_role.

-- ─────────────────────────────────────────────────────────────────────────────
-- Helper: has_active_subscription — used by posts RLS + future tables
-- ─────────────────────────────────────────────────────────────────────────────

create or replace function public.has_active_subscription(
  fan_id uuid,
  target_creator_id uuid,
  required_tier_id uuid default null
) returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.subscriptions s
    where s.subscriber_id = fan_id
      and s.creator_id = target_creator_id
      and (required_tier_id is null or s.tier_id = required_tier_id)
      and s.status in ('active', 'trialing')
      and (s.current_period_end is null or s.current_period_end > now())
  );
$$;

grant execute on function public.has_active_subscription(uuid, uuid, uuid) to authenticated, anon;

-- ─────────────────────────────────────────────────────────────────────────────
-- media — uploaded files (avatars, covers, post attachments, future DM media)
-- ─────────────────────────────────────────────────────────────────────────────

create table public.media (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  kind public.media_kind not null,
  storage_bucket text not null,
  storage_path text not null,
  mime_type text,
  byte_size bigint,
  width integer,
  height integer,
  duration_seconds numeric(10,2),
  blurhash text,
  -- Phase 3: Mux video assets get a non-null asset id; storage_path may be unused
  mux_asset_id text,
  mux_playback_id text,
  created_at timestamptz not null default now()
);

create index media_owner_idx on public.media (owner_id, created_at desc);
create unique index media_storage_idx on public.media (storage_bucket, storage_path);

alter table public.media enable row level security;

create policy "media public read"
  on public.media for select
  using (true);
-- ^ rows in `media` are public metadata; the actual file in Storage is RLS-gated
-- below. Locked content is served via signed URLs only.

create policy "owner manages own media"
  on public.media for all
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- posts — creator content (text / image / video / gallery)
-- ─────────────────────────────────────────────────────────────────────────────

create table public.posts (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references public.profiles(id) on delete cascade,
  kind public.post_kind not null default 'text',
  body text not null default '',
  media_ids uuid[] not null default '{}',
  -- NULL = free / public post. Non-null = locked to subscribers of that tier (or higher in future ladder logic).
  tier_required_id uuid references public.subscription_tiers(id) on delete set null,
  scheduled_for timestamptz,
  published_at timestamptz,
  is_pinned boolean not null default false,
  like_count integer not null default 0,
  comment_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index posts_creator_published_idx
  on public.posts (creator_id, published_at desc)
  where published_at is not null;

create index posts_scheduled_idx
  on public.posts (scheduled_for)
  where published_at is null and scheduled_for is not null;

create trigger posts_updated_at
  before update on public.posts
  for each row execute function public.touch_updated_at();

alter table public.posts enable row level security;

-- Anyone can read a published post if:
--   (a) it has no tier requirement (free / teaser), OR
--   (b) the viewer is the creator themselves, OR
--   (c) the viewer has an active subscription that satisfies the tier.
-- Unpublished posts (scheduled, drafts) are only visible to the creator.
create policy "view public or own posts"
  on public.posts for select
  using (
    (published_at is not null and tier_required_id is null)
    or auth.uid() = creator_id
    or (
      published_at is not null
      and tier_required_id is not null
      and public.has_active_subscription(auth.uid(), creator_id, tier_required_id)
    )
  );

create policy "creator manages own posts"
  on public.posts for all
  using (auth.uid() = creator_id)
  with check (auth.uid() = creator_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- Storage RLS — buckets must exist (avatars, covers, posts).
-- ─────────────────────────────────────────────────────────────────────────────
-- The buckets themselves are created via the Supabase dashboard, but we own
-- the row-level policies on storage.objects here so they live in version
-- control alongside the rest of the schema.

-- Avatars + covers: public read, owner write to own user-id-prefixed path.
create policy "public read avatar storage"
  on storage.objects for select
  using (bucket_id = 'avatars');

create policy "owner write avatar storage"
  on storage.objects for insert
  with check (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "owner update avatar storage"
  on storage.objects for update
  using (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "owner delete avatar storage"
  on storage.objects for delete
  using (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "public read cover storage"
  on storage.objects for select
  using (bucket_id = 'covers');

create policy "owner write cover storage"
  on storage.objects for insert
  with check (
    bucket_id = 'covers'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "owner update cover storage"
  on storage.objects for update
  using (
    bucket_id = 'covers'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "owner delete cover storage"
  on storage.objects for delete
  using (
    bucket_id = 'covers'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- Posts (private bucket): only the owner can read/write directly. Subscribers
-- read via signed URLs minted by a server-side route handler that has already
-- verified an active subscription. Direct anonymous SELECT is denied.
create policy "owner read post storage"
  on storage.objects for select
  using (
    bucket_id = 'posts'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "owner write post storage"
  on storage.objects for insert
  with check (
    bucket_id = 'posts'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "owner update post storage"
  on storage.objects for update
  using (
    bucket_id = 'posts'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "owner delete post storage"
  on storage.objects for delete
  using (
    bucket_id = 'posts'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
