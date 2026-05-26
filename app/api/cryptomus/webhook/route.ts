import { NextResponse, type NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { verifyCryptomusWebhook } from '@/lib/cryptomus/verifyWebhook';

/**
 * POST /api/cryptomus/webhook
 *
 * Cryptomus webhook target. They POST a JSON body with the latest
 * status of an invoice; we update the `payment_invoices` row and — on
 * terminal success — create the matching `subscriptions` row so the
 * paywall RLS opens up for the fan.
 *
 * Critical: this handler is invoked by Cryptomus servers, NOT by a
 * user session. We use the service-role Supabase client which bypasses
 * RLS. Before trusting ANYTHING in the body we verify the md5(base64+key)
 * signature against the payment API key.
 *
 * Cryptomus `status` values we care about:
 *   - `paid`, `paid_over`: terminal success → create subscription row
 *   - `fail`, `wrong_amount`, `cancel`, `system_fail`: terminal failure → record only
 *   - `process`, `check`, `confirm_check`: in-flight → record only
 *
 * Idempotency: we only create a subscription if `payment_invoices.subscription_id`
 * is null. Duplicate `paid` webhooks are no-ops after the first.
 */
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type WebhookBody = {
  type?: string;
  uuid?: string;
  order_id?: string;
  amount?: string;
  payment_amount?: string;
  payer_amount?: string;
  payer_currency?: string;
  currency?: string;
  network?: string;
  address?: string;
  txid?: string;
  status?: string;
  is_final?: boolean;
  additional_data?: string;
  sign?: string;
};

const TERMINAL_SUCCESS = new Set(['paid', 'paid_over']);

export async function POST(request: NextRequest) {
  const rawBody = await request.text();

  if (!verifyCryptomusWebhook(rawBody)) {
    console.warn('Rejected Cryptomus webhook: invalid signature');
    return new NextResponse('Invalid signature', { status: 401 });
  }

  let body: WebhookBody;
  try {
    body = JSON.parse(rawBody) as WebhookBody;
  } catch {
    return new NextResponse('Invalid JSON', { status: 400 });
  }

  const { uuid, order_id, status, txid } = body;
  if (!status) {
    return new NextResponse('Missing status', { status: 400 });
  }

  const admin = createAdminClient();

  // Prefer our own order_id (= payment_invoices.id), fall back to the
  // Cryptomus uuid for provider_invoice_id lookups.
  let invoice = null as
    | {
        id: string;
        subscriber_id: string;
        creator_id: string;
        tier_id: string;
        subscription_id: string | null;
      }
    | null;

  if (order_id) {
    const { data } = await admin
      .from('payment_invoices')
      .select('id, subscriber_id, creator_id, tier_id, subscription_id')
      .eq('id', order_id)
      .maybeSingle();
    invoice = data ?? null;
  }

  if (!invoice && uuid) {
    const { data } = await admin
      .from('payment_invoices')
      .select('id, subscriber_id, creator_id, tier_id, subscription_id')
      .eq('provider', 'cryptomus')
      .eq('provider_invoice_id', String(uuid))
      .maybeSingle();
    invoice = data ?? null;
  }

  if (!invoice) {
    console.error('Webhook for unknown invoice', { order_id, uuid, status });
    // 200 so Cryptomus stops retrying an orphan webhook (test DBs etc).
    return new NextResponse('Invoice not found, dropped', { status: 200 });
  }

  const updates: {
    status: string;
    provider_payment_id?: string;
    subscription_id?: string;
  } = { status };
  if (txid) updates.provider_payment_id = txid;

  // Terminal success — open the paywall.
  if (TERMINAL_SUCCESS.has(status) && !invoice.subscription_id) {
    const periodStart = new Date();
    const periodEnd = new Date(periodStart);
    periodEnd.setUTCDate(periodEnd.getUTCDate() + 30);

    const providerSubId = String(txid ?? uuid ?? invoice.id);

    const { data: sub, error: subError } = await admin
      .from('subscriptions')
      .insert({
        subscriber_id: invoice.subscriber_id,
        creator_id: invoice.creator_id,
        tier_id: invoice.tier_id,
        status: 'active',
        provider: 'cryptomus',
        provider_subscription_id: providerSubId,
        current_period_start: periodStart.toISOString(),
        current_period_end: periodEnd.toISOString(),
      })
      .select('id')
      .single();

    if (subError) {
      // Duplicate provider_subscription_id (23505) means we already
      // processed this — log and move on.
      if (subError.code !== '23505') {
        console.error('subscriptions insert error:', subError);
        return new NextResponse('Subscription create failed', { status: 500 });
      }
    } else if (sub) {
      updates.subscription_id = sub.id;
    }
  }

  const { error: updateError } = await admin
    .from('payment_invoices')
    .update(updates)
    .eq('id', invoice.id);

  if (updateError) {
    console.error('payment_invoices update error:', updateError);
    return new NextResponse('Invoice update failed', { status: 500 });
  }

  return new NextResponse('OK', { status: 200 });
}
