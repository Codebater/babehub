import { Play, Sparkles, ExternalLink } from 'lucide-react';
import { Link } from '@/i18n/navigation';

/**
 * Grid of saved videos for /favorites. Each card is a Link to
 * /v/{provider}/{contentId} so saved videos open in the same
 * dedicated page as everywhere else on the platform. For eporner
 * items we thread the cached embed/title/thumb/source from the
 * favorite row through as query params (same shape the explore
 * cards use).
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
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {favorites.map((fav) => {
        const isEporner = fav.provider === 'eporner';
        const href = isEporner
          ? {
              pathname: `/v/eporner/${fav.content_id}` as '/v/eporner/[contentId]',
              query: {
                ...(fav.embed_url ? { embed: fav.embed_url } : {}),
                ...(fav.title ? { title: fav.title } : {}),
                ...(fav.thumb_url ? { thumb: fav.thumb_url } : {}),
                ...(fav.source_url ? { source: fav.source_url } : {}),
              },
            }
          : (`/v/creator_post/${fav.content_id}` as '/v/creator_post/[contentId]');

        return (
          <Link
            key={`${fav.provider}:${fav.content_id}`}
            href={href}
            className="group flex flex-col overflow-hidden rounded-2xl border border-border-color bg-card text-left transition-colors hover:border-primary"
          >
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
                  Open video →
                </p>
              )}
            </div>
          </Link>
        );
      })}
    </div>
  );
}
