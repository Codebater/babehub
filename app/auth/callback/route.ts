import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

/**
 * Supabase magic-link + OAuth callback. Supabase appends `?code=...` (and
 * optionally `?next=...`) to this URL after a user clicks the magic link or
 * completes an OAuth flow. We exchange the code for a session (which sets
 * the auth cookies via the cookie-aware server client), then redirect to
 * the requested next page — defaulting to `/explore` (the platform's
 * main discovery surface for both fans and creators).
 *
 * Admin bootstrap: if the signed-in user's email is in `ADMIN_EMAILS`
 * (comma-separated list of authoritative admin addresses), we promote
 * `profiles.role` to 'admin' via the service-role client. This makes
 * "make my account the admin" a single env-var change — set it in
 * .env.local, sign in, done. The promotion only fires when the email
 * actually matches and the row exists; otherwise it's a no-op.
 *
 * This route is intentionally OUTSIDE `app/[locale]/` so it doesn't get
 * locale-rewritten, and is excluded from the next-intl middleware matcher
 * (see `middleware.ts`).
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/app/onboarding';

  if (!code) {
    return NextResponse.redirect(`${origin}/app/login?error=missing_code`);
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    // PKCE failure on cross-browser clicks ("code verifier not found in
    // storage") is by far the most common cause. Surface a friendly
    // message + steer the user toward the 6-digit code fallback instead
    // of leaking Supabase's raw error string.
    const looksLikePkceMiss =
      /code verifier|pkce|code_verifier/i.test(error.message);
    const friendly = looksLikePkceMiss
      ? 'This magic link was opened in a different browser than where you requested it. Request a new link and either click it in the same browser, or paste the 6-digit code from the email.'
      : error.message;
    return NextResponse.redirect(
      `${origin}/app/login?error=${encodeURIComponent(friendly)}`,
    );
  }

  // ── Admin bootstrap (post-auth promotion) ────────────────────────
  // Done before the redirect so the next page render sees role=admin.
  // Uses the service-role client because a user can't elevate their
  // own role via RLS (and shouldn't be able to). Silent on every
  // failure path — if env vars aren't set or the row isn't ready
  // yet, the user signs in normally as fan/creator.
  try {
    const email = data?.user?.email?.toLowerCase();
    const userId = data?.user?.id;
    const allowList = (process.env.ADMIN_EMAILS ?? '')
      .split(',')
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);

    if (email && userId && allowList.includes(email)) {
      const admin = createAdminClient();
      await admin
        .from('profiles')
        .update({ role: 'admin' })
        .eq('id', userId);
    }
  } catch {
    // Intentional swallow — admin promotion is best-effort, never a
    // reason to fail the sign-in itself.
  }

  // Honor `?next=/some/path` if provided (e.g. deep-link after sign-in),
  // but only if it's a relative path on this origin (defense against
  // open-redirect abuse).
  const safeNext = next.startsWith('/') && !next.startsWith('//') ? next : '/app/onboarding';
  return NextResponse.redirect(`${origin}${safeNext}`);
}
