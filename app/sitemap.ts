import type { MetadataRoute } from 'next';
import { seoPages } from '@/content/seoData';
import { routing } from '@/i18n/routing';

const DOMAIN = 'https://babehub.net';

/**
 * Replaces the legacy sitemap.xml generation from `scripts/prerender.ts`.
 * Includes the localized home pages + every SEO slug. Each entry uses
 * `weekly` change frequency and the current ISO date as `lastModified`.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const today = new Date();

  const homeEntries: MetadataRoute.Sitemap = routing.locales.map((locale) => ({
    url: locale === routing.defaultLocale ? `${DOMAIN}/` : `${DOMAIN}/${locale}`,
    lastModified: today,
    changeFrequency: 'weekly',
    priority: locale === routing.defaultLocale ? 1.0 : 0.8,
  }));

  const slugEntries: MetadataRoute.Sitemap = seoPages.map((page) => ({
    url: `${DOMAIN}/${page.slug}`,
    lastModified: today,
    changeFrequency: 'weekly',
    priority: 0.8,
  }));

  return [...homeEntries, ...slugEntries];
}
