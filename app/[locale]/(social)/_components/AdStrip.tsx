'use client';

import { useEffect, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { useSurveyModal } from '../SurveyModalProvider';

/**
 * `<AdStrip>` — a thin, deliberately old-school "Advertisement" rail
 * that sits between content sections on public pages and **rotates
 * through creatives every few seconds** like a 2000s banner ad.
 *
 * Why the rotation:
 *   - Real banner inventory has multiple creatives in a single slot;
 *     rotating in place gives this placeholder the same "we have ad
 *     supply" feel even though every creative currently points back
 *     to the BannerInquiryModal.
 *   - Different headlines pitch different angles (reach, anonymity,
 *     placement options, response time) — whichever lands with the
 *     visitor at the moment they look at it.
 *
 * Design intent stays "newspaper-rule strip":
 *   - dashed top/bottom border (newspaper-rule feel)
 *   - monospace ADVERTISEMENT eyebrow chip
 *   - bold uppercase headline + sub line
 *   - whole strip is one big <button> — click anywhere → opens the
 *     B2B BannerInquiryModal until a real advertiser is plugged in.
 *
 * Variants:
 *   - 'thin'    (default) — rotating, full-bleed feel.
 *   - 'compact'             — single-line condensed pill, static
 *                            (rotation would be noisy in dense layouts).
 *
 * Tracking: `placement` is dropped on a data-attr so any analytics
 * layer wired in later can attribute clicks without code changes.
 */
type Props = {
  variant?: 'thin' | 'compact';
  /** Override the rotation interval (ms). Default 6000. */
  intervalMs?: number;
  /** Identifier for the slot's location, e.g. "explore-top". */
  placement?: string;
};

type Creative = {
  /** Tracking key for the individual creative. */
  key: string;
  /** Tiny eyebrow chip text. Defaults to "Advertisement". */
  eyebrow?: string;
  headline: string;
  sub: string;
  /** Optional accent shade applied to the eyebrow chip + hover halo. */
  accent?: 'pink' | 'amber' | 'sky' | 'mono';
};

/**
 * The default carousel — five creatives that each pitch the slot
 * from a different angle. Stable order so SSR ↔ client first paint
 * stays identical; rotation only starts after hydration.
 */
const DEFAULT_CREATIVES: Creative[] = [
  {
    key: 'reach',
    headline: 'Your ad could be here',
    sub: 'Reach every visitor on this page — pitch a slot in 60 seconds.',
    accent: 'mono',
  },
  {
    key: 'placements',
    eyebrow: 'Inventory',
    headline: 'Banner · Featured job · Collab',
    sub: 'Pick one, two, or all three. Brands often combine.',
    accent: 'pink',
  },
  {
    key: 'anonymous',
    eyebrow: 'Anonymous OK',
    headline: 'Brand inquiries — no obligation',
    sub: 'Email only. Reply within 48 hours.',
    accent: 'sky',
  },
  {
    key: 'placement',
    eyebrow: 'Premium slot',
    headline: 'Top of /explore · Top of /jobs',
    sub: 'High-traffic placements above every grid.',
    accent: 'amber',
  },
  {
    key: 'cta',
    eyebrow: 'Limited slots',
    headline: 'Sponsor a placement now',
    sub: 'A handful of slots open per month — claim yours.',
    accent: 'pink',
  },
];

const ACCENT_CLASS: Record<NonNullable<Creative['accent']>, { chip: string; halo: string }> = {
  pink: {
    chip: 'border-primary/40 bg-primary/10 text-primary',
    halo: 'group-hover:bg-primary/[0.06]',
  },
  amber: {
    chip: 'border-amber-300/40 bg-amber-300/10 text-amber-200',
    halo: 'group-hover:bg-amber-300/[0.05]',
  },
  sky: {
    chip: 'border-sky-300/40 bg-sky-300/10 text-sky-200',
    halo: 'group-hover:bg-sky-300/[0.05]',
  },
  mono: {
    chip: 'border-border-color bg-card/40 text-text-secondary',
    halo: 'group-hover:bg-primary/[0.04]',
  },
};

export default function AdStrip({
  variant = 'thin',
  intervalMs = 6000,
  placement = 'unknown',
}: Props) {
  const { openBanner } = useSurveyModal();

  // ── Compact: static, single-line. Rotation would be noisy. ─────
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
            {DEFAULT_CREATIVES[0].headline}
          </span>
        </div>
        <ArrowRight className="h-3.5 w-3.5 shrink-0 text-text-secondary transition-all group-hover:translate-x-0.5 group-hover:text-primary" />
      </button>
    );
  }

  // ── Thin: rotating banner. ─────────────────────────────────────
  return <RotatingStrip placement={placement} intervalMs={intervalMs} onClick={openBanner} />;
}

