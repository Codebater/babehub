import { Suspense } from 'react';
import { setRequestLocale } from 'next-intl/server';
import HomeShell from './_components/HomeShell';

/**
 * Marketing home page. All UI lives in `_components/HomeShell` (client component)
 * because the original SPA had cross-section state (apply modal, scroll spy
 * theme toggle).
 *
 * HomeShell uses `useSearchParams()` to detect `?embed=1` (sets embedded
 * mode for the social-shell /marketing iframe). useSearchParams forces
 * client-side rendering for the entire tree it's read in, which would
 * otherwise bail out of static prerender for this page. Wrapping it in
 * a Suspense boundary tells Next.js it's safe to defer that subtree to
 * the client while still SSG'ing the surrounding HTML.
 */
export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <Suspense fallback={null}>
      <HomeShell />
    </Suspense>
  );
}
