import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { signOut } from '../../(public)/login/actions';

/**
 * `/app/dashboard` — first authenticated screen after sign-in.
 *
 * Phase 1 MVP version: reads the user's profile via RLS-aware client and
 * renders a placeholder home with their handle / display_name / role +
 * a sign-out button. Phase 1 next iterations layer in:
 *   - Creator stats panel (MRR, subs, tips)
 *   - Recent activity feed
 *   - Quick actions (new post, manage tiers, payouts)
 */
export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/app/login');

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('handle, display_name, bio, avatar_url, role, onboarded_at')
    .eq('id', user.id)
    .single();

  // Brand-new users haven't filled out the onboarding form yet — push them
  // through it before they see the dashboard.
  if (profile && !profile.onboarded_at) {
    redirect('/app/onboarding');
  }

  if (error || !profile) {
    // Trigger should have created this on signup. If it's missing the user
    // hit a rare race or the trigger failed — surface it loudly.
    return (
      <main className="mx-auto max-w-3xl px-6 py-12">
        <h1 className="text-2xl font-bold text-text-main">Profile not found</h1>
        <p className="mt-2 text-text-secondary">
          We couldn&apos;t load your profile. This usually clears up after a
          page refresh — if it doesn&apos;t, please contact support.
        </p>
        <p className="mt-4 font-mono text-xs text-text-secondary">
          {error?.message ?? 'no profile row for this user id'}
        </p>
      </main>
    );
  }

  const isCreator = profile.role === 'creator';

  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <header className="mb-10 flex items-center justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-widest text-text-secondary">Dashboard</p>
          <h1 className="mt-1 text-3xl font-black tracking-tight text-text-main">
            Welcome, {profile.display_name || profile.handle}
          </h1>
          <p className="mt-1 text-sm text-text-secondary">
            @{profile.handle} · role:{' '}
            <span className="font-medium capitalize text-primary">{profile.role}</span>
          </p>
        </div>

        <form action={signOut}>
          <button
            type="submit"
            className="rounded-full border border-border-color px-4 py-2 text-sm font-medium text-text-secondary transition-colors hover:border-primary hover:text-primary"
          >
            Sign out
          </button>
        </form>
      </header>

      <section className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {isCreator ? (
          <>
            <DashboardCard
              title="Subscribers"
              value="0"
              hint="Active paid subscribers across all tiers"
            />
            <DashboardCard
              title="MRR"
              value="$0"
              hint="Monthly recurring revenue (net of platform commission)"
            />
            <DashboardCard
              title="Tier"
              value="Free"
              hint="Your current plan"
            />
          </>
        ) : (
          <div className="md:col-span-3 rounded-2xl border border-border-color bg-card p-8">
            <h2 className="text-2xl font-bold text-text-main">Become a creator</h2>
            <p className="mt-2 max-w-xl text-text-secondary">
              Babe Hub creators set up subscription tiers, publish locked content,
              receive tips, and get paid in fiat (via Stripe Connect, coming soon)
              or crypto (NOWPayments). Your fan account stays — you just unlock
              creator features.
            </p>
            <Link
              href="/app/onboarding"
              className="mt-6 inline-block rounded-full bg-primary px-6 py-3 font-bold text-white transition-all hover:bg-pink-400 hover:scale-[1.02]"
            >
              Switch to creator →
            </Link>
          </div>
        )}
      </section>

      <section className="mt-12">
        <h2 className="mb-4 text-lg font-bold text-text-main">Quick links</h2>
        <ul className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <QuickLink href={`/c/${profile.handle}`}>View public profile</QuickLink>
          {isCreator && <QuickLink href="/app/dashboard/tiers">Manage tiers</QuickLink>}
          {isCreator && <QuickLink href="/app/dashboard/posts">Your posts</QuickLink>}
          <QuickLink href="/">Marketing site</QuickLink>
          <QuickLink href="/app/settings" disabled>
            Settings (soon)
          </QuickLink>
          <QuickLink href="/app/payouts" disabled>
            Payouts (soon)
          </QuickLink>
        </ul>
      </section>
    </main>
  );
}

function DashboardCard({
  title,
  value,
  hint,
}: {
  title: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="rounded-2xl border border-border-color bg-card p-6">
      <p className="text-xs uppercase tracking-widest text-text-secondary">{title}</p>
      <p className="mt-2 text-3xl font-black text-text-main">{value}</p>
      <p className="mt-2 text-xs text-text-secondary">{hint}</p>
    </div>
  );
}

function QuickLink({
  href,
  children,
  disabled,
}: {
  href: string;
  children: React.ReactNode;
  disabled?: boolean;
}) {
  if (disabled) {
    return (
      <li className="rounded-xl border border-border-color/50 bg-secondary/40 px-4 py-3 text-sm text-text-secondary/60">
        {children}
      </li>
    );
  }
  return (
    <li>
      <Link
        href={href}
        className="block rounded-xl border border-border-color bg-secondary px-4 py-3 text-sm text-text-main transition-colors hover:border-primary hover:text-primary"
      >
        {children}
      </Link>
    </li>
  );
}
