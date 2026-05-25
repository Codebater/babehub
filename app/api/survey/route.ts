import { NextResponse } from 'next/server';

/**
 * Port of the legacy `api/survey.ts` Vercel Node serverless function to a
 * Next.js App Router route handler. Same Airtable schema, same env vars
 * (AIRTABLE_API_KEY, AIRTABLE_BASE_ID, AIRTABLE_TABLE_ID/NAME,
 * AIRTABLE_OMIT_SUBMISSION_DATE). Node runtime is required for the airtable
 * SDK (no fetch-only mode).
 */
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type SurveyFormBody = {
  name?: string;
  email?: string;
  whatsapp?: string;
  country?: string;
  isOver18?: string;
  isActiveCreator?: string;
  isGeneratingRevenue?: string;
  monthlyEarnings?: string;
  socialPlatform?: string;
  socialHandle?: string;
  contentType?: string;
  goals?: string;
  interestedInCampaigns?: boolean;
  agreesToProfitShare?: boolean;
};

function buildRecord(formData: SurveyFormBody): Record<string, string | boolean> {
  const record: Record<string, string | boolean> = {
    Name: formData.name ?? '',
    Email: formData.email ?? '',
    Country: formData.country?.trim() ?? '',
    'Over 18': formData.isOver18 === 'yes',
    'Active Creator': formData.isActiveCreator === 'yes',
    'Generating Revenue': formData.isGeneratingRevenue === 'yes',
    'Social Platform': formData.socialPlatform ?? '',
    'Social Handle': formData.socialHandle ?? '',
    'Content Type': formData.contentType ?? '',
    'Interested in Campaigns': Boolean(formData.interestedInCampaigns),
    'Agrees to Profit Share': Boolean(formData.agreesToProfitShare),
  };

  if (process.env.AIRTABLE_OMIT_SUBMISSION_DATE !== '1') {
    record['Submission Date'] = new Date().toISOString();
  }
  if (formData.whatsapp?.trim()) {
    record['WhatsApp'] = formData.whatsapp.trim();
  }
  if (formData.goals?.trim()) {
    record['Goals'] = formData.goals.trim();
  }
  if (formData.isGeneratingRevenue === 'yes' && formData.monthlyEarnings) {
    record['Monthly Earnings'] = formData.monthlyEarnings;
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
    const body = (await request.json().catch(() => ({}))) as SurveyFormBody;
    // Anonymous-friendly: only the email is required so we have one
    // reliable contact channel. Name and social handle are optional and
    // get persisted as empty strings to Airtable when omitted.
    if (!body.email?.trim()) {
      return NextResponse.json(
        { error: 'Bad Request', details: 'Missing email' },
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
    console.error('Survey route error:', details);
    return NextResponse.json(
      { error: 'Failed to submit to Airtable', details },
      { status: 500 },
    );
  }
}
