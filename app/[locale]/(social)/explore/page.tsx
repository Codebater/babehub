import type { Metadata } from 'next';
import Link from 'next/link';
import { loadFeedPage } from './data';
import { loadFeaturedCreatorVideos } from './creators';
import VideoCard from './VideoCard';
import CreatorVideoCard from './CreatorVideoCard';
import LoadMoreButton from './LoadMoreButton';
import SearchBar from './SearchBar';

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
  const query = q?.trim() ?? '';

  // Load both sources in parallel — independent of each other.
  const [firstPage, featured] = await Promise.all([
    loadFeedPage(1, { query: query || 'all' }).catch((err: unknown) => ({
      error: err instanceof Error ? err.message : String(err),
    })),
    loadFeaturedCreatorVideos(10).catch(() => [] as Awaited<ReturnType<typeof loadFeaturedCreatorVideos>>),
  ]);

  const eporneFailed = 'error' in firstPage;

  return (
    <main className="mx-auto max-w-7xl px-6 py-10">
      <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm uppercase tracking-widest text-text-secondary">Discover</p>
          <h1 className="mt-1 text-3xl font-black tracking-tight text-text-main md:text-4xl">
            {query ? `Search: ${query}` : 'Explore videos'}
          </h1>
        </div>
        <Link
          href="/app/login"
          className="hidden shrink-0 rounded-full border border-primary px-4 py-2 text-sm font-bold text-primary transition-colors hover:bg-primary hover:text-white sm:inline-flex"
        >
          Sign in
        </Link>
      </header>

      <div className="mb-10">
        <SearchBar initialQuery={query} />
      </div>

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

      {/* ── Trending eporner grid ─────────────────────────────────────────── */}
      <section>
        <h2 className="mb-4 text-lg font-bold text-text-main">
          {query ? `Results for "${query}"` : 'Trending videos'}
        </h2>

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
            {firstPage.videos.map((video) => (
              <VideoCard key={video.id} video={video} />
            ))}

            <LoadMoreButton
              initialPage={firstPage.page}
              initialHasMore={firstPage.hasMore}
              query={query || undefined}
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
