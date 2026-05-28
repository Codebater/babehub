import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * POST /api/survey/delete
 *
 * GDPR/CCPA "delete my data" endpoint for the application survey.
 * Takes { email } in the JSON body and deletes every survey_submissions
 * row whose email matches. No auth required — anyone who knows the email
 * can delete it, which is intentional: the data belongs to the person
 * who submitted it and they're asking for it to be removed.
 *
 * Phase-2 hardening: double-opt-in confirmation email via Resend once
 * transactional email is set up.
 */
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type DeleteBody = { email?: string };

function isValidEmail(s: string): boolean {
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

    // Use the service-role-aware server client so the DELETE isn't
    // blocked by the admin-only RLS policy (the submitter themselves
    // is allowed to erase their own data even when not signed in).
    const supabase = await createClient();
    const { error, count } = await supabase
      .from('survey_submissions')
      .delete({ count: 'exact' })
      .eq('email', email);

    if (error) {
      console.error('[survey-delete] Supabase error:', error.message);
      return NextResponse.json(
        { error: 'Failed to delete application data', details: error.message },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true, deleted: count ?? 0 });
  } catch (err) {
    const details = toErrorMessage(err);
    console.error('[survey-delete] failed:', details);
    return NextResponse.json(
      { error: 'Failed to delete application data', details },
      { status: 500 },
    );
  }
}
