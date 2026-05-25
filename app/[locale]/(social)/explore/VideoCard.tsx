'use client';

import { useState } from 'react';
import { Play, Eye, Clock } from 'lucide-react';
import VideoModal from './VideoModal';
import type { FeedVideo, ModalPayload } from './types';

/**
 * One eporner video card in the /explore grid. Thumbnail + duration +
 * title + view count. Click opens the unified VideoModal in iframe mode.
 *
 * Client component because it owns the modal-open state. Pairs with
 * CreatorVideoCard.tsx (same UX, different payload kind).
 */
export default function VideoCard({ video }: { video: FeedVideo }) {
  const [isOpen, setIsOpen] = useState(false);

  const thumb = video.default_thumb?.src ?? video.thumbs?.[0]?.src ?? '';

  const formatViews = (n: number): string => {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
    return String(n);
  };

  const modalPayload: ModalPayload = {
    kind: 'iframe',
    embed: video.embed,
    title: video.title,
    sourceUrl: video.url,
    keywords: video.keywords,
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="group flex flex-col overflow-hidden rounded-2xl border border-border-color bg-card text-left transition-colors hover:border-primary"
      >
        <div className="relative aspect-video bg-black">
          {thumb && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={thumb}
              alt={video.title}
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          )}

          <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/30">
            <span className="rounded-full bg-primary/90 p-4 opacity-0 transition-opacity group-hover:opacity-100">
              <Play className="h-6 w-6 fill-white text-white" />
            </span>
          </div>

          <span className="absolute bottom-2 right-2 flex items-center gap-1 rounded-md bg-black/70 px-2 py-0.5 text-xs font-medium text-white">
            <Clock className="h-3 w-3" />
            {video.length_min}
          </span>

          <span className="absolute bottom-2 left-2 flex items-center gap-1 rounded-md bg-black/70 px-2 py-0.5 text-xs font-medium text-white">
            <Eye className="h-3 w-3" />
            {formatViews(video.views)}
          </span>
        </div>

        <div className="flex-1 p-3">
          <h3 className="line-clamp-2 text-sm font-medium text-text-main group-hover:text-primary">
            {video.title}
          </h3>
        </div>
      </button>

      {isOpen && <VideoModal payload={modalPayload} onClose={() => setIsOpen(false)} />}
    </>
  );
}
