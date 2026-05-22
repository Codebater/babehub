/**
 * prerender.ts — World-class SEO pre-renderer
 *
 * Runs after `vite build` (postbuild hook). For every page in seoData.ts:
 *   1. Writes dist/<slug>/index.html with correct meta/canonical/OG/Twitter tags
 *   2. Injects REAL crawlable HTML body content (not just empty #root div)
 *   3. Adds page-specific JSON-LD schema (LocalBusiness or Article + FAQ + Breadcrumb)
 *   4. Adds hreflang link tags for international pages
 *   5. Adds internal links to related pages
 *
 * Also generates dist/sitemap.xml with all URLs.
 */

import { readFileSync, mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';
import { seoPages, SEOPage } from '../content/seoData.js';

const DOMAIN = 'https://babehub.net';
const DIST   = join(process.cwd(), 'dist');

// ── HTML helpers ──────────────────────────────────────────────────────────────

function esc(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function replaceAttr(html: string, selector: string, attr: string, value: string): string {
  const s = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp(`(<${s}[^>]*${attr}=")[^"]*(")`);
  return html.replace(re, `$1${esc(value)}$2`);
}

function replaceTitle(html: string, title: string): string {
  return html.replace(/<title>[^<]*<\/title>/, `<title>${esc(title)}</title>`);
}

// ── SEO body builder ──────────────────────────────────────────────────────────

const SEO_STYLES = `
<style id="seo-init">
#seo-shell{font-family:'Poppins',system-ui,sans-serif;background:#121212;color:#E5E7EB;min-height:100vh}
.seo-nav{background:#1E1E1E;padding:1rem 2rem;border-bottom:1px solid #374151;display:flex;align-items:center}
.seo-nav a{color:#F472B6;text-decoration:none;font-weight:700;font-size:1.25rem}
.seo-wrap{max-width:860px;margin:0 auto;padding:3rem 1.5rem}
.seo-bc{font-size:.875rem;color:#9CA3AF;margin-bottom:2rem}
.seo-bc a{color:#F472B6;text-decoration:none}
.seo-bc span{margin:0 .4rem}
h1.seo-h1{color:#fff;font-size:2.25rem;font-weight:700;margin:0 0 1rem;line-height:1.25}
.seo-desc{color:#9CA3AF;font-size:1.125rem;margin-bottom:2rem;line-height:1.7}
.seo-body p{color:#E5E7EB;line-height:1.8;margin-bottom:1.25rem}
.seo-cta{margin:2.5rem 0;background:#2A2A2A;border:1px solid #374151;border-radius:1rem;padding:2rem}
.seo-cta h2{color:#F472B6;font-size:1.5rem;margin:0 0 .75rem}
.seo-cta p{color:#9CA3AF;margin:0 0 1.25rem;line-height:1.6}
.seo-cta a{display:inline-block;background:#F472B6;color:#fff;padding:.75rem 2rem;border-radius:.5rem;text-decoration:none;font-weight:700;font-size:1rem}
.seo-faq{margin-top:2.5rem}
.seo-faq h2{color:#fff;font-size:1.5rem;margin:0 0 1.25rem}
.seo-faq-item{border-bottom:1px solid #374151;padding:1.25rem 0}
.seo-faq-item h3{color:#F472B6;font-size:1rem;margin:0 0 .5rem;font-weight:600}
.seo-faq-item p{color:#9CA3AF;margin:0;line-height:1.7}
.seo-related{margin-top:2.5rem}
.seo-related h2{color:#fff;font-size:1.25rem;margin:0 0 1rem}
.seo-related ul{list-style:none;padding:0;display:flex;flex-wrap:wrap;gap:.75rem}
.seo-related a{color:#F472B6;text-decoration:none;background:#2A2A2A;border:1px solid #374151;padding:.5rem 1rem;border-radius:.5rem;font-size:.875rem;transition:border-color .2s}
</style>
`.trim();

function buildHreflang(page: SEOPage, url: string): string {
  if (!page.hreflang) return '';
  return [
    `<link rel="alternate" hreflang="${page.hreflang}" href="${url}" />`,
    `<link rel="alternate" hreflang="x-default" href="${DOMAIN}/" />`
  ].join('\n    ');
}

function buildSchema(page: SEOPage, url: string): string {
  const schemas: object[] = [];

  // Breadcrumb schema (all pages)
  schemas.push({
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: `${DOMAIN}/` },
      { '@type': 'ListItem', position: 2, name: page.h1, item: url }
    ]
  });

  // LocalBusiness schema for location pages with city data
  if (page.category === 'location' && page.city) {
    schemas.push({
      '@context': 'https://schema.org',
      '@type': 'ProfessionalService',
      name: `Babe Hub — ${page.city}`,
      url,
      description: page.description,
      areaServed: page.city,
      addressCountry: page.country ?? '',
      serviceType: 'OnlyFans Management Agency',
      priceRange: 'Commission-based (30–40%)',
      provider: {
        '@type': 'Organization',
        name: 'Babe Hub',
        url: DOMAIN
      }
    });
  }

  // Article schema for guide/platform pages
  if (page.category === 'guide' || page.category === 'platform') {
    schemas.push({
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: page.title,
      description: page.description,
      url,
      author: { '@type': 'Organization', name: 'Babe Hub', url: DOMAIN },
      publisher: {
        '@type': 'Organization',
        name: 'Babe Hub',
        url: DOMAIN,
        logo: { '@type': 'ImageObject', url: `${DOMAIN}/favicon.png` }
      },
      mainEntityOfPage: url
    });
  }

  // FAQ schema (all pages with faq data)
  if (page.faq && page.faq.length > 0) {
    schemas.push({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: page.faq.map(({ q, a }) => ({
        '@type': 'Question',
        name: q,
        acceptedAnswer: { '@type': 'Answer', text: a }
      }))
    });
  }

  return schemas
    .map(s => `<script type="application/ld+json">\n${JSON.stringify(s, null, 2)}\n</script>`)
    .join('\n    ');
}

