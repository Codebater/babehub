'use client';

import { useEffect } from 'react';

/**
 * Loads ExoClick's ad-provider script and renders the sticky banner
 * ins tag once per page. ExoClick's script handles the fixed/sticky
 * positioning — the ins tag just needs to be in the DOM.
 *
 * Zone 5935770 is babehub.net's sticky banner zone (728×90 desktop /
 * responsive mobile). The script is injected once even if this
 * component re-mounts.
 */
export default function ExoClickStickyBanner() {
  useEffect(() => {
    const existing = document.querySelector(
      'script[src*="a.magsrv.com/ad-provider.js"]',
    );
    const push = () => {
      (window as { AdProvider?: { push: (v: unknown) => void }[] }).AdProvider =
        (window as { AdProvider?: { push: (v: unknown) => void }[] }).AdProvider ?? [];
      (window as { AdProvider: { push: (v: unknown) => void }[] }).AdProvider.push({
        serve: {},
      });
    };
    if (existing) {
      push();
      return;
    }
    const s = document.createElement('script');
    s.async = true;
    s.type = 'application/javascript';
    s.src = 'https://a.magsrv.com/ad-provider.js';
    s.onload = push;
    document.head.appendChild(s);
  }, []);

  return (
    <ins className="eas6a97888e17" data-zoneid="5935770" data-sub="123450000" />
  );
}
