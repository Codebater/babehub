import { Play, Clock } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { formatCastingNumber } from '@/lib/casting/numbers';
import type { FeedVideo } from './types';
import type { PrimaryCreator } from './primary-creator';

/**
 * One eporner video card in the /explore grid.
 *
 * Design: pure-thumbnail tile — no visible card border or background.
 * The 16:9 thumbnail fills the cell; duration overlays bottom-right;
 * title sits below in 1–2 lines. Feels like a native mobile feed
 * (YouTube Shorts / TikTok grid) rather than a web card component.
 */
export default function VideoCard({
  video,
  castingNumber,
  primaryCreator = null,
}: {
  video: FeedVideo;
  castingNumber?: number;
  primaryCreator?: PrimaryCreator | null;
}) {
  const thumb = video.default_thumb?.src ?? video.thumbs?.[0]?.src ?? '';

  const formatViews = (n: number): string => {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
    return String(n);
  };

  const watchHref = {
    pathname: `/v/eporner/${video.id}` as '/v/eporner/[contentId]',
    query: {
      embed: video.embed,
      title: video.title,
      thumb,
      source: video.url,
      keywords: video.keywords,
      length: video.length_min,
      views: formatViews(video.views),
    },
  };

  return (
    <div className="group flex flex-col">
      {/* ── Thumbnail ─────────────────────────────────────────────── */}
      <Link href={watchHref} className="relative block aspect-video overflow-hidden rounded-md bg-zinc-900 sm:rounded-xl">
        {thumb && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={thumb}
            alt={video.title}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
        )}

        {/* Play overlay on hover */}
        <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/30">
          <span className="rounded-full bg-white/90 p-2.5 opacity-0 shadow-lg transition-all group-hover:opacity-100 sm:p-3">
            <Play className="h-4 w-4 fill-zinc-900 text-zinc-900 sm:h-5 sm:w-5" />
          </span>
        </div>

        {/* Casting badge */}
        {castingNumber !== undefined && (
          <div className="absolute left-1.5 top-1.5 overflow-hidden rounded border border-white/30 bg-black/90 font-mono text-white">
            <div
              className="h-1.5 w-full"
              style={{ backgroundImage: 'repeating-linear-gradient(-30deg, #fff 0 6px, #000 6px 12px)' }}
              aria-hidden
            />
            <div className="px-1.5 py-1">
              <p className="text-[7px] font-bold uppercase leading-none tracking-[0.2em] text-white/60">Take</p>
              <p className="mt-0.5 text-xs font-black leading-none">{formatCastingNumber(castingNumber)}</p>
            </div>
          </div>
        )}

        {/* Duration pill — bottom right */}
        <span className="absolute bottom-1.5 right-1.5 flex items-center gap-0.5 rounded bg-black/80 px-1.5 py-0.5 text-[10px] font-semibold leading-none text-white">
          <Clock className="h-2.5 w-2.5" />
          {video.length_min}
        </span>
      </Link>

      {/* ── Info below thumbnail ───────────────────────────────────── */}
      <div className="mt-1.5 px-0.5">
        <Link href={watchHref}>
          <h3 className="line-clamp-2 text-[11px] font-medium leading-tight text-text-main group-hover:text-primary sm:text-xs sm:leading-snug">
            {video.title}
          </h3>
        </Link>

        {primaryCreator && (
          <Link
            href={`/c/${primaryCreator.handle}` as '/c/[handle]'}
            className="mt-1 inline-flex items-center gap-1 text-[10px] text-text-secondary/70 transition-colors hover:text-primary"
          >
            <span className="h-3.5 w-3.5 shrink-0 overflow-hidden rounded-full bg-secondary">
              {primaryCreator.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={primaryCreator.avatarUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <span className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/40 to-pink-600/40 text-[7px] font-black text-white">
                  {primaryCreator.displayName.slice(0, 1).toUpperCase()}
                </span>
              )}
            </span>
            @{primaryCreator.handle}
          </Link>
        )}
      </div>
    </div>
  );
}
