import type { MetadataRoute } from 'next';
import { routing } from '@/i18n/routing';
import { ALL_POSTS } from '@/lib/blog/posts';

const DOMAIN = 'https://babehub.net';

/**
 * Sitemap covers:
 *   - Localized home pages (`/`, `/de`, `/es`, …)
 *   - Public top-level routes (`/explore`, `/jobs`, `/blog`,
 *     `/creators`) that carry SEO weight.
 *   - One entry per blog post (`/blog/{slug}`) with the post's
 *     publication date as lastmod.
 *
 * Per-creator profile (`/c/{handle}`) is intentionally excluded —
 * those are user-generated and noindex by default until the profile
 * editor toggles it on.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const today = new Date();

  const homeEntries: MetadataRoute.Sitemap = routing.locales.map((locale) => ({
    url: locale === routing.defaultLocale ? `${DOMAIN}/` : `${DOMAIN}/${locale}`,
    lastModified: today,
    changeFrequency: 'weekly',
    priority: locale === routing.defaultLocale ? 1.0 : 0.8,
  }));

  const publicSurfaces: MetadataRoute.Sitemap = [
    { url: `${DOMAIN}/explore`, lastModified: today, changeFrequency: 'hourly', priority: 0.9 },
    { url: `${DOMAIN}/jobs`, lastModified: today, changeFrequency: 'daily', priority: 0.8 },
    { url: `${DOMAIN}/blog`, lastModified: today, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${DOMAIN}/creators`, lastModified: today, changeFrequency: 'weekly', priority: 0.7 },
  ];

  const blogEntries: MetadataRoute.Sitemap = ALL_POSTS.map((post) => ({
    url: `${DOMAIN}/blog/${post.slug}`,
    lastModified: new Date(post.date + 'T00:00:00Z'),
    changeFrequency: 'monthly',
    priority: 0.7,
  }));

  return [...homeEntries, ...publicSurfaces, ...blogEntries];
}
