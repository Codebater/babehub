'use client';

import { useEffect, useRef } from 'react';
import { X, ExternalLink, User } from 'lucide-react';
import Link from 'next/link';
import type { ModalPayload } from './types';

/**
 * Unified fullscreen video modal. Renders either:
 *   - an eporner iframe player (when payload.kind === 'iframe'), or
 *   - an HTML5 <video> player for creator-uploaded content
 *     (payload.kind === 'video').
 *
 * Closes on Esc, backdrop click, or the explicit Close button. Locks
 * background scroll while open so the page underneath doesn't jump on
 * mobile.
 *
 * For creator videos the header includes a "View creator profile →" CTA
 * that links to /c/{handle} — the primary conversion path back into the
 * subscription flow.
 */
export default function VideoModal({
  payload,
  onClose,
}: {
  payload: ModalPayload;
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDivElement>(null);

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

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={payload.title}
      onClick={(e) => {
        if (e.target === dialogRef.current) onClose();
      }}
      ref={dialogRef}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
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
                className="flex items-center gap-1 rounded-full border border-white/20 px-3 py-1 text-xs text-white/80 transition-colors hover:border-white hover:text-white"
              >
                <ExternalLink className="h-3 w-3" />
                Open on source
              </a>
            ) : (
              <Link
                href={`/c/${payload.creatorHandle}`}
                onClick={onClose}
                className="flex items-center gap-1 rounded-full bg-primary px-3 py-1 text-xs font-bold text-white transition-colors hover:bg-pink-400"
              >
                <User className="h-3 w-3" />
                View {payload.creatorName} →
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
      </div>
    </div>
  );
}
