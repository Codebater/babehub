import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Lock, ShieldCheck } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { getSignedMediaUrls } from '@/lib/storage/signedUrls';
import MediaTile, { type MediaItem } from '@/components/MediaTile';

/**
 * `/c/{handle}` — public creator profile.
 *
 * Server-rendered with the cookie-aware client so RLS does the right thing
 * automatically:
 *   - profiles: public read (everyone sees the profile row)
 *   - subscription_tiers: public read for `active = true` rows
 *   - posts: public read for free posts, gated by `has_active_subscription`
 *     for paywalled rows — so the same query works whether the viewer is
 *     anonymous, the creator themselves, or an active subscriber
 *
 * The page is dynamic on purpose (no `generateStaticParams`) because
 * profiles, tiers, and the post stream change continuously.
 */
export const dynamic = 'force-dynamic';

type Props = {
  params: Promise<{ handle: string; locale: string }>;
};

async function loadProfile(handle: string) {
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from('profiles')
    .select(
      'id, handle, display_name, bio, avatar_url, cover_url, role, is_verified, created_at',
    )
    .eq('handle', handle)
    .maybeSingle();

  if (!profile) return null;

  const [{ data: tiers }, { data: posts }, { data: { user } }] = await Promise.all([
    supabase
      .from('subscription_tiers')
      .select('id, name, description, price_cents, currency, perks, sort_order')
      .eq('creator_id', profile.id)
      .eq('active', true)
      .order('sort_order', { ascending: true }),
    supabase
      .from('posts')
      .select('id, kind, body, media_ids, published_at, tier_required_id, like_count, comment_count')
      .eq('creator_id', profile.id)
      .not('published_at', 'is', null)
      .order('published_at', { ascending: false })
      .limit(20),
    supabase.auth.getUser(),
  ]);

  // Collect every media id referenced by the posts the viewer can actually
  // see (RLS already filtered the array), then mint signed URLs in one
  // batch. The `posts` bucket is private — only signed URLs work.
  const mediaIds = (posts ?? []).flatMap((p) => p.media_ids ?? []);
  const mediaUrlMap = await getSignedMediaUrls(mediaIds);

  return {
    profile,
    tiers: tiers ?? [],
    posts: posts ?? [],
    viewer: user,
    mediaUrlMap,
  };
}

function formatPrice(priceCents: number, currency: string): string {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
      minimumFractionDigits: priceCents % 100 === 0 ? 0 : 2,
    }).format(priceCents / 100);
  } catch {
    return `${(priceCents / 100).toFixed(2)} ${currency}`;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { handle } = await params;
  const result = await loadProfile(handle);
  if (!result) return { title: 'Profile not found' };
  const { profile } = result;
  const title = `${profile.display_name || profile.handle} (@${profile.handle}) · Babe Hub`;
  return {
    title,
    description: profile.bio || `${profile.display_name || profile.handle} on Babe Hub`,
    openGraph: {
      title,
      description: profile.bio || undefined,
      type: 'profile',
      images: profile.avatar_url ? [profile.avatar_url] : ['/og-image.png'],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description: profile.bio || undefined,
      images: profile.avatar_url ? [profile.avatar_url] : ['/og-image.png'],
    },
    alternates: { canonical: `/c/${profile.handle}` },
  };
}

