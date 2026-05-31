'use client';

import { Sparkles, Star } from 'lucide-react';
import { useSurveyModal } from '../SurveyModalProvider';

/**
 * A "featured slot" tile that sits inside the /explore grid alongside
 * VideoCards. Matches the VideoCard layout exactly (aspect-video thumbnail
 * + small title below) so it doesn't distort the grid rhythm.
 *
 * Everything is overlaid on the thumbnail — no separate card body.
 */
type Theme = 'casting' | 'livecams' | 'luxury' | 'default';

const THEMES: Record<Theme, {
  bg: string;
  glow: string;
  badge: string;
  label: string;
  title: string;
}> = {
  casting: {
    bg: 'bg-gradient-to-br from-zinc-950 via-black to-zinc-900',
    glow: 'from-primary/20 via-transparent to-transparent',
    badge: 'bg-primary/20 text-primary border-primary/30',
    label: 'Featured slot — open',
    title: 'Apply to be cast',
  },
  livecams: {
    bg: 'bg-gradient-to-br from-black via-red-950/70 to-black',
    glow: 'from-red-500/20 via-transparent to-transparent',
    badge: 'bg-red-500/20 text-red-300 border-red-500/30',
    label: 'Live slot — apply now',
    title: 'Apply for a live slot',
  },
  luxury: {
    bg: 'bg-gradient-to-br from-black via-zinc-900 to-purple-950/60',
    glow: 'from-amber-300/20 via-transparent to-transparent',
    badge: 'bg-amber-300/15 text-amber-200 border-amber-300/30',
    label: 'Premium feature spot',
    title: 'Feature your brand',
  },
  default: {
    bg: 'bg-gradient-to-br from-black via-zinc-900 to-pink-950/60',
    glow: 'from-primary/20 via-transparent to-transparent',
    badge: 'bg-primary/20 text-primary border-primary/30',
    label: 'Featured slot — apply',
    title: 'Apply to be featured',
  },
};

export default function FeaturedSlot({ theme = 'default' as Theme }: { theme?: Theme }) {
  const { openBanner } = useSurveyModal();
  const t = THEMES[theme];

  return (
    <button
      type="button"
      onClick={openBanner}
      className="group flex flex-col text-left"
    >
      {/* Thumbnail — matches VideoCard exactly */}
      <div className={`relative aspect-video w-full overflow-hidden rounded-md sm:rounded-xl ${t.bg}`}>

        {/* Diagonal glow */}
        <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${t.glow}`} aria-hidden />

        {/* Pulsing star icon — center */}
        <div className="absolute inset-0 flex items-center justify-center">
          <Star className="h-8 w-8 text-white/25 transition-transform duration-300 group-hover:scale-110 group-hover:text-white/40 sm:h-10 sm:w-10" />
        </div>

        {/* Badge — top-left */}
        <div className="absolute left-2 top-2">
          <span className={`inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.2em] ${t.badge}`}>
            <Sparkles className="h-2.5 w-2.5" />
            Open
          </span>
        </div>

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-white/0 transition-colors group-hover:bg-white/[0.04]" />
      </div>

      {/* Below thumbnail — matches VideoCard info row */}
      <div className="mt-1.5 px-0.5">
        <p className="text-[11px] font-medium leading-tight text-text-secondary/70 group-hover:text-text-secondary sm:text-xs">
          {t.title}
        </p>
      </div>
    </button>
  );
}
