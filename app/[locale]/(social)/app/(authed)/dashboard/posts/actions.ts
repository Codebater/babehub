'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireCreator } from '@/lib/auth/guards';
import { getLimits, loadUsage } from '@/lib/limits';

export type PostState = {
  ok?: boolean;
  error?: string;
  values?: { body?: string; tier_required_id?: string };
};

export async function createPost(_prev: PostState, formData: FormData): Promise<PostState> {
  const body = String(formData.get('body') ?? '').trim();
  const tierRaw = String(formData.get('tier_required_id') ?? '').trim();
  const action = String(formData.get('action') ?? 'draft');

  // Collect attached media ids. The composer adds them as `<input type="hidden"
  // name="media_ids" value={id} />` per attachment — formData.getAll bundles
  // them back into an array.
  const mediaIds = formData
    .getAll('media_ids')
    .map((v) => String(v))
    .filter((v) => v.length > 0);

  const values = { body, tier_required_id: tierRaw };

  if (body.length < 1 || body.length > 5000) {
    return { error: 'Post body must be 1-5000 characters.', values };
  }
  if (mediaIds.length > 10) {
    return { error: 'You can attach at most 10 images per post.', values };
  }

  const { user, profile, supabase } = await requireCreator();

  // ── Quota enforcement ──────────────────────────────────────────
  // Caps are: 2/5/5/2 free, 10/25/25/10 elevated (verified / premium /
  // admin). We count current usage server-side rather than trusting
  // the client. Pictures + videos count the user's existing `media`
  // rows; the about-to-be-published post just adds 1 to either
  // publicPosts or privatePosts depending on `tier_required_id`.
  //
  // Adding a media-bearing post pulls media that's already in the
  // `media` table — the upload already happened before this action
  // ran. So we don't need to pre-count attached media against caps
  // again; whoever uploaded them was rate-limited at upload time. We
  // only enforce the post-level caps here.
  const limits = getLimits(profile);
  const usage = await loadUsage(supabase, user.id);
  if (tierRaw && tierRaw !== 'public') {
    if (usage.privatePosts >= limits.privatePosts) {
      return {
        error: `Private-post cap reached (${limits.privatePosts}). Apply BabeHub or upgrade to Premium for more.`,
        values,
      };
    }
  } else if (usage.publicPosts >= limits.publicPosts) {
    return {
      error: `Public-post cap reached (${limits.publicPosts}). Apply BabeHub or upgrade to Premium for more.`,
      values,
    };
  }

  // Tier ownership check.
  let tier_required_id: string | null = null;
  if (tierRaw && tierRaw !== 'public') {
    const { data: tier } = await supabase
      .from('subscription_tiers')
      .select('id')
      .eq('id', tierRaw)
      .eq('creator_id', user.id)
      .maybeSingle();
    if (!tier) return { error: 'That tier no longer exists or is not yours.', values };
    tier_required_id = tier.id;
  }

  // Media ownership check + kind lookup in a single round trip. RLS already
  // prevents writing other users' media into the array indirectly, but a
  // server-side guard catches malformed/stale ids early. We also need the
  // `kind` column from each row so we can set `posts.kind` correctly below.
  let mediaKinds: ('image' | 'video')[] = [];
  if (mediaIds.length > 0) {
    const { data: ownedMedia } = await supabase
      .from('media')
      .select('id, kind')
      .eq('owner_id', user.id)
      .in('id', mediaIds);
    const owned = new Map((ownedMedia ?? []).map((m) => [m.id, m.kind]));
    const orphan = mediaIds.find((id) => !owned.has(id));
    if (orphan) {
      return { error: 'One of the attached files is no longer available.', values };
    }
    mediaKinds = mediaIds.map((id) => owned.get(id) as 'image' | 'video');
  }

  const publishNow = action === 'publish';

  // Pick `posts.kind` based on what's attached. Logic:
  //   - no media          → 'text'
  //   - any video         → 'video'   (video posts get the centerpiece
  //                                    treatment on /explore)
  //   - 1 image only      → 'image'
  //   - 2+ images         → 'gallery'
  const hasVideo = mediaKinds.includes('video');
  const kind: 'text' | 'image' | 'video' | 'gallery' =
    mediaIds.length === 0
      ? 'text'
      : hasVideo
        ? 'video'
        : mediaIds.length === 1
          ? 'image'
          : 'gallery';

  const { error } = await supabase.from('posts').insert({
    creator_id: user.id,
    kind,
    body,
    media_ids: mediaIds,
    tier_required_id,
    published_at: publishNow ? new Date().toISOString() : null,
  });

  if (error) {
    return { error: error.message, values };
  }

  revalidatePath('/app/dashboard/posts');
  if (publishNow) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('handle')
      .eq('id', user.id)
      .single();
    if (profile?.handle) revalidatePath(`/c/${profile.handle}`);
    // A free video post should appear in the Featured creators row on
    // /explore immediately — bust the cache here instead of waiting for
    // the natural revalidate TTL.
    if (kind === 'video' && tier_required_id === null) {
      revalidatePath('/explore');
    }
  }

  redirect('/app/dashboard/posts');
}

export async function publishDraft(postId: string): Promise<void> {
  const { user, supabase } = await requireCreator();
  await supabase
    .from('posts')
    .update({ published_at: new Date().toISOString() })
    .eq('id', postId)
    .eq('creator_id', user.id)
    .is('published_at', null);

  const { data: profile } = await supabase
    .from('profiles')
    .select('handle')
    .eq('id', user.id)
    .single();
  revalidatePath('/app/dashboard/posts');
  if (profile?.handle) revalidatePath(`/c/${profile.handle}`);
}

export async function deletePost(postId: string): Promise<void> {
  const { user, supabase } = await requireCreator();
  await supabase.from('posts').delete().eq('id', postId).eq('creator_id', user.id);
  const { data: profile } = await supabase
    .from('profiles')
    .select('handle')
    .eq('id', user.id)
    .single();
  revalidatePath('/app/dashboard/posts');
  if (profile?.handle) revalidatePath(`/c/${profile.handle}`);
  redirect('/app/dashboard/posts');
}

/**
 * Delete a media row + the corresponding object in storage. Called from
 * the post composer when the creator removes an attachment before
 * publishing. RLS on `media` already restricts deletes to the owner — the
 * `.eq('owner_id')` is defense in depth.
 *
 * Note: this doesn't detach the media from any posts that reference it.
 * The composer never publishes the post until after the user confirms
 * the attachment list, so dangling media_ids in posts shouldn't happen.
 */
export async function deleteMedia(mediaId: string): Promise<{ ok?: boolean; error?: string }> {
  const { user, supabase } = await requireCreator();

  const { data: media } = await supabase
    .from('media')
    .select('storage_bucket, storage_path')
    .eq('id', mediaId)
    .eq('owner_id', user.id)
    .maybeSingle();

  if (!media) return { error: 'Media not found.' };

  const { error: storageError } = await supabase.storage
    .from(media.storage_bucket)
    .remove([media.storage_path]);
  if (storageError) return { error: storageError.message };

  const { error: rowError } = await supabase
    .from('media')
    .delete()
    .eq('id', mediaId)
    .eq('owner_id', user.id);
  if (rowError) return { error: rowError.message };

  return { ok: true };
}
