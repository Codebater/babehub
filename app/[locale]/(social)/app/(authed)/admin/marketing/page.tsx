import { ShieldAlert, ImageIcon } from 'lucide-react';
import { requireAdmin } from '@/lib/auth/guards';
import { loadMarketingSettings, GALLERY_KEYS } from '@/lib/marketing/settings';
import ImageSlot from './ImageSlot';

export const dynamic = 'force-dynamic';

/**
 * `/app/admin/marketing` — manage images shown on the marketing homepage.
 *
 * Each image slot maps to a key in `public.site_settings`. Admins can
 * upload an image (stored in the `marketing` Supabase Storage bucket) or
 * paste an external URL. Changes appear on the site within seconds
 * (ISR-cached pages revalidate automatically via `revalidatePath`).
 */

const SLOT_META: Record<string, { label: string; hint: string }> = {
  mkt_hero_feature: {
    label: 'Hero — Feature image',
    hint: 'Large image shown in the Hero section (right side on desktop). Ideal: 1200×900px.',
  },
  mkt_howitworks_feature: {
    label: 'How It Works — Illustration',
    hint: 'Decorative illustration shown beside the step list. Ideal: 800×600px.',
  },
  mkt_gallery_1: { label: 'Gallery 1', hint: 'Showcase grid slot 1 of 6.' },
  mkt_gallery_2: { label: 'Gallery 2', hint: 'Showcase grid slot 2 of 6.' },
  mkt_gallery_3: { label: 'Gallery 3', hint: 'Showcase grid slot 3 of 6.' },
  mkt_gallery_4: { label: 'Gallery 4', hint: 'Showcase grid slot 4 of 6.' },
  mkt_gallery_5: { label: 'Gallery 5', hint: 'Showcase grid slot 5 of 6.' },
  mkt_gallery_6: { label: 'Gallery 6', hint: 'Showcase grid slot 6 of 6.' },
};

export default async function AdminMarketingPage() {
  await requireAdmin();
  const settings = await loadMarketingSettings();

  // Build a flat map of key → current URL for quick lookup
  const currentUrls: Record<string, string> = {};
  if (settings.hero_feature) currentUrls['mkt_hero_feature'] = settings.hero_feature;
  if (settings.howitworks_feature) currentUrls['mkt_howitworks_feature'] = settings.howitworks_feature;
  GALLERY_KEYS.forEach((k, i) => {
    const url = settings.gallery[i];
    if (url) currentUrls[k] = url;
  });

  const allKeys = Object.keys(SLOT_META);

  return (
    <main className="mx-auto max-w-7xl px-4 py-6 md:px-6 md:py-10">
      <header className="mb-8">
        <p className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.25em] text-primary">
          <ShieldAlert className="h-3 w-3" />
          Admin · Marketing
        </p>
        <h1 className="mt-3 text-2xl font-black tracking-tight text-text-main md:text-3xl">
          Marketing site images
        </h1>
        <p className="mt-1 text-sm text-text-secondary max-w-2xl">
          Upload images or paste URLs for each section of the marketing homepage.
          Changes go live within seconds. Images are stored in Supabase Storage
          (the <code className="rounded bg-secondary px-1 font-mono text-[11px]">marketing</code> bucket).
        </p>
      </header>

      {/* Hero + HowItWorks — 2 feature slots */}
      <section className="mb-10">
        <h2 className="mb-4 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.25em] text-text-secondary">
          <ImageIcon className="h-3.5 w-3.5" />
          Section images
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {['mkt_hero_feature', 'mkt_howitworks_feature'].map((key) => {
            const meta = SLOT_META[key];
            return (
              <ImageSlot
                key={key}
                slotKey={key}
                label={meta.label}
                hint={meta.hint}
                currentUrl={currentUrls[key]}
              />
            );
          })}
        </div>
      </section>

      {/* Gallery — 6 slots */}
      <section>
        <h2 className="mb-1 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.25em] text-text-secondary">
          <ImageIcon className="h-3.5 w-3.5" />
          Creator showcase gallery
        </h2>
        <p className="mb-4 text-xs text-text-secondary">
          These 6 images appear in the gallery grid on the marketing homepage.
          Fill as many or as few slots as you like — empty slots are hidden.
          Ideal aspect ratio: 1:1 or 4:3 (square thumbnails work best).
        </p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {GALLERY_KEYS.map((key) => {
            const meta = SLOT_META[key];
            return (
              <ImageSlot
                key={key}
                slotKey={key}
                label={meta.label}
                hint={meta.hint}
                currentUrl={currentUrls[key]}
              />
            );
          })}
        </div>
      </section>

      <p className="mt-6 text-[11px] text-text-secondary">
        {allKeys.filter((k) => currentUrls[k]).length} / {allKeys.length} slots filled.
        The marketing homepage reads these settings with ISR caching — changes appear within 60 seconds.
      </p>
    </main>
  );
}
