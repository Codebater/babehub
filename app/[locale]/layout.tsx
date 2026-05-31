import type { Metadata } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { Analytics } from '@vercel/analytics/next';
import { Poppins } from 'next/font/google';
import { routing, type AppLocale } from '@/i18n/routing';
import AgeGate from './_components/AgeGate';
import '../globals.css';

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '900'],
  variable: '--font-poppins',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL('https://babehub.net'),
  title: {
    default: 'Babe Hub | Adult Creator Jobs, Casting Calls & Monetization',
    template: '%s — Babe Hub',
  },
  description:
    'Babe Hub is the #1 platform for adult creator jobs, casting calls, and OnlyFans management. Apply for paid gigs, find cam model work, and scale your content income to the top 0.1%.',
  keywords: [
    // Creator job seekers
    'adult casting calls',
    'OnlyFans casting',
    'adult model jobs',
    'cam model jobs',
    'content creator jobs',
    'adult creator jobs',
    'OnlyFans auditions',
    'adult content work from home',
    'paid creator work',
    'creator casting calls',
    // Agencies / recruiters
    'OnlyFans management agency',
    'OnlyFans agency',
    'adult talent agency',
    'find OnlyFans models',
    'hire adult content creators',
    'adult content agency',
    // Monetization
    'how to monetize content',
    'OnlyFans tips',
    'make money as content creator',
    'OnlyFans growth',
    'OnlyFans marketing',
    // Discovery
    'top OnlyFans creators',
    'adult content creators',
    'live cam models',
    'luxury adult content',
    // Brand
    'Babe Hub',
    'BabeHub',
    'babehub.net',
  ],
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    url: 'https://babehub.net/',
    title: 'Babe Hub | Adult Creator Jobs, Casting Calls & Monetization',
    description:
      'Apply for adult casting calls, find creator jobs, or scale your OnlyFans income with the #1 management agency. Join thousands of creators on Babe Hub.',
    images: ['/og-image.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Babe Hub | Adult Creator Jobs, Casting Calls & Monetization',
    description:
      'Apply for adult casting calls, find creator jobs, or scale your OnlyFans income with the #1 management agency.',
    images: ['/og-image.png'],
  },
  icons: { icon: '/favicon.png', apple: '/favicon.png' },
  other: {
    'google-site-verification': 'o5JrL8VSLTJcm1Y3liJ41MTvLIx6lzS-QlH7iHKd4hM',
    '6a97888e-site-verification': 'f0dbbe21efdb52edc5a865db796962bd',
  },
};

const ORG_SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Babe Hub',
  alternateName: 'BabeHub',
  url: 'https://babehub.net',
  logo: 'https://babehub.net/logo.png',
  description:
    'Babe Hub is the #1 platform for adult creator jobs, casting calls, OnlyFans management, and creator monetization.',
  sameAs: ['https://twitter.com/babehub', 'https://instagram.com/babehub'],
};

const WEBSITE_SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'Babe Hub',
  alternateName: 'BabeHub',
  url: 'https://babehub.net',
  // Sitelinks search box: lets Google surface a search field for branded
  // queries that deep-links into our /explore feed.
  potentialAction: {
    '@type': 'SearchAction',
    target: {
      '@type': 'EntryPoint',
      urlTemplate: 'https://babehub.net/explore?q={search_term_string}',
    },
    'query-input': 'required name=search_term_string',
  },
};

const SERVICE_SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'Service',
  serviceType: 'Adult Creator Platform',
  provider: { '@type': 'Organization', name: 'Babe Hub' },
  areaServed: 'Worldwide',
  hasOfferCatalog: {
    '@type': 'OfferCatalog',
    name: 'Babe Hub Services',
    itemListElement: [
      { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Adult Creator Job Board' } },
      { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Casting Calls & Auditions' } },
      { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'OnlyFans Management' } },
      { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Creator Monetization' } },
      { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Social Media Marketing' } },
    ],
  },
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!(routing.locales as readonly string[]).includes(locale)) {
    notFound();
  }
  setRequestLocale(locale as AppLocale);

  // Explicitly hand messages to the client provider. Without this prop,
  // client components (which is most of the page) call useTranslations on
  // an empty message bag and render the raw key path — e.g. "hero.title.more"
  // instead of "More". next-intl v3 does NOT auto-bridge server messages to
  // the client; you must pass them.
  const messages = await getMessages();

  return (
    <html lang={locale} className={poppins.variable}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(ORG_SCHEMA) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(WEBSITE_SCHEMA) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(SERVICE_SCHEMA) }}
        />
      </head>
      <body className="bg-background font-sans">
        <NextIntlClientProvider locale={locale} messages={messages}>
          {children}
        </NextIntlClientProvider>
        {/* Mandatory 18+ confirmation. Shows on first visit per browser,
            covers every page underneath. Reads/writes localStorage in a
            useEffect — SSR-safe, never blocks search-engine crawl. */}
        <AgeGate />
        <Analytics />
      </body>
    </html>
  );
}
