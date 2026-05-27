'use client';

import { useEffect, useState } from 'react';
import { Sparkles, ShieldAlert } from 'lucide-react';
import { Link } from '@/i18n/navigation';

/**
 * Mandatory age-confirmation modal. Renders on the first visit to any
 * page; once the visitor clicks "Yes, I'm 18+" we set
 * `localStorage.babehub_age_verified = 'true'` and hide it forever on
 * this browser. "No" or "Leave" hard-redirects the tab to google.com.
 *
 * SSR-safe: state defaults to `'pending'`. The localStorage check only
 * runs in `useEffect`, so the server never renders the modal — that
 * keeps the gate from flashing for already-verified returning visitors.
 *
 * Mounted once in app/[locale]/layout.tsx so it covers EVERY page
 * (marketing home, /explore, /jobs, /c/[handle], /app/*). Compliance-
 * driven: adult-content platforms commonly require this exact
 * "click-through" age gate as a record-keeping prerequisite.
 *
 * The modal also locks page scroll while open (no peeking at content
 * behind it) and blocks Esc + click-outside dismiss — the only ways
 * out are the Yes button or Leave.
 */
const STORAGE_KEY = 'babehub_age_verified';

export default function AgeGate() {
  const [state, setState] = useState<'pending' | 'open' | 'verified'>('pending');

  // Read localStorage after hydration so SSR markup doesn't differ from
  // the first client render. If the user has previously confirmed, skip
  // the modal entirely; otherwise show it.
  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      setState(stored === 'true' ? 'verified' : 'open');
    } catch {
      // localStorage can throw in private-mode Safari; in that case we
      // show the gate (safer to over-prompt than under-prompt).
      setState('open');
    }
  }, []);

  // Lock page scroll while the modal is open so visitors can't scroll
  // the underlying content behind it.
  useEffect(() => {
    if (state !== 'open') return;
    const original = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = original;
    };
  }, [state]);

  if (state !== 'open') return null;

  function handleConfirm() {
    try {
      window.localStorage.setItem(STORAGE_KEY, 'true');
    } catch {
      /* swallow — confirmation still applies to this tab via state */
    }
    setState('verified');
  }

  function handleLeave() {
    // Hard redirect, not a Link click — the user is opting out of the
    // entire domain, so we send them somewhere neutral.
    window.location.replace('https://www.google.com');
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="age-gate-title"
      aria-describedby="age-gate-body"
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4 backdrop-blur-md"
    >
      <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-primary/30 bg-gradient-to-br from-zinc-950 via-black to-pink-950/40 p-7 shadow-2xl shadow-primary/20 sm:p-8">
        {/* Decorative glow accents */}
        <span
          aria-hidden
          className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-primary/30 blur-3xl"
        />
        <span
          aria-hidden
          className="pointer-events-none absolute -bottom-16 -left-16 h-40 w-40 rounded-full bg-amber-400/20 blur-3xl"
        />

        <div className="relative">
          <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-primary/40 bg-primary/15 text-primary">
            <ShieldAlert className="h-5 w-5" />
          </span>

          <p className="mt-4 inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.25em] text-primary">
            <Sparkles className="h-3 w-3" />
            Adult content · 18+ only
          </p>

          <h2
            id="age-gate-title"
            className="mt-2 text-2xl font-black tracking-tight text-white sm:text-3xl"
          >
            Are you 18 or older?
          </h2>

          <p id="age-gate-body" className="mt-3 text-sm text-text-secondary">
            BabeHub features adult content intended for legal adults only.
            By entering, you confirm you are at least 18 years old and that
            adult content is legal in your jurisdiction.
          </p>

          <div className="mt-7 flex flex-col gap-2.5">
            <button
              type="button"
              onClick={handleConfirm}
              className="w-full rounded-full bg-primary px-6 py-3 text-sm font-black uppercase tracking-widest text-white shadow-lg shadow-primary/40 transition-all hover:scale-[1.01] hover:bg-pink-400"
            >
              Yes, I&apos;m 18 or older — Enter
            </button>
            <button
              type="button"
              onClick={handleLeave}
              className="w-full rounded-full border border-border-color px-6 py-3 text-sm font-bold text-text-secondary transition-colors hover:border-red-400 hover:text-red-300"
            >
              No, take me away
            </button>
          </div>

          <p className="mt-5 text-center text-[10px] text-text-secondary/70">
            By clicking &quot;Enter&quot; you agree to our{' '}
            <Link
              href="/legal/terms"
              className="underline transition-colors hover:text-primary"
            >
              Terms
            </Link>{' '}
            and{' '}
            <Link
              href="/legal/privacy"
              className="underline transition-colors hover:text-primary"
            >
              Privacy Policy
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
