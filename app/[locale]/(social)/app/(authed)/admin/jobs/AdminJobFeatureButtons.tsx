'use client';

import { useTransition } from 'react';
import { Star, StarOff } from 'lucide-react';
import { setJobFeatured } from '../actions';

/**
 * Admin row controls for the jobs table. Three durations the admin
 * can pick from when promoting; each calls `setJobFeatured(id, days)`
 * which writes `featured_until = now() + days` on the row.
 *
 * `Unfeature` writes `featured_until = null` and drops the job back
 * into the auto-pick pool (which ranks by budget).
 *
 * `useTransition` keeps the buttons clickable while the action runs;
 * the dim during pending tells the admin the click landed without a
 * full page reload.
 */
type Props = {
  jobId: string;
  /** Current featured_until — null = auto-pool, future date = manual feature. */
  featuredUntil: string | null;
};

const DURATIONS = [
  { days: 7, label: '7d' },
  { days: 30, label: '30d' },
  { days: 90, label: '90d' },
] as const;

export default function AdminJobFeatureButtons({ jobId, featuredUntil }: Props) {
  const [pending, startTransition] = useTransition();
  const isManual = !!featuredUntil && new Date(featuredUntil) > new Date();

  const feature = (days: number) =>
    startTransition(() => {
      void setJobFeatured(jobId, days);
    });
  const unfeature = () =>
    startTransition(() => {
      void setJobFeatured(jobId, null);
    });

  return (
    <div className={`flex flex-wrap items-center gap-1.5 ${pending ? 'opacity-60' : ''}`}>
      {DURATIONS.map((d) => (
        <button
          key={d.days}
          type="button"
          onClick={() => feature(d.days)}
          disabled={pending}
          title={`Feature for ${d.days} days`}
          className="inline-flex items-center gap-1 rounded-md border border-border-color bg-card px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-text-secondary transition-colors hover:border-amber-400/60 hover:text-amber-300 disabled:opacity-50"
        >
          <Star className="h-3 w-3" />
          {d.label}
        </button>
      ))}
      {isManual && (
        <button
          type="button"
          onClick={unfeature}
          disabled={pending}
          title="Unfeature — back to budget auto-pick pool"
          className="inline-flex items-center gap-1 rounded-md border border-amber-400/40 bg-amber-400/15 px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-amber-300 transition-colors hover:bg-amber-400/25 disabled:opacity-50"
        >
          <StarOff className="h-3 w-3" />
          Unfeature
        </button>
      )}
    </div>
  );
}
