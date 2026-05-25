import { Play, Eye, Clock } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { formatCastingNumber } from '@/lib/casting/numbers';
import type { FeedVideo } from './types';

/**
 * One eporner video card in the /explore grid. Thumbnail + duration +
 * title + view count. Click navigates to /v/eporner/{id} where the
 * dedicated video page lives inside the (social) shell.
 *
 * Player metadata (embed URL, title, thumb, source URL, keywords) is
 * passed via URL query params — eporner doesn't ship the video page a
 * "get by id" endpoint and we already have everything from the search
 * response that produced this card, so threading params avoids a second
 * API round-trip per page render.
 */
export default function VideoCard({
  video,
  castingNumber,
}: {
  video: FeedVideo;
  /** When set, renders a casting-slate badge over the thumbnail. */
  castingNumber?: number;
}) {
  const thumb = video.default_thumb?.src ?? video.thumbs?.[0]?.src ?? '';

  const formatViews = (n: number): string => {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
    return String(n);
  };

  // next-intl's Link can't parse query strings out of a string href
  // (it'll treat "?" as literal path), so we pass pathname + query as
  // an object. Pathname is the resolved path, not the dynamic template.
  const href = {
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
    <Link
      href={href}
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

        {castingNumber !== undefined && (
          // Casting-slate badge, top-left. Real clapperboard look:
          // black/white diagonal-striped ribbon on top + black body with
          // bold zero-padded TAKE number. Sized so it reads even at
          // small card widths.
          <div className="absolute left-2 top-2 overflow-hidden rounded-md border border-white/40 bg-black font-mono text-white shadow-2xl">
            <div
              className="h-2 w-full"
              style={{
                backgroundImage:
                  'repeating-linear-gradient(-30deg, #ffffff 0 8px, #000000 8px 16px)',
              }}
              aria-hidden
            />
            <div className="px-2.5 py-1.5">
              <p className="text-[8px] font-bold uppercase leading-none tracking-[0.25em] text-white/70">
                Casting · Take
              </p>
              <p className="mt-1 text-lg font-black leading-none tracking-tight">
                {formatCastingNumber(castingNumber)}
              </p>
            </div>
          </div>
        )}

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
    </Link>
  );
}
