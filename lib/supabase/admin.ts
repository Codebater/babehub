import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';

/**
 * Service-role Supabase client. **Server-only.** This client bypasses RLS
 * and has full read/write access to the database. Use it for:
 *   - Stripe / NOWPayments webhook handlers that write `subscriptions` rows
 *     on behalf of users (no user session available at that moment)
 *   - Background jobs / cron handlers that need cross-user access
 *   - Internal admin tooling
 *
 * **Never import this from a client component.** It reads
 * `SUPABASE_SERVICE_ROLE_KEY` which must never reach the browser bundle.
 *
 * `auth.persistSession: false` and `autoRefreshToken: false` prevent the
 * service-role client from picking up the calling user's session — it
 * should be stateless across requests.
 */
let cached: ReturnType<typeof createClient<Database>> | null = null;

export function createAdminClient() {
  if (cached) return cached;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      'Supabase admin client requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY env vars.',
    );
  }

  cached = createClient<Database>(url, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
  return cached;
}
