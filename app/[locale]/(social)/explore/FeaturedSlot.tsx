'use client';

import { Sparkles, Megaphone, Star } from 'lucide-react';
import { useSurveyModal } from '../SurveyModalProvider';

/**
 * Placeholder card that takes the shape of a VideoCard but pitches the
 * viewer (or a creator) to apply for a featured slot. Spliced into the
 * /explore grid: one random position per category, with the Live Cams
 * view getting four such slots at the start of the grid (the user's
 * specific ask).
 *
 * Click → opens the B2B BannerInquiryModal via the shell-wide
 * context. The slot is inventory pitched at brands & casting partners,
 * not creators applying — the creator funnel has its own modal +
 * questions, kept separate to avoid mixing the two pipelines.
 *
 * Three subtle variants matching the section banners so the slot
 * doesn't feel like a foreign element when spliced into a themed grid:
 *   - casting  → black slate, primary glow, "Featured slot — open"
 *   - livecams → red broadcast, On Air pulse, "Apply for a live slot"
 *   - luxury   → amber/gold, Crown-style chip, "Premium feature spot"
 *   - default  → primary pink fallback
 */
type Theme = 'casting' | 'livecams' | 'luxury' | 'default';

const THEMES: Record<Theme, {
  bg: string;
  glow: string;
  border: string;
  eyebrow: string;
  chip: string;
  title: string;
}> = {
  casting: {
    bg: 'bg-gradient-to-br from-zinc-950 via-black to-zinc-900',
    glow: 'bg-primary/30',
    border: 'border-white/15',
    eyebrow: 'text-white/70',
    chip: 'bg-primary/20 text-primary',
    title: 'Featured slot — open',
  },
  livecams: {
    bg: 'bg-gradient-to-br from-black via-red-950/70 to-black',
    glow: 'bg-red-500/30',
    border: 'border-red-500/30',
    eyebrow: 'text-red-200/80',
    chip: 'bg-red-500/30 text-red-200',
    title: 'Live slot — apply now',
  },
  luxury: {
    bg: 'bg-gradient-to-br from-black via-zinc-900 to-purple-950/60',
    glow: 'bg-amber-300/30',
    border: 'border-amber-300/30',
    eyebrow: 'text-amber-200/80',
    chip: 'bg-amber-300/15 text-amber-200',
    title: 'Premium feature spot',
  },
  default: {
    bg: 'bg-gradient-to-br from-black via-zinc-900 to-pink-950/60',
    glow: 'bg-primary/30',
    border: 'border-primary/30',
    eyebrow: 'text-primary',
    chip: 'bg-primary/20 text-primary',
    title: 'Featured slot — apply',
  },
};

export default function FeaturedSlot({ theme = 'default' as Theme }: { theme?: Theme }) {
  const { openBanner } = useSurveyModal();
  const t = THEMES[theme];

  return (
    <button
      type="button"
      onClick={openBanner}
      className={`group relative flex flex-col overflow-hidden rounded-2xl border text-left transition-transform hover:scale-[1.02] ${t.border} ${t.bg}`}
    >
      {/* Soft glow blob */}
      <span
        className={`pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full blur-3xl ${t.glow}`}
        aria-hidden
      />

      {/* Match VideoCard's aspect-video so the slot doesn't break the grid rhythm */}
      <div className="relative flex aspect-video items-center justify-center">
        <div className="text-center">
          <Star className="mx-auto h-10 w-10 text-white/80 transition-transform group-hover:rotate-12 group-hover:scale-110" />
          <p className={`mt-2 text-[10px] font-bold uppercase tracking-[0.25em] ${t.eyebrow}`}>
            <Sparkles className="-mt-0.5 mr-1 inline h-3 w-3" />
            Apply to be featured
          </p>
        </div>
      </div>

      <div className="relative flex-1 p-3">
        <p className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest ${t.chip}`}>
          <Megaphone className="h-3 w-3" />
          Open
        </p>
        <h3 className="mt-2 text-sm font-bold text-white">{t.title}</h3>
        <p className="mt-1 text-xs text-white/60">
          Click to apply — we&apos;ll reply within 48 hours.
        </p>
      </div>
    </button>
  );
}
