import { createHash } from 'node:crypto';

/**
 * Thin REST wrapper around the Cryptomus payment API.
 *
 * Docs: https://doc.cryptomus.com/business/payments/creating-invoice
 *
 * Auth scheme (every request):
 *   headers.merchant = CRYPTOMUS_MERCHANT_ID
 *   headers.sign     = md5( base64( JSON.stringify(body) ) + CRYPTOMUS_PAYMENT_API_KEY )
 *
 * The same scheme is used to verify webhooks — see verifyWebhook.ts.
 *
 * Cryptomus operates one base URL (no sandbox vs prod split — they use
 * test merchant accounts instead). Set `CRYPTOMUS_TEST_MODE=true` on
 * test accounts; for our purposes that's a no-op at the client level.
 */

const BASE = 'https://api.cryptomus.com/v1';

function merchantId(): string {
  const v = process.env.CRYPTOMUS_MERCHANT_ID;
  if (!v) throw new Error('CRYPTOMUS_MERCHANT_ID env var is required.');
  return v;
}

function paymentApiKey(): string {
  const v = process.env.CRYPTOMUS_PAYMENT_API_KEY;
  if (!v) throw new Error('CRYPTOMUS_PAYMENT_API_KEY env var is required.');
  return v;
}

/**
 * Sign a request body the Cryptomus way: md5(base64(json) + apiKey).
 * Exported so the webhook verifier can reuse it.
 */
export function signCryptomusBody(body: unknown, apiKey: string): string {
  const json = JSON.stringify(body);
  const b64 = Buffer.from(json, 'utf8').toString('base64');
  return createHash('md5').update(b64 + apiKey).digest('hex');
}

export type CryptomusInvoiceInput = {
  /** Amount as a decimal string. e.g. "9.99" for $9.99. */
  amount: string;
  /** Uppercase ISO code: 'USD', 'EUR', etc. */
  currency: string;
  /** Internal id we can match in the webhook — typically payment_invoices.id. */
  order_id: string;
  /** Webhook URL — must be reachable from the public internet. */
  url_callback: string;
  /** Where to send the user's browser after a successful payment. */
  url_success: string;
  /** Where to send the user's browser if they cancel checkout. */
  url_return: string;
  /** Optional description shown on the Cryptomus checkout page. */
  subtract?: number;
  lifetime?: number;
};

export type CryptomusInvoice = {
  uuid: string;
  order_id: string;
  amount: string;
  payment_amount: string | null;
  payer_amount: string | null;
  discount_percent: number | null;
  discount: string | null;
  payer_currency: string | null;
  currency: string;
  merchant_amount: string | null;
  network: string | null;
  address: string | null;
  from: string | null;
  txid: string | null;
  payment_status: string;
  url: string;
  expired_at: number;
  status: string;
  is_final: boolean;
  additional_data: string | null;
  created_at: string;
  updated_at: string;
};

type CryptomusEnvelope<T> = {
  state: 0 | 1;
  result?: T;
  message?: string;
  errors?: Record<string, string[]>;
};

/**
 * Creates a hosted-checkout invoice. The returned `url` is what we
 * redirect the user's browser to — Cryptomus hosts the wallet selection
 * + payment screen.
 */
export async function createInvoice(input: CryptomusInvoiceInput): Promise<CryptomusInvoice> {
  const apiKey = paymentApiKey();
  const sign = signCryptomusBody(input, apiKey);

  const res = await fetch(`${BASE}/payment`, {
    method: 'POST',
    headers: {
      merchant: merchantId(),
      sign,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
    cache: 'no-store',
  });

  const text = await res.text();
  if (!res.ok) {
    throw new Error(`Cryptomus createInvoice HTTP ${res.status}: ${text}`);
  }

  let envelope: CryptomusEnvelope<CryptomusInvoice>;
  try {
    envelope = JSON.parse(text) as CryptomusEnvelope<CryptomusInvoice>;
  } catch {
    throw new Error(`Cryptomus createInvoice: non-JSON response: ${text}`);
  }

  if (envelope.state !== 0 || !envelope.result) {
    throw new Error(
      `Cryptomus createInvoice rejected: ${envelope.message ?? JSON.stringify(envelope.errors ?? envelope)}`,
    );
  }

  return envelope.result;
}
