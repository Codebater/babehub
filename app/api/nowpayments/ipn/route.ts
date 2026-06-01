import { NextResponse, type NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { verifyNowPaymentsIpn } from '@/lib/nowpayments/verifyIpn';

/**
 * POST /api/nowpayments/ipn
 *
 * NOWPayments webhook target. They post a JSON body with the latest
 * status of an invoice; we update the `payment_invoices` row and — on
 * terminal success — create the matching `subscriptions` row so the
 * paywall RLS opens up for the fan.
 *
 * Critical: this handler is invoked by NOWPayments servers, NOT by a
 * user session. We use the service-role Supabase client which bypasses
 * RLS. Before trusting ANYTHING in the body we verify the HMAC-SHA512
 * signature against the IPN secret.
 *
 * The NOWPayments `payment_status` values we care about:
 *   - `finished`: terminal success → create subscription row
 *   - `failed`, `expired`, `refunded`: terminal failure → record only
 *   - `waiting`, `confirming`, `confirmed`, `sending`, `partially_paid`:
 *     in-flight → record only, no subscription row yet
 *
 * Idempotency: we only create a subscription if `payment_invoices.subscription_id`
 * is null. Duplicate `finished` IPNs are no-ops after the first.
 */
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type IpnBody = {
  payment_id?: string | number;
  invoice_id?: string | number;
  payment_status?: string;
  order_id?: string;
  pay_amount?: number;
  pay_currency?: string;
  price_amount?: number;
  price_currency?: string;
};

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const signature = request.headers.get('x-nowpayments-sig');

  if (!verifyNowPaymentsIpn(rawBody, signature)) {
    console.warn('Rejected NOWPayments IPN: invalid signature');
    return new NextResponse('Invalid signature', { status: 401 });
  }

  let body: IpnBody;
  try {
    body = JSON.parse(rawBody) as IpnBody;
  } catch {
    return new NextResponse('Invalid JSON', { status: 400 });
  }

  const { payment_id, invoice_id, payment_status, order_id } = body;
  if (!payment_status) {
    return new NextResponse('Missing payment_status', { status: 400 });
  }

  const admin = createAdminClient();

  // Look up the matching invoice. Prefer our own `order_id` (which we set
  // to payment_invoices.id when creating); fall back to NOWPayments'
  // `invoice_id` because IPN-only fields aren't always echoed back.
  let invoice = null as
    | {
        id: string;
        subscriber_id: string;
        creator_id: string | null;
        tier_id: string | null;
        subscription_id: string | null;
        purpose: string;
      }
    | null;

  if (order_id) {
    const { data } = await admin
      .from('payment_invoices')
      .select('id, subscriber_id, creator_id, tier_id, subscription_id, purpose')
      .eq('id', order_id)
      .maybeSingle();
    invoice = data ?? null;
  }

  if (!invoice && invoice_id != null) {
    const { data } = await admin
      .from('payment_invoices')
      .select('id, subscriber_id, creator_id, tier_id, subscription_id, purpose')
      .eq('provider', 'nowpayments')
      .eq('provider_invoice_id', String(invoice_id))
      .maybeSingle();
    invoice = data ?? null;
  }

  if (!invoice) {
    console.error('IPN for unknown invoice', { order_id, invoice_id, payment_status });
    // Return 200 so NOWPayments doesn't endlessly retry an orphan webhook
    // (could happen if a sandbox DB was reset). Log loudly so we notice.
    return new NextResponse('Invoice not found, dropped', { status: 200 });
  }

  const updates: {
    status: string;
    provider_payment_id?: string;
    subscription_id?: string;
  } = { status: payment_status };
  if (payment_id != null) updates.provider_payment_id = String(payment_id);

  // Terminal success — open the paywall (or flip premium).
  if (payment_status === 'finished') {
    const periodStart = new Date();
    const periodEnd = new Date(periodStart);
    periodEnd.setUTCDate(periodEnd.getUTCDate() + 30);

    if (invoice.purpose === 'premium') {
      // One-time Casting unlock — lifetime access, no expiry.
      // `premium_until = null` is treated by isElevated() as never-expiring.
      const { error: profErr } = await admin
        .from('profiles')
        .update({
          is_premium: true,
          premium_until: null,
        })
        .eq('id', invoice.subscriber_id);

      if (profErr) {
        console.error('profiles premium update error:', profErr);
        return new NextResponse('Premium update failed', { status: 500 });
      }
    } else if (!invoice.subscription_id && invoice.creator_id && invoice.tier_id) {
      // tier_subscription path — create the subscriptions row.
      const providerSubId = String(payment_id ?? invoice_id ?? invoice.id);

      const { data: sub, error: subError } = await admin
        .from('subscriptions')
        .insert({
          subscriber_id: invoice.subscriber_id,
          creator_id: invoice.creator_id,
          tier_id: invoice.tier_id,
          status: 'active',
          provider: 'nowpayments',
          provider_subscription_id: providerSubId,
          current_period_start: periodStart.toISOString(),
          current_period_end: periodEnd.toISOString(),
        })
        .select('id')
        .single();

      if (subError) {
        // Duplicate provider_subscription_id (23505) means we already
        // processed this — log and move on rather than failing the IPN.
        if (subError.code !== '23505') {
          console.error('subscriptions insert error:', subError);
          return new NextResponse('Subscription create failed', { status: 500 });
        }
      } else if (sub) {
        updates.subscription_id = sub.id;
      }
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
