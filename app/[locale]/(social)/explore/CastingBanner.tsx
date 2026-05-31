'use client';

import { Clapperboard, ArrowRight } from 'lucide-react';
import { useSurveyModal } from '../SurveyModalProvider';

export default function CastingBanner() {
  const { openApply } = useSurveyModal();
  return (
    <section
      aria-label="Casting room"
      className="relative mb-4 overflow-hidden rounded-xl border border-white/10 bg-gradient-to-br from-black via-zinc-900 to-black p-3 sm:mb-8 sm:rounded-2xl sm:p-7"
    >
      {/* Clapperboard stripe — thin on mobile */}
      <div
        className="absolute inset-x-0 top-0 h-1.5 sm:h-3"
        style={{ backgroundImage: 'repeating-linear-gradient(-30deg, #ffffff 0 12px, #000000 12px 24px)' }}
        aria-hidden
      />
      <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-primary/15 blur-3xl sm:-right-20 sm:-top-20 sm:h-64 sm:w-64 sm:bg-primary/20" aria-hidden />

      <div className="relative mt-2 flex items-center justify-between gap-3 sm:mt-4 sm:flex-col sm:items-start sm:gap-5">
        <div className="min-w-0 flex-1">
          {/* Eyebrow */}
          <p className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-[0.25em] text-white/50 sm:text-[10px] sm:tracking-[0.3em]">
            <Clapperboard className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
            <span className="hidden sm:inline">Casting Room · Scene 01</span>
            <span className="sm:hidden">Casting</span>
          </p>

          {/* Headline */}
          <h2 className="mt-1 text-lg font-black tracking-tight text-white sm:mt-2 sm:text-3xl md:text-4xl">
            Auditions in Session
          </h2>

          {/* Body — hidden on mobile */}
          <p className="mt-2 hidden max-w-xl text-sm text-white/60 sm:block">
            Every video below is a numbered take from an open call. Want to be the next take? Apply — we&apos;re reviewing applications now.
          </p>
        </div>

        {/* CTA — inline on mobile, block on sm */}
        <button
          type="button"
          onClick={openApply}
          className="shrink-0 inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide text-white shadow-md shadow-primary/30 transition-all hover:bg-pink-400 sm:mt-4 sm:gap-2 sm:px-5 sm:py-2.5 sm:text-sm sm:tracking-widest"
        >
          Apply
          <ArrowRight className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
        </button>
      </div>
    </section>
  );
}
