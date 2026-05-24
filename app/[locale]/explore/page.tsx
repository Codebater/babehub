import type { Metadata } from 'next';
import Link from 'next/link';
import { loadFeedPage } from './actions';
import PostCard from './PostCard';
import LoadMoreButton from './LoadMoreButton';

/**
 * `/explore` — public global feed of every free post on Babe Hub.
 *
 * Dynamic on purpose (no SSG): new posts land here constantly, and we
 * want first-paint to reflect the latest state without revalidation
 * tricks. The query is RLS-aware via the cookie-aware Supabase client,
 * but for `/explore` the policy already filters to `tier_required_id is
 * null` so anon viewers and signed-in viewers see the same content —
 * tier-locked content stays on the creator profile only.
 */
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Explore — Babe Hub',
  description:
    'Discover creators on Babe Hub. Browse the latest free video and photo posts from our community of creators.',
  openGraph: {
    title: 'Explore — Babe Hub',
    description: 'Discover creators on Babe Hub.',
    type: 'website',
  },
  alternates: { canonical: '/explore' },
};

export default async function ExplorePage() {
  const firstPage = await loadFeedPage(0);

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <header className="mb-8 flex items-end justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-widest text-text-secondary">Discover</p>
          <h1 className="mt-1 text-3xl font-black tracking-tight text-text-main md:text-4xl">
            Latest from our creators
          </h1>
          <p className="mt-2 text-sm text-text-secondary">
            Free posts from every creator on Babe Hub. Subscribe to a creator&apos;s tier on their
            profile to unlock their private content.
          </p>
        </div>
        <Link
          href="/app/login"
          className="hidden shrink-0 rounded-full border border-primary px-4 py-2 text-sm font-bold text-primary transition-colors hover:bg-primary hover:text-white sm:inline-flex"
        >
          Sign in
        </Link>
      </header>

      {firstPage.posts.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border-color bg-secondary/40 p-12 text-center">
          <p className="text-text-secondary">
            No public posts yet. Be the first to publish — sign in and head to your dashboard.
          </p>
          <Link
            href="/app/login"
            className="mt-6 inline-block rounded-full bg-primary px-6 py-3 font-bold text-white transition-all hover:bg-pink-400 hover:scale-[1.02]"
          >
            Get started
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* Video posts span 2 columns on md+ so they're the visual centerpiece. */}
          {firstPage.posts.map((post) => (
            <div
              key={post.id}
              className={post.kind === 'video' ? 'md:col-span-2' : ''}
            >
              <PostCard post={post} creator={post.creator} mediaItems={post.mediaItems} />
            </div>
          ))}

          <LoadMoreButton initialOffset={firstPage.posts.length} initialHasMore={firstPage.hasMore} />
        </div>
      )}
    </main>
  );
}