function buildBody(page: SEOPage, url: string): string {
  const contentParas = page.content
    .split('\n\n')
    .filter(Boolean)
    .map(p => `<p>${p.trim()}</p>`)
    .join('\n        ');

  const faqHtml = (page.faq ?? []).length > 0
    ? `<section class="seo-faq" aria-label="Frequently Asked Questions">
        <h2>Frequently Asked Questions</h2>
        ${(page.faq ?? []).map(({ q, a }) => `
        <div class="seo-faq-item">
          <h3>${esc(q)}</h3>
          <p>${esc(a)}</p>
        </div>`).join('')}
      </section>`
    : '';

  const relatedHtml = (page.related ?? []).length > 0
    ? `<nav class="seo-related" aria-label="Related pages">
        <h2>Related Services &amp; Guides</h2>
        <ul>
          ${(page.related ?? []).map(slug => {
            const rel = seoPages.find(p => p.slug === slug);
            if (!rel) return '';
            const label = rel.title.split('|')[0].trim();
            return `<li><a href="/${slug}">${esc(label)}</a></li>`;
          }).join('\n          ')}
        </ul>
      </nav>`
    : '';

  return `<div id="seo-shell">
    <nav class="seo-nav" aria-label="Main navigation">
      <a href="/">Babe Hub</a>
    </nav>
    <main class="seo-wrap">
      <nav class="seo-bc" aria-label="Breadcrumb">
        <a href="/">Home</a><span aria-hidden="true">›</span>${esc(page.h1)}
      </nav>
      <h1 class="seo-h1">${esc(page.h1)}</h1>
      <p class="seo-desc">${esc(page.description)}</p>
      <div class="seo-body">
        ${contentParas}
      </div>
      <div class="seo-cta">
        <h2>Ready to Scale Your Income?</h2>
        <p>Join the top 0.1% of creators with Babe Hub's professional management. Commission-only — we only earn when you do.</p>
        <a href="/">Apply Now →</a>
      </div>
      ${faqHtml}
      ${relatedHtml}
    </main>
  </div>`;
}

// ── main ─────────────────────────────────────────────────────────────────────

const rawTemplate = readFileSync(join(DIST, 'index.html'), 'utf8');
let count = 0;

const sitemapUrls: { loc: string; priority: string }[] = [
  { loc: `${DOMAIN}/`, priority: '1.0' },
];

for (const page of seoPages) {
  const url = `${DOMAIN}/${page.slug}`;
  let html = rawTemplate;

  // ── Head: meta replacements ───────────────────────────────────────────────
  html = replaceTitle(html, page.title);
  html = replaceAttr(html, 'meta name="description"',         'content', page.description);
  html = replaceAttr(html, 'meta name="keywords"',            'content', page.keywords);
  html = replaceAttr(html, 'link rel="canonical"',            'href',    url);
  html = replaceAttr(html, 'meta property="og:url"',          'content', url);
  html = replaceAttr(html, 'meta property="og:title"',        'content', page.title);
  html = replaceAttr(html, 'meta property="og:description"',  'content', page.description);
  html = replaceAttr(html, 'meta property="twitter:url"',         'content', url);
  html = replaceAttr(html, 'meta property="twitter:title"',       'content', page.title);
  html = replaceAttr(html, 'meta property="twitter:description"', 'content', page.description);

  // ── Head: inject SEO styles + hreflang + page schema ─────────────────────
  const hreflang = buildHreflang(page, url);
  const schema   = buildSchema(page, url);
  const headInject = [SEO_STYLES, hreflang, schema].filter(Boolean).join('\n    ');
  html = html.replace('</head>', `    ${headInject}\n  </head>`);

  // ── Body: replace empty root div with real crawlable content ─────────────
  const bodyContent = buildBody(page, url);
  html = html.replace('<div id="root"></div>', bodyContent);

  // ── Write dist/<slug>/index.html ──────────────────────────────────────────
  const outDir = join(DIST, page.slug);
  mkdirSync(outDir, { recursive: true });
  writeFileSync(join(outDir, 'index.html'), html, 'utf8');

  console.log(`  ✓  /${page.slug}`);
  count++;

  sitemapUrls.push({ loc: url, priority: '0.8' });
}

console.log(`\n✅  Pre-rendered ${count} SEO pages into dist/`);

// ── sitemap.xml ───────────────────────────────────────────────────────────────

const today = new Date().toISOString().split('T')[0];

const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapUrls.map(({ loc, priority }) =>
  `  <url>\n    <loc>${loc}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>${priority}</priority>\n  </url>`
).join('\n')}
</urlset>
`;

writeFileSync(join(DIST, 'sitemap.xml'), sitemapXml, 'utf8');
console.log(`✅  Generated sitemap.xml (${sitemapUrls.length} URLs)`);
