import { Radio, Dot } from 'lucide-react';

/**
 * Section banner shown only on /explore?q=live%20cams.
 *
 * Broadcast-set themed: deep red glow + "ON AIR" pill that pulses,
 * radio-wave icon, big "Going Live" headline. Sets the tone for the
 * live-cam view so the user knows they're inside a special category,
 * not just looking at a generic search.
 *
 * Server component — no client state needed. The pulse is pure CSS so
 * Tailwind's animate-ping handles it without any client JS.
 */
export default function LiveCamsBanner() {
  return (
    <section
      aria-label="Live cams"
      className="relative mb-8 overflow-hidden rounded-2xl border border-red-500/20 bg-gradient-to-br from-black via-red-950/60 to-black p-6 sm:p-8"
    >
      {/* Red broadcast glow, top-right corner */}
      <div
        className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-red-500/30 blur-3xl"
        aria-hidden
      />
      {/* Soft scanline texture for the "broadcast" feel */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            'repeating-linear-gradient(0deg, #ffffff 0 1px, transparent 1px 4px)',
        }}
        aria-hidden
      />

      <div className="relative flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-white/60">
            <Radio className="h-3.5 w-3.5" />
            Live Cams · Studio 02
          </p>
          <h2 className="mt-2 text-3xl font-black tracking-tight text-white sm:text-4xl md:text-5xl">
            Going Live
          </h2>
          <p className="mt-2 inline-flex items-center gap-1 rounded-full bg-red-500/30 px-3 py-1 text-xs font-bold uppercase tracking-widest text-red-300">
            <span className="relative inline-flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
            </span>
            On Air Now
          </p>
          <p className="mt-3 max-w-xl text-sm text-white/70 sm:text-base">
            Tune into real-time streams from creators broadcasting now. Drop
            in, send a tip, leave a comment — they can hear you.
          </p>
        </div>

        <div className="hidden shrink-0 rounded-xl border border-red-500/30 bg-black/70 px-4 py-3 text-right font-mono shadow-2xl backdrop-blur-sm sm:block">
          <p className="flex items-center justify-end gap-1 text-[10px] font-bold uppercase tracking-[0.25em] text-red-300">
            <Dot className="-mr-1 h-4 w-4 animate-pulse text-red-500" />
            Live
          </p>
          <p className="mt-1 text-2xl font-black text-white">CH 02</p>
        </div>
      </div>
    </section>
  );
}
