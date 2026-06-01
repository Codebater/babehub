import { type NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

/**
 * POST /api/track — ingest a single anonymous funnel event.
 *
 * Whitelisted event names only (so the table can't be filled with junk),
 * no PII, inserts via the service-role client. Always returns 204 quickly
 * so the client never waits on analytics.
 */
const ALLOWED = new Set([
  // Page traffic
  'pageview',
  // Creator apply funnel (full + quick)
  'apply_open',
  'apply_step2',
  'apply_step3',
  'apply_submit',
  'apply_success',
  'apply_error',
  'apply_close',
  'quick_apply_submit',
  'quick_apply_success',
  // B2B inquiry funnel
  'b2b_open',
  'b2b_submit',
  'b2b_success',
  // Signup funnel
  'signup_view',
  'signup_submit',
]);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const name = String(body?.name ?? '').slice(0, 40);
    if (!ALLOWED.has(name)) return new Response(null, { status: 204 });

    const db = createAdminClient() as any;
    await db.from('analytics_events').insert({
      name,
      session_id: String(body?.session ?? '').slice(0, 40) || null,
      path: String(body?.path ?? '').slice(0, 200) || null,
    });
  } catch {
    /* swallow — analytics must never error the client */
  }
  return new Response(null, { status: 204 });
}