/**
 * Inner component handling the rotation state. Split out so we don't
 * need useState/useEffect at all when the parent is 'compact'.
 *
 * The strip starts at index 0 on every render (SSR-safe — no client-
 * only random seed leaks into the markup); the rotation timer kicks
 * in after hydration via useEffect.
 */
function RotatingStrip({
  placement,
  intervalMs,
  onClick,
}: {
  placement: string;
  intervalMs: number;
  onClick: () => void;
}) {
  const [index, setIndex] = useState(0);
  // `fading` toggles a one-tick opacity-0 right before the swap so the
  // creative cross-fades instead of jump-cutting. 250ms fade out → set
  // new index → 250ms fade back in. Total 500ms transition per swap.
  const [fading, setFading] = useState(false);

  useEffect(() => {
    if (DEFAULT_CREATIVES.length <= 1) return;
    const id = window.setInterval(() => {
      setFading(true);
      window.setTimeout(() => {
        setIndex((i) => (i + 1) % DEFAULT_CREATIVES.length);
        setFading(false);
      }, 250);
    }, intervalMs);
    return () => window.clearInterval(id);
  }, [intervalMs]);

  const c = DEFAULT_CREATIVES[index];
  const accent = ACCENT_CLASS[c.accent ?? 'mono'];

  return (
    <button
      type="button"
      onClick={onClick}
      data-ad-placement={placement}
      data-ad-creative={c.key}
      aria-label={`Sponsored slot: ${c.headline}`}
      className={`group relative block w-full overflow-hidden border-y border-dashed border-border-color/70 bg-card/30 py-3 text-left transition-colors hover:border-primary/50 sm:py-4 ${accent.halo}`}
    >
      <div
        className={`flex items-center gap-3 px-4 transition-opacity duration-300 sm:gap-5 sm:px-6 ${
          fading ? 'opacity-0' : 'opacity-100'
        }`}
      >
        <span
          className={`hidden shrink-0 rounded-sm border px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-[0.25em] sm:inline-flex ${accent.chip}`}
        >
          {c.eyebrow ?? 'Advertisement'}
        </span>
        <span
          className={`inline-flex shrink-0 rounded-sm border px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-[0.2em] sm:hidden ${accent.chip}`}
        >
          Ad
        </span>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-black uppercase tracking-wide text-text-main sm:text-base">
            {c.headline}
          </p>
          <p className="mt-0.5 hidden truncate text-xs text-text-secondary sm:block">
            {c.sub}
          </p>
        </div>

        <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-text-main/15 bg-text-main/[0.04] px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-text-main transition-all group-hover:border-primary group-hover:bg-primary group-hover:text-white">
          <span className="hidden sm:inline">Pitch a slot</span>
          <span className="sm:hidden">Pitch</span>
          <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
        </span>
      </div>

      {/* Old-school carousel dots — bottom-right, decorative. Active
          dot in primary pink, others muted. Visible on desktop only;
          mobile keeps the strip clean. */}
      <div className="pointer-events-none absolute bottom-1 right-3 hidden gap-1 sm:flex">
        {DEFAULT_CREATIVES.map((cr, i) => (
          <span
            key={cr.key}
            aria-hidden
            className={`h-1 w-1 rounded-full transition-colors ${
              i === index ? 'bg-primary' : 'bg-text-secondary/30'
            }`}
          />
        ))}
      </div>
    </button>
  );
}
