import { Radio } from 'lucide-react';

export default function LiveCamsBanner() {
  return (
    <section
      aria-label="Live cams"
      className="relative mb-4 overflow-hidden rounded-xl border border-red-500/20 bg-gradient-to-br from-black via-red-950/50 to-black p-3 sm:mb-8 sm:rounded-2xl sm:p-7"
    >
      <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-red-500/20 blur-3xl sm:-right-20 sm:-top-20 sm:h-64 sm:w-64 sm:bg-red-500/30" aria-hidden />
      {/* Scanline */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{ backgroundImage: 'repeating-linear-gradient(0deg, #ffffff 0 1px, transparent 1px 4px)' }}
        aria-hidden
      />

      <div className="relative flex items-center justify-between gap-3 sm:flex-col sm:items-start sm:gap-5">
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-[0.25em] text-white/50 sm:text-[10px] sm:tracking-[0.3em]">
            <Radio className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
            <span className="hidden sm:inline">Live Cams · Studio 02</span>
            <span className="sm:hidden">Live Cams</span>
          </p>

          <h2 className="mt-1 text-lg font-black tracking-tight text-white sm:mt-2 sm:text-3xl md:text-4xl">
            Going Live
          </h2>

          <p className="mt-1 hidden max-w-xl text-sm text-white/60 sm:mt-2 sm:block">
            Tune into real-time streams from creators broadcasting now. Drop in, send a tip — they can hear you.
          </p>
        </div>

        {/* On Air badge */}
        <span className="shrink-0 inline-flex items-center gap-1.5 rounded-full bg-red-500/20 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide text-red-300 sm:text-xs sm:tracking-widest">
          <span className="relative inline-flex h-1.5 w-1.5 sm:h-2 sm:w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-red-500 sm:h-2 sm:w-2" />
          </span>
          On Air
        </span>
      </div>
    </section>
  );
}
