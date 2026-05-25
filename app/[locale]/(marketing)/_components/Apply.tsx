'use client';

import { Megaphone, Briefcase, Sparkles, ArrowRight } from 'lucide-react';

/**
 * B2B "Put your brand on BabeHub" section at the bottom of the
 * marketing home. Replaces the old creator-flavored "Ready to elevate
 * your career?" CTA — the rest of the home page (Header, Hero,
 * Benefits, MarketingDashboard) already pitches creators, so this
 * last block is intentionally retargeted at brands & agencies skimming
 * the page from the top.
 *
 * `onApplyClick` is the BannerInquiryModal opener wired in HomeShell —
 * keeping the prop name so the rest of HomeShell didn't have to change.
 *
 * Visual: dark gradient card with a soft pink/amber glow, a tiny
 * "For brands & agencies" eyebrow chip, a 3-up preview row showing the
 * three placement kinds the modal asks about (Banner / Featured job /
 * Creator collab), and a single primary CTA. Same visual rhythm as
 * SponsoredSlot/FeaturedSlot on /explore so the brand-side surfaces
 * read as one consistent product layer.
 *
 * English-only copy — the previous next-intl `apply.*` keys were
 * creator-flavored and translating B2B copy across 7 locales isn't
 * worth the effort while brand traffic is mostly English.
 */
interface ApplyProps {
  onApplyClick: () => void;
}

const PLACEMENTS = [
  {
    icon: Megaphone,
    title: 'Sponsored banner',
    blurb: 'High-traffic placement above the Load-more on /explore.',
  },
  {
    icon: Briefcase,
    title: 'Featured job',
    blurb: 'Promote a casting, shoot, or hire to thousands of creators.',
  },
  {
    icon: Sparkles,
    title: 'Creator collab',
    blurb: "Brand × creator campaign with the platform's top voices.",
  },
] as const;

export default function Apply({ onApplyClick }: ApplyProps) {
  return (
    <section id="apply" className="py-20 bg-background transition-colors duration-700">
      <div className="container mx-auto px-6">
        <div className="relative mx-auto max-w-4xl overflow-hidden rounded-3xl border border-primary/30 bg-gradient-to-br from-black via-zinc-950 to-pink-950/40 p-8 shadow-2xl shadow-primary/10 sm:p-12">
          {/* Soft accent glows — match the SponsoredSlot billboard so the
              brand-side surfaces feel like one family. */}
          <span
            aria-hidden
            className="pointer-events-none absolute -right-32 -top-32 h-80 w-80 rounded-full bg-primary/25 blur-3xl"
          />
          <span
            aria-hidden
            className="pointer-events-none absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-amber-400/10 blur-3xl"
          />

          <div className="relative grid gap-10 lg:grid-cols-[1.1fr_1fr] lg:items-center">
            {/* ── Pitch column ───────────────────────────────────── */}
            <div>
              <p className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.25em] text-primary">
                <Sparkles className="h-3 w-3" />
                For brands &amp; agencies
              </p>

              <h2 className="mt-4 text-3xl font-black leading-tight tracking-tight text-white sm:text-4xl">
                Put your brand in front of <span className="text-primary">every visitor</span>.
              </h2>
              <p className="mt-4 max-w-md text-base text-white/70 sm:text-lg">
                Banners, featured jobs, creator collabs. Pitch us a placement and we&apos;ll
                come back with options within 48 hours.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-3">
                <button
                  onClick={onApplyClick}
                  className="group inline-flex items-center gap-2 rounded-full bg-primary px-7 py-3 text-sm font-black uppercase tracking-widest text-white shadow-lg shadow-primary/30 transition-all hover:scale-[1.03] hover:bg-pink-400"
                >
                  Pitch a placement
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </button>
                <span className="text-xs text-white/50">
                  Anonymous &middot; no obligation &middot; 48h reply
                </span>
              </div>
            </div>

            {/* ── Placement preview column ───────────────────────── */}
            <ul className="grid gap-3">
              {PLACEMENTS.map(({ icon: Icon, title, blurb }) => (
                <li
                  key={title}
                  className="group flex items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4 transition-colors hover:border-primary/40 hover:bg-primary/[0.06]"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-primary/30 bg-primary/15 text-primary transition-transform group-hover:scale-110">
                    <Icon className="h-4 w-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-white">{title}</p>
                    <p className="mt-0.5 text-xs text-white/60">{blurb}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
