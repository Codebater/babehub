'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { track } from '@/lib/analytics/track';

/**
 * Fires a `pageview` event on first load and on every client-side route
 * change. Mounted once in the root locale layout so it covers the whole
 * site. Admin/API paths are skipped to avoid polluting traffic numbers
 * with internal navigation.
 */
export default function PageViewTracker() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname) return;
    // Skip internal/admin surfaces.
    if (/(^|\/)(app\/admin|api)(\/|$)/.test(pathname)) return;
    track('pageview');
  }, [pathname]);

  return null;
}
