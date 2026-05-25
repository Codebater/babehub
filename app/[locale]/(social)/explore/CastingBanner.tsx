import { Clapperboard, Megaphone, ArrowRight } from 'lucide-react';
import { Link } from '@/i18n/navigation';

/**
 * Section banner shown only on /explore?q=casting.
 *
 * Movie-set themed: black canvas + a clapperboard icon + the classic
 * black/white striped clapperboard ribbon along the top edge. Sets the
 * tone for the casting view so the user knows they're inside a special
 * category, not just looking at a generic search.
 *
 * Server component — no client state needed.
 */
export default function CastingBanner() {
  return (
    <section
      aria-label="Casting room"
      className="relative mb-8 overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-black via-zinc-900 to-black p-6 sm:p-8"
    >
      {/* Clapperboard diagonal stripes along the top edge — the classic
          black/white slate ribbon. */}
      <div
        className="absolute inset-x-0 top-0 h-3 sm:h-4"
        style={{
          backgroundImage:
            'repeating-linear-gradient(-30deg, #ffffff 0 16px, #000000 16px 32px)',
        }}
        aria-hidden
      />

      {/* Soft primary glow behind the headline to lift it off the black. */}
      <div
        className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-primary/20 blur-3xl"
        aria-hidden
      />

      <div className="relative mt-4 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-white/60">
            <Clapperboard className="h-3.5 w-3.5" />
            Casting Room · Scene 01
          </p>
          <h2 className="mt-2 text-3xl font-black tracking-tight text-white sm:text-4xl md:text-5xl">
            Auditions in Session
          </h2>
          <p className="mt-2 inline-flex items-center gap-2 rounded-full bg-primary/20 px-3 py-1 text-xs font-bold uppercase tracking-widest text-primary">
            <Megaphone className="h-3.5 w-3.5" />
            Now searching new auditions
          </p>
          <p className="mt-3 max-w-xl text-sm text-white/70 sm:text-base">
            Every video below is a numbered take from an open call. Want to
            be the next take? Apply to be cast — we&apos;re reviewing
            applications now.
          </p>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <Link
              href={'/#apply' as '/'}
              className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-black uppercase tracking-widest text-white shadow-lg shadow-primary/40 transition-all hover:scale-[1.03] hover:bg-pink-400"
            >
              Apply to be cast
              <ArrowRight className="h-4 w-4" />
            </Link>
            <p className="text-xs text-white/50">
              Two minutes · we&apos;ll reply within 48 hours
            </p>
          </div>
        </div>

        <div className="hidden shrink-0 rounded-xl border border-white/20 bg-black/60 px-4 py-3 text-right font-mono shadow-2xl backdrop-blur-sm sm:block">
          <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-white/60">
            Now Casting
          </p>
          <p className="mt-1 text-2xl font-black text-white">N° 2026</p>
        </div>
      </div>
    </section>
  );
}
