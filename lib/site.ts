import { headers } from 'next/headers';

/**
 * Resolves the absolute origin of the current request. Use this to build
 * fully-qualified URLs for Supabase auth redirects, OG images, etc.
 *
 * Order of precedence:
 *   1. The actual request host (via `headers()`) — only available in
 *      server contexts (Server Components, Route Handlers, Server Actions).
 *      This is the most accurate option in production because it reflects
 *      whatever Preview deployment URL the user actually landed on.
 *   2. `NEXT_PUBLIC_SITE_URL` — escape hatch for static contexts.
 *   3. `VERCEL_URL` — automatic on Vercel deployments but lacks the scheme.
 *   4. `http://localhost:3000` — local dev fallback.
 */
export async function getRequestOrigin(): Promise<string> {
  const h = await headers();
  const host = h.get('host');
  if (host) {
    const proto = h.get('x-forwarded-proto') ?? (host.startsWith('localhost') ? 'http' : 'https');
    return `${proto}://${host}`;
  }
  return getStaticSiteOrigin();
}

export function getStaticSiteOrigin(): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return 'http://localhost:3000';
}
