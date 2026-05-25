import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import MarketingInline from './MarketingInline';

/**
 * Marketing content embedded inside the (social) sidebar shell.
 *
 * The canonical marketing page still lives at `/` with its own
 * (marketing) layout for SEO + first-time visitors. THIS route is for
 * in-platform users who want to browse the marketing content without
 * losing the sidebar / nav. Same sections, same Apply modal, but
 * rendered as the main content area inside the social shell.
 */
type Props = { params: Promise<{ locale: string }> };

export const metadata: Metadata = {
  title: 'About Babe Hub',
  description:
    'Babe Hub — what the platform is, how creators grow, how the agency program works.',
  robots: { index: false, follow: true },
  alternates: { canonical: '/' },
};

export default async function MarketingInPlatformPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <MarketingInline />;
}
