'use client';

import { useState } from 'react';
import { MessageSquare } from 'lucide-react';
import VideoActions from './VideoActions';
import CommentThread from './CommentThread';
import type {
  CommentRow,
  ContentMeta,
  ContentProvider,
} from '@/lib/interactions/types';

/**
 * Footer block for a creator-profile post card: like/favorite actions
 * + a collapsible comment thread.
 *
 * Defaults to collapsed so 20 posts on a profile don't render 200
 * comment rows at once. Tapping the comment count expands the thread
 * for that post (state is per-instance, no global selection).
 *
 * Initial comments + counts come from the server in one batched query
 * via `loadFullInteractionsBatch` — so expanding is instant, no
 * client-side fetch needed.
 */
type Props = {
  provider: ContentProvider;
  contentId: string;
  initialLikeCount: number;
  initialIsLiked: boolean;
  initialIsFavorited: boolean;
  initialComments: CommentRow[];
  commentCount: number;
  viewerId: string | null;
  isSignedIn: boolean;
  meta?: ContentMeta;
};

export default function PostInteractions({
  provider,
  contentId,
  initialLikeCount,
  initialIsLiked,
  initialIsFavorited,
  initialComments,
  commentCount,
  viewerId,
  isSignedIn,
  meta,
}: Props) {
  const [showComments, setShowComments] = useState(false);

  return (
    <div className="border-t border-border-color/40 px-5 py-4">
      <div className="flex flex-wrap items-center gap-3">
        <VideoActions
          provider={provider}
          contentId={contentId}
          initialLikeCount={initialLikeCount}
          initialIsLiked={initialIsLiked}
          initialIsFavorited={initialIsFavorited}
          isSignedIn={isSignedIn}
          meta={meta}
        />
        <button
          type="button"
          onClick={() => setShowComments((v) => !v)}
          aria-expanded={showComments}
          className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-bold transition-colors ${
            showComments
              ? 'bg-primary/10 text-primary'
              : 'border border-border-color text-text-secondary hover:border-primary hover:text-primary'
          }`}
        >
          <MessageSquare className="h-4 w-4" />
          {commentCount} {commentCount === 1 ? 'comment' : 'comments'}
        </button>
      </div>

      {showComments && (
        <div className="mt-4">
          <CommentThread
            provider={provider}
            contentId={contentId}
            initialComments={initialComments}
            viewerId={viewerId}
            isSignedIn={isSignedIn}
          />
        </div>
      )}
    </div>
  );
}
