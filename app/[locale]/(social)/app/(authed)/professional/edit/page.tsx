import { requireOnboarded } from '@/lib/auth/guards';
import ProfessionalProfileForm from './ProfessionalProfileForm';
import SettingsForm from '../../settings/SettingsForm';
import ImageUploader from '../../settings/ImageUploader';

export const dynamic = 'force-dynamic';

/**
 * `/app/professional/edit` — single Profile editor that merges what
 * used to be split between `/app/settings` (account identity — cover,
 * avatar, handle, display_name, bio) and the professional profile
 * (headline, skills, rates, availability, portfolio).
 *
 * Two sections stacked top-to-bottom:
 *
 *   1. **Identity** — cover banner, avatar, handle, display name, bio.
 *      Powered by the existing `SettingsForm` + `ImageUploader`
 *      components from the dead `/app/settings` route — same
 *      `updateProfileText` server action, same storage uploaders.
 *
 *   2. **Professional** — the existing ProfessionalProfileForm with
 *      headline, about, categories, skills, languages, rates, region,
 *      collaboration, availability, links, visibility, portfolio.
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
    <main className="mx-auto max-w-2xl px-6 py-10">
      <header className="mb-6">
        <p className="text-sm text-text-secondary">
          Edit how you appear across Babe Hub. Keep it short — this is what
          recruiters and visitors see.
        </p>
      </header>

      {/* ── Identity (former /app/settings content) ──────────────────── */}
      <section className="space-y-6 rounded-2xl border border-border-color bg-card/40 p-5 sm:p-6">
        <h2 className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-text-secondary">
          Identity
        </h2>

        <div>
          <p className="mb-2 text-sm font-bold text-text-main">Cover banner</p>
          <p className="mb-3 text-xs text-text-secondary">
            Shown at the top of your public profile. Recommended ≥ 1500×500 px.
          </p>
          <ImageUploader
            bucket="covers"
            userId={user.id}
            columnName="cover_url"
            currentUrl={profile.cover_url}
            previewClassName="h-32 w-full rounded-2xl border border-border-color sm:h-48"
            placeholder={
              <div
                className="h-full w-full rounded-2xl"
                style={{
                  background:
                    'linear-gradient(135deg, var(--color-primary) 0%, #7c3aed 100%)',
                }}
              />
            }
          />
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-[160px_1fr]">
          <div>
            <p className="mb-2 text-sm font-bold text-text-main">Avatar</p>
            <ImageUploader
              bucket="avatars"
              userId={user.id}
              columnName="avatar_url"
              currentUrl={profile.avatar_url}
              previewClassName="h-32 w-32 rounded-full border-2 border-border-color"
              placeholder={
                <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/40 to-pink-600/40 text-3xl font-black text-white">
                  {(profile.display_name || profile.handle).slice(0, 1).toUpperCase()}
                </div>
              }
            />
          </div>

          <SettingsForm
            defaults={{
              handle: profile.handle,
              display_name: profile.display_name,
              bio: profile.bio,
              gender: (profile as any).gender ?? null,
            }}
            role={profile.role}
          />
        </div>
      </section>

      {/* ── Professional (existing pro-profile editor) ───────────────── */}
      <div className="mt-8">
        <ProfessionalProfileForm
          currentHandle={profile.handle}
          defaults={{
            headline: pro?.headline ?? '',
            about: pro?.about ?? '',
            hourly_rate_cents: pro?.hourly_rate_cents ?? null,
            currency: pro?.currency ?? 'EUR',
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
      </div>
    </main>
  );
}
