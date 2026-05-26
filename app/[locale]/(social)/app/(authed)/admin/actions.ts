'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireAdmin } from '@/lib/auth/guards';
import type { TablesUpdate } from '@/types/supabase';

/**
 * Server actions for the admin user-management table. All four flip a
 * single boolean column on `public.profiles` for the given user id.
 *
 * Auth: `requireAdmin()` redirects non-admins, so an unauthenticated
 * or merely-onboarded caller never gets past the guard.
 *
 * Writes are RLS-aware via the cookie client — the admin's own row
 * isn't special-cased, so an admin can verify themselves too (useful
 * for the first admin bootstrap).
 *
 * Each action revalidates `/app/admin/users` so the table reflects
 * the change instantly without a manual refresh.
 */
async function flipFlag(
  userId: string,
  column: 'is_verified' | 'is_frozen' | 'is_banned' | 'applied_babehub',
  value: boolean,
) {
  const { supabase } = await requireAdmin();
  // Touch verified_at alongside is_verified so the admin view can show
  // when verification was granted (and the queue can sort by it).
  const patch: TablesUpdate<'profiles'> = { [column]: value };
  if (column === 'is_verified') {
    patch.verified_at = value ? new Date().toISOString() : null;
  }
  await supabase.from('profiles').update(patch).eq('id', userId);
  revalidatePath('/app/admin/users');
}

export async function setUserVerified(userId: string, verified: boolean) {
  await flipFlag(userId, 'is_verified', verified);
}

export async function setUserFrozen(userId: string, frozen: boolean) {
  await flipFlag(userId, 'is_frozen', frozen);
}

export async function setUserBanned(userId: string, banned: boolean) {
  await flipFlag(userId, 'is_banned', banned);
}

export async function setUserApplied(userId: string, applied: boolean) {
  await flipFlag(userId, 'applied_babehub', applied);
}

/**
 * Grant or revoke platform Premium on a user.
 *
 * `durationDays > 0` → sets `is_premium=true` AND
 *   `premium_until = now() + durationDays`. The app-side `isElevated()`
 *   check compares `premium_until > now()` so the badge automatically
 *   falls off when the period expires (until a background cron flips
 *   `is_premium` back to false; not built yet — date check is enough).
 *
 * `durationDays = null` → revokes immediately by setting both fields
 *   to false / null.
 *
 * Admin-granted comp accounts can be created with a very large
 * duration (e.g. 365 * 100 days) — same effect as "forever" without
 * a separate code path.
 */
/**
 * Create or update an admin-authored blog post.
 *
 * Slug uniqueness is enforced by the DB index; if a row with the slug
 * already exists we UPDATE it (admin's edits override). Otherwise we
 * INSERT. The merged blog loader on /blog reads DB rows ahead of the
 * static registry, so an upsert with a matching slug will hide the
 * static version.
 */
export async function upsertBlogPost(formData: FormData) {
  const { supabase, user } = await requireAdmin();

  const slug = String(formData.get('slug') ?? '').trim().toLowerCase();
  const title = String(formData.get('title') ?? '').trim();
  const description = String(formData.get('description') ?? '').trim();
  const body = String(formData.get('body') ?? '').trim();
  const tagsRaw = String(formData.get('tags') ?? '').trim();
  const tags = tagsRaw
    ? tagsRaw.split(',').map((t) => t.trim()).filter(Boolean)
    : [];
  const author = String(formData.get('author') ?? 'BabeHub Team').trim() || 'BabeHub Team';
  const readingMinutes = Math.max(
    1,
    Math.round(Number(formData.get('reading_minutes') ?? 3)) || 3,
  );
  const publish = formData.get('publish') === '1';

  // Validation failures throw — the admin sees Next's error overlay
  // with the real reason. (Form-action handlers must return void, so
  // we can't pass a `{ ok, error }` shape back. If we ever want inline
  // error UI here, switch to useActionState + a wrapping client form.)
  if (!/^[a-z0-9-]{3,80}$/.test(slug)) {
    throw new Error('Slug must be 3-80 chars, lowercase, digits and dashes only.');
  }
  if (!title || !body) {
    throw new Error('Title and body are required.');
  }

  // Upsert by slug. `publish=1` flips published_at to now; "Save
  // draft" leaves it null so the row is invisible to /blog readers.
  const { error } = await supabase
    .from('blog_posts')
    .upsert(
      {
        slug,
        title,
        description,
        body,
        tags,
        author,
        reading_minutes: readingMinutes,
        author_id: user.id,
        published_at: publish ? new Date().toISOString() : null,
      },
      { onConflict: 'slug' },
    );

  if (error) throw new Error(`Blog upsert failed: ${error.message}`);

  revalidatePath('/blog');
  revalidatePath(`/blog/${slug}`);
  revalidatePath('/app/admin/blog');
  redirect('/app/admin/blog');
}