export default async function CreatorProfilePage({ params }: Props) {
  const { handle } = await params;
  const result = await loadProfile(handle);
  if (!result) notFound();

  const { profile, tiers, posts, viewer, mediaUrlMap } = result;
  const isOwnProfile = viewer?.id === profile.id;
  const isCreator = profile.role === 'creator';

  return (
    <div className="min-h-screen bg-background text-text-main">
      {/* ── Cover ──────────────────────────────────────────────────────────── */}
      <div
        className="relative h-48 w-full sm:h-64 md:h-80"
        style={
          profile.cover_url
            ? { backgroundImage: `url(${profile.cover_url})`, backgroundSize: 'cover', backgroundPosition: 'center' }
            : { background: 'linear-gradient(135deg, var(--color-primary) 0%, #7c3aed 100%)' }
        }
        aria-hidden
      >
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background" />
      </div>

      <main className="mx-auto max-w-4xl px-6">
        {/* ── Header ──────────────────────────────────────────────────────── */}
        <header className="-mt-16 sm:-mt-20 flex flex-col items-start gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-end">
            <div className="relative">
              <div className="h-28 w-28 overflow-hidden rounded-full border-4 border-background bg-secondary sm:h-32 sm:w-32">
                {profile.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={profile.avatar_url}
                    alt={`${profile.display_name || profile.handle} avatar`}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/40 to-pink-600/40 text-3xl font-black text-white">
                    {(profile.display_name || profile.handle).slice(0, 1).toUpperCase()}
                  </div>
                )}
              </div>
            </div>

            <div className="pb-2">
              <h1 className="flex items-center gap-2 text-2xl font-black sm:text-3xl">
                {profile.display_name || profile.handle}
                {profile.is_verified && (
                  <ShieldCheck className="h-5 w-5 text-primary" aria-label="Verified" />
                )}
              </h1>
              <p className="text-text-secondary">@{profile.handle}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end pb-2">
            {isOwnProfile ? (
              <Link
                href="/app/dashboard"
                className="rounded-full border border-border-color px-4 py-2 text-sm font-medium text-text-secondary transition-colors hover:border-primary hover:text-primary"
              >
                Edit on dashboard →
              </Link>
            ) : !viewer ? (
              <Link
                href={`/app/login?next=${encodeURIComponent(`/c/${profile.handle}`)}`}
                className="rounded-full border border-primary px-4 py-2 text-sm font-bold text-primary transition-colors hover:bg-primary hover:text-white"
              >
                Sign in to subscribe
              </Link>
            ) : null}
          </div>
        </header>

        {profile.bio && (
          <p className="mt-6 max-w-2xl text-text-main leading-relaxed">{profile.bio}</p>
        )}

        {/* ── Tiers ───────────────────────────────────────────────────────── */}
        {isCreator && tiers.length > 0 && (
          <section className="mt-10">
            <h2 className="mb-4 text-lg font-bold text-text-main">Subscription tiers</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
              {tiers.map((tier) => {
                const perks = Array.isArray(tier.perks) ? (tier.perks as string[]) : [];
                return (
                  <div
                    key={tier.id}
                    className="flex flex-col rounded-2xl border border-border-color bg-card p-5"
                  >
                    <p className="text-sm font-semibold text-primary">{tier.name}</p>
                    <p className="mt-2 text-3xl font-black text-text-main">
                      {formatPrice(tier.price_cents, tier.currency)}
                      <span className="ml-1 text-sm font-normal text-text-secondary">/ mo</span>
                    </p>
                    {tier.description && (
                      <p className="mt-2 text-sm text-text-secondary">{tier.description}</p>
                    )}
                    {perks.length > 0 && (
                      <ul className="mt-3 space-y-1 text-sm text-text-main">
                        {perks.slice(0, 5).map((perk, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <span className="text-primary">•</span>
                            <span>{perk}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                    {/* Subscribe button — posts to the NOWPayments create-invoice
                        route, which 303-redirects the browser to the hosted
                        crypto checkout. Unauthenticated viewers get bounced to
                        /app/login first via the route's own session check. */}
                    <form
                      action="/api/nowpayments/create-invoice"
                      method="POST"
                      className="mt-auto"
                    >
                      <input type="hidden" name="tier_id" value={tier.id} />
                      <button
                        type="submit"
                        disabled={isOwnProfile}
                        className="w-full rounded-full bg-primary py-2 text-sm font-bold text-white shadow-lg shadow-primary/20 transition-all hover:bg-pink-400 hover:scale-[1.02] disabled:cursor-not-allowed disabled:bg-pink-400/40 disabled:hover:scale-100"
                      >
                        {isOwnProfile ? "That's your tier" : 'Subscribe with crypto'}
                      </button>
                    </form>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* ── Posts ───────────────────────────────────────────────────────── */}
        {isCreator && (
          <section className="mt-10 pb-16">
            <h2 className="mb-4 text-lg font-bold text-text-main">Posts</h2>
            {posts.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border-color bg-secondary/40 p-10 text-center">
                <p className="text-text-secondary">
                  {isOwnProfile
                    ? "You haven't published anything yet. Head to your dashboard to make your first post."
                    : `${profile.display_name || profile.handle} hasn't posted yet — check back soon.`}
                </p>
              </div>
            ) : (
              <ul className="space-y-4">
                {posts.map((post) => {
                  const mediaItems: MediaItem[] = (post.media_ids ?? [])
                    .map((id) => mediaUrlMap.get(id))
                    .filter((m): m is MediaItem => Boolean(m));
                  return (
                    <li
                      key={post.id}
                      className="overflow-hidden rounded-2xl border border-border-color bg-card"
                    >
                      {post.body && (
                        <p className="whitespace-pre-wrap p-5 text-text-main">{post.body}</p>
                      )}

                      {mediaItems.length > 0 && <MediaTile items={mediaItems} />}

                      <div className="flex items-center gap-3 border-t border-border-color/40 px-5 py-3 text-xs text-text-secondary">
                        <span>
                          {post.published_at && new Date(post.published_at).toLocaleString()}
                        </span>
                        {post.tier_required_id && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 font-medium text-primary">
                            <Lock className="h-3 w-3" /> Subscriber
                          </span>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        )}

        {/* Fans get a simpler bio-only page, no tiers/posts surface */}
        {!isCreator && (
          <section className="mt-10 rounded-2xl border border-border-color bg-secondary/40 p-8 text-center">
            <p className="text-text-secondary">
              {profile.display_name || profile.handle} is a fan account.
              {isOwnProfile && ' Switch to creator mode from your dashboard to publish content.'}
            </p>
          </section>
        )}
      </main>
    </div>
  );
}

// Image/video grid rendering moved to `components/MediaTile.tsx` in
// Phase 1.2 — both /c/{handle} and /explore now use the shared component.
