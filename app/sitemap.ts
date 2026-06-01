import type { MetadataRoute } from 'next';
import { routing } from '@/i18n/routing';
import { ALL_POSTS } from '@/lib/blog/posts';
import { SEO_TAGS } from '@/lib/seo/tags';
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

  // Static surfaces + per-category explore URLs (each gets its own
  // title/description via generateMetadata in explore/page.tsx, so
  // submitting them individually gives Google the right signal for each).
  const publicSurfaces: MetadataRoute.Sitemap = [
    { url: `${DOMAIN}/explore`, lastModified: today, changeFrequency: 'hourly', priority: 0.9 },
    { url: `${DOMAIN}/explore?q=casting`, lastModified: today, changeFrequency: 'hourly', priority: 0.95 },
    { url: `${DOMAIN}/explore?q=live%20cams`, lastModified: today, changeFrequency: 'hourly', priority: 0.9 },
    { url: `${DOMAIN}/explore?q=luxury`, lastModified: today, changeFrequency: 'daily', priority: 0.85 },
    { url: `${DOMAIN}/jobs`, lastModified: today, changeFrequency: 'daily', priority: 0.95 },
    { url: `${DOMAIN}/blog`, lastModified: today, changeFrequency: 'weekly', priority: 0.85 },
    { url: `${DOMAIN}/creators`, lastModified: today, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${DOMAIN}/accept-crypto`, lastModified: today, changeFrequency: 'monthly', priority: 0.75 },
  ];

  // Programmatic category/keyword landing pages (/videos/{slug}) — the
  // primary video-SEO engine. Each targets a high-volume adult-category
  // term with a live video grid + VideoObject ItemList schema.
  const tagEntries: MetadataRoute.Sitemap = SEO_TAGS.map((t) => ({
    url: `${DOMAIN}/videos/${t.slug}`,
    lastModified: today,
    changeFrequency: 'daily',
    priority: 0.85,
  }));

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

  // Verified creator profiles — is_verified = true means they've been
  // approved and their public /c/{handle} page is worth indexing.
  // Unverified profiles are excluded: they're typically incomplete and
  // we don't want thin user pages competing with our money keywords.
  let creatorEntries: MetadataRoute.Sitemap = [];
  try {
    const supabase = await createClient();
    const { data: creators } = await supabase
      .from('profiles')
      .select('handle, verified_at')
      .eq('is_verified', true)
      .not('handle', 'is', null)
      .limit(5000);
    creatorEntries = (creators ?? []).map((c) => ({
      url: `${DOMAIN}/c/${c.handle}`,
      lastModified: c.verified_at ? new Date(c.verified_at) : today,
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }));
  } catch {
    // Partial output preferred over throwing.
  }

  return [
    ...homeEntries,
    ...publicSurfaces,
    ...tagEntries,
    ...blogEntries,
    ...dbBlogEntries,
    ...jobEntries,
    ...creatorEntries,
  ];
}
