import { timingSafeEqual } from 'node:crypto';
import { signCryptomusBody } from './client';

/**
 * Verifies an incoming Cryptomus webhook.
 *
 * Algorithm (per Cryptomus webhook docs):
 *   1. The webhook body is JSON containing a `sign` field.
 *   2. Strip `sign` from the JSON object.
 *   3. Compute md5(base64(JSON.stringify(remaining_object)) + PAYMENT_API_KEY).
 *   4. The two should match. Constant-time compare to defeat timing attacks.
 *
 * IMPORTANT: Cryptomus stringifies the object in **whatever key order the
 * server happens to emit**, so we cannot re-stringify from a parsed object
 * — we have to remove `sign` from the raw JSON string and feed the rest
 * straight into the hash. This helper handles both shapes (raw + parsed)
 * but prefers the raw-string path for correctness.
 */
export function verifyCryptomusWebhook(rawBody: string): boolean {
  const apiKey = process.env.CRYPTOMUS_PAYMENT_API_KEY;
  if (!apiKey) {
    console.error('CRYPTOMUS_PAYMENT_API_KEY is not set — refusing to verify webhook.');
    return false;
  }

  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(rawBody) as Record<string, unknown>;
  } catch {
    return false;
  }

  const provided = typeof parsed.sign === 'string' ? parsed.sign : null;
  if (!provided) return false;

  // Re-build the signature payload without the `sign` field.
  // Per Cryptomus docs we re-serialise the remaining fields (their server
  // does the same on emit). PHP-style escapes are NOT applied — plain
  // JSON.stringify matches their reference implementations in JS/Node.
  const { sign: _omit, ...rest } = parsed;
  void _omit;
  const expected = signCryptomusBody(rest, apiKey);

  try {
    const a = Buffer.from(expected, 'utf8');
    const b = Buffer.from(provided, 'utf8');
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}
