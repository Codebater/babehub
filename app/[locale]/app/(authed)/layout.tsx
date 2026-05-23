import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { createClient } from '@/lib/supabase/server';

/**
 * Auth gate for every route inside the `(authed)` group: dashboard,
 * onboarding, settings, content composer, etc.
 *
 * If there's no Supabase session we redirect to `/app/login` and pass
 * `?next=<original-path>` so the user lands back where they were after
 * signing in.
 */
export default async function AuthedLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    // Recover the requested path so we can deep-link back after sign-in.
    const h = await headers();
    const requested = h.get('x-invoke-path') ?? h.get('referer') ?? '/app/dashboard';
    const next =
      requested && requested.startsWith('/') && !requested.startsWith('/app/login')
        ? requested
        : '/app/dashboard';
    redirect(`/app/login?next=${encodeURIComponent(next)}`);
  }

  return <>{children}</>;
}
