import { Gem, Crown } from 'lucide-react';

/**
 * Section banner shown only on /explore?q=luxury.
 *
 * Couture / high-jewelry themed: deep purple-to-black gradient with
 * gold accents (the "luxury" palette), a Gem icon, and a "Premium
 * Editorial" eyebrow. Sets the tone for the luxury-shoot view so the
 * user knows they're inside a special category.
 *
 * Server component — no client state needed.
 */
export default function LuxuryBanner() {
  return (
    <section
      aria-label="Luxury shoots"
      className="relative mb-8 overflow-hidden rounded-2xl border border-amber-300/20 bg-gradient-to-br from-black via-zinc-900 to-purple-950/60 p-6 sm:p-8"
    >
      {/* Soft gold glow, top-right corner */}
      <div
        className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-amber-300/15 blur-3xl"
        aria-hidden
      />
      {/* Soft purple glow, bottom-left corner */}
      <div
        className="pointer-events-none absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-purple-500/15 blur-3xl"
        aria-hidden
      />

      <div className="relative flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-amber-200/80">
            <Gem className="h-3.5 w-3.5" />
            Luxury Shoots · Collection 03
          </p>
          <h2 className="mt-2 bg-gradient-to-r from-amber-200 via-yellow-100 to-amber-200 bg-clip-text text-3xl font-black tracking-tight text-transparent sm:text-4xl md:text-5xl">
            Premium Editorial
          </h2>
          <p className="mt-2 inline-flex items-center gap-2 rounded-full border border-amber-300/40 bg-amber-300/5 px-3 py-1 text-xs font-bold uppercase tracking-widest text-amber-200">
            <Crown className="h-3.5 w-3.5" />
            Hand-picked
          </p>
          <p className="mt-3 max-w-xl text-sm text-white/70 sm:text-base">
            High-production luxury shoots — couture, jewelry, marble, gold.
            Slow, cinematic, expensive. The kind of content that earns the
            word <em>shoot</em>.
          </p>
        </div>

        <div className="hidden shrink-0 rounded-xl border border-amber-300/30 bg-black/70 px-4 py-3 text-right font-mono shadow-2xl backdrop-blur-sm sm:block">
          <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-amber-200/80">
            Edition
          </p>
          <p className="mt-1 bg-gradient-to-b from-amber-200 to-yellow-300 bg-clip-text text-2xl font-black text-transparent">
            № 24K
          </p>
        </div>
      </div>
    </section>
  );
}
