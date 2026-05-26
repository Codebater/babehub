import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * B2B "Sponsored banner / featured job / collab" inquiry endpoint.
 *
 * Primary path: writes to `public.banner_inquiries` (Supabase). Admin
 * /app/admin/inquiries reads from this table.
 *
 * Fallback path: optional Airtable mirror when AIRTABLE_API_KEY +
 * AIRTABLE_BANNER_TABLE are both set. Lets the team migrate gradually.
 *
 * Anonymous-friendly: only `email` is required. Company / name /
 * website / budget / timeline / message all optional. Signed-in
 * submitters get linked via user_id.
 */
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type BannerInquiryBody = {
  /** Multi-select. Pre-multi shape had a single `kind` — kept for back-compat. */
  kinds?: string[];
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
        return 'Unknown error';
      }
    }
  }
  return String(err);
}

function normalizeKinds(body: BannerInquiryBody): string[] {
  if (Array.isArray(body.kinds) && body.kinds.length) return body.kinds;
  if (body.kind) return [body.kind];
  return [];
}

/** Optional Airtable mirror — only runs when env vars are set. */
async function mirrorToAirtable(body: BannerInquiryBody, kinds: string[]) {
  const apiKey = process.env.AIRTABLE_API_KEY;
  const baseId = process.env.AIRTABLE_BASE_ID;
  if (!apiKey || !baseId) return;

  const tableName =
    process.env.AIRTABLE_BANNER_TABLE ||
    process.env.AIRTABLE_BANNER_TABLE_ID ||
    'B2B Inquiries';

  const kindLabel = kinds.map((k) => KIND_LABELS[k] ?? k).join(', ');
  const record: Record<string, string> = {
    Kind: kindLabel,
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

  const mod = await import('airtable');
  const Airtable = mod.default;
  if (!Airtable) return;
  Airtable.configure({ apiKey });
  const base = Airtable.base(baseId);
  await base(tableName).create([{ fields: record }]);
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

    const kinds = normalizeKinds(body);

    // Primary write to Supabase.
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { error: insertError } = await supabase.from('banner_inquiries').insert({
      user_id: user?.id ?? null,
      kinds,
      company: body.company?.trim() || null,
      website: body.website?.trim() || null,
      budget: body.budget?.trim() || null,
      timeline: body.timeline?.trim() || null,
      message: body.message?.trim() || null,
      name: body.name?.trim() || null,
      email: body.email.trim().toLowerCase(),
      telegram: body.telegram?.trim() || null,
    });

    if (insertError) {
      console.error('Banner inquiry insert error:', insertError);
      return NextResponse.json(
        { error: 'Failed to save inquiry', details: insertError.message },
        { status: 500 },
      );
    }

    try {
      await mirrorToAirtable(body, kinds);
    } catch (err) {
      console.warn('Airtable mirror failed (non-fatal):', toErrorMessage(err));
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    const details = toErrorMessage(err);
    console.error('Banner inquiry route error:', details);
    return NextResponse.json(
      { error: 'Failed to submit inquiry', details },
      { status: 500 },
    );
  }
}
