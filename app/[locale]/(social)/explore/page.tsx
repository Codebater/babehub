import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { loadFeedPage } from './data';
import { loadFeaturedCreatorVideos } from './creators';
import VideoCard from './VideoCard';
import CreatorVideoCard from './CreatorVideoCard';
import LoadMoreButton from './LoadMoreButton';
import CategoryChips from './CategoryChips';
import CastingBanner from './CastingBanner';
import LiveCamsBanner from './LiveCamsBanner';
import LuxuryBanner from './LuxuryBanner';
import FeaturedSlot from './FeaturedSlot';
import { loadPrimaryCreator } from './primary-creator';
import { assignCastingNumbers } from '@/lib/casting/numbers';
import AdStrip from '../_components/AdStrip';

/**
 * `/explore` — public video discovery feed.
 *
 * Two content sources stacked:
 *   1. Featured creators row — the last 10 free creator-uploaded videos,
 *      surfaced above the main grid as a horizontal scroll. Each card
 *      drives clicks back to /c/{handle} for subscription conversion.
 *   2. Trending videos — paginated grid sourced from the public eporner
 *      v2 API. Search bar filters this grid only (creator row is always
 *      latest).
 *
 * Cache strategy:
 *   - Featured creators query is RLS-aware via the cookie client; runs
 *     per-request (force-dynamic).
 *   - Eporner API uses Next.js fetch cache with 5-min revalidate — the
 *     same query+page combo serves from cache across all visitors.
 *
 * Creator videos surface here within 5 minutes of publish because
 * `createPost` in dashboard/posts/actions.ts calls `revalidatePath('/explore')`.
 */
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Explore — Babe Hub',
  description:
    'Discover videos on Babe Hub. Browse the latest from creators and our global video catalog.',
  openGraph: {
    title: 'Explore — Babe Hub',
    description: 'Discover videos on Babe Hub.',
    type: 'website',
  },
  alternates: { canonical: '/explore' },
};

type Props = {
  searchParams: Promise<{ q?: string }>;
};

