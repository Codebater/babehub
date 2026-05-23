import createIntlMiddleware from 'next-intl/middleware';
import type { NextRequest } from 'next/server';
import { routing } from './i18n/routing';
import { updateSession } from './lib/supabase/middleware';

const intlMiddleware = createIntlMiddleware(routing);

/**
 * Composed middleware: next-intl decides locale routing first, then we layer
 * Supabase auth-session refresh on top of the resulting response. Order
 * matters — next-intl may rewrite/redirect (e.g. `/de` → internal `/de`
 * route), and Supabase's `updateSession` then merges its cookies onto that
 * already-decided response without clobbering the redirect/rewrite.
 */
export async function middleware(request: NextRequest) {
  const intlResponse = intlMiddleware(request);
  return updateSession(request, intlResponse);
}

export const config = {
  // Match all paths except: api routes, Next.js internals, static files.
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};
