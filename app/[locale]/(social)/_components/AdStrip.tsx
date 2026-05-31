'use client';

import { useEffect, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { useSurveyModal } from '../SurveyModalProvider';

/**
 * `<AdStrip>` — full-width ad rail.
 *
 * Priority:
 *   1. ExoClick  — if NEXT_PUBLIC_EXOCLICK_ZONE_STRIP is set
 *   2. JuicyAds  — if NEXT_PUBLIC_JUICYADS_SPOT_STRIP is set
 *   3. Placeholder rotating banner (house ad, opens BannerInquiryModal)
 *
 * ExoClick setup:
 *   - Create a Display Banner zone in your ExoClick Publisher dashboard
 *   - Recommended sizes: 728×90 (desktop) + 300×100 (mobile)
 *   - Set NEXT_PUBLIC_EXOCLICK_ZONE_STRIP to the numeric zone ID
 *   - Optionally set NEXT_PUBLIC_EXOCLICK_ZONE_STRIP_MOBILE for the
 *     mobile zone (falls back to the desktop zone if unset)
 *
 * JuicyAds setup:
 *   - Set NEXT_PUBLIC_JUICYADS_SPOT_STRIP to your spot UUID
 */
type Props = {
  variant?: 'thin' | 'compact';
  intervalMs?: number;
  placement?: string;
};

// ── ExoClick ────────────────────────────────────────────────────────
const EXOCLICK_ZONE_DESKTOP = process.env.NEXT_PUBLIC_EXOCLICK_ZONE_STRIP;
const EXOCLICK_ZONE_MOBILE = process.env.NEXT_PUBLIC_EXOCLICK_ZONE_STRIP_MOBILE ?? EXOCLICK_ZONE_DESKTOP;

function ExoClickAd({ placement }: { placement: string }) {
  useEffect(() => {
    // Always push so new ins tags are picked up after client-side navigation.
    const w = window as unknown as Record<string, unknown[]>;
    w.AdProvider = w.AdProvider ?? [];
    w.AdProvider.push({ serve: {} });

    if (document.querySelector('script[src*="a.magsrv.com/ad-provider.js"]')) return;
    const s = document.createElement('script');
    s.async = true;
    s.src = 'https://a.magsrv.com/ad-provider.js';
    document.head.appendChild(s);
  }, []);

  return (
    <div data-ad-placement={placement} className="flex w-full justify-center overflow-hidden py-1">
      <ins className="eas6a97888e2" data-zoneid={EXOCLICK_ZONE_DESKTOP} />
    </div>
  );
}

// ── JuicyAds ────────────────────────────────────────────────────────
const JUICYADS_SPOT = process.env.NEXT_PUBLIC_JUICYADS_SPOT_STRIP;

function JuicyAdsAd({ placement }: { placement: string }) {
  useEffect(() => {
    if (document.querySelector('script[src*="cdn.juicyads.com"]')) return;
    const s = document.createElement('script');
    s.async = true;
    s.src = 'https://cdn.juicyads.com/jp.js';
    document.head.appendChild(s);
  }, []);

  return (
    <div data-ad-placement={placement} className="flex w-full justify-center overflow-hidden py-1">
      <ins className="juicyads" data-cfg={JUICYADS_SPOT} />
    </div>
  );
}

// ── Placeholder ─────────────────────────────────────────────────────
type Creative = {
  key: string;
  eyebrow?: string;
  headline: string;
  sub: string;
  accent?: 'pink' | 'amber' | 'sky' | 'mono';
};

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

// ── Main export ─────────────────────────────────────────────────────
export default function AdStrip({
  variant = 'thin',
  intervalMs = 6000,
  placement = 'unknown',
}: Props) {
  const { openBanner } = useSurveyModal();

  if (EXOCLICK_ZONE_DESKTOP) return <ExoClickAd placement={placement} />;
  if (JUICYADS_SPOT) return <JuicyAdsAd placement={placement} />;

  if (variant === 'compact') {
    return (
      <button
        type="button"
        onClick={openBanner}
        data-ad-placement={placement}
        className="group flex w-full items-center justify-between gap-3 rounded-xl border border-border-color/50 bg-card/60 px-4 py-2.5 text-left backdrop-blur-sm transition-all hover:border-primary/40 hover:bg-primary/[0.03]"
      >
        <div className="flex min-w-0 items-center gap-3">
          <span className="shrink-0 rounded-md border border-border-color/60 bg-secondary px-2 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-[0.18em] text-text-secondary/70">
            Sponsored
          </span>
          <span className="truncate text-xs text-text-secondary group-hover:text-text-main">
            {DEFAULT_CREATIVES[0].headline}
          </span>
        </div>
        <ArrowRight className="h-3.5 w-3.5 shrink-0 text-text-secondary/50 transition-all group-hover:translate-x-0.5 group-hover:text-primary" />
      </button>
    );
  }

  return <RotatingStrip placement={placement} intervalMs={intervalMs} onClick={openBanner} />;
}

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
  const [fading, setFading] = useState(false);

  useEffect(() => {
    if (DEFAULT_CREATIVES.length <= 1) return;
    const id = window.setInterval(() => {
      setFading(true);
      window.setTimeout(() => {
        setIndex((i) => (i + 1) % DEFAULT_CREATIVES.length);
        setFading(false);
      }, 200);
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
      className="group relative block w-full overflow-hidden rounded-2xl border border-border-color/60 bg-gradient-to-r from-card via-card to-primary/[0.04] py-3.5 text-left shadow-sm transition-all hover:border-primary/40 hover:shadow-md hover:shadow-primary/5 sm:py-4"
    >
      <div
        className={`flex items-center gap-3 px-5 transition-opacity duration-200 sm:gap-5 sm:px-6 ${
          fading ? 'opacity-0' : 'opacity-100'
        }`}
      >
        {/* Sponsored label */}
        <span className="shrink-0 rounded-md border border-border-color/50 bg-secondary/80 px-2.5 py-1 font-mono text-[9px] font-semibold uppercase tracking-[0.2em] text-text-secondary/60">
          Sponsored
        </span>

        {/* Copy */}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold text-text-main transition-colors group-hover:text-primary sm:text-[15px]">
            {c.headline}
          </p>
          <p className="mt-0.5 hidden truncate text-xs text-text-secondary/70 sm:block">
            {c.sub}
          </p>
        </div>

        {/* CTA */}
        <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-primary/10 px-4 py-1.5 text-[11px] font-bold tracking-wide text-primary ring-1 ring-primary/20 transition-all group-hover:bg-primary group-hover:text-white group-hover:ring-primary/60">
          Get in touch
          <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
        </span>
      </div>

      {/* Subtle right-side glow on hover */}
      <div className="pointer-events-none absolute right-0 top-0 h-full w-32 bg-gradient-to-l from-primary/[0.06] to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
    </button>
  );
}
