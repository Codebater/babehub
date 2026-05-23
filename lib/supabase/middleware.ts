import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import type { Database } from '@/types/supabase';

/**
 * Refresh the Supabase session on every matched request. Run this from
 * `middleware.ts` alongside the next-intl middleware.
 *
 * The pattern below is taken from the official Supabase Next.js SSR guide:
 * - Create a `supabaseResponse` we'll mutate cookies on
 * - On every cookie set the client wants to do, write to BOTH the request
 *   (so downstream server components see fresh cookies) and a fresh
 *   `supabaseResponse` (so the browser receives the rotation)
 * - Call `getUser()` to trigger a refresh if the access token is near expiry
 *
 * @param request   the incoming request
 * @param response  an existing response to layer cookies onto (lets next-intl
 *                  run first and produce its redirect/rewrite; we keep its
 *                  rewrites and just splice our cookies in)
 */
export async function updateSession(request: NextRequest, response?: NextResponse) {
  let supabaseResponse = response ?? NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          // Re-create the response only if we hadn't been handed one in;
          // when next-intl gave us a response, mutating its cookies
          // preserves any rewrites/redirects it already applied.
          if (!response) {
            supabaseResponse = NextResponse.next({ request });
          }
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // IMPORTANT: must run between createServerClient and any logic — refreshes
  // the access token if needed and triggers the cookie rotation above.
  await supabase.auth.getUser();

  return supabaseResponse;
}
