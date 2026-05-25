import type { ReactNode } from 'react';

/**
 * Schema for a single blog post. Posts are TypeScript modules in
 * `content/blog/*.tsx` so:
 *   - body content gets full TSX (internal <Link> components, custom
 *     callout components, embeds, even client components later)
 *   - everything is build-time included → zero runtime markdown parsing
 *   - no extra dependencies (gray-matter, remark, MDX, etc.) — keeps
 *     the bundle small and the build fast
 *   - links and metadata are typed → typos surface at `npm run build`,
 *     not in production
 *
 * Switching to a file-based markdown/MDX system later means dropping a
 * loader in lib/blog/load.ts that returns the same BlogPost shape —
 * the routes don't have to change.
 */
export type BlogPost = {
  /** URL slug — must match the filename for clarity. Used as the
   *  `/blog/{slug}` route. */
  slug: string;
  /** <title>. Also used as the H1. */
  title: string;
  /** <meta description> + OG description. 140–160 chars sweet spot. */
  description: string;
  /** ISO date (YYYY-MM-DD). Used for sitemap lastmod + display. */
  date: string;
  /** Display name shown under the article header. */
  author: string;
  /** Free-form tag strings — drives the tag chips on the index/detail. */
  tags: string[];
  /** Optional cover image (absolute path from /public). Surfaces as
   *  the OG image and the index-card hero. */
  cover?: string;
  /** Estimated reading minutes. Manually set — keeps the lib zero-dep. */
  readingMinutes: number;
  /** Article body as a React node. Wrap with <article className="prose
   *  prose-invert"> on the detail page — every post is consumed by the
   *  same layout. */
  body: ReactNode;
};
