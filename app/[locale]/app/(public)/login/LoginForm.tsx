'use client';

import { useActionState, useState } from 'react';
import { useFormStatus } from 'react-dom';
import {
  sendMagicLink,
  signInWithGoogle,
  signInWithPassword,
  signUpWithPassword,
  verifyEmailToken,
  type LoginState,
  type PasswordSignInState,
  type PasswordSignUpState,
  type TokenLoginState,
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

function SecondaryButton({ label, pendingLabel }: { label: string; pendingLabel: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-full border border-primary/50 bg-primary/10 py-2.5 px-6 text-sm font-bold text-primary transition-all hover:border-primary hover:bg-primary/20 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {pending ? pendingLabel : label}
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

const inputClass =
  'w-full rounded-md border border-border-color bg-secondary px-3 py-2 text-text-main placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-primary';
const tabClass = (active: boolean) =>
  `flex-1 rounded-full px-4 py-2 text-xs font-bold uppercase tracking-widest transition-colors ${
    active
      ? 'bg-primary text-white shadow-md shadow-primary/30'
      : 'text-text-secondary hover:text-text-main'
  }`;

/* ── Sub-forms ─────────────────────────────────────────────────────── */

const initialSignIn: PasswordSignInState = {};
function SignInPasswordForm() {
  const [state, action] = useActionState(signInWithPassword, initialSignIn);
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
        <label
          htmlFor="signin-password"
          className="mb-1 block text-sm font-medium text-text-secondary"
        >
          Password
        </label>
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
        <div className="rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-400">
          {state.error}
        </div>
      )}
      <PrimaryButton label="Sign in" pendingLabel="Signing in…" />
    </form>
  );
}

const initialSignUp: PasswordSignUpState = {};
function SignUpPasswordForm() {
  const [state, action] = useActionState(signUpWithPassword, initialSignUp);

  if (state.ok && state.email) {
    return (
      <div className="rounded-xl border border-border-color bg-card p-6 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/20 text-2xl">
          ✉️
        </div>
        <h2 className="text-xl font-bold text-text-main">Check your inbox</h2>
        <p className="mt-2 text-sm text-text-secondary">
          We sent a verification link to{' '}
          <span className="font-medium text-text-main">{state.email}</span>.
          Click it to activate your account and sign in.
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
    <form action={action} className="space-y-3">
      <div>
        <label htmlFor="signup-handle" className="mb-1 block text-sm font-medium text-text-secondary">
          Username (handle)
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
          Your @handle. Lowercase letters, digits, underscores. 3–30 chars.
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
        <label
          htmlFor="signup-password"
          className="mb-1 block text-sm font-medium text-text-secondary"
        >
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
        <div className="rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-400">
          {state.error}
        </div>
      )}
      <PrimaryButton label="Create account" pendingLabel="Creating account…" />
    </form>
  );
}

const initialMagic: LoginState = {};
const initialToken: TokenLoginState = {};
function CheckInbox({ email }: { email: string }) {
  const [state, formAction] = useActionState(verifyEmailToken, {
    ...initialToken,
    email,
  });
  return (
    <div className="rounded-xl border border-border-color bg-card p-6 text-center">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/20 text-2xl">
        ✉️
      </div>
      <h2 className="text-xl font-bold text-text-main">Check your inbox</h2>
      <p className="mt-2 text-sm text-text-secondary">
        We sent a sign-in link to{' '}
        <span className="font-medium text-text-main">{email}</span>. Click it
        in the same browser, OR paste the 6-digit code from the email below.
      </p>

      <form action={formAction} className="mt-5 space-y-3 text-left">
        <input type="hidden" name="email" value={email} />
        <div>
          <label
            htmlFor="token"
            className="mb-1 block text-xs font-medium uppercase tracking-widest text-text-secondary"
          >
            6-digit code
          </label>
          <input
            id="token"
            name="token"
            type="text"
            inputMode="numeric"
            pattern="[0-9]{6}"
            maxLength={6}
            autoComplete="one-time-code"
            placeholder="123456"
            className="w-full rounded-md border border-border-color bg-secondary px-3 py-2 text-center font-mono text-lg tracking-[0.5em] text-text-main placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        {state.error && (
          <div className="rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-400">
            {state.error}
          </div>
        )}
        <SecondaryButton label="Verify code" pendingLabel="Verifying…" />
      </form>

      <p className="mt-5 text-xs text-text-secondary">
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

function MagicLinkForm() {
  const [state, action] = useActionState(sendMagicLink, initialMagic);

  if (state.ok && state.email) {
    return <CheckInbox email={state.email} />;
  }

  return (
    <form action={action} className="space-y-3">
      <div>
        <label
          htmlFor="magic-email"
          className="mb-1 block text-sm font-medium text-text-secondary"
        >
          Email
        </label>
        <input
          id="magic-email"
          name="email"
          type="email"
          required
          autoComplete="email"
          defaultValue={state.email ?? ''}
          placeholder="you@example.com"
          className={inputClass}
        />
      </div>
      {state.error && (
        <div className="rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-400">
          {state.error}
        </div>
      )}
      <PrimaryButton label="Send magic link" pendingLabel="Sending magic link…" />
      <p className="text-[11px] text-text-secondary">
        We&apos;ll email a one-tap sign-in link. No password needed.
      </p>
    </form>
  );
}

/* ── Tab shell ─────────────────────────────────────────────────────── */

type Tab = 'signin' | 'signup' | 'magic';

/**
 * Three sign-in modes in one form:
 *   - signin  : email + password against an existing account
 *   - signup  : email + username + password creates a new account; user
 *               gets a verification email via Resend SMTP (configured in
 *               Supabase Dashboard → Authentication → Emails)
 *   - magic   : magic-link email (works the same, with the 6-digit-code
 *               fallback for cross-browser clicks)
 *
 * All three share the Google OAuth button up top.
 */
export default function LoginForm() {
  const [tab, setTab] = useState<Tab>('signin');

  return (
    <div className="space-y-5">
      <form action={signInWithGoogle}>
        <GoogleButton />
      </form>

      <div className="flex items-center gap-3 text-xs uppercase tracking-widest text-text-secondary/70">
        <span className="h-px flex-1 bg-border-color" />
        or
        <span className="h-px flex-1 bg-border-color" />
      </div>

      {/* Tab switcher — pill row, single-row, primary-pink for active. */}
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
        <button
          role="tab"
          type="button"
          aria-selected={tab === 'magic'}
          onClick={() => setTab('magic')}
          className={tabClass(tab === 'magic')}
        >
          Magic link
        </button>
      </div>

      {tab === 'signin' && <SignInPasswordForm />}
      {tab === 'signup' && <SignUpPasswordForm />}
      {tab === 'magic' && <MagicLinkForm />}
    </div>
  );
}
