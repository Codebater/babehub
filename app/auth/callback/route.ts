import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * Supabase magic-link + OAuth callback. Supabase appends `?code=...` (and
 * optionally `?next=...`) to this URL after a user clicks the magic link or
 * completes an OAuth flow. We exchange the code for a session (which sets
 * the auth cookies via the cookie-aware server client), then redirect to
 * the requested next page — defaulting to `/app/dashboard`.
 *
 * This route is intentionally OUTSIDE `app/[locale]/` so it doesn't get
 * locale-rewritten, and is excluded from the next-intl middleware matcher
 * (see `middleware.ts`).
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/app/dashboard';

  if (!code) {
    // No code = either an error or someone hit the URL directly.
    return NextResponse.redirect(`${origin}/app/login?error=missing_code`);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(
      `${origin}/app/login?error=${encodeURIComponent(error.message)}`,
    );
  }

  // Honor `?next=/some/path` if provided (e.g. deep-link after sign-in),
  // but only if it's a relative path on this origin (defense against
  // open-redirect abuse).
  const safeNext = next.startsWith('/') && !next.startsWith('//') ? next : '/app/dashboard';
  return NextResponse.redirect(`${origin}${safeNext}`);
}