export default async function ExplorePage({ searchParams }: Props) {
  const { q } = await searchParams;
  // The platform's default discovery surface is the Casting category.
  // Visiting /explore without a query → redirect to /explore?q=casting
  // so users always land on a populated section instead of generic
  // "latest" search results.
  if (q === undefined) {
    redirect('/explore?q=casting');
  }
  const query = q?.trim() ?? '';

  // Load both sources in parallel — independent of each other.
  const [firstPage, featured, primaryCreator] = await Promise.all([
    loadFeedPage(1, { query: query || 'all' }).catch((err: unknown) => ({
      error: err instanceof Error ? err.message : String(err),
    })),
    loadFeaturedCreatorVideos(10).catch(() => [] as Awaited<ReturnType<typeof loadFeaturedCreatorVideos>>),
    loadPrimaryCreator().catch(() => null),
  ]);

  const eporneFailed = 'error' in firstPage;

  // Each category gets its own treatment. Switching on the lowercased
  // query keeps it case-insensitive and accident-proof against trailing
  // whitespace (already trimmed above).
  const queryKey = query.toLowerCase();
  const showCastingNumbers = queryKey === 'casting';
  const showLiveCamsBanner = queryKey === 'live cams';
  const showLuxuryBanner = queryKey === 'luxury';

  const castingTaken = new Set<number>();
  const castingNumberMap = showCastingNumbers && !eporneFailed
    ? assignCastingNumbers(firstPage.videos, castingTaken)
    : new Map<string, number>();

  // Featured "Apply to be featured" slot placement.
  //   - Live Cams view: the first 4 grid spots are reserved for slots.
  //   - Casting / Luxury / default: ONE randomly placed slot mixed
  //     into the first batch. Position is derived from a stable hash
  //     of the first video id so it doesn't jump every render but
  //     varies by query.
  const featuredTheme: 'casting' | 'livecams' | 'luxury' | 'default' =
    showCastingNumbers
      ? 'casting'
      : showLiveCamsBanner
        ? 'livecams'
        : showLuxuryBanner
          ? 'luxury'
          : 'default';
  const liveCamsLeadingSlots = showLiveCamsBanner ? 4 : 0;
  let randomFeaturedIndex = -1;
  if (
    !eporneFailed &&
    !showLiveCamsBanner &&
    firstPage.videos.length > 0
  ) {
    const seed = firstPage.videos[0]?.id ?? query;
    let h = 0;
    for (let i = 0; i < seed.length; i++) {
      h = (Math.imul(h, 31) + seed.charCodeAt(i)) | 0;
    }
    randomFeaturedIndex = Math.abs(h) % firstPage.videos.length;
  }

  return (
    <main className="mx-auto max-w-7xl px-6 py-6">
      <div className="mb-6">
        <CategoryChips />
      </div>

      {/* Old-school ad strip — sits between the category nav and the
          category hero so it reads as a clearly demarcated ad zone.
          Click → opens the B2B BannerInquiryModal until a real
          advertiser is plugged in. */}
      <div className="mb-6">
        <AdStrip placement="explore-top" />
      </div>

      {/* ── Category hero banners (each section "starts with the banner") ─ */}
      {showCastingNumbers && <CastingBanner />}
      {showLiveCamsBanner && <LiveCamsBanner />}
      {showLuxuryBanner && <LuxuryBanner />}

      {/* ── Featured creators row ─────────────────────────────────────────── */}
      {featured.length > 0 && (
        <section className="mb-10">
          <div className="mb-3 flex items-baseline justify-between">
            <h2 className="text-lg font-bold text-text-main">Featured creators</h2>
            <p className="text-xs text-text-secondary">
              Latest from creators on Babe Hub · click for subscription perks
            </p>
          </div>
          <div className="-mx-2 flex gap-3 overflow-x-auto px-2 pb-3">
            {featured.map((video) => (
              <CreatorVideoCard key={video.postId} video={video} />
            ))}
          </div>
        </section>
      )}

      {/* ── Eporner grid ──────────────────────────────────────────────────── */}
      <section>
        {eporneFailed ? (
          <div className="rounded-2xl border border-red-500/40 bg-red-500/5 p-8 text-center">
            <p className="text-text-main">Can&apos;t load videos right now.</p>
            <p className="mt-2 text-xs text-text-secondary">
              The video catalog API is temporarily unreachable. Please try again in a moment.
            </p>
            <p className="mt-3 font-mono text-[10px] text-text-secondary/70">
              {'error' in firstPage ? firstPage.error : ''}
            </p>
          </div>
        ) : firstPage.videos.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border-color bg-secondary/40 p-12 text-center text-text-secondary">
            {query
              ? `No videos match "${query}". Try a different search.`
              : 'No videos to show right now. Try refreshing.'}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {/* Live Cams: 4 leading "Apply for a live slot" placeholders */}
            {Array.from({ length: liveCamsLeadingSlots }).map((_, i) => (
              <FeaturedSlot key={`lc-slot-${i}`} theme="livecams" />
            ))}

            {firstPage.videos.flatMap((video, i) => {
              const items = [];
              // Random "Apply to be featured" slot mixed into the
              // Casting / Luxury / default grids (one per first batch).
              if (i === randomFeaturedIndex) {
                items.push(
                  <FeaturedSlot key={`feat-${i}`} theme={featuredTheme} />,
                );
              }
              items.push(
                <VideoCard
                  key={video.id}
                  video={video}
                  castingNumber={
                    showCastingNumbers ? castingNumberMap.get(video.id) : undefined
                  }
                  primaryCreator={primaryCreator}
                />,
              );
              return items;
            })}

            <LoadMoreButton
              initialPage={firstPage.page}
              initialHasMore={firstPage.hasMore}
              query={query || undefined}
              showCastingNumbers={showCastingNumbers}
              initialUsedNumbers={
                showCastingNumbers ? Array.from(castingTaken) : []
              }
              primaryCreator={primaryCreator}
            />
          </div>
        )}
      </section>

      <footer className="mt-12 border-t border-border-color/40 pt-6 text-xs text-text-secondary">
        <p>
          Catalog videos sourced from the public eporner.com API. Creator videos are
          uploaded by Babe Hub creators. By browsing, you confirm you are 18+ and that
          adult content is legal in your jurisdiction.
        </p>
      </footer>
    </main>
  );
}
