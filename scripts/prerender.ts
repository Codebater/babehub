/**
 * prerender.ts
 *
 * Runs after `vite build` (postbuild hook).
 * For every SEO page in seoData.ts, it writes
 *   dist/<slug>/index.html
 * with the correct <title>, <meta>, <link rel="canonical">, and OG/Twitter tags
 * already injected — so crawlers never need to execute JavaScript.
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
}

console.log(`\n✅  Pre-rendered ${count} SEO pages into dist/`);
