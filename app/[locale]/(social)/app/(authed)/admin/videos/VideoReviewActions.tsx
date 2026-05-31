'use client';

import { useState, useTransition } from 'react';
import { Check, X, Loader2 } from 'lucide-react';
import { approveVideo, rejectVideo } from './actions';

export default function VideoReviewActions({ submissionId }: { submissionId: string }) {
  const [pending, startTransition] = useTransition();
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);

  const onApprove = () => {
    setError(null);
    startTransition(async () => {
      const res = await approveVideo(submissionId);
      if (!res.ok) setError(res.error ?? 'Failed.');
    });
  };

  const onReject = () => {
    setError(null);
    startTransition(async () => {
      const res = await rejectVideo(submissionId, reason);
      if (!res.ok) setError(res.error ?? 'Failed.');
      else setRejecting(false);
    });
  };

  if (rejecting) {
    return (
      <div className="space-y-2">
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value.slice(0, 280))}
          rows={2}
          placeholder="Reason (optional — shown to the user)…"
          className="w-full rounded-lg border border-border-color bg-secondary px-3 py-2 text-xs text-text-main placeholder-text-secondary/50 focus:border-red-400/50 focus:outline-none"
        />
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onReject}
            disabled={pending}
            className="inline-flex items-center gap-1 rounded-full bg-red-500 px-4 py-1.5 text-xs font-bold text-white transition-colors hover:bg-red-400 disabled:opacity-50"
          >
            {pending ? <Loader2 className="h-3 w-3 animate-spin" /> : <X className="h-3 w-3" />}
            Confirm reject
          </button>
          <button
            type="button"
            onClick={() => setRejecting(false)}
            disabled={pending}
            className="rounded-full border border-border-color px-4 py-1.5 text-xs font-bold text-text-secondary transition-colors hover:text-text-main disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
        {error && <p className="text-xs text-red-400">{error}</p>}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onApprove}
          disabled={pending}
          className="inline-flex items-center gap-1 rounded-full bg-green-500 px-4 py-1.5 text-xs font-bold text-white transition-colors hover:bg-green-400 disabled:opacity-50"
        >
          {pending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
          Approve
        </button>
        <button
          type="button"
          onClick={() => setRejecting(true)}
          disabled={pending}
          className="inline-flex items-center gap-1 rounded-full border border-red-500/40 px-4 py-1.5 text-xs font-bold text-red-400 transition-colors hover:bg-red-500/10 disabled:opacity-50"
        >
          <X className="h-3 w-3" />
          Reject
        </button>
      </div>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}
