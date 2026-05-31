import { Gem } from 'lucide-react';

export default function LuxuryBanner() {
  return (
    <section
      aria-label="Luxury shoots"
      className="relative mb-4 overflow-hidden rounded-xl border border-amber-300/15 bg-gradient-to-br from-black via-zinc-900 to-purple-950/50 p-3 sm:mb-8 sm:rounded-2xl sm:p-7"
    >
      <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-amber-300/10 blur-3xl sm:-right-24 sm:-top-24 sm:h-72 sm:w-72 sm:bg-amber-300/15" aria-hidden />
      <div className="pointer-events-none absolute -bottom-16 -left-16 h-40 w-40 rounded-full bg-purple-500/10 blur-3xl sm:-bottom-24 sm:-left-24 sm:h-72 sm:w-72 sm:bg-purple-500/15" aria-hidden />

      <div className="relative flex items-center justify-between gap-3 sm:flex-col sm:items-start sm:gap-5">
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-[0.25em] text-amber-200/60 sm:text-[10px] sm:tracking-[0.3em]">
            <Gem className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
            <span className="hidden sm:inline">Luxury Shoots · Collection 03</span>
            <span className="sm:hidden">Luxury</span>
          </p>

          <h2 className="mt-1 bg-gradient-to-r from-amber-200 via-yellow-100 to-amber-200 bg-clip-text text-lg font-black tracking-tight text-transparent sm:mt-2 sm:text-3xl md:text-4xl">
            Premium Editorial
          </h2>

          <p className="mt-1 hidden max-w-xl text-sm text-white/60 sm:mt-2 sm:block">
            High-production luxury shoots — couture, marble, gold. Slow, cinematic, expensive.
          </p>
        </div>

        {/* Edition badge */}
        <span className="shrink-0 inline-flex items-center gap-1.5 rounded-full border border-amber-300/30 bg-amber-300/5 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide text-amber-200 sm:text-xs sm:tracking-widest">
          <Gem className="h-3 w-3" />
          Curated
        </span>
      </div>
    </section>
  );
}
