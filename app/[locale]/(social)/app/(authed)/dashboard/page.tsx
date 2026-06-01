import { redirect } from 'next/navigation';
import Link from 'next/link';
import {
  Users,
  DollarSign,
  FileText,
  Heart,
  Plus,
  Layers,
  Briefcase,
  Sparkles,
  Compass,
  ArrowRight,
  Star,
  Settings as SettingsIcon,
  MessageSquare,
  Film,
  Megaphone,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import SwitchToCreatorButton from './SwitchToCreatorButton';

/**
 * `/app/dashboard` — first authenticated screen after sign-in.
 *
 * Mobile-first redesign:
 *   - Compact header card with avatar + greeting + role chip (no more
 *     "signed in as …" plain-text strip)
 *   - 3-up stats grid that gracefully stacks to 1-col on small screens
 *   - Icon-driven quick-action cards instead of plain text labels —
 *     scan-able with a glance, big enough to tap
 *   - Tighter container padding (`px-4 py-6 md:px-6 md:py-10`) so the
 *     mobile view doesn't waste vertical real-estate
 *
 * Fans (non-creators) get a single creator-pitch hero + a row of
 * "fan toolbox" cards (Discover, Favorites, Apply, Settings). No
 * empty-state stats cards that read "0 / $0 / Free" the way the old
 * version did.
 *
 * Stats query real numbers via three RLS-aware aggregations — active
 * subscribers, published posts, total likes across all posts. Cheap
 * counts; no joins or signed-URL minting needed here.
 */
export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/app/login');

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('handle, display_name, bio, avatar_url, role, onboarded_at')
    .eq('id', user.id)
    .single();

  if (profile && !profile.onboarded_at) {
    redirect('/app/professional/edit');
  }

  if (error || !profile) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-8 md:px-6 md:py-12">
        <h1 className="text-2xl font-bold text-text-main">Profile not found</h1>
        <p className="mt-2 text-text-secondary">
          We couldn&apos;t load your profile. This usually clears up after a
          page refresh — if it doesn&apos;t, please contact support.
        </p>
        <p className="mt-4 font-mono text-xs text-text-secondary">
          {error?.message ?? 'no profile row for this user id'}
        </p>
      </main>
    );
  }

  const isCreator = profile.role === 'creator';

  // ── Creator stats ────────────────────────────────────────────────
  // Three parallel HEAD-count queries — cheap, RLS-aware. Fans skip
  // these entirely so the dashboard render stays fast for non-creators.
  let subCount = 0;
  let postCount = 0;
  let totalLikes = 0;

  if (isCreator) {
    const [subs, posts] = await Promise.all([
      supabase
        .from('subscriptions')
        .select('id', { count: 'exact', head: true })
        .eq('creator_id', user.id)
        .eq('status', 'active'),
      supabase
        .from('posts')
        .select('id', { count: 'exact', head: true })
        .eq('creator_id', user.id)
        .not('published_at', 'is', null),
    ]);
    subCount = subs.count ?? 0;
    postCount = posts.count ?? 0;

    // Total likes across every published post by this creator — same
    // two-step pattern used on /c/[handle].
    const { data: allPosts } = await supabase
      .from('posts')
      .select('id')
      .eq('creator_id', user.id)
      .not('published_at', 'is', null);
    const ids = (allPosts ?? []).map((p) => p.id);
    if (ids.length > 0) {
      const { count } = await supabase
        .from('video_likes')
        .select('content_id', { count: 'exact', head: true })
        .eq('provider', 'creator_post')
        .in('content_id', ids);
      totalLikes = count ?? 0;
    }
  }

  const firstName = (profile.display_name || profile.handle).split(/\s+/)[0];

  return (
    <main className="mx-auto max-w-5xl px-4 py-6 md:px-6 md:py-10">
      {/* ── Greeting card ─────────────────────────────────────────── */}
      <header className="mb-6 flex items-center gap-4 rounded-2xl border border-border-color bg-card p-4 md:mb-8 md:gap-5 md:p-6">
        <span className="h-12 w-12 shrink-0 overflow-hidden rounded-full bg-secondary md:h-14 md:w-14">
          {profile.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={profile.avatar_url}
              alt=""
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/40 to-pink-600/40 text-base font-black text-white md:text-lg">
              {(profile.display_name || profile.handle).slice(0, 1).toUpperCase()}
            </span>
          )}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-text-secondary">
            Dashboard
          </p>
          <h1 className="mt-0.5 truncate text-xl font-black tracking-tight text-text-main md:text-2xl">
            Hi, {firstName}.
          </h1>
          <p className="mt-0.5 truncate text-xs text-text-secondary md:text-sm">
            @{profile.handle}{' '}
            <span className="mx-1 text-text-secondary/40">·</span>{' '}
            <span className="inline-flex items-center gap-1 font-medium capitalize text-primary">
              {profile.role}
            </span>
          </p>
        </div>
        <Link
          href={`/c/${profile.handle}`}
          className="hidden shrink-0 rounded-full border border-border-color px-3 py-1.5 text-xs font-bold text-text-secondary transition-colors hover:border-primary hover:text-primary sm:inline-flex sm:items-center sm:gap-1"
        >
          View profile
          <ArrowRight className="h-3 w-3" />
        </Link>
      </header>

      {isCreator ? (
        <>
          {/* ── Creator stats ───────────────────────────────────── */}
          <section className="mb-8 grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
            <StatCard
              icon={<Users className="h-4 w-4" />}
              title="Subscribers"
              value={subCount.toLocaleString()}
              hint="Active across all tiers"
            />
            <StatCard
              icon={<DollarSign className="h-4 w-4" />}
              title="MRR"
              value="$0"
              hint="Recurring monthly revenue"
            />
            <StatCard
              icon={<FileText className="h-4 w-4" />}
              title="Posts"
              value={postCount.toLocaleString()}
              hint={`${totalLikes.toLocaleString()} total likes`}
            />
          </section>

          {/* ── Creator quick actions ───────────────────────────── */}
          <section>
            <h2 className="mb-3 text-[10px] font-bold uppercase tracking-[0.25em] text-text-secondary">
              Creator tools
            </h2>
            <ul className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <ActionCard
                href="/app/upload"
                icon={<Film className="h-4 w-4" />}
                title="Upload video"
                hint="Reviewed before going live"
                accent
              />
              <ActionCard
                href="/app/dashboard/posts/new"
                icon={<Plus className="h-4 w-4" />}
                title="New post"
                hint="Publish to your feed"
              />
              <ActionCard
                href="/app/dashboard/posts"
                icon={<FileText className="h-4 w-4" />}
                title="Posts"
                hint="View & edit drafts"
              />
              <ActionCard
                href="/app/dashboard/tiers"
                icon={<Layers className="h-4 w-4" />}
                title="Tiers"
                hint="Subscription plans"
              />
            </ul>
          </section>

          {/* ── Secondary actions ───────────────────────────────── */}
          <section className="mt-6">
            <h2 className="mb-3 text-[10px] font-bold uppercase tracking-[0.25em] text-text-secondary">
              Marketplace
            </h2>
            <ul className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <ActionCard
                href="/jobs"
                icon={<Briefcase className="h-4 w-4" />}
                title="Jobs"
                hint="Apply for paid work"
              />
              <ActionCard
                href="/app/creator/applications"
                icon={<Sparkles className="h-4 w-4" />}
                title="Applications"
                hint="Your outbox"
              />
              <ActionCard
                href="/favorites"
                icon={<Star className="h-4 w-4" />}
                title="Favorites"
                hint="Saved videos"
              />
              <ActionCard
                href="/app/promote"
                icon={<Megaphone className="h-4 w-4" />}
                title="Get badge"
                hint="Embed & grow reach"
              />
              <ActionCard
                href="/app/professional/edit"
                icon={<SettingsIcon className="h-4 w-4" />}
                title="Edit profile"
                hint="Identity & pro details"
              />
              <ActionCard
                href="/app/chat"
                icon={<MessageSquare className="h-4 w-4" />}
                title="Team chat"
                hint="Message BabeHub · Beta"
              />
            </ul>
          </section>
        </>
      ) : (
        <>
          {/* ── Fan: creator pitch + toolbox ────────────────────── */}
          <section className="relative mb-6 overflow-hidden rounded-2xl border border-primary/30 bg-gradient-to-br from-card via-card to-pink-950/40 p-6 md:p-8">
            <span
              aria-hidden
              className="pointer-events-none absolute -right-20 -top-20 h-48 w-48 rounded-full bg-primary/25 blur-3xl"
            />
            <p className="relative inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.25em] text-primary">
              <Sparkles className="h-3 w-3" />
              Become a creator
            </p>
            <h2 className="relative mt-3 text-xl font-black tracking-tight text-text-main md:text-2xl">
              Earn from your fans — keep your existing account.
            </h2>
            <p className="relative mt-2 max-w-xl text-sm text-text-secondary">
              Set up subscription tiers, publish locked content, accept tips,
              and get paid in crypto today (NOWPayments) or card (CCBill, soon).
              Your fan history stays — you just unlock creator features.
            </p>
            <div className="relative mt-5">
              <SwitchToCreatorButton />
            </div>
          </section>

          <section>
            <h2 className="mb-3 text-[10px] font-bold uppercase tracking-[0.25em] text-text-secondary">
              Your toolbox
            </h2>
            <ul className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <ActionCard
                href="/explore"
                icon={<Compass className="h-4 w-4" />}
                title="Discover"
                hint="Trending videos"
              />
              <ActionCard
                href="/favorites"
                icon={<Heart className="h-4 w-4" />}
                title="Favorites"
                hint="Saved videos"
              />
              <ActionCard
                href="/app/upload"
                icon={<Film className="h-4 w-4" />}
                title="Upload video"
                hint="Get featured · reviewed first"
              />
              <ActionCard
                href="/jobs"
                icon={<Briefcase className="h-4 w-4" />}
                title="Jobs"
                hint="Casting & collabs"
              />
              <ActionCard
                href="/app/professional/edit"
                icon={<SettingsIcon className="h-4 w-4" />}
                title="Edit profile"
                hint="Handle & bio"
              />
              <ActionCard
                href="/app/chat"
                icon={<MessageSquare className="h-4 w-4" />}
                title="Team chat"
                hint="Message BabeHub · Beta"
              />
            </ul>
          </section>
        </>
      )}
    </main>
  );
}