export async function deleteBlogPost(id: string) {
  const { supabase } = await requireAdmin();
  await supabase.from('blog_posts').delete().eq('id', id);
  revalidatePath('/blog');
  revalidatePath('/app/admin/blog');
}

export async function setUserPremium(
  userId: string,
  durationDays: number | null,
) {
  const { supabase } = await requireAdmin();
  let premium_until: string | null = null;
  let is_premium = false;
  if (durationDays && durationDays > 0) {
    is_premium = true;
    const d = new Date();
    d.setUTCDate(d.getUTCDate() + durationDays);
    premium_until = d.toISOString();
  }
  await supabase
    .from('profiles')
    .update({ is_premium, premium_until })
    .eq('id', userId);
  revalidatePath('/app/admin/users');
  revalidatePath('/app/admin');
  revalidatePath('/explore');
}

/**
 * Feature a job in the platform-wide top-6 promoted slots (calendar
 * amber dots + /blog featured row + /jobs board top section).
 *
 * `durationDays` becomes the `featured_until` timestamp; passing
 * `null` (or any non-positive number) unfeatures the job by writing
 * `featured_until = null`, dropping it back into the auto-pick pool
 * where it competes by budget like everyone else.
 *
 * Revalidates every surface that reads featured jobs so the UI
 * reflects the change instantly:
 *   - sidebar calendar (in the (social) layout)
 *   - /blog featured row
 *   - /jobs board top section
 *   - /app/admin/jobs (admin's own table)
 */
/**
 * Update the status of a survey submission (Apply BabeHub) or banner
 * inquiry (B2B). Same workflow vocabulary for both: new → reviewing →
 * contacted → accepted | rejected. Touches `reviewed_at` + `reviewed_by`
 * so the table can show "decided by @admin on Date".
 */
async function updateSubmissionStatus(
  table: 'survey_submissions' | 'banner_inquiries',
  id: string,
  status: 'new' | 'reviewing' | 'contacted' | 'accepted' | 'rejected',
) {
  const { supabase, user } = await requireAdmin();
  await supabase
    .from(table)
    .update({
      status,
      reviewed_at: new Date().toISOString(),
      reviewed_by: user.id,
    })
    .eq('id', id);
  revalidatePath('/app/admin/applications');
  revalidatePath('/app/admin/inquiries');
}

export async function setSurveyStatus(
  id: string,
  status: 'new' | 'reviewing' | 'contacted' | 'accepted' | 'rejected',
) {
  await updateSubmissionStatus('survey_submissions', id, status);
}

export async function setInquiryStatus(
  id: string,
  status: 'new' | 'reviewing' | 'contacted' | 'accepted' | 'rejected',
) {
  await updateSubmissionStatus('banner_inquiries', id, status);
}

/**
 * Delete a survey submission (Apply BabeHub) or banner inquiry (B2B)
 * row. RLS DELETE policy added in migration 0013 gates this to admins
 * server-side; the requireAdmin() guard above blocks non-admin callers
 * from even reaching the action.
 *
 * Idempotent: deleting a non-existent id is a silent no-op (no error
 * surface), so the UI doesn't have to special-case race conditions.
 */
async function deleteSubmission(
  table: 'survey_submissions' | 'banner_inquiries',
  id: string,
) {
  const { supabase } = await requireAdmin();
  await supabase.from(table).delete().eq('id', id);
  revalidatePath('/app/admin');
  revalidatePath('/app/admin/applications');
  revalidatePath('/app/admin/inquiries');
}

export async function deleteSurveySubmission(id: string) {
  await deleteSubmission('survey_submissions', id);
}

export async function deleteBannerInquiry(id: string) {
  await deleteSubmission('banner_inquiries', id);
}

export async function setJobFeatured(jobId: string, durationDays: number | null) {
  const { supabase } = await requireAdmin();
  let featuredUntil: string | null = null;
  if (durationDays && durationDays > 0) {
    const d = new Date();
    d.setUTCDate(d.getUTCDate() + durationDays);
    featuredUntil = d.toISOString();
  }
  await supabase.from('jobs').update({ featured_until: featuredUntil }).eq('id', jobId);
  // Invalidate every reader of the featured set. revalidatePath on the
  // root '/' isn't enough because of nested route groups; list each
  // segment that has its own SSR fetch.
  revalidatePath('/app/admin/jobs');
  revalidatePath('/jobs');
  revalidatePath('/blog');
  revalidatePath('/explore');
}

