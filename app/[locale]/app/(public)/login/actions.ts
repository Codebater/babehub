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

  if (!email || !EMAIL_RE.test(email)) {
    return { error: 'Please enter a valid email address.', email };
  }

  const supabase = await createClient();
  const origin = await getRequestOrigin();

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${origin}/auth/callback`,
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
 * Server Action: end the session and redirect home. Wired to the dashboard's
 * sign-out button. Always succeeds, even if the user had no session.
 */
export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/');
}
