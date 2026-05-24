import { randomUUID } from 'node:crypto';
import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createInvoice } from '@/lib/nowpayments/client';

/**
 * POST /api/nowpayments/create-invoice
 *
 * Wired to the "Subscribe" form on every creator profile (`/c/{handle}`).
 * Body is `application/x-www-form-urlencoded` with a single field:
 *
 *   tier_id=<uuid>
 *
 * Flow:
 *   1. Require a signed-in user — redirect to /app/login with a `next=`
 *      param pointing back to the creator profile if not.
 *   2. Look up the tier (must be active, must belong to a creator that's
 *      not the same as the subscriber).
 *   3. Generate our own row id, hand it to NOWPayments as `order_id` so
 *      the IPN webhook can resolve the payment back to this invoice.
 *   4. Create the NOWPayments invoice (sandbox or prod based on env).
 *   5. Insert the `payment_invoices` row via the SERVICE-ROLE client
 *      (RLS denies anon/authenticated writes — only the webhook + this
 *      route may write).
 *   6. 303-redirect the user's browser to NOWPayments' hosted checkout.
 */
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function origin(request: NextRequest): string {
  const proto = request.headers.get('x-forwarded-proto') ?? 'https';
  const host = request.headers.get('host');
  return `${proto}://${host}`;
}

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const tierId = String(formData.get('tier_id') ?? '').trim();
  if (!tierId) {
    return NextResponse.redirect(`${origin(request)}/?error=missing_tier`, 303);
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    // Send to login, then bounce back to whichever creator profile they came from.
    const referer = request.headers.get('referer');
    const fallback = '/app/dashboard';
    const next =
      referer && referer.startsWith(origin(request))
        ? referer.slice(origin(request).length) || fallback
        : fallback;
    return NextResponse.redirect(
      `${origin(request)}/app/login?next=${encodeURIComponent(next)}`,
      303,
    );
  }

  // Pull the tier + the creator's handle in one round trip via RLS-aware client.
  const { data: tier } = await supabase
    .from('subscription_tiers')
    .select(
      'id, name, price_cents, currency, active, creator:profiles!subscription_tiers_creator_id_fkey(id, handle, display_name)',
    )
    .eq('id', tierId)
    .maybeSingle();

  // The `creator` join can return an array or single depending on FK shape;
  // normalise to a single object.
  const creator = Array.isArray(tier?.creator) ? tier?.creator[0] : tier?.creator;

  if (!tier || !tier.active || !creator) {
    return NextResponse.redirect(`${origin(request)}/?error=tier_unavailable`, 303);
  }
  if (creator.id === user.id) {
    return NextResponse.redirect(
      `${origin(request)}/c/${creator.handle}?error=cannot_subscribe_to_self`,
      303,
    );
  }

  const invoiceRowId = randomUUID();
  const base = origin(request);

  let nowInvoice;
  try {
    nowInvoice = await createInvoice({
      price_amount: tier.price_cents / 100,
      price_currency: tier.currency.toLowerCase(),
      order_id: invoiceRowId,
      order_description: `${tier.name} subscription for @${creator.handle}`,
      ipn_callback_url: `${base}/api/nowpayments/ipn`,
      success_url: `${base}/app/subscriptions/${invoiceRowId}`,
      cancel_url: `${base}/c/${creator.handle}?cancelled=1`,
    });
  } catch (err) {
    console.error('NOWPayments createInvoice error:', err);
    return NextResponse.redirect(
      `${base}/c/${creator.handle}?error=payment_provider_error`,
      303,
    );
  }

  // Service-role insert — payment_invoices RLS blocks client writes.
  const admin = createAdminClient();
  const { error: insertError } = await admin.from('payment_invoices').insert({
    id: invoiceRowId,
    subscriber_id: user.id,
    creator_id: creator.id,
    tier_id: tier.id,
    provider: 'nowpayments',
    provider_invoice_id: nowInvoice.id,
    status: 'pending',
    amount_cents: tier.price_cents,
    currency: tier.currency,
    metadata: {
      tier_name: tier.name,
      creator_handle: creator.handle,
    },
  });

  if (insertError) {
    console.error('payment_invoices insert error:', insertError);
    return NextResponse.redirect(
      `${base}/c/${creator.handle}?error=invoice_record_failed`,
      303,
    );
  }

  return NextResponse.redirect(nowInvoice.invoice_url, 303);
}
