'use client';

import { useState, useTransition } from 'react';
import { Send, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { applyToJob } from '@/lib/jobs/actions';

/**
 * Client apply form on /jobs/[id]. Intro message only for v1 — intro
 * media upload lands in Sprint 4 alongside business-messaging media.
 */
export default function ApplyToJobForm({
  jobId,
  jobTitle,
}: {
  jobId: string;
  jobTitle: string;
}) {
  const [body, setBody] = useState('');
  const [pending, startTransition] = useTransition();
  const [status, setStatus] = useState<
    { kind: 'idle' } | { kind: 'sent' } | { kind: 'error'; message: string }
  >({ kind: 'idle' });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!body.trim() || pending) return;
    const fd = new FormData();
    fd.set('job_id', jobId);
    fd.set('intro_message', body);
    startTransition(async () => {
      const res = await applyToJob(fd);
      if (res.ok) setStatus({ kind: 'sent' });
      else setStatus({ kind: 'error', message: res.error });
    });
  };

  if (status.kind === 'sent') {
    return (
      <div className="rounded-2xl border border-green-500/30 bg-green-500/5 p-5 text-center">
        <CheckCircle2 className="mx-auto h-8 w-8 text-green-400" />
        <p className="mt-2 text-sm font-bold text-text-main">
          Application sent to {jobTitle}.
        </p>
        <p className="mt-1 text-xs text-text-secondary">
          The recruiter sees your professional profile. They&apos;ll update
          your status in their inbox.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={submit}
      className="space-y-3 rounded-2xl border border-border-color bg-card p-5"
    >
      <label htmlFor="intro" className="block text-sm font-bold text-text-main">
        Your intro
      </label>
      <textarea
        id="intro"
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={5}
        maxLength={2000}
        placeholder="Why you're a fit. What makes you stand out. Any relevant links."
        className="min-h-[120px] w-full resize-y rounded-xl border border-border-color bg-card/60 px-3 py-2 text-sm text-text-main placeholder:text-text-secondary focus:border-primary focus:outline-none"
      />
      <p className="text-xs text-text-secondary">
        Your professional profile is attached automatically.
      </p>

      {status.kind === 'error' && (
        <div className="flex items-start gap-2 rounded-md border border-red-500/40 bg-red-500/5 p-3 text-sm text-red-300">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{status.message}</span>
        </div>
      )}

      <button
        type="submit"
        disabled={!body.trim() || pending}
        className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-primary/30 transition-all hover:scale-[1.02] hover:bg-pink-400 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        {pending ? 'Sending…' : 'Apply'}
      </button>
    </form>
  );
}
