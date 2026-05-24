import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import AppNav from './AppNav';

/**
 * Auth gate for every route inside the `(authed)` group: dashboard,
 * onboarding, settings, tiers, posts, subscriptions landing, etc.
 *
 * Responsibilities:
 *   1. Bounce unauthenticated users to /app/login with a `next=` deep-link.
 *   2. Fetch the minimal profile fields the persistent <AppNav /> needs
 *      so every child page gets the same shared chrome.
 *
 * Onboarding-gating is handled per-page (dashboard redirects to /app/onboarding
 * if profile.onboarded_at is null). We don't gate here because /app/onboarding
 * itself lives under (authed) and a layout-level redirect would loop.
 */
export default async function AuthedLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const h = await headers();
    const requested = h.get('x-invoke-path') ?? h.get('referer') ?? '/app/dashboard';
    const next =
      requested && requested.startsWith('/') && !requested.startsWith('/app/login')
        ? requested
        : '/app/dashboard';
    redirect(`/app/login?next=${encodeURIComponent(next)}`);
  }

  // Pull just enough profile to render the nav. If it's somehow missing
  // (auth trigger raced) render the bare layout — the dashboard page has a
  // more detailed fallback for that situation.
  const { data: profile } = await supabase
    .from('profiles')
    .select('handle, display_name, avatar_url, role')
    .eq('id', user.id)
    .maybeSingle();

  return (
    <>
      {profile && (
        <AppNav
          profile={{
            handle: profile.handle,
            display_name: profile.display_name,
            avatar_url: profile.avatar_url,
          }}
          isCreator={profile.role === 'creator'}
        />
      )}
      {children}
    </>
  );
}
