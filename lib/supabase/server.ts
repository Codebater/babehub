import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import type { Database } from '@/types/supabase';

/**
 * Server-side Supabase client for use in:
 *   - Server Components (read-only — Next.js doesn't allow cookie writes
 *     during render, so `setAll` is a no-op and that's expected)
 *   - Route Handlers (full read/write, including session refresh writes)
 *   - Server Actions (full read/write)
 *
 * RLS applies — the request's cookies establish the auth session.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // `cookieStore.set` throws when called from a Server Component.
            // That's OK — middleware refreshes the session there instead.
          }
        },
      },
    },
  );
}
