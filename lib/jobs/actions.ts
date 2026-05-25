'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireOnboarded } from '@/lib/auth/guards';
import type { Database } from '@/types/supabase';

/**
 * Server actions for the jobs marketplace.
 *
 * MVP-1 lets any onboarded user post a job (the recruiter-mode toggle
 * is informational only). Token cost is stored on the row but spend
 * is a no-op until Sprint 3 wires `consume_tokens()`. Moderation
 * defaults to 'approved' so newly published jobs appear immediately;
 * Sprint 5 flips that to 'pending' once the admin queue exists.
 */

type LocationKind = Database['public']['Enums']['job_location_kind'];
type JobStatus = Database['public']['Enums']['job_status'];
type ApplicationStatus = Database['public']['Enums']['application_status'];

export type JobActionResult =
  | { ok: true; id: string }
  | { ok: false; error: string };

function csvToArray(raw: string, limit = 20): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const piece of raw.split(/[,\n]/)) {
    const v = piece.trim().toLowerCase();
    if (!v || seen.has(v)) continue;
    seen.add(v);
    out.push(v);
    if (out.length >= limit) break;
  }
  return out;
}

function parseCents(raw: string | null): number | null {
  if (!raw) return null;
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 0) return null;
  return Math.round(n);
}

/**
 * Create a job in 'draft' state OR create+publish in one shot if the
 * form submitted with publish=1. Returns the new row id so the
 * composer can redirect to the recruiter dashboard.
 */
export async function createJob(formData: FormData): Promise<JobActionResult> {
  const { user, supabase } = await requireOnboarded();

  const title = ((formData.get('title') as string) || '').trim().slice(0, 200);
  if (!title) return { ok: false, error: 'Title is required.' };

  const wantsPublish = formData.get('publish') === '1';
  const locationKindRaw = (formData.get('location_kind') as string) || 'remote';
  const locationKind: LocationKind =
    locationKindRaw === 'remote' ||
    locationKindRaw === 'onsite' ||
    locationKindRaw === 'hybrid'
      ? locationKindRaw
      : 'remote';

  const visibilityRaw = (formData.get('visibility') as string) || 'public';
  const visibility =
    visibilityRaw === 'public' ||
    visibilityRaw === 'verified_only' ||
    visibilityRaw === 'invite'
      ? visibilityRaw
      : 'public';

  const insertRow = {
    poster_id: user.id,
    title,
    description: ((formData.get('description') as string) || '').trim().slice(0, 5000),
    budget_min_cents: parseCents((formData.get('budget_min_cents') as string) ?? null),
    budget_max_cents: parseCents((formData.get('budget_max_cents') as string) ?? null),
    currency: ((formData.get('currency') as string) || 'USD')
      .toUpperCase()
      .slice(0, 3),
    location_kind: locationKind,
    location_text: ((formData.get('location_text') as string) || '').trim() || null,
    tags: csvToArray((formData.get('tags') as string) || '', 12),
    categories: csvToArray((formData.get('categories') as string) || '', 8),
    requires_verification: formData.get('requires_verification') === '1',
    visibility,
    token_cost: Math.max(0, Math.round(Number(formData.get('token_cost') ?? 0)) || 0),
    status: (wantsPublish ? 'published' : 'draft') as JobStatus,
    published_at: wantsPublish ? new Date().toISOString() : null,
  };

  const { data, error } = await supabase
    .from('jobs')
    .insert(insertRow)
    .select('id')
    .single();
  if (error || !data) return { ok: false, error: error?.message ?? 'Insert failed.' };

  revalidatePath('/jobs');
  revalidatePath('/app/recruiter/dashboard');
  return { ok: true, id: data.id };
}

/**
 * Server action invoked by the composer's submit button. Redirects
 * to the recruiter dashboard on success.
 */
export async function createJobAndRedirect(formData: FormData): Promise<void> {
  const res = await createJob(formData);
  if (!res.ok) {
    // Bubble up via redirect-with-query so the composer can surface it.
    redirect(`/app/recruiter/jobs/new?error=${encodeURIComponent(res.error)}`);
  }
  redirect(`/app/recruiter/jobs/${res.id}/applications`);
}

