/**
 * lib/analytics/track.ts
 *
 * Tiny, privacy-friendly funnel tracker. Fires named events to /api/track
 * with an anonymous, locally-generated session id (no PII, no cookies, no
 * third party). Uses sendBeacon so events still land if the user navigates
 * away mid-funnel.
 *
 * Client-only — call from 'use client' components / event handlers.
 */

const SESSION_KEY = 'bh_sid';

function getSession(): string {
  try {
    let sid = localStorage.getItem(SESSION_KEY);
    if (!sid) {
      sid = (crypto.randomUUID?.() ?? `${Date.now()}-${Math.random()}`).slice(0, 36);
      localStorage.setItem(SESSION_KEY, sid);
    }
    return sid;
  } catch {
    return 'anon';
  }
}

/** Record a funnel event. Best-effort and silent — never throws. */
export function track(name: string): void {
  try {
    if (typeof window === 'undefined') return;
    const body = JSON.stringify({
      name,
      session: getSession(),
      path: window.location.pathname,
    });
    if (navigator.sendBeacon) {
      navigator.sendBeacon('/api/track', new Blob([body], { type: 'application/json' }));
    } else {
      void fetch('/api/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
        keepalive: true,
      });
    }
  } catch {
    /* analytics is best-effort */
  }
}
