'use server';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getRequestOrigin } from '@/lib/site';

export type LoginState = {
  ok?: boolean;
  email?: string;
  error?: string;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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
