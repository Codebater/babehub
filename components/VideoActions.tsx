'use client';

import { useState, useTransition } from 'react';
import { Heart, Star, LogIn } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { toggleLike, toggleFavorite } from '@/lib/interactions/actions';
import type { ContentMeta, ContentProvider } from '@/lib/interactions/types';

/**
 * Like + Favorite toggles for a single video. Used inside VideoModal and
 * beneath creator profile post cards.
 *
 * Anonymous users see a "Sign in" pill instead — clicking either toggle
 * before signing in would just no-op silently otherwise.
 *
 * Optimistic UI: counts and toggle states update instantly; if the
 * server call fails we roll back. The action call returns an
 * authoritative count which then replaces the optimistic value.
 */
type Props = {
  provider: ContentProvider;
  contentId: string;
  /** Initial like total to seed the count. */
  initialLikeCount: number;
  initialIsLiked: boolean;
  initialIsFavorited: boolean;
  /** Whether the viewer is signed in. Drives the Sign in CTA. */
  isSignedIn: boolean;
  /** Cached metadata stored on the favorite row for the /favorites list. */
  meta?: ContentMeta;
  /** Layout: 'horizontal' (modal/profile) | 'compact' (card overlays). */
  layout?: 'horizontal' | 'compact';
};

export default function VideoActions({
  provider,
  contentId,
  initialLikeCount,
  initialIsLiked,
  initialIsFavorited,
  isSignedIn,
  meta = {},
  layout = 'horizontal',
}: Props) {
  const [likeCount, setLikeCount] = useState(initialLikeCount);
  const [isLiked, setIsLiked] = useState(initialIsLiked);
  const [isFavorited, setIsFavorited] = useState(initialIsFavorited);
  const [isPending, startTransition] = useTransition();

  if (!isSignedIn) {
    return (
      <div className={layout === 'compact' ? 'flex gap-2' : 'flex items-center gap-3'}>
        <Link
          href="/app/login"
          className="inline-flex items-center gap-2 rounded-full border border-primary px-3 py-1.5 text-xs font-bold text-primary transition-colors hover:bg-primary hover:text-white"
        >
          <LogIn className="h-3.5 w-3.5" />
          Sign in to react
        </Link>
      </div>
    );
  }

  const onLike = () => {
    const next = !isLiked;
    // Optimistic
    setIsLiked(next);
    setLikeCount((c) => c + (next ? 1 : -1));

    startTransition(async () => {
      const res = await toggleLike(provider, contentId, next ? 'like' : 'unlike');
      if (res.ok) {
        // Reconcile with the authoritative count from the server.
        setLikeCount(res.data.likeCount);
        setIsLiked(res.data.isLiked);
      } else {
        // Roll back optimistic update.
        setIsLiked(!next);
        setLikeCount((c) => c + (next ? -1 : 1));
      }
    });
  };

  const onFavorite = () => {
    const next = !isFavorited;
    setIsFavorited(next);

    startTransition(async () => {
      const res = await toggleFavorite(
        provider,
        contentId,
        next ? 'add' : 'remove',
        meta,
      );
      if (!res.ok) setIsFavorited(!next);
      else setIsFavorited(res.data.isFavorited);
    });
  };

  return (
    <div className={layout === 'compact' ? 'flex gap-2' : 'flex items-center gap-3'}>
      <button
        type="button"
        onClick={onLike}
        disabled={isPending}
        aria-pressed={isLiked}
        className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-bold transition-colors disabled:opacity-60 ${
          isLiked
            ? 'bg-red-500/20 text-red-400'
            : 'border border-border-color text-text-secondary hover:border-red-400/60 hover:text-red-400'
        }`}
      >
        <Heart
          className={`h-4 w-4 transition-transform ${isLiked ? 'fill-current scale-110' : ''}`}
        />
        {likeCount}
      </button>

      <button
        type="button"
        onClick={onFavorite}
        disabled={isPending}
        aria-pressed={isFavorited}
        title={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
        className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-bold transition-colors disabled:opacity-60 ${
          isFavorited
            ? 'bg-yellow-500/20 text-yellow-400'
            : 'border border-border-color text-text-secondary hover:border-yellow-400/60 hover:text-yellow-400'
        }`}
      >
        <Star className={`h-4 w-4 ${isFavorited ? 'fill-current' : ''}`} />
        {isFavorited ? 'Saved' : 'Save'}
      </button>
    </div>
  );
}
