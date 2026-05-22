/**
 * prerender.ts
 *
 * Runs after `vite build` (postbuild hook).
 * For every SEO page in seoData.ts, it writes
 *   dist/<slug>/index.html
 * with the correct <title>, <meta>, <link rel="canonical">, and OG/Twitter tags
 * already injected — so crawlers never need to execute JavaScript.
 *
 * Also generates:
 *   dist/sitemap.xml  — all pre-rendered URLs + homepage
 *
 * Vercel serves dist/<slug>/index.html when a request hits /<slug>,
 * taking priority over the catch-all rewrite in vercel.json.
 */

import { readFileSync, mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';
import { seoPages } from '../content/seoData.js';

const DOMAIN = 'https://babehub.net';
const DIST   = join(process.cwd(), 'dist');

// ── helpers ──────────────────────────────────────────────────────────────────

/** Escape characters that would break an HTML attribute value. */
function escAttr(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * Replace the first occurrence of an HTML tag attribute value.
 * Works even when the tag spans one line and has a trailing slash.
 */
function replaceAttr(html: string, selector: string, attr: string, value: string): string {
  // Matches:  <selector ... attr="anything" ...>
  const esc = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re  = new RegExp(`(<${esc}[^>]*${attr}=")[^"]*(")`);
  return html.replace(re, `$1${escAttr(value)}$2`);
}

function replaceTitle(html: string, title: string): string {
  return html.replace(/<title>[^<]*<\/title>/, `<title>${escAttr(title)}</title>`);
}

// ── main ─────────────────────────────────────────────────────────────────────

const template = readFileSync(join(DIST, 'index.html'), 'utf8');
let count = 0;

// Collect all URLs for the sitemap (start with homepage)
const sitemapUrls: { loc: string; priority: string; changefreq: string }[] = [
  { loc: `${DOMAIN}/`, priority: '1.0', changefreq: 'weekly' },
];

for (const page of seoPages) {
  const url = `${DOMAIN}/${page.slug}`;

  let html = template;

  // Primary tags
  html = replaceTitle(html, page.title);
  html = replaceAttr(html, 'meta name="description"',         'content', page.description);
  html = replaceAttr(html, 'meta name="keywords"',            'content', page.keywords);
  html = replaceAttr(html, 'link rel="canonical"',            'href',    url);

  // Open Graph
  html = replaceAttr(html, 'meta property="og:url"',          'content', url);
  html = replaceAttr(html, 'meta property="og:title"',        'content', page.title);
  html = replaceAttr(html, 'meta property="og:description"',  'content', page.description);

  // Twitter
  html = replaceAttr(html, 'meta property="twitter:url"',         'content', url);
  html = replaceAttr(html, 'meta property="twitter:title"',       'content', page.title);
  html = replaceAttr(html, 'meta property="twitter:description"', 'content', page.description);

  // Write  dist/<slug>/index.html  (Vercel treats this as a directory index)
  const outDir = join(DIST, page.slug);
  mkdirSync(outDir, { recursive: true });
  writeFileSync(join(outDir, 'index.html'), html, 'utf8');

  console.log(`  ✓  /${page.slug}`);
  count++;

  sitemapUrls.push({ loc: url, priority: '0.8', changefreq: 'weekly' });
}

console.log(`\n✅  Pre-rendered ${count} SEO pages into dist/`);

// ── sitemap.xml ───────────────────────────────────────────────────────────────

const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

const sitemapEntries = sitemapUrls
  .map(({ loc, priority, changefreq }) =>
    `  <url>\n    <loc>${loc}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>${changefreq}</changefreq>\n    <priority>${priority}</priority>\n  </url>`
  )
  .join('\n');

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapEntries}
</urlset>
`;

writeFileSync(join(DIST, 'sitemap.xml'), sitemap, 'utf8');
console.log(`✅  Generated sitemap.xml (${sitemapUrls.length} URLs)`);
