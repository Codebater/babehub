import type { MetadataRoute } from 'next';
import { routing } from '@/i18n/routing';

const DOMAIN = 'https://babehub.net';

/**
 * Sitemap covers the localized home pages — the legacy SEO-slug
 * pages were dropped in the Sprint-2 cleanup pass since the platform
 * pivoted away from the funnel-landing strategy. Add more entries
 * here as new public routes (/jobs, /creators) start carrying SEO
 * weight.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const today = new Date();

  const homeEntries: MetadataRoute.Sitemap = routing.locales.map((locale) => ({
    url: locale === routing.defaultLocale ? `${DOMAIN}/` : `${DOMAIN}/${locale}`,
    lastModified: today,
    changeFrequency: 'weekly',
    priority: locale === routing.defaultLocale ? 1.0 : 0.8,
  }));

  return homeEntries;
}
