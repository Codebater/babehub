'use client';

import { useActionState, useState } from 'react';
import { useFormStatus } from 'react-dom';
import {
  sendPasswordReset,
  signInWithPassword,
  signUpWithPassword,
  type PasswordSignInState,
  type PasswordSignUpState,
} from './actions';

/* ── Submit buttons ────────────────────────────────────────────────── */

function PrimaryButton({ label, pendingLabel }: { label: string; pendingLabel: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-full bg-primary py-3 px-6 font-bold text-white shadow-lg shadow-primary/30 transition-all hover:bg-pink-400 hover:scale-[1.02] disabled:cursor-not-allowed disabled:bg-pink-400/50 disabled:hover:scale-100"
    >
      {pending ? pendingLabel : label}
    </button>
  );
}

const inputClass =
  'w-full rounded-xl border border-border-color bg-secondary px-3 py-2.5 text-text-main placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-primary';

const tabClass = (active: boolean) =>
  `flex-1 rounded-full px-4 py-2.5 text-xs font-bold uppercase tracking-widest transition-all ${
    active
      ? 'bg-primary text-white shadow-md shadow-primary/30'
      : 'text-text-secondary hover:text-text-main'
  }`;

/* ── Sign-in form ───────────────────────────────────────────────────── */

const initialSignIn: PasswordSignInState = {};
const initialReset = {};

