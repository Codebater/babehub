'use client';

import { useState, useTransition } from 'react';
import { Trash2, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

/**
 * Client form for /legal/delete-my-application. Posts the email to
 * /api/survey/delete and shows the result (success + count, or error).
 *
 * Deliberately simple — no double-confirm modal, no captcha — for v1.
 * The endpoint validates the email shape; the worst a bad actor can do
 * is delete applications belonging to addresses they already know,
 * which is a deliberate trade-off to keep the right-to-erasure path
 * frictionless. Phase-2 hardening: send a confirmation email via
 * Resend before executing the delete.
 */
type Status =
  | { kind: 'idle' }
  | { kind: 'success'; deleted: number }
  | { kind: 'error'; message: string };

export default function DeleteForm() {
  const [email, setEmail] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [status, setStatus] = useState<Status>({ kind: 'idle' });
  const [pending, startTransition] = useTransition();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !confirmed || pending) return;
    setStatus({ kind: 'idle' });

    startTransition(async () => {
      try {
        const res = await fetch('/api/survey/delete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: email.trim() }),
        });
        const data = (await res.json().catch(() => null)) as
          | { success?: boolean; deleted?: number; details?: string }
          | null;
        if (!res.ok || !data?.success) {
          setStatus({
            kind: 'error',
            message: data?.details ?? 'Something went wrong. Try again.',
          });
          return;
        }
        setStatus({ kind: 'success', deleted: data.deleted ?? 0 });
      } catch (err) {
        setStatus({
          kind: 'error',
          message: err instanceof Error ? err.message : String(err),
        });
      }
    });
  };

  if (status.kind === 'success') {
    return (
      <div className="rounded-2xl border border-green-500/30 bg-green-500/5 p-6 text-center">
        <CheckCircle2 className="mx-auto h-10 w-10 text-green-400" />
        <p className="mt-3 text-lg font-bold text-text-main">
          {status.deleted === 0
            ? 'No records found.'
            : `Deleted ${status.deleted} record${status.deleted === 1 ? '' : 's'}.`}
        </p>
        <p className="mt-2 text-sm text-text-secondary">
          {status.deleted === 0
            ? "We didn't find an application matching that email. Nothing to delete."
            : 'Your application data has been permanently removed from our system.'}
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <label
          htmlFor="email"
          className="block text-sm font-bold text-text-main"
        >
          Email address
        </label>
        <input
          id="email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="mt-1 w-full rounded-xl border border-border-color bg-card/60 px-3 py-2 text-sm text-text-main placeholder:text-text-secondary focus:border-primary focus:outline-none"
        />
        <p className="mt-1 text-xs text-text-secondary">
          Same address you used on the Apply form.
        </p>
      </div>

      <label className="flex items-start gap-2 text-sm text-text-main">
        <input
          type="checkbox"
          checked={confirmed}
          onChange={(e) => setConfirmed(e.target.checked)}
          className="mt-1 h-4 w-4 shrink-0 rounded border-border-color text-primary focus:ring-primary"
        />
        <span>
          I confirm I want to permanently delete every application
          record associated with this email. <strong>This cannot be undone.</strong>
        </span>
      </label>

      {status.kind === 'error' && (
        <div className="flex items-start gap-2 rounded-md border border-red-500/40 bg-red-500/5 p-3 text-sm text-red-300">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{status.message}</span>
        </div>
      )}

      <button
        type="submit"
        disabled={!email.trim() || !confirmed || pending}
        className="flex w-full items-center justify-center gap-2 rounded-full bg-red-500 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-red-500/20 transition-all hover:bg-red-400 hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
      >
        {pending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Trash2 className="h-4 w-4" />
        )}
        {pending ? 'Deleting…' : 'Delete my application data'}
      </button>
    </form>
  );
}
