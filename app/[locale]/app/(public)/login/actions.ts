'use server';

import { redirect } from 'next/navigation';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { getRequestOrigin } from '@/lib/site';

export type LoginState = {
  ok?: boolean;
  email?: string;
  error?: string;
};

export type TokenLoginState = {
  ok?: boolean;
  email?: string;
  error?: string;
  /** Where to send the user after the token verifies. */
  next?: string;
};

export type PasswordSignUpState = {
  ok?: boolean;
  email?: string;
  handle?: string;
  error?: string;
};

export type PasswordSignInState = {
  email?: string;
  error?: string;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const HANDLE_RE = /^[a-z0-9_]{3,30}$/;

/**
 * Server Action: send a magic-link email via Supabase Auth.
 *
 * The user enters their email → we call `signInWithOtp` → Supabase emails
 * them a one-tap link → the link points at `/auth/callback?code=...` →
 * the callback exchanges the code for a session and redirects to
 * `/app/dashboard`.
 *
 * Returns a state object the form uses to render a "check your inbox"
 * confirmation or an error message.
 */
export async function sendMagicLink(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get('email') ?? '').trim().toLowerCase();
  // Optional `next` lets a dedicated login surface (e.g. /app/admin/login)
  // route the post-auth visitor to a specific destination. Falls back to
  // the callback's default (/explore) when absent. Server-side
  // open-redirect defense lives in /auth/callback, so we don't sanitize
  // here; we just forward what we got.
  const next = String(formData.get('next') ?? '').trim();

  if (!email || !EMAIL_RE.test(email)) {
    return { error: 'Please enter a valid email address.', email };
  }

  const supabase = await createClient();
  const origin = await getRequestOrigin();
  const redirectUrl = next
    ? `${origin}/auth/callback?next=${encodeURIComponent(next)}`
    : `${origin}/auth/callback`;

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: redirectUrl,
      // shouldCreateUser=true is the default: first-time email creates an
      // account and triggers `handle_new_user` (auto-profile creation).
      shouldCreateUser: true,
    },
  });

  if (error) {
    return { error: error.message, email };
  }

  return { ok: true, email };
}

/**
 * Server Action: email + password + handle signup.
 *
 * Supabase Auth handles the password hashing, session creation, and the
 * verification email. We pass the chosen handle through raw_user_meta_data
 * so the `handle_new_user` DB trigger uses it as the profile's @handle on
 * the auto-created row (migration 0019).
 *
 * Email delivery goes via the SMTP server configured in Supabase Dashboard
 * → Authentication → Emails → SMTP Settings. Point that at Resend's SMTP
 * (smtp.resend.com:465, user "resend", password = Resend API key) so we
 * don't hit Supabase's default-sender rate limit.
 *
 * If "Confirm email" is ON in Supabase Auth settings (the default), the
 * user gets a verification email containing a link to /auth/callback.
 * They MUST click it from the same browser (PKCE) — same caveat as the
 * magic-link flow, same token-fallback applies.
 */
export async function signUpWithPassword(
  _prev: PasswordSignUpState,
  formData: FormData,
): Promise<PasswordSignUpState> {
  // ── Anti-spam: honeypot ─────────────────────────────────────────
  // The signup form renders a visually-hidden text field named `_trap`.
  // Real users never see or touch it. Bots that auto-fill all inputs
  // will fill it. Silently return ok so bots don't know they were
  // caught (they'd just iterate evasions if we returned an error).
  const trap = String(formData.get('_trap') ?? '');
  if (trap) return { ok: true, email: '', handle: '' };

  const email = String(formData.get('email') ?? '').trim().toLowerCase();
  const password = String(formData.get('password') ?? '');
  const handle = String(formData.get('handle') ?? '').trim().toLowerCase();

  if (!email || !EMAIL_RE.test(email)) {
    return { error: 'Please enter a valid email address.', email, handle };
  }
  if (!HANDLE_RE.test(handle)) {
    return {
      error: 'Username must be 3-30 lowercase letters, digits, or underscores.',
      email,
      handle,
    };
  }
  if (password.length < 8) {
    return { error: 'Password must be at least 8 characters.', email, handle };
  }

  const supabase = await createClient();
  const origin = await getRequestOrigin();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      // After the user clicks the confirmation link in their inbox, send
      // them to /explore rather than /app/onboarding — by the time they
      // verify they've already been through onboarding (instant-signup
      // flow with "Confirm email" OFF), so landing on the feed is right.
      emailRedirectTo: `${origin}/auth/callback?next=${encodeURIComponent('/explore')}`,
      data: { handle, display_name: handle },
    },
  });

  if (error) {
    return { error: error.message, email, handle };
  }

  // If "Confirm email" is OFF in Supabase Auth, signUp returns a live
  // session immediately — send the user to onboarding so they pick a
  // handle, bio, and fan-vs-creator role before landing in the app.
  // If "Confirm email" is ON (default), the user clicks the email link
  // which hits /auth/callback → /app/onboarding.
  if (data?.session) {
    // Instant-signup bypasses /auth/callback, so fire the welcome message
    // here too. Idempotent + best-effort.
    if (data.user?.id) {
      const { ensureWelcomeMessage } = await import('@/lib/chat/welcome');
      await ensureWelcomeMessage(data.user.id);
    }
    redirect('/app/onboarding');
  }

  return { ok: true, email, handle };
}

