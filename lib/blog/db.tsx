import { createClient } from '@/lib/supabase/server';
import { ALL_POSTS, getPostBySlug as getStaticPostBySlug } from './posts';
import type { BlogPost } from './types';

/**
 * Unified blog loader: merges the build-time static registry
 * (`lib/blog/posts.tsx`) with admin-published rows from
 * `public.blog_posts`. Used by `/blog` (index) and `/blog/[slug]`
 * (detail) so both surfaces see the same merged catalog.
 *
 * Why both sources:
 *   • Static posts can use JSX in the body (with internal <Link>s,
 *     custom components). Great for hand-crafted launch content.
 *   • DB posts let admins publish from /app/admin/blog/new without
 *     a code deploy. Body is plain-text-with-paragraphs (split on
 *     double newlines → <p> blocks).
 *
 * If a DB row and a static row share the same slug, DB wins. That's
 * the intended override path: an admin can replace launch copy by
 * publishing a new DB row with the same slug.
 */

/** DB body → React paragraphs. Plain-text only; no HTML injection. */
function renderDbBody(body: string): React.ReactNode {
  return body
    .split(/\n{2,}/)
    .map((para) => para.trim())
    .filter(Boolean)
    .map((para, i) => <p key={i}>{para}</p>);
}

async function loadDbPosts(): Promise<BlogPost[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('blog_posts')
    .select('slug, title, description, body, tags, author, reading_minutes, cover_url, published_at')
    .not('published_at', 'is', null)
    .lte('published_at', new Date().toISOString())
    .order('published_at', { ascending: false });

  return (data ?? []).map((r) => ({
    slug: r.slug,
    title: r.title,
    description: r.description,
    date: (r.published_at ?? new Date().toISOString()).slice(0, 10),
    author: r.author,
    tags: r.tags,
    cover: r.cover_url ?? undefined,
    readingMinutes: r.reading_minutes,
    body: renderDbBody(r.body),
  }));
}

/**
 * All published posts (DB + static) sorted newest-first. DB rows with
 * a matching slug override the static version.
 */
export async function loadAllBlogPosts(): Promise<BlogPost[]> {
  const dbPosts = await loadDbPosts();
  const dbSlugs = new Set(dbPosts.map((p) => p.slug));
  const staticPosts = ALL_POSTS.filter((p) => !dbSlugs.has(p.slug));
  return [...dbPosts, ...staticPosts].sort((a, b) => (a.date < b.date ? 1 : -1));
}

/**
 * Single-post lookup. DB first (admin edits win); falls back to
 * static. Returns undefined if neither source has the slug.
 */
export async function loadBlogPostBySlug(slug: string): Promise<BlogPost | undefined> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('blog_posts')
    .select('slug, title, description, body, tags, author, reading_minutes, cover_url, published_at')
    .eq('slug', slug)
    .not('published_at', 'is', null)
    .lte('published_at', new Date().toISOString())
    .maybeSingle();

  if (data) {
    return {
      slug: data.slug,
      title: data.title,
      description: data.description,
      date: (data.published_at ?? new Date().toISOString()).slice(0, 10),
      author: data.author,
      tags: data.tags,
      cover: data.cover_url ?? undefined,
      readingMinutes: data.reading_minutes,
      body: renderDbBody(data.body),
    };
  }
  return getStaticPostBySlug(slug);
}
