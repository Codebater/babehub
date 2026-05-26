'use client';

import { useTransition } from 'react';
import { setSurveyStatus, setInquiryStatus } from '../actions';

/**
 * Status workflow buttons for the admin applications / inquiries
 * tables. Same vocabulary on both: new → reviewing → contacted →
 * accepted | rejected. The single component handles both kinds via
 * the `kind` prop to keep the JSX identical across the two tables.
 *
 * `useTransition` lets the row dim while the server action runs but
 * keeps the table interactive — no full page reload.
 */
type Kind = 'survey' | 'inquiry';
type Status = 'new' | 'reviewing' | 'contacted' | 'accepted' | 'rejected';

const STEPS: { value: Status; label: string; tone: string }[] = [
  { value: 'new', label: 'New', tone: 'text-text-secondary' },
  { value: 'reviewing', label: 'Reviewing', tone: 'text-sky-300' },
  { value: 'contacted', label: 'Contacted', tone: 'text-amber-300' },
  { value: 'accepted', label: 'Accept', tone: 'text-green-400' },
  { value: 'rejected', label: 'Reject', tone: 'text-red-400' },
];

export default function SubmissionStatusButtons({
  id,
  kind,
  current,
}: {
  id: string;
  kind: Kind;
  current: Status;
}) {
  const [pending, startTransition] = useTransition();

  const setStatus = (status: Status) =>
    startTransition(() => {
      if (kind === 'survey') void setSurveyStatus(id, status);
      else void setInquiryStatus(id, status);
    });

  return (
    <div className={`flex flex-wrap gap-1 ${pending ? 'opacity-60' : ''}`}>
      {STEPS.map((s) => {
        const isCurrent = s.value === current;
        return (
          <button
            key={s.value}
            type="button"
            onClick={() => setStatus(s.value)}
            disabled={pending || isCurrent}
            title={
              isCurrent ? `Already ${s.label.toLowerCase()}` : `Mark as ${s.label.toLowerCase()}`
            }
            className={`rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest transition-colors disabled:opacity-50 ${
              isCurrent
                ? `border-text-main/30 bg-text-main/10 ${s.tone}`
                : `border-border-color bg-card text-text-secondary hover:border-current ${s.tone.replace('text-', 'hover:text-')}`
            }`}
          >
            {s.label}
          </button>
        );
      })}
    </div>
  );
}
