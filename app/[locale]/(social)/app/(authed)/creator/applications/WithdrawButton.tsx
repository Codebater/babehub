'use client';

import { useTransition, useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import { setApplicationStatus } from '@/lib/jobs/actions';

/**
 * Withdraw button for the applicant's outbox row. Calls
 * `setApplicationStatus(id, 'withdrawn')` — the server action's
 * guard makes sure only the applicant can move an application to
 * 'withdrawn'.
 */
export default function WithdrawButton({ applicationId }: { applicationId: string }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const onClick = () => {
    if (!confirm('Withdraw this application? You can apply again later.')) return;
    setError(null);
    startTransition(async () => {
      const res = await setApplicationStatus(applicationId, 'withdrawn');
      if (!res.ok) setError(res.error);
    });
  };

  return (
    <div>
      <button
        type="button"
        onClick={onClick}
        disabled={pending}
        className="inline-flex items-center gap-1 rounded-full border border-border-color px-3 py-1.5 text-xs font-medium text-text-secondary transition-colors hover:border-red-400 hover:text-red-400 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {pending ? <Loader2 className="h-3 w-3 animate-spin" /> : <X className="h-3 w-3" />}
        Withdraw
      </button>
      {error && <p className="mt-2 text-xs text-red-400">{error}</p>}
    </div>
  );
}
