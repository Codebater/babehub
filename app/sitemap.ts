import type { MetadataRoute } from 'next';
import { routing } from '@/i18n/routing';
import { ALL_POSTS } from '@/lib/blog/posts';
import { createClient } from '@/lib/supabase/server';

const DOMAIN = 'https://babehub.net';

/**
 * Sitemap covers:
 *   - Localized home pages (`/`, `/de`, `/es`, …)
 *   - Public top-level routes (`/explore`, `/jobs`, `/blog`, `/creators`)
 *   - One entry per blog post (static registry + admin-published DB rows)
 *   - One entry per published, non-expired job — Google For Jobs uses
 *     this signal alongside the per-page JobPosting JSON-LD to decide
 *     which postings to surface in the jobs vertical.
 *
 * Per-creator profile (`/c/{handle}`) is intentionally excluded —
 * those are user-generated and not all warrant indexing yet. Once
 * verified-creator profiles want indexable canonical URLs we'll add
 * them here behind an `is_verified` filter.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const today = new Date();

  const homeEntries: MetadataRoute.Sitemap = routing.locales.map((locale) => ({
    url: locale === routing.defaultLocale ? `${DOMAIN}/` : `${DOMAIN}/${locale}`,
    lastModified: today,
    changeFrequency: 'weekly',
    priority: locale === routing.defaultLocale ? 1.0 : 0.8,
  }));

  const publicSurfaces: MetadataRoute.Sitemap = [
    { url: `${DOMAIN}/explore`, lastModified: today, changeFrequency: 'hourly', priority: 0.9 },
    { url: `${DOMAIN}/jobs`, lastModified: today, changeFrequency: 'daily', priority: 0.9 },
    { url: `${DOMAIN}/blog`, lastModified: today, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${DOMAIN}/creators`, lastModified: today, changeFrequency: 'weekly', priority: 0.7 },
  ];

  const blogEntries: MetadataRoute.Sitemap = ALL_POSTS.map((post) => ({
    url: `${DOMAIN}/blog/${post.slug}`,
    lastModified: new Date(post.date + 'T00:00:00Z'),
    changeFrequency: 'monthly',
    priority: 0.7,
  }));

  // Admin-published blog posts (DB rows) — fetched at request time so
  // freshly-published posts show up in the next sitemap fetch.
  let dbBlogEntries: MetadataRoute.Sitemap = [];
  try {
    const supabase = await createClient();
    const { data: dbBlog } = await supabase
      .from('blog_posts')
      .select('slug, published_at, updated_at')
      .not('published_at', 'is', null)
      .lte('published_at', new Date().toISOString());
    dbBlogEntries = (dbBlog ?? []).map((p) => ({
      url: `${DOMAIN}/blog/${p.slug}`,
      lastModified: new Date(p.updated_at ?? p.published_at!),
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    }));
  } catch {
    // Sitemap should never throw — partial output is better than 500.
  }

  // Published, non-expired job postings. Google For Jobs scrapes the
  // per-page JobPosting JSON-LD; the sitemap accelerates discovery
  // (especially for fresh listings that wouldn't otherwise have
  // backlinks yet).
  let jobEntries: MetadataRoute.Sitemap = [];
  try {
    const supabase = await createClient();
    const nowIso = new Date().toISOString();
    const { data: jobs } = await supabase
      .from('jobs')
      .select('id, published_at, updated_at, expires_at')
      .not('published_at', 'is', null)
      .or(`expires_at.is.null,expires_at.gt.${nowIso}`)
      .limit(5000);
    jobEntries = (jobs ?? []).map((j) => ({
      url: `${DOMAIN}/jobs/${j.id}`,
      lastModified: new Date(j.updated_at ?? j.published_at!),
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    }));
  } catch {
    // Same swallow as above — sitemap stays robust.
  }

  return [
    ...homeEntries,
    ...publicSurfaces,
    ...blogEntries,
    ...dbBlogEntries,
    ...jobEntries,
  ];
}
