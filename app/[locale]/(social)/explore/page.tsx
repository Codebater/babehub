import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { loadFeedPage } from './data';
import { loadFeaturedCreatorVideos } from './creators';
import VideoCard from './VideoCard';
import CreatorVideoCard from './CreatorVideoCard';
import LoadMoreButton from './LoadMoreButton';
import CastingBanner from './CastingBanner';
import LiveCamsBanner from './LiveCamsBanner';
import LuxuryBanner from './LuxuryBanner';
import FeaturedSlot from './FeaturedSlot';
import { loadPrimaryCreator } from './primary-creator';
import { assignCastingNumbers } from '@/lib/casting/numbers';
import AdStrip from '../_components/AdStrip';
import { createClient } from '@/lib/supabase/server';
import { isElevated } from '@/lib/limits';
import PremiumGate from './PremiumGate';

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

// Per-category SEO — each browse surface gets its own targeted title,
// description, and keyword set so Google can rank each entry point
// independently (casting vs live cams vs luxury vs general explore).
const CATEGORY_META: Record<
  string,
  { title: string; description: string; keywords: string[] }
> = {
  casting: {
    title: 'Adult Casting Calls & Auditions — Babe Hub',
    description:
      'Browse the latest adult casting calls and auditions. Apply directly to real paid gigs posted by verified agencies, studios, and brands on Babe Hub.',
    keywords: [
      'adult casting calls',
      'OnlyFans casting',
      'adult model auditions',
      'creator casting calls',
      'adult content casting',
      'paid casting work',
      'casting agency adult',
    ],
  },
  'live cams': {
    title: 'Live Cam Model Jobs & Opportunities — Babe Hub',
    description:
      'Find live cam model jobs and webcam work opportunities. Connect with studios and agencies hiring cam models worldwide — remote and flexible.',
    keywords: [
      'cam model jobs',
      'live cam model',
      'webcam model work',
      'cam studio jobs',
      'live streaming model jobs',
      'work from home cam model',
    ],
  },
  luxury: {
    title: 'Luxury Adult Content Creator Opportunities — Babe Hub',
    description:
      'Premium luxury adult content opportunities for top-tier creators. High-budget projects, brand deals, and exclusive placements for verified creators.',
    keywords: [
      'luxury adult content',
      'premium creator opportunities',
      'high budget adult content',
      'luxury casting calls',
      'elite adult creator work',
    ],
  },
};

const DEFAULT_META = {
  title: 'Explore Adult Creators & Videos — Babe Hub',
  description:
    'Discover adult content creators, casting calls, live cams, and more on Babe Hub. Browse thousands of creator videos and find your next opportunity.',
  keywords: [
    'adult content creators',
    'OnlyFans creators',
    'adult video explore',
    'creator discovery',
    'adult content platform',
  ],
};

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { q } = await searchParams;
  const cat = q?.toLowerCase().trim() ?? '';
  const meta = CATEGORY_META[cat] ?? {
    ...DEFAULT_META,
    ...(cat
      ? {
          title: `${cat.charAt(0).toUpperCase() + cat.slice(1)} Creators — Babe Hub`,
          description: `Discover ${cat} adult content creators and opportunities on Babe Hub.`,
        }
      : {}),
  };
  const canonical = cat ? `/explore?q=${encodeURIComponent(cat)}` : '/explore';
  return {
    title: meta.title,
    description: meta.description,
    keywords: meta.keywords,
    alternates: { canonical },
    openGraph: {
      title: meta.title,
      description: meta.description,
      type: 'website',
      url: `https://babehub.net${canonical}`,
      images: ['/og-image.png'],
    },
    twitter: {
      card: 'summary_large_image',
      title: meta.title,
      description: meta.description,
    },
  };
}

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

  // ── Viewer premium gate ─────────────────────────────────────────
  // Casting videos blur for non-elevated viewers. "Elevated" = admin,
  // verified, or active premium. Single Supabase round-trip to pull
  // the four flags; anonymous viewers go straight to "not elevated".
  let viewerElevated = false;
  {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      const { data: viewerRow } = await supabase
        .from('profiles')
        .select('role, is_verified, is_premium, premium_until')
        .eq('id', user.id)
        .maybeSingle();
      viewerElevated = isElevated(viewerRow);
    }
  }

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
      {/* Old-school ad strip — sits at the top of the page, just
          above the category hero so it reads as a clearly demarcated
          ad zone. Click → opens the B2B BannerInquiryModal until a
          real advertiser is plugged in. (The Categories nav was
          removed from the top; sidebar Categories cover the same
          destinations.) */}
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
      {/* The gate wraps ONLY the initial grid of cards. LoadMoreButton
          sits as a sibling underneath, so it stays clickable + readable
          even when the section is blurred. Its appended cells inherit
          the same per-cell blur via the `locked` prop so the premium
          pitch stays consistent across pagination. */}
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
          <>
            <PremiumGate
              locked={showCastingNumbers && !viewerElevated}
              category="Casting"
            >
              <div className="grid grid-cols-2 gap-1 sm:gap-3 lg:grid-cols-3 xl:grid-cols-4">
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
              </div>
            </PremiumGate>

            {/* Load more — lives OUTSIDE the gate so it's always
                clickable/readable. The button passes `locked` through
                so freshly-loaded batches stay blurred for non-premium
                viewers, matching the initial grid above. */}
            <div className="mt-6 grid grid-cols-2 gap-1 sm:gap-3 lg:grid-cols-3 xl:grid-cols-4">
              <LoadMoreButton
                initialPage={firstPage.page}
                initialHasMore={firstPage.hasMore}
                query={query || undefined}
                showCastingNumbers={showCastingNumbers}
                initialUsedNumbers={
                  showCastingNumbers ? Array.from(castingTaken) : []
                }
                primaryCreator={primaryCreator}
                locked={showCastingNumbers && !viewerElevated}
              />
            </div>
          </>
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
