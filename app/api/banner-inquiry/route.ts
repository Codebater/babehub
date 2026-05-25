import { NextResponse } from 'next/server';

/**
 * B2B "Sponsored banner / featured job / collab" inquiry endpoint.
 *
 * Twin of `/api/survey`, but writes to a different Airtable table so
 * brand leads don't pollute the creator-applicant table. Uses the same
 * Airtable base + API key (single source of truth for inquiries) but a
 * different table:
 *
 *   - AIRTABLE_BANNER_TABLE (preferred)
 *   - AIRTABLE_BANNER_TABLE_ID (alternate name)
 *   - falls back to "B2B Inquiries"
 *
 * Anonymous-friendly: only `email` is required (we need a way to
 * reply). Company, name, website, budget, message, telegram are all
 * optional and persisted as empty strings when omitted.
 */
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type BannerInquiryBody = {
  kind?: string;
  company?: string;
  website?: string;
  budget?: string;
  timeline?: string;
  message?: string;
  name?: string;
  email?: string;
  telegram?: string;
};

const KIND_LABELS: Record<string, string> = {
  banner: 'Sponsored banner',
  featured_job: 'Featured job',
  collab: 'Creator collab',
};

function buildRecord(body: BannerInquiryBody): Record<string, string> {
  const record: Record<string, string> = {
    Kind: body.kind ? KIND_LABELS[body.kind] ?? body.kind : '',
    Email: body.email ?? '',
    Name: body.name ?? '',
    Company: body.company ?? '',
    Website: body.website ?? '',
    Budget: body.budget ?? '',
    Timeline: body.timeline ?? '',
    Message: body.message ?? '',
    Telegram: body.telegram ?? '',
  };

  if (process.env.AIRTABLE_OMIT_SUBMISSION_DATE !== '1') {
    record['Submission Date'] = new Date().toISOString();
  }
  return record;
}

function toErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (err && typeof err === 'object') {
    if ('message' in err && typeof (err as { message?: unknown }).message === 'string') {
      return (err as { message: string }).message;
    }
    if ('error' in err) {
      try {
        return JSON.stringify((err as { error: unknown }).error);
      } catch {
        return 'Unknown Airtable error';
      }
    }
  }
  return String(err);
}

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as BannerInquiryBody;
    if (!body.email?.trim()) {
      return NextResponse.json(
        { error: 'Bad Request', details: 'Missing email' },
        { status: 400 },
      );
    }

    const apiKey = process.env.AIRTABLE_API_KEY;
    const baseId = process.env.AIRTABLE_BASE_ID;
    const tableName =
      process.env.AIRTABLE_BANNER_TABLE ||
      process.env.AIRTABLE_BANNER_TABLE_ID ||
      'B2B Inquiries';

    if (!apiKey || !baseId) {
      // Soft-fail in dev when Airtable isn't configured: log the
      // payload so testers can verify the form roundtrip without
      // needing real credentials. In prod the env vars are present so
      // this path doesn't fire.
      if (process.env.NODE_ENV !== 'production') {
        console.warn(
          '[banner-inquiry] Airtable not configured — payload was:',
          JSON.stringify(buildRecord(body), null, 2),
        );
        return NextResponse.json({ success: true, dryRun: true });
      }
      throw new Error('Airtable configuration missing (AIRTABLE_API_KEY or AIRTABLE_BASE_ID)');
    }

    const mod = await import('airtable');
    const Airtable = mod.default;
    if (!Airtable) {
      throw new Error('Failed to load Airtable SDK');
    }

    Airtable.configure({ apiKey });
    const base = Airtable.base(baseId);
    await base(tableName).create([{ fields: buildRecord(body) }]);

    return NextResponse.json({ success: true });
  } catch (err) {
    const details = toErrorMessage(err);
    console.error('Banner inquiry route error:', details);
    return NextResponse.json(
      { error: 'Failed to submit to Airtable', details },
      { status: 500 },
    );
  }
}