/** Flip a job between draft / published / paused / closed. */
export async function setJobStatus(
  jobId: string,
  status: JobStatus,
): Promise<JobActionResult> {
  const { user, supabase } = await requireOnboarded();
  const patch: { status: JobStatus; published_at?: string } = { status };
  if (status === 'published') patch.published_at = new Date().toISOString();

  const { error } = await supabase
    .from('jobs')
    .update(patch)
    .eq('id', jobId)
    .eq('poster_id', user.id); // defense-in-depth even with RLS

  if (error) return { ok: false, error: error.message };
  revalidatePath('/jobs');
  revalidatePath(`/jobs/${jobId}`);
  revalidatePath('/app/recruiter/dashboard');
  return { ok: true, id: jobId };
}

/**
 * Recruiter moves an application along the funnel:
 * pending → viewed → shortlisted → accepted/rejected.
 * Applicants withdraw via setApplicationStatus(..., 'withdrawn').
 *
 * RLS permits either party to update; we add a defensive check here
 * so applicants can ONLY withdraw and posters can never set 'withdrawn'.
 */
export async function setApplicationStatus(
  applicationId: string,
  status: ApplicationStatus,
): Promise<JobActionResult> {
  const { user, supabase } = await requireOnboarded();

  const { data: application, error: loadErr } = await supabase
    .from('job_applications')
    .select('id, applicant_id, job_id, jobs:jobs(poster_id)')
    .eq('id', applicationId)
    .maybeSingle();
  if (loadErr || !application) {
    return { ok: false, error: loadErr?.message ?? 'Not found.' };
  }

  const posterId = Array.isArray(application.jobs)
    ? application.jobs[0]?.poster_id
    : (application.jobs as { poster_id: string } | null)?.poster_id;
  const isApplicant = user.id === application.applicant_id;
  const isPoster = user.id === posterId;

  if (status === 'withdrawn' && !isApplicant) {
    return { ok: false, error: 'Only the applicant can withdraw.' };
  }
  if (
    (status === 'viewed' || status === 'shortlisted' || status === 'accepted' || status === 'rejected') &&
    !isPoster
  ) {
    return { ok: false, error: 'Only the recruiter can decide.' };
  }

  const patch: {
    status: ApplicationStatus;
    viewed_at?: string;
    decided_at?: string;
  } = { status };
  if (status === 'viewed') patch.viewed_at = new Date().toISOString();
  if (status === 'accepted' || status === 'rejected') patch.decided_at = new Date().toISOString();

  const { error } = await supabase
    .from('job_applications')
    .update(patch)
    .eq('id', applicationId);
  if (error) return { ok: false, error: error.message };

  revalidatePath(`/app/recruiter/jobs/${application.job_id}/applications`);
  revalidatePath('/app/creator/applications');
  return { ok: true, id: applicationId };
}

/** Submit a new application. The applicant must be onboarded. */
export async function applyToJob(formData: FormData): Promise<JobActionResult> {
  const { user, supabase } = await requireOnboarded();

  const jobId = (formData.get('job_id') as string) || '';
  if (!jobId) return { ok: false, error: 'Missing job id.' };

  const introMessage = ((formData.get('intro_message') as string) || '')
    .trim()
    .slice(0, 2000);

  // Phase 2 polish (Sprint 4): handle intro_media_ids upload here.
  const { data, error } = await supabase
    .from('job_applications')
    .insert({
      job_id: jobId,
      applicant_id: user.id,
      intro_message: introMessage,
    })
    .select('id')
    .single();

  if (error) {
    if (error.code === '23505') {
      // unique (job_id, applicant_id) — friendly message
      return { ok: false, error: 'You already applied to this job.' };
    }
    return { ok: false, error: error.message };
  }

  revalidatePath(`/jobs/${jobId}`);
  revalidatePath('/app/creator/applications');
  return { ok: true, id: data.id };
}
