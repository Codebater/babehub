import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { createClient } from '@/lib/supabase/server';

/**
 * Auth gate for every route inside the `(authed)` group: dashboard,
 * onboarding, settings, tiers, posts, subscriptions landing, etc.
 *
 * The persistent chrome (sidebar + bottom tab bar) comes from the parent
 * `(social)/layout.tsx`, which also fetches the profile. This layout is
 * just the auth gate — no nav, no duplicate profile fetch.
 *
 * Onboarding-gating is handled per-page (dashboard redirects to
 * /app/onboarding if `profile.onboarded_at` is null). We don't gate
 * here because /app/onboarding itself lives under (authed) and a
 * layout-level redirect would loop.
 */
export default async function AuthedLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const h = await headers();
    const requested = h.get('x-invoke-path') ?? h.get('referer') ?? '/explore';
    const next =
      requested && requested.startsWith('/') && !requested.startsWith('/app/login')
        ? requested
        : '/explore';
    redirect(`/app/login?next=${encodeURIComponent(next)}`);
  }

  return <>{children}</>;
}
