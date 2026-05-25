'use client';

import { useState } from 'react';
import { Play, Sparkles, ExternalLink } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import VideoModal from '../explore/VideoModal';
import type { ModalPayload } from '../explore/types';

/**
 * Grid of saved videos for /favorites. Eporner items re-open the
 * VideoModal with the cached embed/source URLs we wrote to the
 * favorite row at save-time. Creator-post items link to /c/{handle}
 * (we don't store the signed video URL on the row because signed
 * URLs expire — replaying via the profile page mints a fresh one).
 */
type Favorite = {
  provider: 'creator_post' | 'eporner';
  content_id: string;
  title: string | null;
  thumb_url: string | null;
  embed_url: string | null;
  source_url: string | null;
  created_at: string;
};

export default function FavoritesGrid({ favorites }: { favorites: Favorite[] }) {
  const [openPayload, setOpenPayload] = useState<ModalPayload | null>(null);

  const openEporner = (fav: Favorite) => {
    if (!fav.embed_url) return;
    setOpenPayload({
      kind: 'iframe',
      embed: fav.embed_url,
      title: fav.title ?? 'Saved video',
      sourceUrl: fav.source_url ?? '#',
      contentId: fav.content_id,
      thumbUrl: fav.thumb_url ?? undefined,
    });
  };

  return (
    <>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {favorites.map((fav) => {
          const isEporner = fav.provider === 'eporner';
          const cardInner = (
            <div className="group flex flex-col overflow-hidden rounded-2xl border border-border-color bg-card text-left transition-colors hover:border-primary">
              <div className="relative aspect-video bg-black">
                {fav.thumb_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={fav.thumb_url}
                    alt={fav.title ?? 'Saved video'}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/30 to-pink-600/30 text-text-secondary">
                    <Play className="h-10 w-10" />
                  </div>
                )}
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/30">
                  <span className="rounded-full bg-primary/90 p-4 opacity-0 transition-opacity group-hover:opacity-100">
                    <Play className="h-6 w-6 fill-white text-white" />
                  </span>
                </div>
                {!isEporner && (
                  <span className="absolute left-2 top-2 flex items-center gap-1 rounded-md bg-primary/90 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-white">
                    <Sparkles className="h-3 w-3" />
                    Creator
                  </span>
                )}
              </div>
              <div className="flex-1 p-3">
                <h3 className="line-clamp-2 text-sm font-medium text-text-main group-hover:text-primary">
                  {fav.title ?? (isEporner ? 'Saved video' : 'Creator post')}
                </h3>
                {!isEporner && (
                  <p className="mt-1 flex items-center gap-1 text-xs text-text-secondary">
                    <ExternalLink className="h-3 w-3" />
                    Open creator profile →
                  </p>
                )}
              </div>
            </div>
          );

          if (isEporner) {
            return (
              <button
                key={`${fav.provider}:${fav.content_id}`}
                type="button"
                onClick={() => openEporner(fav)}
                className="text-left"
              >
                {cardInner}
              </button>
            );
          }

          // Creator-post favorites: link to the source profile. We don't
          // know the handle here (we only cached the post id) — so route
          // through a small helper page if needed. For now, link to
          // /explore as a safe fallback and rely on the post id in the
          // URL hash so the modal can be opened from there in a later
          // iteration. (For v1, the favorite still records the save +
          // shows the thumbnail; clicking lands on /explore so the user
          // can find it.)
          return (
            <Link
              key={`${fav.provider}:${fav.content_id}`}
              href="/explore"
              className="block"
            >
              {cardInner}
            </Link>
          );
        })}
      </div>

      {openPayload && (
        <VideoModal payload={openPayload} onClose={() => setOpenPayload(null)} />
      )}
    </>
  );
}
