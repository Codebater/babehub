'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { Clapperboard, Radio, Gem } from 'lucide-react';

/**
 * Horizontal row of one-tap category filters shown above the search bar
 * on /explore. Pre-fills the same `?q=…` param the search box uses, so
 * the eporner-search pipeline is reused unchanged.
 *
 * Visible on every viewport — unlike the desktop-only sidebar Categories
 * section. Active chip is highlighted; tapping the active chip clears
 * back to the unfiltered "All" feed.
 */

const CATEGORIES = [
  { label: 'Casting', q: 'casting', icon: Clapperboard },
  { label: 'Live Cams', q: 'live cams', icon: Radio },
  { label: 'Luxury Shoots', q: 'luxury', icon: Gem },
] as const;

export default function CategoryChips() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  // Chips always navigate to /explore?q=… regardless of current route —
  // they're a global category switcher, not a per-page filter. Otherwise
  // clicking Casting from /creators would push /creators?q=casting which
  // wouldn't do anything.
  const onExplore = pathname?.endsWith('/explore') ?? false;
  const currentQ = onExplore ? (searchParams?.get('q') ?? '') : '';

  const go = (q: string) => {
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    const qs = params.toString();
    router.push(qs ? `/explore?${qs}` : '/explore');
  };

  return (
    <div className="-mx-1 flex gap-2 overflow-x-auto pb-1">
      {CATEGORIES.map(({ label, q, icon: Icon }) => {
        const active = currentQ === q;
        return (
          <button
            key={label || 'all'}
            type="button"
            onClick={() => go(q)}
            className={`flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm font-bold transition-colors ${
              active
                ? 'bg-primary text-white shadow-lg shadow-primary/30'
                : 'border border-border-color bg-card/40 text-text-secondary hover:border-primary hover:text-primary'
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        );
      })}
    </div>
  );
}
