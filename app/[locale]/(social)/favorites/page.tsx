import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { Star } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import FavoritesGrid from './FavoritesGrid';

/**
 * `/favorites` — personal list of every video the signed-in user has
 * starred. Sign-in required (the list is private per RLS).
 *
 * Eporner-sourced rows include cached title + thumb + embed/source URLs
 * so clicking re-opens the VideoModal with everything it needs (no
 * upstream API call). Creator-post rows link to /c/{handle} so the
 * subscription handoff still works.
 */
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Favorites — Babe Hub',
  description: 'Videos you’ve saved on Babe Hub.',
  alternates: { canonical: '/favorites' },
  robots: { index: false, follow: false },
};

export default async function FavoritesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/app/login?next=/favorites');

  const { data: favorites } = await supabase
    .from('video_favorites')
    .select('provider, content_id, title, thumb_url, embed_url, source_url, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  return (
    <main className="mx-auto max-w-7xl px-6 py-10">
      <header className="mb-8 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-text-main md:text-4xl">
            Favorites
          </h1>
          <p className="mt-1 text-sm text-text-secondary">
            Everything you’ve starred — eporner videos and creator posts in one place.
          </p>
        </div>
      </header>

      {(!favorites || favorites.length === 0) ? (
        <div className="flex flex-col items-center rounded-2xl border border-dashed border-border-color bg-secondary/40 p-12 text-center">
          <Star className="mb-3 h-10 w-10 text-yellow-400/60" />
          <p className="text-text-secondary">
            No favorites yet. Tap the ★ Save button on any video to add it here.
          </p>
        </div>
      ) : (
        <FavoritesGrid favorites={favorites} />
      )}
    </main>
  );
}
