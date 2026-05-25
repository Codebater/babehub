'use client';

/**
 * Marketing content embedded inside the (social) shell at /marketing.
 *
 * Implementation: an iframe pointed at the canonical marketing home
 * (`/?embed=1`). Two reasons we went iframe instead of component
 * inlining:
 *
 *  1. The marketing components were designed for a full-viewport
 *     desktop width. Inside the social shell the main column is
 *     narrower (viewport minus the 240px sidebar) and several
 *     sections clipped past the right edge — text columns, the logo
 *     marquee, the dashboard grid all assumed they had the whole
 *     viewport to play with.
 *  2. An iframe gives the marketing site its own layout context so
 *     it renders at its natural width with no overflow fights, and
 *     the social sidebar stays visible alongside it.
 *
 * The `?embed=1` param tells HomeShell to hide its own Header +
 * Footer (the social shell already provides nav + legal footer), so
 * the user sees one consistent chrome — the social sidebar on the
 * left, the embedded marketing sections on the right — with no
 * stacked headers.
 *
 * Height: full viewport on desktop, viewport minus mobile-bottom-bar
 * on mobile. The iframe scrolls its own content internally.
 */
export default function MarketingInline() {
  return (
    <div className="h-[calc(100vh-4rem)] w-full md:h-screen">
      <iframe
        src="/?embed=1"
        title="Babe Hub marketing site"
        className="block h-full w-full border-0"
        loading="lazy"
      />
    </div>
  );
}
