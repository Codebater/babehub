import { Link } from '@/i18n/navigation';
import { Lock, Sparkles, ArrowRight } from 'lucide-react';

/**
 * Wraps a section in a blur + click-block overlay when `locked=true`.
 *
 * Used on `/explore?q=casting` for non-elevated viewers: the children
 * (the catalog grid) render normally but are blurred and unclickable,
 * with a centered "Unlock Premium" CTA overlay pulling the viewer
 * toward the $10/mo upgrade.
 *
 * Elevated viewers (admin / verified / active premium) get the gate
 * disabled via `locked=false` and see the grid as normal.
 *
 * Server component — no JS needed. The blur is CSS, the click block
 * is `pointer-events-none` on the children container, the unlock
 * CTA is a regular Link (currently to /app/premium placeholder; the
 * NOWPayments checkout flow lands in a follow-up turn).
 */
export default function PremiumGate({
  locked,
  category,
  children,
}: {
  locked: boolean;
  /** Display name of the gated section, e.g. "Casting". */
  category: string;
  children: React.ReactNode;
}) {
  if (!locked) return <>{children}</>;

  return (
    <div className="relative">
      {/* Lightly-blurred frozen content — just enough to signal "you
          can't click these yet" without hiding what's behind. 4px is
          the sweet spot: thumbnails are still recognizable (face
          shapes, framing, colors) so the upgrade pitch lands as
          "unlock THIS specific catalog" instead of "unlock a mystery
          grid". aria-hidden because the overlay carries the actual
          actionable content. */}
      <div
        aria-hidden="true"
        className="pointer-events-none select-none blur-[3px]"
      >
        {children}
      </div>

      {/* Overlay sits above the blurred grid. The card itself is now
          smaller and less opaque (bg-black/70 instead of full gradient
          fill) so the surrounding grid peeks through on either side —
          more "preview" feel, less "wall". */}
      <div className="absolute inset-0 z-10 flex items-start justify-center p-4 sm:p-6">
        <div className="sticky top-24 max-w-sm rounded-2xl border border-amber-400/40 bg-black/70 p-5 text-center shadow-2xl shadow-amber-400/20 backdrop-blur-md sm:p-6">
          <span
            aria-hidden
            className="pointer-events-none absolute -right-16 -top-16 h-32 w-32 rounded-full bg-amber-400/25 blur-3xl"
          />
          <span className="relative inline-flex h-10 w-10 items-center justify-center rounded-xl border border-amber-400/30 bg-amber-400/15 text-amber-300">
            <Lock className="h-5 w-5" />
          </span>
          <p className="relative mt-3 inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.25em] text-amber-300">
            <Sparkles className="h-3 w-3" />
            Premium · $10/mo
          </p>
          <h2 className="relative mt-1.5 text-lg font-black tracking-tight text-white sm:text-xl">
            Unlock the {category} catalog
          </h2>
          <p className="relative mt-1.5 text-xs text-white/70">
            $10/mo · full catalog + every creator&apos;s otherwise-blurred posts. Cancel anytime.
          </p>
          <Link
            href={'/app/premium' as never}
            className="group relative mt-4 inline-flex items-center gap-2 rounded-full bg-amber-400 px-4 py-2 text-xs font-black uppercase tracking-widest text-black shadow-lg shadow-amber-400/30 transition-all hover:scale-[1.03] hover:bg-amber-300"
          >
            Unlock premium
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