/**
 * Single stat card — icon chip + big number + hint. Compact enough to
 * sit 3-up on a wide layout, 1-up stacked on mobile.
 */
function StatCard({
  icon,
  title,
  value,
  hint,
}: {
  icon: React.ReactNode;
  title: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="rounded-2xl border border-border-color bg-card p-4 md:p-5">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-text-secondary">
          {title}
        </p>
        <span className="flex h-7 w-7 items-center justify-center rounded-lg border border-primary/30 bg-primary/10 text-primary">
          {icon}
        </span>
      </div>
      <p className="text-2xl font-black text-text-main md:text-3xl">{value}</p>
      <p className="mt-1 text-xs text-text-secondary">{hint}</p>
    </div>
  );
}

/**
 * Quick-action card — icon + label + hint. Two states: enabled (Link)
 * or disabled (placeholder rendering for "coming soon" surfaces).
 *
 * `accent` flips the chrome to primary-pink — used for the primary
 * action of the row (e.g. "New post" on the creator tools row).
 */
function ActionCard({
  href,
  icon,
  title,
  hint,
  accent = false,
  disabled = false,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  hint: string;
  accent?: boolean;
  disabled?: boolean;
}) {
  if (disabled) {
    return (
      <li className="flex h-full flex-col gap-1 rounded-2xl border border-border-color/50 bg-secondary/40 p-4 text-text-secondary/60">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg border border-border-color/50 bg-card/60">
          {icon}
        </span>
        <p className="mt-2 text-sm font-bold">{title}</p>
        <p className="text-[11px]">{hint}</p>
      </li>
    );
  }
  return (
    <li>
      <Link
        href={href}
        className={`group flex h-full flex-col gap-1 rounded-2xl border p-4 transition-all hover:scale-[1.02] ${
          accent
            ? 'border-primary/40 bg-primary/10 text-text-main hover:border-primary hover:bg-primary/15'
            : 'border-border-color bg-card text-text-main hover:border-primary/50'
        }`}
      >
        <span
          className={`flex h-7 w-7 items-center justify-center rounded-lg border transition-colors ${
            accent
              ? 'border-primary/40 bg-primary/15 text-primary'
              : 'border-border-color/60 bg-secondary/60 text-text-secondary group-hover:border-primary/40 group-hover:text-primary'
          }`}
        >
          {icon}
        </span>
        <p className="mt-2 text-sm font-bold">{title}</p>
        <p className="text-[11px] text-text-secondary">{hint}</p>
      </Link>
    </li>
  );
}
