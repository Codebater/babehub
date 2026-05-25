'use client';

import { useEffect, useRef } from 'react';
import { X, ExternalLink } from 'lucide-react';
import type { FeedVideo } from './types';

/**
 * Fullscreen-ish modal for playing an eporner video inline via iframe.
 * Closes on:
 *   - Esc key
 *   - click on the dimmed backdrop
 *   - click the explicit Close button
 *
 * Locks body scroll while open so the page underneath doesn't jump on
 * mobile. Iframe is unsandboxed because eporner's player needs same-origin
 * access for autoplay + analytics; we're trusting the embed by design.
 */
export default function VideoModal({
  video,
  onClose,
}: {
  video: FeedVideo;
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Prevent background scroll while open.
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
      aria-label={video.title}
      onClick={(e) => {
        if (e.target === dialogRef.current) onClose();
      }}
      ref={dialogRef}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
    >
      <div className="relative w-full max-w-5xl">
        <div className="flex items-center justify-between gap-4 pb-3">
          <h2 className="line-clamp-1 flex-1 text-sm font-medium text-white">{video.title}</h2>
          <div className="flex items-center gap-2">
            <a
              href={video.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 rounded-full border border-white/20 px-3 py-1 text-xs text-white/80 transition-colors hover:border-white hover:text-white"
            >
              <ExternalLink className="h-3 w-3" />
              Open on source
            </a>
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
          <iframe
            src={video.embed}
            title={video.title}
            allow="autoplay; fullscreen; encrypted-media"
            allowFullScreen
            className="h-full w-full border-0"
          />
        </div>

        <p className="mt-3 line-clamp-1 text-xs text-white/50">
          {video.keywords.split(',').slice(0, 6).map((k) => k.trim()).filter(Boolean).join(' · ')}
        </p>
      </div>
    </div>
  );
}
