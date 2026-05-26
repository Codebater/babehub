'use client';

import { useEffect, useState, useTransition } from 'react';
import { Trash2, Check } from 'lucide-react';
import { deleteBlogPost } from '../actions';

/**
 * Two-step confirm-then-delete for admin blog post rows. Same pattern
 * as the survey/inquiry delete button: first click arms (red
 * "Confirm" for 3 seconds), second click within the window fires the
 * server action. No modal, no accidental deletes.
 */
const ARM_WINDOW_MS = 3000;

export default function AdminBlogDeleteButton({
  id,
  title,
}: {
  id: string;
  title: string;
}) {
  const [armed, setArmed] = useState(false);
  const [pending, startTransition] = useTransition();

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
      void deleteBlogPost(id);
    });
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={pending}
      title={armed ? `Click again to permanently delete "${title}"` : `Delete "${title}"`}
      className={`inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[10px] font-bold uppercase tracking-widest transition-colors disabled:opacity-50 ${
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
