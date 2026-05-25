import { Play, Sparkles, ShieldCheck } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import type { CreatorFeedVideo } from './types';

/**
 * One card in the "Featured creators" row. Distinct visual treatment
 * from eporner cards (smaller, creator-header-led) to signal that these
 * are platform-native videos with a subscription monetization handoff.
 *
 * Click → navigates to /v/creator_post/{postId} where the full
 * dedicated video page lives inside the (social) shell. The page also
 * surfaces a "View creator profile" CTA back to /c/{handle} for
 * subscription conversion.
 */
export default function CreatorVideoCard({ video }: { video: CreatorFeedVideo }) {
  return (
    <Link
      href={`/v/creator_post/${video.postId}` as '/v/creator_post/[contentId]'}
      className="group flex w-64 shrink-0 flex-col overflow-hidden rounded-2xl border border-border-color bg-card text-left transition-colors hover:border-primary sm:w-72"
    >
      <div className="relative aspect-video overflow-hidden bg-black">
        {/* preload=metadata loads only the first few KB so this stays cheap */}
        <video
          src={video.videoUrl}
          preload="metadata"
          muted
          playsInline
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />

        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/30 transition-colors group-hover:bg-black/40">
          <span className="rounded-full bg-primary/90 p-3 transition-transform group-hover:scale-110">
            <Play className="h-5 w-5 fill-white text-white" />
          </span>
        </div>

        <span className="absolute left-2 top-2 flex items-center gap-1 rounded-md bg-primary/90 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-white">
          <Sparkles className="h-3 w-3" />
          Creator
        </span>
      </div>

      <div className="flex items-start gap-3 p-3">
        <span className="h-9 w-9 shrink-0 overflow-hidden rounded-full bg-secondary">
          {video.creator.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={video.creator.avatarUrl}
              alt=""
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/40 to-pink-600/40 text-xs font-black text-white">
              {(video.creator.displayName || video.creator.handle).slice(0, 1).toUpperCase()}
            </span>
          )}
        </span>

        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1 truncate text-sm font-bold text-text-main">
            {video.creator.displayName || video.creator.handle}
            {video.creator.isVerified && (
              <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-primary" />
            )}
          </p>
          <p className="truncate text-xs text-text-secondary">@{video.creator.handle}</p>
          {video.body && (
            <p className="mt-1 line-clamp-2 text-xs text-text-main/80">{video.body}</p>
          )}
        </div>
      </div>
    </Link>
  );
}
