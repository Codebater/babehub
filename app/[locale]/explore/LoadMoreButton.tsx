'use client';

import { useState, useTransition } from 'react';
import { Loader2 } from 'lucide-react';
import { loadMoreFeed } from './actions';
import type { FeedPost } from './types';
import PostCard from './PostCard';

/**
 * "Load more" pagination for /explore. Keeps the cursor + accumulated
 * posts in client state so we can append without remounting the entire
 * feed (preserves video playback positions, scroll position, etc.).
 *
 * We split the feed visually: video-only posts go in a full-width row,
 * everything else in a 2-col grid. The split is applied per page so new
 * batches mix in naturally.
 */
export default function LoadMoreButton({
  initialOffset,
  initialHasMore,
}: {
  initialOffset: number;
  initialHasMore: boolean;
}) {
  const [offset, setOffset] = useState(initialOffset);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [extra, setExtra] = useState<FeedPost[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (!hasMore && extra.length === 0) return null;

  const onClick = () => {
    setError(null);
    startTransition(async () => {
      try {
        const next = await loadMoreFeed(offset);
        setExtra((prev) => [...prev, ...next.posts]);
        setOffset(offset + next.posts.length);
        setHasMore(next.hasMore);
      } catch {
        setError('Could not load more posts. Try again?');
      }
    });
  };

  return (
    <>
      {extra.map((post) => (
        <div
          key={post.id}
          className={post.kind === 'video' ? 'md:col-span-2' : ''}
        >
          <PostCard post={post} creator={post.creator} mediaItems={post.mediaItems} />
        </div>
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
            {pending ? 'Loading…' : 'Load more'}
          </button>
        </div>
      )}

      {error && (
        <p className="col-span-full text-center text-sm text-red-400">{error}</p>
      )}
    </>
  );
}
