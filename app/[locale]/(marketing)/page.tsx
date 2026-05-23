import { setRequestLocale } from 'next-intl/server';
import HomeShell from './_components/HomeShell';

/**
 * Marketing home page. All UI lives in `_components/HomeShell` (client component)
 * because the original SPA had cross-section state (apply modal, scroll spy
 * theme toggle). Subsequent phases can split sections back to RSC where they're
 * pure presentational.
 */
export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <HomeShell />;
}