function SignInPasswordForm() {
  const [state, action] = useActionState(signInWithPassword, initialSignIn);
  const [showForgot, setShowForgot] = useState(false);
  const [resetState, resetAction] = useActionState(sendPasswordReset, initialReset);

  if (showForgot) {
    if (resetState.ok) {
      return (
        <div className="rounded-xl border border-green-500/30 bg-green-500/5 p-5 text-center">
          <p className="text-2xl">✉️</p>
          <p className="mt-2 text-sm font-bold text-text-main">Reset link sent</p>
          <p className="mt-1 text-xs text-text-secondary">
            Check your inbox for a password reset link.
          </p>
          <button
            type="button"
            onClick={() => setShowForgot(false)}
            className="mt-4 text-xs text-primary hover:underline"
          >
            ← Back to sign in
          </button>
        </div>
      );
    }
    return (
      <div className="space-y-3">
        <p className="text-sm font-bold text-text-main">Reset your password</p>
        <p className="text-xs text-text-secondary">
          Enter your email and we&apos;ll send a reset link. One email, done.
        </p>
        <form action={resetAction} className="space-y-3">
          <input
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="you@example.com"
            defaultValue={(resetState as { email?: string }).email ?? ''}
            className={inputClass}
          />
          {(resetState as { error?: string }).error && (
            <p className="text-sm text-red-400">{(resetState as { error?: string }).error}</p>
          )}
          <PrimaryButton label="Send reset link" pendingLabel="Sending…" />
        </form>
        <button
          type="button"
          onClick={() => setShowForgot(false)}
          className="block text-xs text-text-secondary hover:text-text-main"
        >
          ← Back to sign in
        </button>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-3">
      <div>
        <label htmlFor="signin-email" className="mb-1 block text-sm font-medium text-text-secondary">
          Email
        </label>
        <input
          id="signin-email"
          name="email"
          type="email"
          required
          autoComplete="email"
          defaultValue={state.email ?? ''}
          placeholder="you@example.com"
          className={inputClass}
        />
      </div>
      <div>
        <div className="mb-1 flex items-center justify-between">
          <label htmlFor="signin-password" className="text-sm font-medium text-text-secondary">
            Password
          </label>
          <button
            type="button"
            onClick={() => setShowForgot(true)}
            className="text-xs text-text-secondary transition-colors hover:text-primary"
          >
            Forgot password?
          </button>
        </div>
        <input
          id="signin-password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          placeholder="Your password"
          className={inputClass}
        />
      </div>
      {state.error && (
        <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-400">
          {state.error}
        </div>
      )}
      <PrimaryButton label="Sign in" pendingLabel="Signing in…" />
    </form>
  );
}

/* ── Sign-up form ───────────────────────────────────────────────────── */

const initialSignUp: PasswordSignUpState = {};

function SignUpPasswordForm() {
  const [state, action] = useActionState(signUpWithPassword, initialSignUp);

  if (state.ok && state.email) {
    return (
      <div className="rounded-xl border border-border-color bg-card/60 p-6 text-center">
        <p className="text-3xl">✉️</p>
        <p className="mt-3 text-base font-bold text-text-main">Verify your email</p>
        <p className="mt-2 text-sm text-text-secondary">
          We sent a one-time verification link to{' '}
          <span className="font-semibold text-text-main">{state.email}</span>.{' '}
          Click it to activate your account — after that, sign in with your password any time, no email needed.
        </p>
        <p className="mt-5 text-xs text-text-secondary">
          Didn&apos;t get it? Check spam or{' '}
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
    <form action={action} className="space-y-3">
      {/* Honeypot anti-spam — must stay empty. Visually hidden so real
          users never see it; bots that blindly fill all inputs fill it. */}
      <input
        name="_trap"
        type="text"
        tabIndex={-1}
        aria-hidden="true"
        autoComplete="off"
        style={{ position: 'absolute', left: '-9999px', height: 1, width: 1, opacity: 0 }}
      />
      <div>
        <label htmlFor="signup-handle" className="mb-1 block text-sm font-medium text-text-secondary">
          Username
        </label>
        <input
          id="signup-handle"
          name="handle"
          type="text"
          required
          minLength={3}
          maxLength={30}
          pattern="[a-z0-9_]{3,30}"
          autoComplete="username"
          defaultValue={state.handle ?? ''}
          placeholder="yourname"
          className={inputClass}
        />
        <p className="mt-1 text-[11px] text-text-secondary">
          Lowercase letters, digits, underscores · 3–30 chars
        </p>
      </div>
      <div>
        <label htmlFor="signup-email" className="mb-1 block text-sm font-medium text-text-secondary">
          Email
        </label>
        <input
          id="signup-email"
          name="email"
          type="email"
          required
          autoComplete="email"
          defaultValue={state.email ?? ''}
          placeholder="you@example.com"
          className={inputClass}
        />
      </div>
      <div>
        <label htmlFor="signup-password" className="mb-1 block text-sm font-medium text-text-secondary">
          Password
        </label>
        <input
          id="signup-password"
          name="password"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          placeholder="At least 8 characters"
          className={inputClass}
        />
      </div>
      {state.error && (
        <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-400">
          {state.error}
        </div>
      )}
      <PrimaryButton label="Create account" pendingLabel="Creating account…" />
      <p className="text-center text-[11px] text-text-secondary">
        One verification email on signup. After that, sign in with password — no more emails.
      </p>
    </form>
  );
}

/* ── Tab shell ─────────────────────────────────────────────────────── */

type Tab = 'signin' | 'signup';

export default function LoginForm() {
  const [tab, setTab] = useState<Tab>('signin');

  return (
    <div className="space-y-5">
      {/* Two-tab switcher */}
      <div
        role="tablist"
        aria-label="Sign-in method"
        className="flex items-center gap-1 rounded-full border border-border-color bg-secondary p-1"
      >
        <button
          role="tab"
          type="button"
          aria-selected={tab === 'signin'}
          onClick={() => setTab('signin')}
          className={tabClass(tab === 'signin')}
        >
          Sign in
        </button>
        <button
          role="tab"
          type="button"
          aria-selected={tab === 'signup'}
          onClick={() => setTab('signup')}
          className={tabClass(tab === 'signup')}
        >
          Sign up
        </button>
      </div>

      {tab === 'signin' && <SignInPasswordForm />}
      {tab === 'signup' && <SignUpPasswordForm />}
    </div>
  );
}
