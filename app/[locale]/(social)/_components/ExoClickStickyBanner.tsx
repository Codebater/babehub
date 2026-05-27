'use client';

import { useEffect } from 'react';

/**
 * Loads ExoClick's ad-provider script and renders the sticky banner
 * ins tag once per page. ExoClick's script handles the fixed/sticky
 * positioning — the ins tag just needs to be in the DOM.
 *
 * Zone 5935770 is babehub.net's sticky banner zone.
 */
export default function ExoClickStickyBanner() {
  useEffect(() => {
    const win = window as unknown as Record<string, unknown[]>;
    win.AdProvider = (win.AdProvider as unknown[]) ?? [];
    win.AdProvider.push({ serve: {} });

    if (document.querySelector('script[src*="a.magsrv.com/ad-provider.js"]')) return;
    const s = document.createElement('script');
    s.async = true;
    s.type = 'application/javascript';
    s.src = 'https://a.magsrv.com/ad-provider.js';
    document.head.appendChild(s);
  }, []);

  return (
    <ins className="eas6a97888e17" data-zoneid="5935770" data-sub="123450000" />
  );
}
