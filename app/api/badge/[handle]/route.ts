import { type NextRequest } from 'next/server';

/**
 * GET /api/badge/{handle} → an SVG "Featured Creator on BabeHub" badge.
 *
 * Creators embed this on their OnlyFans / Twitter / linktree / personal
 * site inside an <a href="https://babehub.net/c/{handle}"> link — every
 * embed becomes a followable backlink to their BabeHub profile, which
 * compounds the domain's link authority over time.
 *
 * Pure SVG, no auth, long cache. Handle is sanitized to the same charset
 * the platform allows so it can't break the markup or be used for XSS.
 */
export const dynamic = 'force-static';
export const revalidate = 86400;

function sanitize(handle: string): string {
  return handle.toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 24);
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ handle: string }> },
) {
  const { handle: raw } = await params;
  const handle = sanitize(raw) || 'creator';
  const sub = `@${handle}`.slice(0, 26);

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="60" viewBox="0 0 300 60" role="img" aria-label="${sub} — Featured Creator on BabeHub">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#111114"/>
      <stop offset="1" stop-color="#08080a"/>
    </linearGradient>
    <linearGradient id="pink" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#ec4899"/>
      <stop offset="1" stop-color="#db2777"/>
    </linearGradient>
  </defs>
  <rect x="0.5" y="0.5" width="299" height="59" rx="12" fill="url(#bg)" stroke="#ec4899" stroke-opacity="0.45"/>
  <circle cx="34" cy="30" r="17" fill="url(#pink)"/>
  <text x="34" y="37" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-weight="900" font-size="20" fill="#ffffff">B</text>
  <text x="62" y="27" font-family="Arial, Helvetica, sans-serif" font-weight="800" font-size="16" fill="#ffffff">Babe<tspan fill="#ec4899">Hub</tspan></text>
  <text x="62" y="45" font-family="Arial, Helvetica, sans-serif" font-weight="500" font-size="11" fill="#a1a1aa">${sub} · Verified Creator</text>
  <g transform="translate(270 30)">
    <circle r="11" fill="#ec4899" fill-opacity="0.15" stroke="#ec4899" stroke-opacity="0.5"/>
    <path d="M -4 0 L -1.5 2.5 L 4 -3" fill="none" stroke="#ec4899" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  </g>
</svg>`;

  return new Response(svg, {
    headers: {
      'Content-Type': 'image/svg+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=86400, s-maxage=86400, immutable',
    },
  });
}
