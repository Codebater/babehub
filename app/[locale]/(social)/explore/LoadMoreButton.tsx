'use client';

import { useState, useTransition } from 'react';
import { Loader2 } from 'lucide-react';
import { loadMoreFeed } from './actions';
import type { FeedVideo } from './types';
import VideoCard from './VideoCard';

/**
 * "Load more" pagination for /explore. Holds the cursor (next page
 * number) + accumulated videos in client state so we can append the
 * next batch without remounting the grid (preserves modal state,
 * scroll position, etc.).
 *
 * `query` is the current search term — pagination stays inside the
 * same search context so "Load more" doesn't drop you back to the
 * unfiltered latest feed.
 */
export default function LoadMoreButton({
  initialPage,
  initialHasMore,
  query,
}: {
  initialPage: number;
  initialHasMore: boolean;
  query?: string;
}) {
  const [nextPage, setNextPage] = useState(initialPage + 1);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [extra, setExtra] = useState<FeedVideo[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (!hasMore && extra.length === 0) return null;

  const onClick = () => {
    setError(null);
    startTransition(async () => {
      try {
        const next = await loadMoreFeed(nextPage, { query });
        setExtra((prev) => [...prev, ...next.videos]);
        setNextPage(next.page + 1);
        setHasMore(next.hasMore);
      } catch {
        setError('Could not load more videos. Try again?');
      }
    });
  };

  return (
    <>
      {extra.map((video) => (
        <VideoCard key={video.id} video={video} />
      ))}

      {hasMore && (
        <div className="col-span-full mt-4 flex justify-center">
          <button
            type="button"
            onClick={onClick}
            disabled={pending}
            className="flex items-center gap-2 rounded-full border border-border-color px-6 py-3 text-sm font-medium text-text-main transition-colors hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
          >
            {pending && <Loader2 className="h-4 w-4 animate-spin" />}
            {pending ? 'Loading…' : 'Load more videos'}
          </button>
        </div>
      )}

      {error && (
        <p className="col-span-full text-center text-sm text-red-400">{error}</p>
      )}
    </>
  );
}
