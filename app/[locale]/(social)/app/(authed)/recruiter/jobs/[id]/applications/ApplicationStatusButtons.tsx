'use client';

import { useTransition, useState } from 'react';
import { Eye, Star, Check, X, Loader2 } from 'lucide-react';
import { setApplicationStatus } from '@/lib/jobs/actions';

/**
 * Quick-action button row for an application row in the recruiter
 * inbox. Each button kicks the application to the next status via
 * `setApplicationStatus` server action; on success the page
 * revalidates so the StatusBadge updates.
 *
 * Disabled buttons indicate the current state. The page-level
 * revalidate handles UI refresh — we don't keep optimistic state
 * here because the badge lives in the parent (server-rendered).
 */
type Status = 'pending' | 'viewed' | 'shortlisted' | 'accepted' | 'rejected' | 'withdrawn';

const BUTTONS: Array<{ status: Status; label: string; icon: typeof Eye; cls: string }> = [
  { status: 'viewed', label: 'Mark viewed', icon: Eye, cls: 'hover:text-text-main' },
  { status: 'shortlisted', label: 'Shortlist', icon: Star, cls: 'hover:text-amber-400' },
  { status: 'accepted', label: 'Accept', icon: Check, cls: 'hover:text-green-400' },
  { status: 'rejected', label: 'Reject', icon: X, cls: 'hover:text-red-400' },
];

export default function ApplicationStatusButtons({
  applicationId,
  currentStatus,
}: {
  applicationId: string;
  currentStatus: string;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const onClick = (status: Status) => {
    setError(null);
    startTransition(async () => {
      const res = await setApplicationStatus(applicationId, status);
      if (!res.ok) setError(res.error);
    });
  };

  return (
    <div>
      <div className="flex flex-wrap gap-1.5">
        {BUTTONS.map(({ status, label, icon: Icon, cls }) => {
          const active = currentStatus === status;
          return (
            <button
              key={status}
              type="button"
              onClick={() => onClick(status)}
              disabled={pending || active}
              className={`inline-flex items-center gap-1 rounded-full border border-border-color px-3 py-1.5 text-xs font-medium text-text-secondary transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${cls}`}
            >
              {pending ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Icon className="h-3 w-3" />
              )}
              {label}
            </button>
          );
        })}
      </div>
      {error && <p className="mt-2 text-xs text-red-400">{error}</p>}
    </div>
  );
}
