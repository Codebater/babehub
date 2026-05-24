import Link from 'next/link';
import { Lock, ShieldCheck } from 'lucide-react';
import MediaTile, { type MediaItem } from '@/components/MediaTile';

type Creator = {
  handle: string;
  display_name: string;
  avatar_url: string | null;
  is_verified: boolean;
};

type Post = {
  id: string;
  body: string;
  kind: 'text' | 'image' | 'video' | 'gallery';
  media_ids: string[];
  tier_required_id: string | null;
  published_at: string | null;
};

/**
 * One post in the global /explore feed. Mirrors the layout used on
 * /c/{handle} but adds a creator header at the top (avatar + handle +
 * relative timestamp) so users know whose content they're looking at.
 *
 * Card width depends on `kind`:
 *   - video posts span the whole row (16:9 player gets prominence)
 *   - text + image posts sit in the standard 2-col grid
 * Callers handle the grid; this component just renders the card itself.
 */
export default function PostCard({
  post,
  creator,
  mediaItems,
}: {
  post: Post;
  creator: Creator;
  mediaItems: MediaItem[];
}) {
  return (
    <article className="overflow-hidden rounded-2xl border border-border-color bg-card">
      <Link
        href={`/c/${creator.handle}`}
        className="flex items-center gap-3 p-4 transition-colors hover:bg-secondary/40"
      >
        <span className="h-10 w-10 overflow-hidden rounded-full bg-secondary">
          {creator.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={creator.avatar_url}
              alt=""
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/40 to-pink-600/40 text-sm font-black text-white">
              {(creator.display_name || creator.handle).slice(0, 1).toUpperCase()}
            </span>
          )}
        </span>
        <div className="min-w-0">
          <p className="flex items-center gap-1 truncate text-sm font-bold text-text-main">
            {creator.display_name || creator.handle}
            {creator.is_verified && <ShieldCheck className="h-3.5 w-3.5 text-primary" />}
          </p>
          <p className="truncate text-xs text-text-secondary">
            @{creator.handle}
            {post.published_at && (
              <>
                {' · '}
                <time dateTime={post.published_at}>{relativeTime(post.published_at)}</time>
              </>
            )}
          </p>
        </div>
      </Link>

      {mediaItems.length > 0 && <MediaTile items={mediaItems} />}

      {post.body && (
        <p className="whitespace-pre-wrap px-4 py-3 text-text-main">{post.body}</p>
      )}

      {post.tier_required_id && (
        <div className="border-t border-border-color/40 px-4 py-2">
          <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
            <Lock className="h-3 w-3" /> Subscriber post
          </span>
        </div>
      )}
    </article>
  );
}

function relativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  const now = Date.now();
  const seconds = Math.max(1, Math.floor((now - then) / 1000));
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}
