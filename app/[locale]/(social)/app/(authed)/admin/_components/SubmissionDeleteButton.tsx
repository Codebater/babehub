'use client';

import { useEffect, useState, useTransition } from 'react';
import { Trash2, Check } from 'lucide-react';
import { deleteSurveySubmission, deleteBannerInquiry } from '../actions';

/**
 * Two-step confirm-then-delete button for the admin submission queues.
 *
 * Click 1 — flips the button into a red "Confirm?" state and starts a
 *   3-second arming window. Same click → no destructive action yet.
 * Click 2 — within the window — fires the server action.
 * No click within the window → button silently reverts to the default
 *   "Delete" state. No accidental deletions, no modal interruption.
 *
 * `useTransition` keeps the button clickable while the server action
 * runs and lets the row dim during the brief revalidate.
 */
type Kind = 'survey' | 'inquiry';

const ARM_WINDOW_MS = 3000;

export default function SubmissionDeleteButton({
  id,
  kind,
}: {
  id: string;
  kind: Kind;
}) {
  const [armed, setArmed] = useState(false);
  const [pending, startTransition] = useTransition();

  // Auto-disarm after ARM_WINDOW_MS so the destructive state is never
  // sticky. If the admin walks away, the button silently reverts.
  useEffect(() => {
    if (!armed) return;
    const t = window.setTimeout(() => setArmed(false), ARM_WINDOW_MS);
    return () => window.clearTimeout(t);
  }, [armed]);

  const onClick = () => {
    if (!armed) {
      setArmed(true);
      return;
    }
    startTransition(() => {
      if (kind === 'survey') void deleteSurveySubmission(id);
      else void deleteBannerInquiry(id);
    });
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={pending}
      title={armed ? 'Click again to permanently delete' : 'Delete this row'}
      aria-label={armed ? 'Confirm delete' : 'Delete row'}
      className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest transition-colors disabled:opacity-50 ${
        armed
          ? 'border-red-500 bg-red-500 text-white hover:bg-red-600'
          : 'border-border-color bg-card text-text-secondary hover:border-red-500/60 hover:text-red-400'
      }`}
    >
      {armed ? <Check className="h-3 w-3" /> : <Trash2 className="h-3 w-3" />}
      {armed ? 'Confirm' : 'Delete'}
    </button>
  );
}
