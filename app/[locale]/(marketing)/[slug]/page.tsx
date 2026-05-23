import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, CheckCircle2, TrendingUp, Shield, Zap } from 'lucide-react';
import { seoPages, type SEOPage } from '@/content/seoData';

const DOMAIN = 'https://babehub.net';

/**
 * Replaces the old `scripts/prerender.ts` + `DynamicSEOPage.tsx` pair.
 * Next.js renders every slug at build time via `generateStaticParams`, and the
 * full meta + JSON-LD schema set (Breadcrumb, Article/ProfessionalService, FAQPage)
 * is emitted through `generateMetadata` + inline `<script type="application/ld+json">`.
 */
export function generateStaticParams() {
  return seoPages.map((page) => ({ slug: page.slug }));
}

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string; locale: string }> },
): Promise<Metadata> {
  const { slug } = await params;
  const page = seoPages.find((p) => p.slug === slug);
  if (!page) return { title: 'Not Found' };

  const url = `${DOMAIN}/${page.slug}`;
  return {
    title: page.title,
    description: page.description,
    keywords: page.keywords,
    alternates: {
      canonical: url,
      ...(page.hreflang
        ? {
            languages: {
              [page.hreflang]: url,
              'x-default': `${DOMAIN}/`,
            },
          }
        : {}),
    },
    openGraph: {
      type: 'article',
      url,
      title: page.title,
      description: page.description,
      images: ['/og-image.png'],
    },
    twitter: {
      card: 'summary_large_image',
      title: page.title,
      description: page.description,
      images: ['/og-image.png'],
    },
  };
}

function buildSchemas(page: SEOPage, url: string): object[] {
  const schemas: object[] = [
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: `${DOMAIN}/` },
        { '@type': 'ListItem', position: 2, name: page.h1, item: url },
      ],
    },
  ];

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
        url: DOMAIN,
      },
    });
  }

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
        logo: { '@type': 'ImageObject', url: `${DOMAIN}/favicon.png` },
      },
      mainEntityOfPage: url,
    });
  }

  if (page.faq && page.faq.length > 0) {
    schemas.push({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: page.faq.map(({ q, a }) => ({
        '@type': 'Question',
        name: q,
        acceptedAnswer: { '@type': 'Answer', text: a },
      })),
    });
  }

  return schemas;
}

export default async function SEOSlugPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const page = seoPages.find((p) => p.slug === slug);
  if (!page) notFound();

  const url = `${DOMAIN}/${page.slug}`;
  const schemas = buildSchemas(page, url);

  const paragraphs = page.content.split('\n\n').filter(Boolean);

  return (
    <div className="min-h-screen bg-background text-text-main">
      {schemas.map((schema, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}

      <nav className="p-6 border-b border-border-color/20 flex justify-between items-center">
        <Link href="/" className="flex items-center space-x-2 text-primary font-bold text-xl">
          <ArrowLeft className="w-5 h-5" />
          <span>Babe Hub</span>
        </Link>
        <Link
          href="/"
          className="bg-primary/10 text-primary px-4 py-2 rounded-xl text-sm font-bold hover:bg-primary/20 transition-colors"
        >
          Apply Now
        </Link>
      </nav>

      <main className="container mx-auto px-6 py-16 max-w-4xl">
        <div className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider mb-6">
          {page.category}
        </div>
        <h1 className="text-4xl md:text-6xl font-black mb-8 tracking-tighter leading-tight">
          {page.h1}
        </h1>

        <div className="prose prose-invert prose-pink max-w-none mb-12">
          {paragraphs.map((p, i) => (
            <p
              key={i}
              className={
                i === 0
                  ? 'text-xl text-text-secondary leading-relaxed mb-8'
                  : 'text-text-main leading-relaxed mb-5'
              }
            >
              {p}
            </p>
          ))}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 my-12 not-prose">
            <div className="bg-secondary/50 p-6 rounded-2xl border border-border-color/30">
              <TrendingUp className="w-8 h-8 text-primary mb-4" />
              <h3 className="text-xl font-bold mb-2">Market Dominance</h3>
              <p className="text-text-secondary text-sm">
                Our strategies are tailored to the specific nuances of{' '}
                {page.category === 'location' ? 'this region' : 'this platform'}, ensuring you stay
                ahead of the competition.
              </p>
            </div>
            <div className="bg-secondary/50 p-6 rounded-2xl border border-border-color/30">
              <Shield className="w-8 h-8 text-primary mb-4" />
              <h3 className="text-xl font-bold mb-2">Secure Growth</h3>
              <p className="text-text-secondary text-sm">
                We prioritize your privacy and security while scaling your presence to the top
                0.1%.
              </p>
            </div>
          </div>

          <h2 className="text-3xl font-bold mb-6">Why Choose Babe Hub?</h2>
          <ul className="space-y-4 mb-12 not-prose">
            {[
              '24/7 Professional Account Management',
              'Data-Driven Marketing Strategies',
              'High-Conversion Chatting Teams',
              'Complete Anonymity & Content Protection',
            ].map((item) => (
              <li key={item} className="flex items-center space-x-3">
                <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
                <span className="text-text-main font-medium">{item}</span>
              </li>
            ))}
          </ul>

          {page.faq && page.faq.length > 0 && (
            <section className="not-prose mb-12">
              <h2 className="text-3xl font-bold mb-6">Frequently Asked Questions</h2>
              <div className="space-y-4">
                {page.faq.map((item) => (
                  <details
                    key={item.q}
                    className="bg-secondary/30 p-5 rounded-xl border border-border-color/30"
                  >
                    <summary className="font-bold text-text-main cursor-pointer">
                      {item.q}
                    </summary>
                    <p className="mt-3 text-text-secondary leading-relaxed">{item.a}</p>
                  </details>
                ))}
              </div>
            </section>
          )}
        </div>

        <div className="bg-gradient-to-br from-primary to-pink-600 p-8 md:p-12 rounded-3xl text-center text-white shadow-2xl shadow-primary/20">
          <Zap className="w-12 h-12 mx-auto mb-6 text-yellow-300 fill-yellow-300" />
          <h2 className="text-3xl md:text-4xl font-black mb-4">Ready to Scale?</h2>
          <p className="text-pink-100 mb-8 max-w-md mx-auto">
            Join the elite creators who trust Babe Hub to manage their growth and maximize their
            revenue.
          </p>
          <Link
            href="/"
            className="inline-block bg-white text-primary px-10 py-4 rounded-full font-black text-lg hover:scale-105 transition-transform shadow-xl"
          >
            APPLY TO JOIN
          </Link>
        </div>
      </main>

      {page.related && page.related.length > 0 && (
        <footer className="bg-secondary/30 py-12 border-t border-border-color/20">
          <div className="container mx-auto px-6 max-w-4xl">
            <h3 className="text-sm font-bold text-text-secondary uppercase tracking-widest mb-6">
              Explore More Guides
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {page.related
                .map((s) => seoPages.find((p) => p.slug === s))
                .filter((p): p is SEOPage => Boolean(p))
                .map((rel) => (
                  <Link
                    key={rel.slug}
                    href={`/${rel.slug}`}
                    className="text-sm text-text-secondary hover:text-primary transition-colors"
                  >
                    {rel.h1}
                  </Link>
                ))}
            </div>
          </div>
        </footer>
      )}
    </div>
  );
}
