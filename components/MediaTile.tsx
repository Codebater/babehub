/**
 * Renders the media attached to a post, either as an image grid or as a
 * single HTML5 video player. Used by both `/c/[handle]` (creator profile)
 * and `/explore` (global discovery feed) so the post-card visuals stay
 * consistent across the platform.
 *
 * Input:
 *   - `items` — already resolved to { url, kind } per media id. The caller
 *     (a server component) is responsible for minting signed URLs via
 *     `lib/storage/signedUrls.ts` + reading kinds from the `media` table.
 *
 * Layout rules:
 *   - 1 video → 16:9 player (max-h-[600px]) with native controls
 *   - 1 image → full-width image capped at 600px
 *   - 2 items → 2 columns
 *   - 3-4 items → 2 columns
 *   - 5+ items → 3 columns
 *   - Mixed image + video → 2-col grid; video plays inline next to images
 *
 * Why HTML5 `<video>` instead of a heavyweight player like `mux-player`?
 *   Phase 1.2 MVP keeps things simple: single MP4 stored in Supabase
 *   Storage, served via 1h signed URL. Phase 3 Mux integration swaps this
 *   for adaptive bitrate + per-format streams + proper thumbnails.
 */

export type MediaItem = { url: string; kind: 'image' | 'video' };

export default function MediaTile({ items }: { items: MediaItem[] }) {
  if (items.length === 0) return null;

  // Single-video: full-width with browser-native controls.
  if (items.length === 1 && items[0].kind === 'video') {
    return (
      <video
        src={items[0].url}
        controls
        preload="metadata"
        playsInline
        className="w-full bg-black"
        style={{ maxHeight: '600px', aspectRatio: '16/9' }}
      />
    );
  }

  // Single-image: full-width.
  if (items.length === 1 && items[0].kind === 'image') {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={items[0].url}
        alt=""
        className="max-h-[600px] w-full object-cover"
        loading="lazy"
      />
    );
  }

  const cols = items.length === 2 ? 'grid-cols-2' : items.length <= 4 ? 'grid-cols-2' : 'grid-cols-3';

  return (
    <div className={`grid ${cols} gap-1`}>
      {items.map((item, i) =>
        item.kind === 'video' ? (
          <video
            key={i}
            src={item.url}
            controls
            preload="metadata"
            playsInline
            className="aspect-square w-full bg-black object-cover"
          />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={i}
            src={item.url}
            alt=""
            className="aspect-square w-full object-cover"
            loading="lazy"
          />
        ),
      )}
    </div>
  );
}
