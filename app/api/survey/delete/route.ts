import { NextResponse } from 'next/server';

/**
 * POST /api/survey/delete
 *
 * GDPR/CCPA "delete my data" endpoint for the application survey.
 * Takes { email } in the JSON body, looks up every Airtable row in the
 * survey table that matches `{Email} = '<email>'`, and deletes them
 * all. Returns the number of records removed.
 *
 * Verification approach for v1: a user submits the form with the email
 * they applied with. Anyone with that email address could trigger a
 * delete — that's an acceptable simplification because (a) the data
 * involved is application metadata they themselves submitted, (b) a
 * delete is what they're asking for, and (c) wiping recoverable rows
 * is the GDPR-correct response to a request, not a withholding of
 * service. A double-opt-in confirmation email is a Phase-2 hardening
 * once we have transactional email set up (Resend).
 *
 * The route reuses the same env vars and table convention as the
 * survey-submit route — AIRTABLE_API_KEY, AIRTABLE_BASE_ID,
 * AIRTABLE_TABLE_ID/NAME.
 */
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type DeleteBody = { email?: string };

function isValidEmail(s: string): boolean {
  // Minimum bar: looks like name@domain.tld, no spaces. We don't want
  // to be strict here — Airtable stores whatever was submitted, so we
  // need the same level of permissiveness to find it again.
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}

function toErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (err && typeof err === 'object' && 'message' in err) {
    return String((err as { message: unknown }).message);
  }
  return String(err);
}

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as DeleteBody;
    const email = body.email?.trim().toLowerCase();

    if (!email || !isValidEmail(email)) {
      return NextResponse.json(
        { error: 'Bad Request', details: 'A valid email address is required.' },
        { status: 400 },
      );
    }

    const apiKey = process.env.AIRTABLE_API_KEY;
    const baseId = process.env.AIRTABLE_BASE_ID;
    const tableName =
      process.env.AIRTABLE_TABLE_ID ||
      process.env.AIRTABLE_TABLE_NAME ||
      'Survey Submissions';

    if (!apiKey || !baseId) {
      throw new Error('Airtable configuration missing.');
    }

    const mod = await import('airtable');
    const Airtable = mod.default;
    if (!Airtable) throw new Error('Failed to load Airtable SDK');

    Airtable.configure({ apiKey });
    const base = Airtable.base(baseId);

    // 1. Find every row whose Email column matches (case-insensitive on
    //    both sides — Airtable's LOWER() makes the comparison stable
    //    even if the stored value has capital letters).
    const matching = await base(tableName)
      .select({
        // Escape single quotes the safe way: Airtable formula language
        // doesn't have a strict escape, but doubling single quotes works
        // for string literals inside curlies.
        filterByFormula: `LOWER({Email}) = '${email.replace(/'/g, "''")}'`,
        fields: ['Email'], // we only need ids; fetch the minimum payload
      })
      .all();

    if (matching.length === 0) {
      return NextResponse.json({ success: true, deleted: 0 });
    }

    // 2. Delete in batches of 10 (Airtable's max per destroy call).
    const ids = matching.map((r) => r.id);
    let deleted = 0;
    for (let i = 0; i < ids.length; i += 10) {
      const batch = ids.slice(i, i + 10);
      await base(tableName).destroy(batch);
      deleted += batch.length;
    }

    return NextResponse.json({ success: true, deleted });
  } catch (err) {
    const details = toErrorMessage(err);
    console.error('[survey-delete] failed:', details);
    return NextResponse.json(
      { error: 'Failed to delete application data', details },
      { status: 500 },
    );
  }
}
