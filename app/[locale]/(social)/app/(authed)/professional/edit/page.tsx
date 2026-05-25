import { requireOnboarded } from '@/lib/auth/guards';
import ProfessionalProfileForm from './ProfessionalProfileForm';

export const dynamic = 'force-dynamic';

/**
 * `/app/professional/edit` — single-screen editor for the professional
 * profile (separate from the social profile in /app/settings). Loads
 * any existing row + portfolio items, then hands them to the client
 * form for editing.
 *
 * Auth-gated via `requireOnboarded()` — this is open to every
 * onboarded user, not just creators, because recruiters / agencies /
 * brands also need a professional identity to be discoverable.
 */
export default async function ProfessionalEditPage() {
  const { user, profile, supabase } = await requireOnboarded();

  const [{ data: pro }, { data: portfolio }] = await Promise.all([
    supabase
      .from('professional_profiles')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle(),
    supabase
      .from('portfolio_items')
      .select('id, title, description, external_url, media_id, sort_order, created_at')
      .eq('user_id', user.id)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false }),
  ]);

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <header className="mb-8">
        <p className="text-sm text-text-secondary">
          Your <strong className="text-text-main">professional identity</strong>{' '}
          — separate from your social profile. Recruiters, agencies and brands
          see this when searching for talent.
        </p>
      </header>

      <ProfessionalProfileForm
        currentHandle={profile.handle}
        defaults={{
          headline: pro?.headline ?? '',
          about: pro?.about ?? '',
          hourly_rate_cents: pro?.hourly_rate_cents ?? null,
          currency: pro?.currency ?? 'USD',
          region: pro?.region ?? '',
          languages: pro?.languages ?? [],
          skills: pro?.skills ?? [],
          categories: pro?.categories ?? [],
          collaboration_status:
            (pro?.collaboration_status as 'open' | 'selective' | 'closed') ?? 'open',
          availability:
            (pro?.availability as 'available' | 'busy' | 'unavailable') ?? 'available',
          visibility:
            (pro?.visibility as 'public' | 'recruiters_only' | 'private') ?? 'public',
          links: (pro?.links as Record<string, string>) ?? {},
        }}
        portfolio={portfolio ?? []}
      />
    </main>
  );
}
