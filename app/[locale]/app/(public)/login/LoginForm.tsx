'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { sendMagicLink, signInWithGoogle, type LoginState } from './actions';

function MagicLinkButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-full bg-primary py-3 px-6 font-bold text-white shadow-lg shadow-primary/30 transition-all hover:bg-pink-400 hover:scale-[1.02] disabled:cursor-not-allowed disabled:bg-pink-400/50 disabled:hover:scale-100"
    >
      {pending ? 'Sending magic link…' : 'Send magic link'}
    </button>
  );
}

function GoogleButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="flex w-full items-center justify-center gap-3 rounded-full border border-border-color bg-secondary py-3 px-6 font-medium text-text-main transition-all hover:border-primary hover:bg-card disabled:cursor-not-allowed disabled:opacity-50"
    >
      <GoogleIcon className="h-5 w-5" />
      {pending ? 'Redirecting…' : 'Continue with Google'}
    </button>
  );
}

function GoogleIcon({ className }: { className?: string }) {
  // Multicolour Google "G" logo. Inline SVG so we don't pull in a font/icon
  // dependency for a single mark.
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
      <path
        fill="#FFC107"
        d="M43.6 20.5H42V20H24v8h11.3c-1.7 4.7-6.2 8-11.3 8a12 12 0 1 1 0-24 12 12 0 0 1 8.5 3.5l5.7-5.7A20 20 0 1 0 44 24c0-1.2-.1-2.3-.4-3.5z"
      />
      <path
        fill="#FF3D00"
        d="M6.3 14.7l6.6 4.8A12 12 0 0 1 24 12c3.2 0 6.1 1.2 8.4 3.2l5.7-5.7A20 20 0 0 0 6.3 14.7z"
      />
      <path
        fill="#4CAF50"
        d="M24 44a20 20 0 0 0 13.5-5.2l-6.2-5.3a12 12 0 0 1-7.3 2.5c-5.2 0-9.6-3.3-11.2-7.9l-6.5 5A20 20 0 0 0 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.6 20.5H42V20H24v8h11.3a12 12 0 0 1-4.1 5.5l6.2 5.3A20 20 0 0 0 44 24c0-1.2-.1-2.3-.4-3.5z"
      />
    </svg>
  );
}

const initial: LoginState = {};

export default function LoginForm() {
  const [state, formAction] = useActionState(sendMagicLink, initial);

  if (state.ok) {
    return (
      <div className="rounded-xl border border-border-color bg-card p-6 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/20 text-2xl">
          ✉️
        </div>
        <h2 className="text-xl font-bold text-text-main">Check your inbox</h2>
        <p className="mt-2 text-sm text-text-secondary">
          We sent a sign-in link to{' '}
          <span className="font-medium text-text-main">{state.email}</span>.
          Click it from the same device to finish signing in.
        </p>
        <p className="mt-6 text-xs text-text-secondary">
          Didn&apos;t get it? Check your spam folder or{' '}
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="font-medium text-primary underline-offset-2 hover:underline"
          >
            try again
          </button>
          .
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Google sign-in — separate form so its pending state is independent
          from the magic-link form's pending state. */}
      <form action={signInWithGoogle}>
        <GoogleButton />
      </form>

      <div className="flex items-center gap-3 text-xs uppercase tracking-widest text-text-secondary/70">
        <span className="h-px flex-1 bg-border-color" />
        or
        <span className="h-px flex-1 bg-border-color" />
      </div>

      <form action={formAction} className="space-y-4">
        <div>
          <label htmlFor="email" className="mb-1 block text-sm font-medium text-text-secondary">
            Email address
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            defaultValue={state.email ?? ''}
            placeholder="you@example.com"
            className="w-full rounded-md border border-border-color bg-secondary px-3 py-2 text-text-main placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        {state.error && (
          <div className="rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-400">
            {state.error}
          </div>
        )}

        <MagicLinkButton />
      </form>
    </div>
  );
}
