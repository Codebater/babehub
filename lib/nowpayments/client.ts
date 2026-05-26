/**
 * Thin REST wrapper around the NOWPayments API.
 *
 * Docs: https://documenter.getpostman.com/view/7907941/2s93JusNJt
 *
 * Sandbox vs production base URL is controlled by `NOWPAYMENTS_SANDBOX`
 * env var. Sandbox accepts test API keys and won't move real crypto — use
 * it to validate the end-to-end flow before flipping `NOWPAYMENTS_SANDBOX`
 * to `false` and swapping in a production API key.
 */

const SANDBOX_BASE = 'https://api.sandbox.nowpayments.io/v1';
const PRODUCTION_BASE = 'https://api.nowpayments.io/v1';

function baseUrl(): string {
  return process.env.NOWPAYMENTS_SANDBOX === 'true' ? SANDBOX_BASE : PRODUCTION_BASE;
}

function apiKey(): string {
  const k = process.env.NOWPAYMENTS_API_KEY;
  if (!k) throw new Error('NOWPAYMENTS_API_KEY env var is required.');
  return k;
}

export type NowPaymentsInvoiceInput = {
  /** Amount in the FIAT currency, NOT cents. e.g. 9.99 for $9.99. */
  price_amount: number;
  /** Lowercase ISO code: `usd`, `eur`, etc. */
  price_currency: string;
  /** Internal id we can match in the IPN — typically our payment_invoices.id. */
  order_id: string;
  order_description: string;
  /** Webhook URL — must be reachable from the public internet. */
  ipn_callback_url: string;
  /** Where to send the user's browser after they pay. */
  success_url: string;
  /** Where to send the user's browser if they cancel checkout. */
  cancel_url: string;
};

export type NowPaymentsInvoice = {
  id: string;
  order_id: string;
  order_description: string;
  price_amount: string;
  price_currency: string;
  pay_currency: string | null;
  ipn_callback_url: string;
  invoice_url: string;
  success_url: string;
  cancel_url: string;
  created_at: string;
  updated_at: string;
};

/**
 * Creates a hosted-checkout invoice. The returned `invoice_url` is what we
 * redirect the user's browser to — they pick a crypto and pay on
 * NOWPayments' page.
 */
export async function createInvoice(input: NowPaymentsInvoiceInput): Promise<NowPaymentsInvoice> {
  const res = await fetch(`${baseUrl()}/invoice`, {
    method: 'POST',
    headers: {
      'x-api-key': apiKey(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
    // Don't cache — every call must hit NOWPayments fresh.
    cache: 'no-store',
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`NOWPayments createInvoice failed (${res.status}): ${text}`);
  }

  return (await res.json()) as NowPaymentsInvoice;
}
