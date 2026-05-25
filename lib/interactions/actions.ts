'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import type { ContentMeta, ContentProvider } from './types';

/**
 * Server actions for video interactions. All require an authenticated
 * caller; returning `{ ok: false, reason }` for anon users lets the
 * client-side UI show a "Sign in to react" CTA without crashing.
 */

type Result<T = unknown> =
  | { ok: true; data: T }
  | { ok: false; reason: 'unauthenticated' | 'invalid' | 'db_error'; message?: string };

async function getUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

/**
 * Toggle the current user's like on a video. Returns the new state
 * + new total count (UI uses both to reconcile after optimistic update).
 *
 * Idempotent: if the row already exists the insert is a no-op (returns
 * isLiked=true); if it doesn't the delete is a no-op (returns
 * isLiked=false). The action's own `mode` parameter dictates direction
 * to avoid a race where a slow click toggles twice.
 */
export async function toggleLike(
  provider: ContentProvider,
  contentId: string,
  desired: 'like' | 'unlike',
): Promise<Result<{ isLiked: boolean; likeCount: number }>> {
  const { supabase, user } = await getUser();
  if (!user) return { ok: false, reason: 'unauthenticated' };

  if (desired === 'like') {
    const { error } = await supabase
      .from('video_likes')
      .upsert(
        { provider, content_id: contentId, user_id: user.id },
        { onConflict: 'user_id,provider,content_id', ignoreDuplicates: true },
      );
    if (error) return { ok: false, reason: 'db_error', message: error.message };
  } else {
    const { error } = await supabase
      .from('video_likes')
      .delete()
      .eq('provider', provider)
      .eq('content_id', contentId)
      .eq('user_id', user.id);
    if (error) return { ok: false, reason: 'db_error', message: error.message };
  }

  const { count } = await supabase
    .from('video_likes')
    .select('user_id', { count: 'exact', head: true })
    .eq('provider', provider)
    .eq('content_id', contentId);

  return {
    ok: true,
    data: { isLiked: desired === 'like', likeCount: count ?? 0 },
  };
}

/**
 * Toggle the current user's favorite. Caches title + thumb + (for
 * eporner) embed/source URLs so the /favorites page can render
 * without re-fetching the source.
 */
export async function toggleFavorite(
  provider: ContentProvider,
  contentId: string,
  desired: 'add' | 'remove',
  meta: ContentMeta = {},
): Promise<Result<{ isFavorited: boolean }>> {
  const { supabase, user } = await getUser();
  if (!user) return { ok: false, reason: 'unauthenticated' };

  if (desired === 'add') {
    const { error } = await supabase.from('video_favorites').upsert(
      {
        provider,
        content_id: contentId,
        user_id: user.id,
        title: meta.title ?? null,
        thumb_url: meta.thumbUrl ?? null,
        embed_url: meta.embedUrl ?? null,
        source_url: meta.sourceUrl ?? null,
      },
      { onConflict: 'user_id,provider,content_id' },
    );
    if (error) return { ok: false, reason: 'db_error', message: error.message };
  } else {
    const { error } = await supabase
      .from('video_favorites')
      .delete()
      .eq('provider', provider)
      .eq('content_id', contentId)
      .eq('user_id', user.id);
    if (error) return { ok: false, reason: 'db_error', message: error.message };
  }

  revalidatePath('/favorites');
  return { ok: true, data: { isFavorited: desired === 'add' } };
}

/**
 * Post a comment. Returns the inserted row so the client can append it
 * to the rendered thread without a re-fetch.
 */
export async function postComment(
  provider: ContentProvider,
  contentId: string,
  body: string,
): Promise<
  Result<{
    id: string;
    body: string;
    created_at: string;
    user_id: string;
    author: { handle: string; display_name: string; avatar_url: string | null };
  }>
> {
  const { supabase, user } = await getUser();
  if (!user) return { ok: false, reason: 'unauthenticated' };

  const trimmed = body.trim();
  if (trimmed.length < 1 || trimmed.length > 2000) {
    return { ok: false, reason: 'invalid', message: 'Comment must be 1–2000 characters.' };
  }

  const { data: inserted, error } = await supabase
    .from('video_comments')
    .insert({
      provider,
      content_id: contentId,
      user_id: user.id,
      body: trimmed,
    })
    .select('id, body, created_at, user_id')
    .single();

  if (error || !inserted) {
    return { ok: false, reason: 'db_error', message: error?.message ?? 'insert failed' };
  }

  // Author info for the returned payload — let the UI render the new
  // comment without another round trip.
  const { data: profile } = await supabase
    .from('profiles')
    .select('handle, display_name, avatar_url')
    .eq('id', user.id)
    .single();

  return {
    ok: true,
    data: {
      id: inserted.id,
      body: inserted.body,
      created_at: inserted.created_at,
      user_id: inserted.user_id,
      author: profile ?? {
        handle: 'unknown',
        display_name: 'unknown',
        avatar_url: null,
      },
    },
  };
}

/**
 * Delete a comment. RLS already enforces owner-only delete, but we
 * pass user_id in the where clause too for defense-in-depth.
 */
export async function deleteComment(commentId: string): Promise<Result<{ id: string }>> {
  const { supabase, user } = await getUser();
  if (!user) return { ok: false, reason: 'unauthenticated' };

  const { error } = await supabase
    .from('video_comments')
    .delete()
    .eq('id', commentId)
    .eq('user_id', user.id);

  if (error) return { ok: false, reason: 'db_error', message: error.message };
  return { ok: true, data: { id: commentId } };
}
