import { randomUUID } from 'node:crypto';
import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createInvoice } from '@/lib/nowpayments/client';

/**
 * POST /api/nowpayments/create-premium-invoice
 *
 * The "Unlock Premium" CTA on PremiumGate + /app/premium posts here.
 * Premium is a platform-wide $10/mo top-up — NOT tied to any creator.
 *
 * Flow:
 *   1. Require a signed-in user (bounces to /app/login with next= back here)
 *   2. Generate a payment_invoices row id we hand to NOWPayments as order_id
 *   3. Create the NOWPayments invoice for $10 USD
 *   4. Insert payment_invoices row with purpose='premium' (creator_id/tier_id
 *      both NULL — that's why migration 0018 dropped their NOT NULL)
 *   5. 303-redirect the user's browser to NOWPayments' hosted checkout
 *
 * On a successful payment, /api/nowpayments/ipn branches on purpose:
 *   - tier_subscription → creates subscriptions row (existing behaviour)
 *   - premium           → flips profiles.is_premium=true + premium_until=now()+30d
 */
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const PREMIUM_PRICE_USD = 10;

function origin(request: NextRequest): string {
  const proto = request.headers.get('x-forwarded-proto') ?? 'https';
  const host = request.headers.get('host');
  return `${proto}://${host}`;
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(
      `${origin(request)}/app/login?next=${encodeURIComponent('/app/premium')}`,
      303,
    );
  }

  const invoiceRowId = randomUUID();
  const base = origin(request);

  let nowInvoice;
  try {
    nowInvoice = await createInvoice({
      price_amount: PREMIUM_PRICE_USD,
      price_currency: 'usd',
      order_id: invoiceRowId,
      order_description: 'BabeHub Casting Access · Lifetime (one-time)',
      ipn_callback_url: `${base}/api/nowpayments/ipn`,
      success_url: `${base}/app/subscriptions/${invoiceRowId}`,
      cancel_url: `${base}/app/premium?cancelled=1`,
    });
  } catch (err) {
    console.error('NOWPayments createInvoice (premium) error:', err);
    return NextResponse.redirect(
      `${base}/app/premium?error=payment_provider_error`,
      303,
    );
  }

  const admin = createAdminClient();
  const { error: insertError } = await admin.from('payment_invoices').insert({
    id: invoiceRowId,
    subscriber_id: user.id,
    creator_id: null,
    tier_id: null,
    provider: 'nowpayments',
    provider_invoice_id: nowInvoice.id,
    status: 'pending',
    amount_cents: PREMIUM_PRICE_USD * 100,
    currency: 'USD',
    purpose: 'premium',
    metadata: {
      lifetime: true,
    },
  });

  if (insertError) {
    console.error('payment_invoices (premium) insert error:', insertError);
    return NextResponse.redirect(
      `${base}/app/premium?error=invoice_record_failed`,
      303,
    );
  }

  return NextResponse.redirect(nowInvoice.invoice_url, 303);
}
