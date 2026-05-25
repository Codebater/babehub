import Link from 'next/link';
import { requireOnboarded } from '@/lib/auth/guards';
import SettingsForm from './SettingsForm';
import ImageUploader from './ImageUploader';

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  const { user, profile } = await requireOnboarded();

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <Link
        href="/app/dashboard"
        className="text-sm text-text-secondary transition-colors hover:text-primary"
      >
        ← Back to dashboard
      </Link>

      <h1 className="mt-2 text-3xl font-black tracking-tight text-text-main">Settings</h1>
      <p className="mt-1 text-sm text-text-secondary">
        Update how you appear across Babe Hub. Changes go live immediately.
      </p>

      {/* ── Cover banner ──────────────────────────────────────────────────── */}
      <section className="mt-8">
        <h2 className="mb-2 text-sm font-bold uppercase tracking-widest text-text-secondary">
          Cover banner
        </h2>
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
                background: 'linear-gradient(135deg, var(--color-primary) 0%, #7c3aed 100%)',
              }}
            />
          }
        />
      </section>

      {/* ── Avatar + profile fields side by side ──────────────────────────── */}
      <section className="mt-10 grid grid-cols-1 gap-8 md:grid-cols-[160px_1fr]">
        <div>
          <h2 className="mb-2 text-sm font-bold uppercase tracking-widest text-text-secondary">
            Avatar
          </h2>
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
          }}
          role={profile.role}
        />
      </section>
    </main>
  );
}
