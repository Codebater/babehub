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
  title: 'Babe Hub | The Best Model Agency for Top Creators',
  description:
    'Babe Hub is the #1 OnlyFans management agency helping creators and models scale their income to top 0.1%. Professional chatting, marketing, and brand building.',
  keywords:
    'OnlyFans management, OnlyFans agency, model management, OnlyFans growth, OnlyFans marketing, content creator agency, OnlyFans model agency, OnlyFans marketing agency, OnlyFans account manager, OnlyFans scaling, top 0.1% OnlyFans',
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    url: 'https://babehub.net/',
    title: 'Babe Hub | The Best Model Agency for Top Creators',
    description:
      "Scale your OnlyFans income with the world's leading management agency. We handle chatting, marketing, and strategy while you create.",
    images: ['/og-image.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Babe Hub | The Best Model Agency for Top Creators',
    description:
      "Scale your OnlyFans income with the world's leading management agency. We handle chatting, marketing, and strategy while you create.",
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
  url: 'https://babehub.net',
  logo: 'https://babehub.net/logo.png',
  description:
    'Premium OnlyFans Management & Model Growth Agency helping creators reach the top 0.1%.',
  sameAs: ['https://twitter.com/babehub', 'https://instagram.com/babehub'],
};

const SERVICE_SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'Service',
  serviceType: 'OnlyFans Management',
  provider: { '@type': 'Organization', name: 'Babe Hub' },
  areaServed: 'Worldwide',
  hasOfferCatalog: {
    '@type': 'OfferCatalog',
    name: 'OnlyFans Services',
    itemListElement: [
      { '@type': 'Offer', itemOffered: { '@type': 'Service', name: '24/7 Account Management' } },
      { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Social Media Marketing' } },
      { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Professional Chatting' } },
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
