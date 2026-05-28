'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Loader2, CheckCircle2 } from 'lucide-react';

/**
 * `/app/reset-password` — reached after clicking a password-reset email link.
 * By the time the user lands here, /auth/callback has already exchanged the
 * recovery code for a session (type=recovery). We just need to call
 * supabase.auth.updateUser({ password }) with the new password.
 *
 * Client component: uses the browser Supabase client because updateUser
 * requires an active session in the browser's cookie store.
 */
export default function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    startTransition(async () => {
      const supabase = createClient();
      const { error: err } = await supabase.auth.updateUser({ password });
      if (err) {
        setError(err.message);
        return;
      }
      setDone(true);
      setTimeout(() => router.push('/explore'), 2000);
    });
  };

  if (done) {
    return (
      <main className="flex min-h-screen items-center justify-center px-6">
        <div className="w-full max-w-sm rounded-2xl border border-green-500/30 bg-green-500/5 p-8 text-center">
          <CheckCircle2 className="mx-auto h-10 w-10 text-green-400" />
          <p className="mt-3 text-base font-bold text-text-main">Password updated!</p>
          <p className="mt-1 text-sm text-text-secondary">Signing you in…</p>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm">
        <h1 className="mb-1 text-2xl font-black tracking-tight text-text-main">
          Set new password
        </h1>
        <p className="mb-6 text-sm text-text-secondary">
          Choose a strong password. After this you can sign in with email + password anytime.
        </p>

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label htmlFor="new-password" className="mb-1 block text-sm font-medium text-text-secondary">
              New password
            </label>
            <input
              id="new-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              autoComplete="new-password"
              placeholder="At least 8 characters"
              className="w-full rounded-xl border border-border-color bg-secondary px-3 py-2.5 text-text-main placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div>
            <label htmlFor="confirm-password" className="mb-1 block text-sm font-medium text-text-secondary">
              Confirm password
            </label>
            <input
              id="confirm-password"
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
              autoComplete="new-password"
              placeholder="Same password again"
              className="w-full rounded-xl border border-border-color bg-secondary px-3 py-2.5 text-text-main placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {error && (
            <p className="rounded-xl border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-400">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={pending}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-primary py-3 font-bold text-white shadow-lg shadow-primary/30 transition-all hover:bg-pink-400 hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {pending && <Loader2 className="h-4 w-4 animate-spin" />}
            {pending ? 'Updating…' : 'Set password'}
          </button>
        </form>
      </div>
    </main>
  );
}
