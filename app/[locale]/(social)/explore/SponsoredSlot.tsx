'use client';

import { Megaphone, Sparkles, ArrowRight } from 'lucide-react';
import { useSurveyModal } from '../SurveyModalProvider';

/**
 * Full-row "Your banner here" sponsored placeholder shown above every
 * Load-more batch on /explore. Visually distinct from FeaturedSlot
 * (which sits inside the grid as a single cell) — this one spans the
 * whole grid width so it reads as a sponsored billboard, not a video.
 *
 * Click → opens the B2B BannerInquiryModal in place (this is brand
 * inventory, not creator outreach — the creator-side Apply BabeHub
 * funnel asks completely different questions).
 */
export default function SponsoredSlot() {
  const { openBanner } = useSurveyModal();
  return (
    <button
      type="button"
      onClick={openBanner}
      className="group relative col-span-full mt-2 flex w-full items-center gap-4 overflow-hidden rounded-2xl border border-primary/30 bg-gradient-to-br from-black via-zinc-900 to-pink-950/40 p-5 text-left transition-transform hover:scale-[1.01] sm:gap-6 sm:p-6"
    >
      <span
        className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-primary/30 blur-3xl"
        aria-hidden
      />
      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-primary/40 bg-primary/15 backdrop-blur-sm sm:h-14 sm:w-14">
        <Megaphone className="h-5 w-5 text-primary sm:h-6 sm:w-6" />
      </span>

      <div className="relative min-w-0 flex-1">
        <p className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.25em] text-primary">
          <Sparkles className="h-3 w-3" />
          Sponsored slot
        </p>
        <h3 className="mt-1 text-base font-black tracking-tight text-white sm:text-lg">
          Your banner could be here
        </h3>
        <p className="mt-1 text-xs text-white/60 sm:text-sm">
          Get in front of every visitor on this page. Apply to sponsor a slot.
        </p>
      </div>

      <span className="relative ml-auto inline-flex shrink-0 items-center gap-2 rounded-full bg-primary px-4 py-2 text-xs font-black uppercase tracking-widest text-white shadow-lg shadow-primary/30 transition-transform group-hover:translate-x-0.5">
        Apply
        <ArrowRight className="h-4 w-4" />
      </span>
    </button>
  );
}
