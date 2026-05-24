import { createHmac, timingSafeEqual } from 'node:crypto';

/**
 * Verifies an incoming IPN (Instant Payment Notification) webhook from
 * NOWPayments.
 *
 * Algorithm (per NOWPayments IPN docs):
 *   1. Receive the raw request body and the `x-nowpayments-sig` header.
 *   2. Parse the body as JSON.
 *   3. Deep-sort every object's keys alphabetically (arrays preserve order).
 *   4. JSON.stringify the sorted tree (no extra whitespace).
 *   5. HMAC-SHA512 the result with the IPN secret, hex-encode.
 *   6. Compare with the header value using a constant-time comparison.
 *
 * Returns `true` only when the signatures match — never trust webhook body
 * data without this passing.
 */
export function verifyNowPaymentsIpn(rawBody: string, signature: string | null): boolean {
  if (!signature) return false;

  const secret = process.env.NOWPAYMENTS_IPN_SECRET;
  if (!secret) {
    console.error('NOWPAYMENTS_IPN_SECRET is not set — refusing to verify IPN.');
    return false;
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(rawBody);
  } catch {
    return false;
  }

  const sortedJson = JSON.stringify(deepSort(parsed));
  const expected = createHmac('sha512', secret).update(sortedJson).digest('hex');

  // Constant-time compare to defeat timing attacks.
  try {
    const a = Buffer.from(expected, 'utf8');
    const b = Buffer.from(signature, 'utf8');
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

/**
 * Recursively sorts object keys alphabetically. Arrays preserve their order
 * (only inner objects get sorted). Primitives pass through.
 */
function deepSort(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(deepSort);
  }
  if (value && typeof value === 'object') {
    const sorted: Record<string, unknown> = {};
    for (const key of Object.keys(value as Record<string, unknown>).sort()) {
      sorted[key] = deepSort((value as Record<string, unknown>)[key]);
    }
    return sorted;
  }
  return value;
}
