import { redirect } from 'next/navigation';

/**
 * Root URL `/` now redirects straight to the Casting view inside the
 * social shell. The marketing content (Hero, Benefits, Apply form,
 * etc.) is still reachable in two places:
 *
 *   - `/marketing` — renders the marketing site inside an iframe in
 *     the (social) shell so the sidebar stays visible.
 *   - The original (marketing) layout still serves any standalone
 *     marketing pages (the SEO-prerendered slugs in
 *     `content/seoData.ts`), they just aren't reachable from `/` by
 *     default anymore.
 *
 * Iframe-embed view at /marketing loads /?embed=1 — that's where the
 * HomeShell still gets rendered (see (marketing)/_components/HomeShell.tsx,
 * which reads the embed flag and skips its Header + Footer).
 */
export default async function HomePage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ embed?: string }>;
}) {
  await params;
  const sp = await searchParams;
  // When the page is loaded inside our /marketing iframe (?embed=1),
  // keep showing the marketing HomeShell so the embedded view works.
  // Anything else redirects to the casting landing.
  if (sp.embed === '1') {
    const { Suspense } = await import('react');
    const HomeShell = (await import('./_components/HomeShell')).default;
    return (
      <Suspense fallback={null}>
        <HomeShell />
      </Suspense>
    );
  }
  redirect('/explore?q=casting');
}
