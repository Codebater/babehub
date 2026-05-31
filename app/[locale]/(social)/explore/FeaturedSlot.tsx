'use client';

import { Sparkles, Star, ArrowRight } from 'lucide-react';
import { useSurveyModal } from '../SurveyModalProvider';

/**
 * A full-width "featured slot" STRIP spliced into the /explore grid via
 * `col-span-full`, so it spans the whole row regardless of column count
 * and reads as a slim promoted bar rather than a square tile.
 *
 * Click → the creator apply survey (openApply) for casting / live cams /
 * default themes. Only the luxury theme is a B2B placement pitch and
 * opens the banner-inquiry modal (openBanner).
 */
type Theme = 'casting' | 'livecams' | 'luxury' | 'default';

const THEMES: Record<Theme, {
  bg: string;
  border: string;
  glow: string;
  iconBg: string;
  eyebrow: string;
  cta: string;
  label: string;
  title: string;
  action: string;
}> = {
  casting: {
    bg: 'bg-gradient-to-r from-zinc-950 via-black to-zinc-900',
    border: 'border-white/10',
    glow: 'bg-primary/20',
    iconBg: 'bg-primary/15 text-primary',
    eyebrow: 'text-white/50',
    cta: 'bg-primary text-white',
    label: 'Casting',
    title: 'Apply to be cast — open auditions now',
    action: 'Apply',
  },
  livecams: {
    bg: 'bg-gradient-to-r from-black via-red-950/50 to-black',
    border: 'border-red-500/20',
    glow: 'bg-red-500/20',
    iconBg: 'bg-red-500/15 text-red-300',
    eyebrow: 'text-red-200/60',
    cta: 'bg-red-500 text-white',
    label: 'Live Cams',
    title: 'Apply for a live slot — go live with us',
    action: 'Apply',
  },
  luxury: {
    bg: 'bg-gradient-to-r from-black via-zinc-900 to-purple-950/40',
    border: 'border-amber-300/20',
    glow: 'bg-amber-300/20',
    iconBg: 'bg-amber-300/15 text-amber-200',
    eyebrow: 'text-amber-200/60',
    cta: 'bg-amber-300 text-black',
    label: 'Luxury',
    title: 'Feature your brand — premium placement',
    action: 'Feature',
  },
  default: {
    bg: 'bg-gradient-to-r from-black via-zinc-900 to-pink-950/40',
    border: 'border-primary/20',
    glow: 'bg-primary/20',
    iconBg: 'bg-primary/15 text-primary',
    eyebrow: 'text-primary/70',
    cta: 'bg-primary text-white',
    label: 'Featured',
    title: 'Apply to be featured on BabeHub',
    action: 'Apply',
  },
};

export default function FeaturedSlot({ theme = 'default' as Theme }: { theme?: Theme }) {
  const { openApply, openBanner } = useSurveyModal();
  const t = THEMES[theme];
  const onClick = theme === 'luxury' ? openBanner : openApply;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`group relative col-span-full flex items-center gap-3 overflow-hidden rounded-xl border px-3 py-2.5 text-left transition-all hover:brightness-125 sm:gap-4 sm:px-4 ${t.border} ${t.bg}`}
    >
      {/* Glow */}
      <span className={`pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full blur-3xl ${t.glow}`} aria-hidden />

      {/* Icon */}
      <span className={`relative flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${t.iconBg}`}>
        <Star className="h-4 w-4" />
      </span>

      {/* Text */}
      <div className="relative min-w-0 flex-1">
        <p className={`flex items-center gap-1 text-[9px] font-bold uppercase tracking-[0.25em] ${t.eyebrow}`}>
          <Sparkles className="h-2.5 w-2.5" />
          {t.label}
        </p>
        <p className="truncate text-xs font-bold text-white sm:text-sm">{t.title}</p>
      </div>

      {/* CTA */}
      <span className={`relative inline-flex shrink-0 items-center gap-1 rounded-full px-3 py-1.5 text-[11px] font-bold transition-transform group-hover:scale-105 ${t.cta}`}>
        {t.action}
        <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
      </span>
    </button>
  );
}
