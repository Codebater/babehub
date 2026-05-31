'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, Loader2 } from 'lucide-react';
import { switchToCreator } from '../settings/actions';

/**
 * Promotes a fan to a creator in place. Calls the existing
 * `switchToCreator` server action (sets role='creator' + creates the
 * creator_settings row), then refreshes so the dashboard re-renders as
 * the creator view.
 */
export default function SwitchToCreatorButton() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const onClick = () => {
    setError(null);
    startTransition(async () => {
      const res = await switchToCreator();
      if (res.error) {
        setError(res.error);
        return;
      }
      router.refresh();
    });
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={onClick}
        disabled={pending}
        className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-primary/30 transition-all hover:scale-[1.02] hover:bg-pink-400 disabled:opacity-60 disabled:hover:scale-100"
      >
        {pending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Switching…
          </>
        ) : (
          <>
            Switch to creator
            <ArrowRight className="h-4 w-4" />
          </>
        )}
      </button>
      {error && <p className="mt-2 text-xs text-red-400">{error}</p>}
    </div>
  );
}
