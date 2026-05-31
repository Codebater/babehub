'use server';

import { revalidatePath } from 'next/cache';
import { requireOnboarded } from '@/lib/auth/guards';
import { getLimits } from '@/lib/limits';
import { createAdminClient } from '@/lib/supabase/admin';

/** Max videos a user may have queued for review at once. */
const MAX_PENDING = 3;

export type SubmitVideoResult =
  | { ok: true; id: string }
  | { ok: false; error: string };

/**
 * Record a video submission after the client has uploaded the file to
 * the `posts` storage bucket. Enforces per-user limits, inserts a
 * pending row, and notifies the user in their BabeHub chat.
 *
 * Limits:
 *   - at most MAX_PENDING videos awaiting review
 *   - approved videos count toward the user's video cap
 *     (2 free / 10 elevated — see lib/limits)
 */
export async function submitVideo(
  storagePath: string,
  title: string,
  meta: { mimeType?: string; byteSize?: number } = {},
): Promise<SubmitVideoResult> {
  const { user, profile } = await requireOnboarded();

  const cleanTitle = title.trim().slice(0, 140);
  if (cleanTitle.length < 1) return { ok: false, error: 'Please give your video a title.' };
  if (!storagePath || !storagePath.startsWith(`${user.id}/`)) {
    return { ok: false, error: 'Upload failed — please try again.' };
  }

  const db = createAdminClient() as any;

  // Count this user's pending + approved submissions
  const { data: rows } = await db
    .from('video_submissions')
    .select('status')
    .eq('user_id', user.id);

  const pending = (rows ?? []).filter((r: any) => r.status === 'pending').length;
  const approved = (rows ?? []).filter((r: any) => r.status === 'approved').length;

  if (pending >= MAX_PENDING) {
    return {
      ok: false,
      error: `You already have ${MAX_PENDING} videos awaiting review. Please wait for those to be processed before uploading more.`,
    };
  }

  const maxApproved = getLimits(profile).videos;
  if (approved >= maxApproved) {
    return {
      ok: false,
      error: `You've reached your limit of ${maxApproved} published videos. Get BabeHub Verified or go Premium to upload more.`,
    };
  }

  const { data: inserted, error } = await db
    .from('video_submissions')
    .insert({
      user_id: user.id,
      title: cleanTitle,
      storage_bucket: 'posts',
      storage_path: storagePath,
      mime_type: meta.mimeType ?? null,
      byte_size: meta.byteSize ?? null,
      status: 'pending',
    })
    .select('id')
    .single();

  if (error) return { ok: false, error: error.message };

  // Notify the user in their chat thread
  const { notifyUserInChat, ChatMessages } = await import('@/lib/chat/notify');
  await notifyUserInChat(user.id, ChatMessages.videoSubmitted(cleanTitle));

  revalidatePath('/app/upload');
  revalidatePath('/app/admin/videos');
  return { ok: true, id: inserted.id };
}

/** Delete one of the user's own pending submissions (cancel before review). */
export async function cancelSubmission(id: string): Promise<{ ok: boolean; error?: string }> {
  const { user } = await requireOnboarded();
  const db = createAdminClient() as any;

  // Load to verify ownership + grab storage path for cleanup
  const { data: row } = await db
    .from('video_submissions')
    .select('id, user_id, status, storage_bucket, storage_path')
    .eq('id', id)
    .maybeSingle();

  if (!row || row.user_id !== user.id) return { ok: false, error: 'Not found.' };
  if (row.status !== 'pending') return { ok: false, error: 'Only pending videos can be cancelled.' };

  // Best-effort storage cleanup, then delete the row
  await db.storage.from(row.storage_bucket).remove([row.storage_path]);
  await db.from('video_submissions').delete().eq('id', id);

  revalidatePath('/app/upload');
  revalidatePath('/app/admin/videos');
  return { ok: true };
}
