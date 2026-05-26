'use client';

import { useRef, useState, useTransition } from 'react';
import { Loader2 } from 'lucide-react';
import { loadMoreFeed } from './actions';
import type { FeedVideo } from './types';
import VideoCard from './VideoCard';
import SponsoredSlot from './SponsoredSlot';
import { assignCastingNumbers } from '@/lib/casting/numbers';
import type { PrimaryCreator } from './primary-creator';

/**
 * "Load more" pagination for /explore. Holds the cursor (next page
 * number) + accumulated videos in client state so we can append the
 * next batch without remounting the grid (preserves scroll position
 * etc.).
 *
 * `query` is the current search term — pagination stays inside the
 * same search context so "Load more" doesn't drop you back to the
 * unfiltered latest feed.
 *
 * `showCastingNumbers` + `initialUsedNumbers` thread the casting-slate
 * numbering through the load-more flow. The server already assigned
 * numbers to the initial batch on /explore?q=casting; this component
 * continues the sequence on subsequent batches, deduping against the
 * union of all previously-shown numbers so no card ever shares a
 * number with another.
 */
export default function LoadMoreButton({
  initialPage,
  initialHasMore,
  query,
  showCastingNumbers = false,
  initialUsedNumbers = [],
  primaryCreator = null,
  locked = false,
}: {
  initialPage: number;
  initialHasMore: boolean;
  query?: string;
  showCastingNumbers?: boolean;
  initialUsedNumbers?: number[];
  /** Primary platform creator — used to attribute every catalog card. */
  primaryCreator?: PrimaryCreator | null;
  /**
   * When true, each appended VideoCard renders inside its own
   * blurred + click-blocked grid cell — same visual posture as the
   * initial PremiumGate-wrapped grid above. Keeps the premium pitch
   * consistent across pagination instead of revealing unblurred
   * content after one click.
   */
  locked?: boolean;
}) {
  const [nextPage, setNextPage] = useState(initialPage + 1);
  const [hasMore, setHasMore] = useState(initialHasMore);
  // Each batch we load gets an index here, so we can splice in a
  // sponsored-slot card between batches without re-keying the whole
  // list when the user clicks Load more again.
  const [batches, setBatches] = useState<FeedVideo[][]>([]);
  const [castingMap, setCastingMap] = useState<Map<string, number>>(
    () => new Map(),
  );
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  // Used-numbers set lives in a ref so we can mutate it across batches
  // without forcing re-renders on every assignment.
  const usedNumbersRef = useRef<Set<number>>(new Set(initialUsedNumbers));

  if (!hasMore && batches.length === 0) return null;

  const onClick = () => {
    setError(null);
    startTransition(async () => {
      try {
        const next = await loadMoreFeed(nextPage, { query });
        if (showCastingNumbers && next.videos.length > 0) {
          const assignments = assignCastingNumbers(next.videos, usedNumbersRef.current);
          setCastingMap((prev) => {
            const merged = new Map(prev);
            assignments.forEach((value, key) => merged.set(key, value));
            return merged;
          });
        }
        setBatches((prev) => [...prev, next.videos]);
        setNextPage(next.page + 1);
        setHasMore(next.hasMore);
      } catch {
        setError('Could not load more videos. Try again?');
      }
    });
  };

  // When `locked=true`, every appended cell wraps with the same
  // blur+pointer-block as the initial PremiumGate grid above so the
  // premium pitch stays consistent across pagination. The button
  // itself stays OUTSIDE this wrap, so it remains usable.
  //
  // Sponsored slots span the whole grid (col-span-full); we preserve
  // that on the wrapper itself so it still occupies the full row even
  // when wrapped.
  const lockClass = locked ? 'pointer-events-none select-none blur-[3px]' : '';

  return (
    <>
      {batches.flatMap((batch, batchIdx) => [
        <div
          key={`sponsor-${batchIdx}`}
          className={`col-span-full ${lockClass}`}
          aria-hidden={locked || undefined}
        >
          <SponsoredSlot />
        </div>,
        ...batch.map((video) => (
          <div
            key={video.id}
            className={lockClass}
            aria-hidden={locked || undefined}
          >
            <VideoCard
              video={video}
              castingNumber={showCastingNumbers ? castingMap.get(video.id) : undefined}
              primaryCreator={primaryCreator}
            />
          </div>
        )),
      ])}

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