/**
 * Server Action: existing-account sign-in with email + password.
 */
export async function signInWithPassword(
  _prev: PasswordSignInState,
  formData: FormData,
): Promise<PasswordSignInState> {
  const email = String(formData.get('email') ?? '').trim().toLowerCase();
  const password = String(formData.get('password') ?? '');
  const next = String(formData.get('next') ?? '').trim();

  if (!email || !EMAIL_RE.test(email)) {
    return { error: 'Please enter a valid email address.', email };
  }
  if (!password) {
    return { error: 'Enter your password.', email };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: error.message, email };
  }

  const safeNext = next && next.startsWith('/') && !next.startsWith('//') ? next : '/explore';
  redirect(safeNext);
}

/**
 * Server Action: verify the 6-digit code Supabase emails alongside the
 * magic link. Used as the cross-browser fallback when the PKCE flow fails
 * ("code verifier not found in storage" — happens when the user clicks
 * the magic link in a different browser than where they requested it).
 *
 * Token verification does NOT use PKCE, so it works from any browser.
 * On success Supabase sets the session cookies via the cookie-aware
 * server client, and we redirect to /explore (or the requested next).
 */
export async function verifyEmailToken(
  _prev: TokenLoginState,
  formData: FormData,
): Promise<TokenLoginState> {
  const email = String(formData.get('email') ?? '').trim().toLowerCase();
  const token = String(formData.get('token') ?? '').trim();
  const next = String(formData.get('next') ?? '').trim();

  if (!email || !EMAIL_RE.test(email)) {
    return { error: 'Please enter a valid email address.', email };
  }
  if (!/^\d{6}$/.test(token)) {
    return { error: 'Enter the 6-digit code from your email.', email };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.verifyOtp({
    email,
    token,
    type: 'email',
  });

  if (error || !data?.user) {
    return { error: error?.message ?? 'Could not verify that code.', email };
  }

  // Same admin-bootstrap logic the /auth/callback route runs after a
  // PKCE exchange — keeps both paths behaviour-equivalent.
  try {
    const allowList = (process.env.ADMIN_EMAILS ?? '')
      .split(',')
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);
    if (allowList.includes(email)) {
      const admin = createAdminClient();
      await admin.from('profiles').update({ role: 'admin' }).eq('id', data.user.id);
    }
  } catch {
    /* admin promotion is best-effort */
  }

  // Token-verify path also bypasses /auth/callback — send the welcome
  // message here. Idempotent + best-effort.
  const { ensureWelcomeMessage } = await import('@/lib/chat/welcome');
  await ensureWelcomeMessage(data.user.id);

  const safeNext = next && next.startsWith('/') && !next.startsWith('//') ? next : '/explore';
  redirect(safeNext);
}

/**
 * Server Action: send a password-reset email. The user receives a single
 * email with a link → /auth/callback?type=recovery → /app/reset-password
 * where they set their new password. No PKCE required for recovery links.
 */
export async function sendPasswordReset(
  _prev: { ok?: boolean; email?: string; error?: string },
  formData: FormData,
): Promise<{ ok?: boolean; email?: string; error?: string }> {
  const email = String(formData.get('email') ?? '').trim().toLowerCase();
  if (!email || !EMAIL_RE.test(email)) {
    return { error: 'Please enter a valid email address.', email };
  }
  const supabase = await createClient();
  const origin = await getRequestOrigin();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/callback?type=recovery`,
  });
  if (error) return { error: error.message, email };
  return { ok: true, email };
}

/**
 * Server Action: kick off the Google OAuth sign-in flow.
 *
 * Flow:
 *   1. We call `signInWithOAuth({ provider: 'google' })` with redirectTo
 *      set to our own /auth/callback.
 *   2. Supabase returns a hosted URL — `data.url` — that points at Google's
 *      consent screen with all the right query params baked in.
 *   3. We redirect the browser there. Google handles consent, then bounces
 *      back to Supabase's `auth/v1/callback`, which exchanges the OAuth
 *      code for a Supabase session and finally redirects to our own
 *      /auth/callback?code=... where the existing code-for-session
 *      exchange completes.
 *
 * Requires: Google OAuth client configured in Supabase Auth → Providers.
 * Without that, this call returns an error and we bounce back to /app/login.
 */
export async function signInWithGoogle(formData?: FormData): Promise<void> {
  const supabase = await createClient();
  const origin = await getRequestOrigin();
  const next = formData ? String(formData.get('next') ?? '').trim() : '';
  const redirectTo = next
    ? `${origin}/auth/callback?next=${encodeURIComponent(next)}`
    : `${origin}/auth/callback`;

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo,
    },
  });

  if (error || !data?.url) {
    redirect(
      `/app/login?error=${encodeURIComponent(error?.message ?? 'oauth_unavailable')}`,
    );
  }

  redirect(data.url);
}

/**
 * Server Action: end the session and redirect home. Wired to the dashboard's
 * sign-out button. Always succeeds, even if the user had no session.
 */
export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/');
}
