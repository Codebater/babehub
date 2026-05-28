import { createAdminClient } from '@/lib/supabase/admin';

/**
 * Marketing image slots stored in `public.site_settings`.
 * Each key maps to a public image URL (Supabase Storage or external CDN).
 */
export type MarketingSettings = {
  /** Large feature image shown in the Hero section */
  hero_feature?: string;
  /** Illustration shown beside HowItWorks steps */
  howitworks_feature?: string;
  /** Up to 6 showcase images in the gallery grid */
  gallery: string[];
};

export const GALLERY_KEYS = [
  'mkt_gallery_1',
  'mkt_gallery_2',
  'mkt_gallery_3',
  'mkt_gallery_4',
  'mkt_gallery_5',
  'mkt_gallery_6',
] as const;

export const ALL_MARKETING_KEYS = [
  'mkt_hero_feature',
  'mkt_howitworks_feature',
  ...GALLERY_KEYS,
] as const;

/** Fetch all marketing image settings. Never throws — returns empty on error. */
export async function loadMarketingSettings(): Promise<MarketingSettings> {
  try {
    const admin = createAdminClient();
    const { data } = await (admin as never)
      .from('site_settings')
      .select('key, value')
      .in('key', ALL_MARKETING_KEYS);

    const map = new Map<string, string>(
      (data ?? []).map((r: { key: string; value: string }) => [r.key, r.value]),
    );

    return {
      hero_feature: map.get('mkt_hero_feature') || undefined,
      howitworks_feature: map.get('mkt_howitworks_feature') || undefined,
      gallery: GALLERY_KEYS.map((k) => map.get(k) ?? '').filter(Boolean),
    };
  } catch {
    return { gallery: [] };
  }
}
