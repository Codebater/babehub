import type { Metadata } from 'next';
import Link from 'next/link';
import { loadFeedPage } from './data';
import VideoCard from './VideoCard';
import LoadMoreButton from './LoadMoreButton';

/**
 * `/explore` — public video discovery feed.
 *
 * Source: eporner v2 search API (no auth required), cached for 5 min via
 * Next.js `fetch` revalidation. Each card opens an inline iframe modal
 * for playback — eporner doesn't expose raw MP4 URLs, so embedding is
 * the only path.
 *
 * Phase 2 idea: mix creator-posted videos from /c/{handle} into this
 * grid (with a "Featured creators" section at the top) so subscribers
 * can convert in the same browsing session.
 */
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Explore — Babe Hub',
  description:
    'Discover videos on Babe Hub. Browse the latest and trending content from our global catalog.',
  openGraph: {
    title: 'Explore — Babe Hub',
    description: 'Discover videos on Babe Hub.',
    type: 'website',
  },
  alternates: { canonical: '/explore' },
};

export default async function ExplorePage() {
  let firstPage;
  try {
    firstPage = await loadFeedPage(1);
  } catch (err) {
    return (
      <main className="mx-auto max-w-5xl px-6 py-16">
        <h1 className="text-2xl font-black text-text-main">Can&apos;t load videos right now</h1>
        <p className="mt-3 text-text-secondary">
          The video catalog API is temporarily unreachable. Please try again in a moment.
        </p>
        <p className="mt-2 text-xs text-text-secondary/70">
          {err instanceof Error ? err.message : String(err)}
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-7xl px-6 py-10">
      <header className="mb-8 flex items-end justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-widest text-text-secondary">Discover</p>
          <h1 className="mt-1 text-3xl font-black tracking-tight text-text-main md:text-4xl">
            Trending videos
          </h1>
          <p className="mt-2 text-sm text-text-secondary">
            Browse the latest from our global video catalog. For exclusive content
            from individual creators, visit their profile at{' '}
            <span className="font-mono text-primary">babehub.net/c/&lt;handle&gt;</span>.
          </p>
        </div>
        <Link
          href="/app/login"
          className="hidden shrink-0 rounded-full border border-primary px-4 py-2 text-sm font-bold text-primary transition-colors hover:bg-primary hover:text-white sm:inline-flex"
        >
          Sign in
        </Link>
      </header>

      {firstPage.videos.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border-color bg-secondary/40 p-12 text-center text-text-secondary">
          No videos to show right now. Try refreshing.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {firstPage.videos.map((video) => (
            <VideoCard key={video.id} video={video} />
          ))}

          <LoadMoreButton
            initialPage={firstPage.page}
            initialHasMore={firstPage.hasMore}
          />
        </div>
      )}

      {/* Compliance / context footer */}
      <footer className="mt-12 border-t border-border-color/40 pt-6 text-xs text-text-secondary">
        <p>
          Videos sourced from the public eporner.com catalog via their official API.
          By browsing, you confirm you are 18+ and that adult content is legal in
          your jurisdiction.
        </p>
      </footer>
    </main>
  );
}
