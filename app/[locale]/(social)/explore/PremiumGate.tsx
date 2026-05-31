import { Link } from '@/i18n/navigation';
import { Lock, Clapperboard, ArrowRight } from 'lucide-react';

/**
 * Wraps a section in a blur + pointer-block overlay when `locked=true`.
 *
 * Elevated viewers (admin / verified / active premium) see the gate
 * disabled via `locked=false` and the grid renders normally.
 */
export default function PremiumGate({
  locked,
  category,
  children,
}: {
  locked: boolean;
  category: string;
  children: React.ReactNode;
}) {
  if (!locked) return <>{children}</>;

  return (
    <div className="relative">
      {/* Blurred frozen content — thumbnails still visible enough to
          communicate value, not hidden behind a black wall. */}
      <div aria-hidden="true" className="pointer-events-none select-none blur-[4px]">
        {children}
      </div>

      {/* Gate card */}
      <div className="absolute inset-0 z-10 flex items-start justify-center p-4 pt-8 sm:p-8 sm:pt-12">
        <div className="sticky top-24 w-full max-w-xs overflow-hidden rounded-2xl border border-amber-400/30 bg-zinc-950/90 shadow-2xl shadow-amber-400/10 backdrop-blur-xl">

          {/* Amber glow strip at top */}
          <div className="h-px w-full bg-gradient-to-r from-transparent via-amber-400/60 to-transparent" />

          <div className="p-6">
            {/* Icon + label */}
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-amber-400/30 bg-amber-400/10">
                <Clapperboard className="h-4 w-4 text-amber-300" />
              </span>
              <div>
                <p className="text-[9px] font-bold uppercase tracking-[0.25em] text-amber-300/80">
                  Premium Content
                </p>
                <p className="text-xs font-bold text-white">{category} Catalog</p>
              </div>
            </div>

            {/* Copy */}
            <p className="mt-4 text-sm font-bold text-white">
              Unlock the full {category} section
            </p>
            <p className="mt-1.5 text-xs leading-relaxed text-white/50">
              Premium gives you instant, unblurred access to the entire {category.toLowerCase()} catalog — plus every creator&apos;s locked posts, job applications, and upcoming chat features.
            </p>

            {/* Price + CTA */}
            <div className="mt-5 flex items-center gap-3">
              <Link
                href={'/app/premium' as never}
                className="group flex flex-1 items-center justify-center gap-2 rounded-full bg-amber-400 px-4 py-2.5 text-xs font-black uppercase tracking-wider text-black shadow-lg shadow-amber-400/25 transition-all hover:bg-amber-300 hover:scale-[1.02]"
              >
                <Lock className="h-3 w-3" />
                Unlock · $10/mo
                <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>
            <p className="mt-2 text-center text-[10px] text-white/25">
              Crypto · cancel any time
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
