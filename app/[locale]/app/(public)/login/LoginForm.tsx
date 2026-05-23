'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { sendMagicLink, type LoginState } from './actions';

function SubmitButton() {
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
          autoFocus
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

      <SubmitButton />
    </form>
  );
}
