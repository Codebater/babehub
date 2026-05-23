'use client';

import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@/types/supabase';

/**
 * Browser-side Supabase client. Use in client components for auth flows,
 * realtime subscriptions, and reads/writes that should run with the
 * authenticated user's session (RLS applies).
 *
 * Do NOT import this from server components — use `lib/supabase/server.ts`
 * there so the cookie-based session is honored on the server.
 */
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
