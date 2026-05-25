import type { Metadata } from 'next';
import { Sparkles, Users, Megaphone } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import CategoryChips from '../explore/CategoryChips';

/**
 * `/creators` — coming-soon teaser for the platform's curated creator
 * roster. Lives inside the social sidebar shell so the page feels like
 * the other category surfaces (Casting / Live Cams / Luxury Shoots).
 *
 * Renders a hero banner in the luxury/iridescent aesthetic + a brief
 * description + an Apply CTA. Once the actual roster ships, this page
 * is replaced with the curated grid; the URL stays.
 */
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Creators — Babe Hub',
  description:
    'Babe Hub creators — coming soon. Apply now to be one of the first featured talents.',
  alternates: { canonical: '/creators' },
};

export default function CreatorsPage() {
  return (
    <main className="mx-auto max-w-7xl px-6 py-6 md:py-8">
      <div className="mb-6">
        <CategoryChips />
      </div>

      {/* Coming-soon hero — same banner language as Casting/Live Cams/Luxury,
          but in an iridescent purple/primary blend with a "Coming Soon"
          chip instead of a category badge. */}
      <section
        aria-label="Creators coming soon"
        className="relative mb-8 overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-black via-purple-950/40 to-black p-6 sm:p-10"
      >
        {/* Iridescent gradient glow behind the headline */}
        <div
          className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-primary/30 blur-3xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-purple-500/25 blur-3xl"
          aria-hidden
        />

        <div className="relative flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-white/60">
              <Users className="h-3.5 w-3.5" />
              Creators · Coming Soon
            </p>
            <h2 className="mt-2 bg-gradient-to-r from-white via-primary to-purple-300 bg-clip-text text-3xl font-black tracking-tight text-transparent sm:text-4xl md:text-5xl">
              Our roster is loading
            </h2>
            <p className="mt-3 inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-xs font-bold uppercase tracking-widest text-primary">
              <Sparkles className="h-3.5 w-3.5" />
              Now booking the first cohort
            </p>
            <p className="mt-4 max-w-xl text-sm text-white/70 sm:text-base">
              A curated grid of Babe Hub creators is in production —
              ranked by engagement, organised by category, one click to
              subscribe. Want to be one of the first?
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Link
                href={'/#apply' as '/'}
                className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-black uppercase tracking-widest text-white shadow-lg shadow-primary/40 transition-all hover:scale-[1.03] hover:bg-pink-400"
              >
                <Megaphone className="h-4 w-4" />
                Apply to be featured
              </Link>
              <p className="text-xs text-white/50">
                Two minutes · we&apos;ll reply within 48 hours
              </p>
            </div>
          </div>

          {/* Stat slate, hidden on small screens to avoid wrap chaos */}
          <div className="hidden shrink-0 rounded-xl border border-white/20 bg-black/60 px-4 py-3 text-right font-mono shadow-2xl backdrop-blur-sm sm:block">
            <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-white/60">
              Cohort
            </p>
            <p className="mt-1 bg-gradient-to-b from-primary to-purple-300 bg-clip-text text-2xl font-black text-transparent">
              N° 001
            </p>
          </div>
        </div>
      </section>

      {/* Placeholder section so the page doesn't look bare — three
          shimmering tiles that hint at the future grid layout. */}
      <section>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="flex flex-col overflow-hidden rounded-2xl border border-border-color/60 bg-card/40"
            >
              <div className="relative aspect-video animate-pulse bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900">
                <div className="absolute inset-0 flex items-center justify-center text-text-secondary/50">
                  <Users className="h-8 w-8" />
                </div>
              </div>
              <div className="space-y-2 p-3">
                <div className="h-3 w-2/3 animate-pulse rounded bg-secondary" />
                <div className="h-2.5 w-1/2 animate-pulse rounded bg-secondary/60" />
              </div>
            </div>
          ))}
        </div>
        <p className="mt-10 text-center text-xs text-text-secondary">
          The creator roster lights up here once the first cohort is signed.
        </p>
      </section>
    </main>
  );
}
