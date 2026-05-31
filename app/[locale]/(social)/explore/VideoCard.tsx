import { Play, Eye, Clock, ShieldCheck } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { formatCastingNumber } from '@/lib/casting/numbers';
import type { FeedVideo } from './types';
import type { PrimaryCreator } from './primary-creator';

/**
 * One eporner video card in the /explore grid. Thumbnail + duration +
 * title + view count. Click navigates to /v/eporner/{id} where the
 * dedicated video page lives inside the (social) shell.
 *
 * Outer wrapper is a `<div>` (not a Link) because the card has two
 * separate navigation targets that can't both be anchor tags inside
 * each other:
 *   - the thumbnail + title → /v/eporner/{id}
 *   - the optional creator-attribution pill → /c/{handle}
 *
 * Player metadata (embed URL, title, thumb, source URL, keywords) is
 * passed via URL query params — eporner doesn't ship a get-by-id
 * endpoint and we already have everything from the search response
 * that produced this card, so threading params avoids a second API
 * round-trip per page render.
 */
export default function VideoCard({
  video,
  castingNumber,
  primaryCreator = null,
}: {
  video: FeedVideo;
  /** When set, renders a casting-slate badge over the thumbnail. */
  castingNumber?: number;
  /**
   * Platform creator credited as the "uploader" of this catalog card.
   * Renders a small avatar + handle pill in the card body that links
   * to /c/{handle}. When null, no attribution is shown.
   */
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
    <div className="group flex flex-col overflow-hidden rounded-lg border border-border-color bg-card text-left transition-colors hover:border-primary sm:rounded-2xl">
      <Link href={watchHref} className="block">
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
            <span className="rounded-full bg-primary/90 p-2 opacity-0 transition-opacity group-hover:opacity-100 sm:p-4">
              <Play className="h-4 w-4 fill-white text-white sm:h-6 sm:w-6" />
            </span>
          </div>

          {castingNumber !== undefined && (
            <div className="absolute left-1.5 top-1.5 overflow-hidden rounded-md border border-white/40 bg-black font-mono text-white shadow-2xl sm:left-2 sm:top-2">
              <div
                className="h-1.5 w-full sm:h-2"
                style={{
                  backgroundImage:
                    'repeating-linear-gradient(-30deg, #ffffff 0 8px, #000000 8px 16px)',
                }}
                aria-hidden
              />
              <div className="px-1.5 py-1 sm:px-2.5 sm:py-1.5">
                <p className="text-[7px] font-bold uppercase leading-none tracking-[0.2em] text-white/70 sm:text-[8px] sm:tracking-[0.25em]">
                  Casting · Take
                </p>
                <p className="mt-0.5 text-sm font-black leading-none tracking-tight sm:mt-1 sm:text-lg">
                  {formatCastingNumber(castingNumber)}
                </p>
              </div>
            </div>
          )}

          {/* Duration — bottom-right */}
          <span className="absolute bottom-1.5 right-1.5 flex items-center gap-0.5 rounded bg-black/75 px-1 py-0.5 text-[10px] font-medium text-white sm:bottom-2 sm:right-2 sm:gap-1 sm:rounded-md sm:px-2 sm:text-xs">
            <Clock className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
            {video.length_min}
          </span>

          {/* Views — bottom-left, hidden on very small to avoid clutter */}
          <span className="absolute bottom-1.5 left-1.5 hidden items-center gap-0.5 rounded bg-black/75 px-1 py-0.5 text-[10px] font-medium text-white sm:bottom-2 sm:left-2 sm:flex sm:gap-1 sm:rounded-md sm:px-2 sm:text-xs">
            <Eye className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
            {formatViews(video.views)}
          </span>
        </div>
      </Link>

      <div className="flex-1 p-2 sm:p-3">
        <Link href={watchHref} className="block">
          <h3 className="line-clamp-2 text-[11px] font-medium leading-snug text-text-main group-hover:text-primary sm:text-sm">
            {video.title}
          </h3>
        </Link>

        {primaryCreator && (
          <Link
            href={`/c/${primaryCreator.handle}` as '/c/[handle]'}
            className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-secondary/60 px-1.5 py-0.5 transition-colors hover:bg-primary/15 sm:mt-2 sm:gap-1.5 sm:px-2 sm:py-1"
          >
            <span className="h-4 w-4 shrink-0 overflow-hidden rounded-full bg-secondary sm:h-5 sm:w-5">
              {primaryCreator.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={primaryCreator.avatarUrl}
                  alt=""
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/40 to-pink-600/40 text-[8px] font-black text-white">
                  {primaryCreator.displayName.slice(0, 1).toUpperCase()}
                </span>
              )}
            </span>
            <span className="flex items-center gap-0.5 text-[10px] font-medium text-text-secondary sm:text-[11px]">
              <ShieldCheck className="h-2.5 w-2.5 text-primary sm:h-3 sm:w-3" />
              @{primaryCreator.handle}
            </span>
          </Link>
        )}
      </div>
    </div>
  );
}
