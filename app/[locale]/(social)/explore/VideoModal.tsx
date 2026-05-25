'use client';

import { useEffect, useRef, useState } from 'react';
import { X, ExternalLink, User, MessageSquare, Loader2 } from 'lucide-react';
import Link from 'next/link';
import VideoActions from '@/components/VideoActions';
import CommentThread from '@/components/CommentThread';
import type { CommentRow } from '@/lib/interactions/types';
import type { ModalPayload } from './types';

/**
 * Unified fullscreen video modal. Renders either:
 *   - an eporner iframe player (when payload.kind === 'iframe'), or
 *   - an HTML5 <video> player for creator-uploaded content
 *     (payload.kind === 'video').
 *
 * Plus the social block underneath the player:
 *   - VideoActions (like + favorite toggles)
 *   - CommentThread (flat thread + composer)
 *
 * Interactions are lazy-loaded via GET /api/interactions once the modal
 * mounts. While loading we show a spinner so the player remains usable
 * immediately.
 *
 * Closes on Esc, backdrop click, or the explicit Close button. Locks
 * background scroll while open so the page underneath doesn't jump on
 * mobile.
 */
type InteractionData = {
  likeCount: number;
  isLiked: boolean;
  isFavorited: boolean;
  comments: CommentRow[];
  commentCount: number;
  viewerId: string | null;
  isSignedIn: boolean;
};

export default function VideoModal({
  payload,
  onClose,
}: {
  payload: ModalPayload;
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const [interactions, setInteractions] = useState<InteractionData | null>(null);

  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);

    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener('keydown', onKey);
    };
  }, [onClose]);

  // Lazy-load like count + favorite state + comments.
  useEffect(() => {
    const provider = payload.kind === 'iframe' ? 'eporner' : 'creator_post';
    const url = `/api/interactions?provider=${provider}&content_id=${encodeURIComponent(payload.contentId)}`;
    let cancelled = false;
    fetch(url, { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!cancelled && data) setInteractions(data);
      })
      .catch(() => {
        // Swallow — the player still works without the social block.
      });
    return () => {
      cancelled = true;
    };
  }, [payload.kind, payload.contentId]);

  const provider = payload.kind === 'iframe' ? 'eporner' : 'creator_post';
  const meta =
    payload.kind === 'iframe'
      ? {
          title: payload.title,
          thumbUrl: payload.thumbUrl ?? null,
          embedUrl: payload.embed,
          sourceUrl: payload.sourceUrl,
        }
      : {
          title: payload.title,
          thumbUrl: payload.thumbUrl ?? null,
        };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={payload.title}
      onClick={(e) => {
        if (e.target === dialogRef.current) onClose();
      }}
      ref={dialogRef}
      className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-black/80 p-4 backdrop-blur-sm sm:items-center"
    >
      <div className="relative w-full max-w-5xl">
        <div className="flex items-center justify-between gap-4 pb-3">
          <h2 className="line-clamp-1 flex-1 text-sm font-medium text-white">
            {payload.title}
          </h2>
          <div className="flex items-center gap-2">
            {payload.kind === 'iframe' ? (
              <a
                href={payload.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="hidden items-center gap-1 rounded-full border border-white/20 px-3 py-1 text-xs text-white/80 transition-colors hover:border-white hover:text-white sm:flex"
              >
                <ExternalLink className="h-3 w-3" />
                Source
              </a>
            ) : (
              <Link
                href={`/c/${payload.creatorHandle}`}
                onClick={onClose}
                className="flex items-center gap-1 rounded-full bg-primary px-3 py-1 text-xs font-bold text-white transition-colors hover:bg-pink-400"
              >
                <User className="h-3 w-3" />
                <span className="hidden sm:inline">View {payload.creatorName} →</span>
                <span className="sm:hidden">Profile</span>
              </Link>
            )}
            <button
              type="button"
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-white/20 text-white/80 transition-colors hover:border-white hover:text-white"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="aspect-video w-full overflow-hidden rounded-xl bg-black shadow-2xl">
          {payload.kind === 'iframe' ? (
            <iframe
              src={payload.embed}
              title={payload.title}
              allow="autoplay; fullscreen; encrypted-media"
              allowFullScreen
              className="h-full w-full border-0"
            />
          ) : (
            <video
              src={payload.src}
              title={payload.title}
              controls
              autoPlay
              playsInline
              className="h-full w-full"
            />
          )}
        </div>

        {payload.kind === 'iframe' && payload.keywords && (
          <p className="mt-3 line-clamp-1 text-xs text-white/50">
            {payload.keywords
              .split(',')
              .slice(0, 6)
              .map((k) => k.trim())
              .filter(Boolean)
              .join(' · ')}
          </p>
        )}

        {/* ── Social block ─────────────────────────────────────────────── */}
        <div className="mt-4 rounded-2xl border border-white/10 bg-card/95 p-4">
          {interactions === null ? (
            <div className="flex items-center justify-center py-4 text-text-secondary">
              <Loader2 className="h-4 w-4 animate-spin" />
            </div>
          ) : (
            <>
              <div className="mb-4 flex flex-wrap items-center gap-3">
                <VideoActions
                  provider={provider}
                  contentId={payload.contentId}
                  initialLikeCount={interactions.likeCount}
                  initialIsLiked={interactions.isLiked}
                  initialIsFavorited={interactions.isFavorited}
                  isSignedIn={interactions.isSignedIn}
                  meta={meta}
                />
                <span className="flex items-center gap-1 text-xs text-text-secondary">
                  <MessageSquare className="h-3.5 w-3.5" />
                  {interactions.commentCount}{' '}
                  {interactions.commentCount === 1 ? 'comment' : 'comments'}
                </span>
              </div>

              <CommentThread
                provider={provider}
                contentId={payload.contentId}
                initialComments={interactions.comments}
                viewerId={interactions.viewerId}
                isSignedIn={interactions.isSignedIn}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
