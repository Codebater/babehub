import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import OnboardingForm from './OnboardingForm';

/**
 * `/app/onboarding` — one-time form to collect handle / display_name / bio
 * and pick fan vs creator. After submission `profiles.onboarded_at` is set
 * and the user lands on `/app/dashboard`.
 *
 * Idempotent: if the user has already onboarded, this page redirects them
 * straight to the dashboard so they don't accidentally overwrite their
 * choices. Dedicated `/app/settings` page (later) will handle edits.
 */
export default async function OnboardingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/app/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('handle, display_name, bio, role, onboarded_at')
    .eq('id', user.id)
    .single();

  if (profile?.onboarded_at) {
    redirect('/app/dashboard');
  }

  return (
    <main className="mx-auto max-w-2xl px-6 py-10">
      <header className="mb-8 text-center">
        <h1 className="text-4xl font-black tracking-tight text-text-main">
          Set up your account
        </h1>
        <p className="mt-3 text-text-secondary">
          Pick a handle, tell us who you are, and choose whether you&apos;re here
          to subscribe to creators or to publish content yourself. You can change
          all of this later.
        </p>
      </header>

      <OnboardingForm
        initial={{
          handle: profile?.handle ?? '',
          display_name: profile?.display_name ?? '',
          bio: profile?.bio ?? '',
          role: profile?.role ?? 'fan',
        }}
      />
    </main>
  );
}
