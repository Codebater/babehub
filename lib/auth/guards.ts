import { redirect } from 'next/navigation';
import type { User } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';
import type { Database } from '@/types/supabase';

type Profile = Database['public']['Tables']['profiles']['Row'];

/**
 * Server-side guards for `/app/*` routes. Use in any (authed) page that
 * needs the user, the profile, and/or a Supabase client. Each guard
 * redirects rather than throwing so callers can `const ... = await guard()`
 * and trust the result downstream.
 */

type GuardResult = {
  user: User;
  profile: Profile;
  supabase: Awaited<ReturnType<typeof createClient>>;
};

/** Require a signed-in user. Redirects to /app/login if not. */
export async function requireUser(): Promise<GuardResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/app/login');

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();
  if (error || !profile) {
    // Profile should always exist (handle_new_user trigger creates it).
    // If somehow missing, force re-auth.
    await supabase.auth.signOut();
    redirect('/app/login?error=profile_missing');
  }

  return { user, profile, supabase };
}

/** Require a signed-in + onboarded user. */
export async function requireOnboarded(): Promise<GuardResult> {
  const result = await requireUser();
  if (!result.profile.onboarded_at) redirect('/app/onboarding');
  return result;
}

/** Require a signed-in, onboarded user whose role is 'creator'. */
export async function requireCreator(): Promise<GuardResult> {
  const result = await requireOnboarded();
  if (result.profile.role !== 'creator') redirect('/app/dashboard');
  return result;
}

/**
 * Require a signed-in, onboarded user whose `roles[]` contains
 * 'recruiter' (or 'agency', 'brand', 'service_provider' — any of the
 * "buy side" roles). We check the roles[] array rather than the
 * singular `role` column because Phase 2 lets a single user be both a
 * creator AND a recruiter simultaneously; the primary role stays in
 * `profiles.role`, the secondary roles live in `profiles.roles[]`.
 */
const BUY_SIDE_ROLES = ['recruiter', 'agency', 'brand', 'service_provider'] as const;

export async function requireRecruiter(): Promise<GuardResult> {
  const result = await requireOnboarded();
  const has = (result.profile.roles ?? []).some((r) =>
    (BUY_SIDE_ROLES as readonly string[]).includes(r),
  );
  if (!has) redirect('/app/dashboard');
  return result;
}

/**
 * Require a signed-in, onboarded user with admin privileges
 * (`profiles.role === 'admin'`). The 'admin' value has been in the
 * user_role enum since Phase 1 but only Phase 2 admin queues actually
 * read it.
 */
export async function requireAdmin(): Promise<GuardResult> {
  const result = await requireOnboarded();
  if (result.profile.role !== 'admin') redirect('/app/dashboard');
  return result;
}
