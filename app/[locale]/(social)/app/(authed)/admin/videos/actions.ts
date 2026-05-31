'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireOnboarded } from '@/lib/auth/guards';
import { createAdminClient } from '@/lib/supabase/admin';

export type ReviewResult = { ok: boolean; error?: string };

async function requireAdminUser() {
  const { user, profile } = await requireOnboarded();
  if (profile.role !== 'admin') redirect('/app/dashboard');
  return { user, profile };
}

/**
 * Approve a pending video submission.
 *
 * On approval we make the video live by creating the backing `media` row
 * and a published `posts` row for the uploader (promoting them to creator
 * if needed), then mark the submission approved and notify the user.
 */
export async function approveVideo(submissionId: string): Promise<ReviewResult> {
  const { user: admin } = await requireAdminUser();
  const db = createAdminClient() as any;

  const { data: sub } = await db
    .from('video_submissions')
    .select('id, user_id, title, storage_bucket, storage_path, mime_type, byte_size, status')
    .eq('id', submissionId)
    .maybeSingle();

  if (!sub) return { ok: false, error: 'Submission not found.' };
  if (sub.status !== 'pending') return { ok: false, error: 'Already reviewed.' };

  // Ensure the uploader is a creator so the post surfaces on their profile.
  const { data: uploader } = await db
    .from('profiles')
    .select('id, handle, role')
    .eq('id', sub.user_id)
    .maybeSingle();

  if (uploader && uploader.role !== 'creator' && uploader.role !== 'admin') {
    await db.from('profiles').update({ role: 'creator' }).eq('id', sub.user_id);
    await db.from('creator_settings').upsert({ creator_id: sub.user_id }, { onConflict: 'creator_id' });
  }

  // Create the media row that backs the video file.
  const { data: media, error: mediaErr } = await db
    .from('media')
    .insert({
      owner_id: sub.user_id,
      kind: 'video',
      storage_bucket: sub.storage_bucket,
      storage_path: sub.storage_path,
      mime_type: sub.mime_type,
      byte_size: sub.byte_size,
    })
    .select('id')
    .single();

  if (mediaErr) return { ok: false, error: `Media: ${mediaErr.message}` };

  // Publish a public video post.
  const { data: post, error: postErr } = await db
    .from('posts')
    .insert({
      creator_id: sub.user_id,
      kind: 'video',
      body: sub.title,
      media_ids: [media.id],
      published_at: new Date().toISOString(),
    })
    .select('id')
    .single();

  if (postErr) return { ok: false, error: `Post: ${postErr.message}` };

  // Mark the submission approved.
  await db
    .from('video_submissions')
    .update({
      status: 'approved',
      reviewed_at: new Date().toISOString(),
      reviewed_by: admin.id,
      published_post_id: post.id,
    })
    .eq('id', submissionId);

  // Notify the uploader.
  const { notifyUserInChat, ChatMessages } = await import('@/lib/chat/notify');
  await notifyUserInChat(sub.user_id, ChatMessages.videoApproved(sub.title));

  revalidatePath('/app/admin/videos');
  revalidatePath('/app/upload');
  revalidatePath('/explore');
  if (uploader?.handle) revalidatePath(`/c/${uploader.handle}`);
  return { ok: true };
}

/** Reject a pending video submission with an optional reason. */
export async function rejectVideo(
  submissionId: string,
  reason: string,
): Promise<ReviewResult> {
  const { user: admin } = await requireAdminUser();
  const db = createAdminClient() as any;

  const { data: sub } = await db
    .from('video_submissions')
    .select('id, user_id, title, storage_bucket, storage_path, status')
    .eq('id', submissionId)
    .maybeSingle();

  if (!sub) return { ok: false, error: 'Submission not found.' };
  if (sub.status !== 'pending') return { ok: false, error: 'Already reviewed.' };

  const cleanReason = reason.trim().slice(0, 280) || null;

  await db
    .from('video_submissions')
    .update({
      status: 'rejected',
      rejection_reason: cleanReason,
      reviewed_at: new Date().toISOString(),
      reviewed_by: admin.id,
    })
    .eq('id', submissionId);

  // Free the storage object — rejected files don't need to be retained.
  await db.storage.from(sub.storage_bucket).remove([sub.storage_path]);

  const { notifyUserInChat, ChatMessages } = await import('@/lib/chat/notify');
  await notifyUserInChat(sub.user_id, ChatMessages.videoRejected(sub.title, cleanReason ?? undefined));

  revalidatePath('/app/admin/videos');
  revalidatePath('/app/upload');
  return { ok: true };
}
