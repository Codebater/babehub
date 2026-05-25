'use client';

import { ArrowRight } from 'lucide-react';
import { useSurveyModal } from '../SurveyModalProvider';

/**
 * `<AdStrip>` — a thin, deliberately old-school "Advertisement" rail
 * that sits between content sections on public pages.
 *
 * Design intent: it should read as a *real ad* slot — newspaper-style
 * dashed top/bottom rule, monospace "ADVERTISEMENT" eyebrow, bold
 * uppercase headline, single CTA pill — so visitors instantly clock
 * "this is the ad zone, not editorial content". When no real
 * advertiser is plugged in (current state), clicking the strip opens
 * the B2B BannerInquiryModal — i.e. the strip *itself* is the pitch.
 *
 * Why thin instead of another billboard: SponsoredSlot already
 * occupies the big-format slot on /explore. The AdStrip lives in
 * between-section gutters where a full billboard would be too noisy.
 * One line tall on mobile, two on desktop with a hint sub-line.
 *
 * Variants:
 *   - 'thin'    (default) — full-bleed-feeling strip with eyebrow +
 *                            headline + sub + CTA. Use between major
 *                            sections (top of /explore, top of /jobs).
 *   - 'compact'             — single-line condensed pill, used inside
 *                            denser layouts (sidebars, sparse pages).
 *
 * Tracking: `placement` is dropped on a data-attr so any analytics
 * layer wired in later can attribute clicks without code changes.
 */
type Props = {
  variant?: 'thin' | 'compact';
  headline?: string;
  sub?: string;
  /** Identifier for the slot's location, e.g. "explore-top". */
  placement?: string;
};

export default function AdStrip({
  variant = 'thin',
  headline = 'Your ad could be here',
  sub = 'Reach every visitor on this page — pitch a slot in 60 seconds.',
  placement = 'unknown',
}: Props) {
  const { openBanner } = useSurveyModal();

  if (variant === 'compact') {
    return (
      <button
        type="button"
        onClick={openBanner}
        data-ad-placement={placement}
        className="group flex w-full items-center justify-between gap-3 rounded-md border border-dashed border-border-color/60 bg-card/40 px-4 py-2 text-left transition-colors hover:border-primary/60 hover:bg-primary/[0.04]"
      >
        <div className="flex min-w-0 items-center gap-3">
          <span className="rounded-sm border border-border-color px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-text-secondary">
            Ad
          </span>
          <span className="truncate text-xs font-medium text-text-secondary group-hover:text-text-main">
            {headline}
          </span>
        </div>
        <ArrowRight className="h-3.5 w-3.5 shrink-0 text-text-secondary transition-all group-hover:translate-x-0.5 group-hover:text-primary" />
      </button>
    );
  }

  // 'thin' — the oldschool strip. Newspaper-rule dashed dividers top
  // and bottom, monospace eyebrow, bold uppercase headline.
  return (
    <button
      type="button"
      onClick={openBanner}
      data-ad-placement={placement}
      aria-label={`Sponsored slot: ${headline}`}
      className="group relative block w-full overflow-hidden border-y border-dashed border-border-color/70 bg-card/30 py-3 text-left transition-colors hover:border-primary/50 hover:bg-primary/[0.04] sm:py-4"
    >
      <div className="flex items-center gap-3 px-4 sm:gap-5 sm:px-6">
        <span className="hidden shrink-0 rounded-sm border border-border-color px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-[0.25em] text-text-secondary sm:inline-flex">
          Advertisement
        </span>
        <span className="inline-flex shrink-0 rounded-sm border border-border-color px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-text-secondary sm:hidden">
          Ad
        </span>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-black uppercase tracking-wide text-text-main sm:text-base">
            {headline}
          </p>
          {sub && (
            <p className="mt-0.5 hidden truncate text-xs text-text-secondary sm:block">
              {sub}
            </p>
          )}
        </div>

        <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-text-main/15 bg-text-main/[0.04] px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-text-main transition-all group-hover:border-primary group-hover:bg-primary group-hover:text-white">
          <span className="hidden sm:inline">Pitch a slot</span>
          <span className="sm:hidden">Pitch</span>
          <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
        </span>
      </div>
    </button>
  );
}
