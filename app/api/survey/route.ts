import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

/**
 * Apply BabeHub survey submission endpoint.
 *
 * Primary path: writes to `public.survey_submissions` (Supabase). The
 * admin /app/admin/applications page reads from this table. A
 * post-insert trigger flips `profiles.applied_babehub = true` on any
 * matching email so the user-management table reflects who applied
 * without manual flagging.
 *
 * Fallback path: if `AIRTABLE_API_KEY` is set, also writes to the
 * existing Airtable base. Lets the team run both during the migration
 * window, then drop Airtable env vars to disable.
 *
 * Anonymous-friendly: only `email` is required. Name + social handle
 * are optional (the modal already nudges "leave blank to stay
 * anonymous"). user_id is captured when the submitter is signed in.
 */
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type SurveyFormBody = {
  name?: string;
  email?: string;
  whatsapp?: string;
  telegram?: string;
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
  /** Honeypot — must be absent/empty. Bots that auto-fill forms set this. */
  _trap?: string;
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

/** Translate the modal's 'yes'/'no' strings to nullable booleans for the DB. */
function ynToBool(v: string | undefined): boolean | null {
  if (v === 'yes') return true;
  if (v === 'no') return false;
  return null;
}

/** Optional Airtable mirror — only runs when env vars are set. */
async function mirrorToAirtable(body: SurveyFormBody) {
  const apiKey = process.env.AIRTABLE_API_KEY;
  const baseId = process.env.AIRTABLE_BASE_ID;
  if (!apiKey || !baseId) return; // Airtable disabled — Supabase is primary.

  const tableName =
    process.env.AIRTABLE_TABLE_ID ||
    process.env.AIRTABLE_TABLE_NAME ||
    'Survey Submissions';

  const record: Record<string, string | boolean> = {
    Name: body.name ?? '',
    Email: body.email ?? '',
    Country: body.country?.trim() ?? '',
    'Over 18': body.isOver18 === 'yes',
    'Active Creator': body.isActiveCreator === 'yes',
    'Generating Revenue': body.isGeneratingRevenue === 'yes',
    'Social Platform': body.socialPlatform ?? '',
    'Social Handle': body.socialHandle ?? '',
    'Content Type': body.contentType ?? '',
    'Interested in Campaigns': Boolean(body.interestedInCampaigns),
    'Agrees to Profit Share': Boolean(body.agreesToProfitShare),
  };
  if (process.env.AIRTABLE_OMIT_SUBMISSION_DATE !== '1') {
    record['Submission Date'] = new Date().toISOString();
  }
  if (body.whatsapp?.trim()) record['WhatsApp'] = body.whatsapp.trim();
  if (body.goals?.trim()) record['Goals'] = body.goals.trim();
  if (body.isGeneratingRevenue === 'yes' && body.monthlyEarnings) {
    record['Monthly Earnings'] = body.monthlyEarnings;
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
    const body = (await request.json().catch(() => ({}))) as SurveyFormBody;

    // ── Anti-spam: honeypot ─────────────────────────────────────────
    // If the hidden `_trap` field is non-empty, this is a bot. Silently
    // succeed so bots don't know they were caught.
    if (body._trap) {
      return NextResponse.json({ success: true });
    }

    // At least one contact method is required: email, WhatsApp, or Telegram.
    const hasContact =
      body.email?.trim() ||
      body.whatsapp?.trim() ||
      body.telegram?.trim();
    if (!hasContact) {
      return NextResponse.json(
        { error: 'Bad Request', details: 'Please provide at least one contact method (WhatsApp, Telegram, or email).' },
        { status: 400 },
      );
    }

    // ── Anti-spam: rate limit — 3 submissions per email per day ──────
    // Uses the admin client (bypasses RLS) so we can count all rows for
    // this email regardless of who submitted them.
    try {
      const adminClient = createAdminClient();
      const dayStart = new Date();
      dayStart.setUTCHours(0, 0, 0, 0);
      const { count: todayCount } = await adminClient
        .from('survey_submissions')
        .select('id', { count: 'exact', head: true })
        .eq('email', body.email.trim().toLowerCase())
        .gte('created_at', dayStart.toISOString());

      if ((todayCount ?? 0) >= 3) {
        return NextResponse.json(
          { error: 'Too many submissions. Please try again tomorrow.' },
          { status: 429 },
        );
      }
    } catch {
      // Rate-limit check is best-effort; don't block valid submissions
      // if the count query fails for any reason.
    }

    // Primary: insert into Supabase. Anyone can insert (RLS policy
    // allows it); signed-in submitters get linked via user_id so the
    // admin sees who's who. The post-insert trigger flips
    // profiles.applied_babehub for any matching email.
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { error: insertError } = await supabase.from('survey_submissions').insert({
      user_id: user?.id ?? null,
      name: body.name?.trim() ?? '',
      email: body.email.trim().toLowerCase(),
      whatsapp: body.whatsapp?.trim() || null,
      country: body.country?.trim() || null,
      is_over_18: ynToBool(body.isOver18),
      is_active_creator: ynToBool(body.isActiveCreator),
      is_generating_revenue: ynToBool(body.isGeneratingRevenue),
      monthly_earnings:
        body.isGeneratingRevenue === 'yes' ? body.monthlyEarnings || null : null,
      social_platform: body.socialPlatform?.trim() || null,
      social_handle: body.socialHandle?.trim() || null,
      content_type: body.contentType?.trim() || null,
      goals: body.goals?.trim() || null,
      interested_in_campaigns: Boolean(body.interestedInCampaigns),
      agrees_to_profit_share: Boolean(body.agreesToProfitShare),
    });

    if (insertError) {
      console.error('Survey insert error:', insertError);
      return NextResponse.json(
        { error: 'Failed to save submission', details: insertError.message },
        { status: 500 },
      );
    }

    // Notify the user in their admin chat thread (signed-in only).
    if (user?.id) {
      const { notifyUserInChat, ChatMessages } = await import('@/lib/chat/notify');
      await notifyUserInChat(user.id, ChatMessages.surveyReceived());
    }

    // Optional Airtable mirror — runs after the Supabase insert
    // succeeds. Wrapped in try/catch so an Airtable outage never
    // takes the form down.
    try {
      await mirrorToAirtable(body);
    } catch (err) {
      console.warn('Airtable mirror failed (non-fatal):', toErrorMessage(err));
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    const details = toErrorMessage(err);
    console.error('Survey route error:', details);
    return NextResponse.json(
      { error: 'Failed to submit survey', details },
      { status: 500 },
    );
  }
}
