import { randomUUID } from 'node:crypto';
import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createInvoice } from '@/lib/cryptomus/client';

/**
 * POST /api/cryptomus/create-invoice
 *
 * Wired to the "Subscribe" form on every creator profile (`/c/{handle}`).
 * Body is `application/x-www-form-urlencoded` with a single field:
 *
 *   tier_id=<uuid>
 *
 * Flow:
 *   1. Require a signed-in user — redirect to /app/login with a `next=`
 *      param pointing back to the creator profile if not.
 *   2. Look up the tier (must be active, must not be the user's own).
 *   3. Generate our own row id, hand it to Cryptomus as `order_id` so
 *      the webhook can resolve the payment back to this invoice.
 *   4. Create the Cryptomus invoice.
 *   5. Insert the `payment_invoices` row via the SERVICE-ROLE client
 *      (RLS denies anon/authenticated writes — only the webhook + this
 *      route may write).
 *   6. 303-redirect the user's browser to Cryptomus' hosted checkout.
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

  const { data: tier } = await supabase
    .from('subscription_tiers')
    .select(
      'id, name, price_cents, currency, active, creator:profiles!subscription_tiers_creator_id_fkey(id, handle, display_name)',
    )
    .eq('id', tierId)
    .maybeSingle();

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

  let cryptInvoice;
  try {
    cryptInvoice = await createInvoice({
      amount: (tier.price_cents / 100).toFixed(2),
      currency: tier.currency.toUpperCase(),
      order_id: invoiceRowId,
      url_callback: `${base}/api/cryptomus/webhook`,
      url_success: `${base}/app/subscriptions/${invoiceRowId}`,
      url_return: `${base}/c/${creator.handle}?cancelled=1`,
      lifetime: 3600, // 1h to complete payment
    });
  } catch (err) {
    console.error('Cryptomus createInvoice error:', err);
    return NextResponse.redirect(
      `${base}/c/${creator.handle}?error=payment_provider_error`,
      303,
    );
  }

  const admin = createAdminClient();
  const { error: insertError } = await admin.from('payment_invoices').insert({
    id: invoiceRowId,
    subscriber_id: user.id,
    creator_id: creator.id,
    tier_id: tier.id,
    provider: 'cryptomus',
    provider_invoice_id: cryptInvoice.uuid,
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

  return NextResponse.redirect(cryptInvoice.url, 303);
}
