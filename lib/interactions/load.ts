/**
 * Server-side loaders for video interaction state.
 *
 * Used by both server components (creator profile cards, /favorites page)
 * and the GET route handler that powers VideoModal's client-side fetch.
 */

import { createClient } from '@/lib/supabase/server';
import type { CommentRow, ContentProvider, InteractionSummary } from './types';

/**
 * Load like count + viewer-specific liked/favorited state + recent
 * comments for a single (provider, content_id). RLS is bypassed for
 * read-all tables (likes/comments are public); favorites are
 * automatically scoped to the current user via RLS so an anon caller
 * always gets isFavorited=false.
 *
 * `commentLimit` caps the initial comment payload (default 50).
 * Pagination can come later if any thread grows past that.
 */
export async function loadInteractionSummary(
  provider: ContentProvider,
  contentId: string,
  commentLimit = 50,
): Promise<InteractionSummary> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Parallel: like-count, viewer's own like, viewer's own favorite,
  // and the comment thread with author joins.
  const [likeCountRes, myLikeRes, myFavRes, commentsRes] = await Promise.all([
    supabase
      .from('video_likes')
      .select('user_id', { count: 'exact', head: true })
      .eq('provider', provider)
      .eq('content_id', contentId),
    user
      ? supabase
          .from('video_likes')
          .select('user_id')
          .eq('provider', provider)
          .eq('content_id', contentId)
          .eq('user_id', user.id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    user
      ? supabase
          .from('video_favorites')
          .select('user_id')
          .eq('provider', provider)
          .eq('content_id', contentId)
          .eq('user_id', user.id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    supabase
      .from('video_comments')
      .select('id, body, created_at, user_id')
      .eq('provider', provider)
      .eq('content_id', contentId)
      .order('created_at', { ascending: false })
      .limit(commentLimit),
  ]);

  // Author embed isn't available via PostgREST because video_comments.user_id
  // FK targets auth.users, not profiles. profiles.id == auth.users.id by
  // design, so we resolve handles in a second batched query.
  const rawComments = commentsRes.data ?? [];
  const userIds = Array.from(new Set(rawComments.map((c) => c.user_id)));
  const profileMap = new Map<
    string,
    { handle: string; display_name: string; avatar_url: string | null }
  >();
  if (userIds.length > 0) {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, handle, display_name, avatar_url')
      .in('id', userIds);
    for (const p of profiles ?? []) {
      profileMap.set(p.id, {
        handle: p.handle,
        display_name: p.display_name,
        avatar_url: p.avatar_url,
      });
    }
  }

  const comments: CommentRow[] = rawComments.map((row) => ({
    id: row.id,
    body: row.body,
    created_at: row.created_at,
    user_id: row.user_id,
    author: profileMap.get(row.user_id) ?? null,
  }));

  return {
    likeCount: likeCountRes.count ?? 0,
    isLiked: Boolean(myLikeRes.data),
    isFavorited: Boolean(myFavRes.data),
    commentCount: comments.length,
    comments,
  };
}

/**
 * Batched: returns full InteractionSummary (likes + favorites +
 * comments + viewer state) per content_id in one set of queries.
 *
 * Used on the creator profile page where every post wants its full
 * social block inline. 4 round-trips total regardless of N posts:
 *   - all likes on these items
 *   - all favorites the viewer has on these items
 *   - all comments on these items (capped per-item via commentLimit)
 *   - all comment authors' profiles
 */
export async function loadFullInteractionsBatch(
  provider: ContentProvider,
  contentIds: string[],
  commentLimit = 20,
): Promise<Map<string, InteractionSummary>> {
  const map = new Map<string, InteractionSummary>();
  if (contentIds.length === 0) return map;
  for (const id of contentIds) {
    map.set(id, {
      likeCount: 0,
      isLiked: false,
      isFavorited: false,
      commentCount: 0,
      comments: [],
    });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [likesRes, favsRes, commentsRes] = await Promise.all([
    supabase
      .from('video_likes')
      .select('content_id, user_id')
      .eq('provider', provider)
      .in('content_id', contentIds),
    user
      ? supabase
          .from('video_favorites')
          .select('content_id')
          .eq('provider', provider)
          .eq('user_id', user.id)
          .in('content_id', contentIds)
      : Promise.resolve({ data: null as { content_id: string }[] | null }),
    supabase
      .from('video_comments')
      .select('id, body, created_at, user_id, content_id')
      .eq('provider', provider)
      .in('content_id', contentIds)
      .order('created_at', { ascending: false }),
  ]);

  for (const row of likesRes.data ?? []) {
    const bucket = map.get(row.content_id);
    if (!bucket) continue;
    bucket.likeCount += 1;
    if (user && row.user_id === user.id) bucket.isLiked = true;
  }
  for (const row of favsRes.data ?? []) {
    const bucket = map.get(row.content_id);
    if (bucket) bucket.isFavorited = true;
  }

  const rawComments = commentsRes.data ?? [];
  const commentUserIds = Array.from(new Set(rawComments.map((c) => c.user_id)));
  const profileMap = new Map<
    string,
    { handle: string; display_name: string; avatar_url: string | null }
  >();
  if (commentUserIds.length > 0) {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, handle, display_name, avatar_url')
      .in('id', commentUserIds);
    for (const p of profiles ?? []) {
      profileMap.set(p.id, {
        handle: p.handle,
        display_name: p.display_name,
        avatar_url: p.avatar_url,
      });
    }
  }

  // Group + cap comments per content_id (commentsRes is already
  // ordered desc by created_at globally).
  for (const row of rawComments) {
    const bucket = map.get(row.content_id);
    if (!bucket) continue;
    bucket.commentCount += 1;
    if (bucket.comments.length < commentLimit) {
      bucket.comments.push({
        id: row.id,
        body: row.body,
        created_at: row.created_at,
        user_id: row.user_id,
        author: profileMap.get(row.user_id) ?? null,
      });
    }
  }

  return map;
}

/**
 * Lightweight batched version: counts + viewer's own state only, no
 * comments. Use on feed surfaces where comments are reached via a
 * modal (e.g. /explore featured row).
 */
export async function loadInteractionsBatch(
  provider: ContentProvider,
  contentIds: string[],
): Promise<Map<string, { likeCount: number; isLiked: boolean; isFavorited: boolean }>> {
  const map = new Map<
    string,
    { likeCount: number; isLiked: boolean; isFavorited: boolean }
  >();
  if (contentIds.length === 0) return map;
  for (const id of contentIds) {
    map.set(id, { likeCount: 0, isLiked: false, isFavorited: false });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // All likes on these items (read-all RLS so this works for anon).
  const { data: likes } = await supabase
    .from('video_likes')
    .select('content_id, user_id')
    .eq('provider', provider)
    .in('content_id', contentIds);

  for (const row of likes ?? []) {
    const bucket = map.get(row.content_id);
    if (bucket) {
      bucket.likeCount += 1;
      if (user && row.user_id === user.id) bucket.isLiked = true;
    }
  }

  if (user) {
    const { data: favs } = await supabase
      .from('video_favorites')
      .select('content_id')
      .eq('provider', provider)
      .eq('user_id', user.id)
      .in('content_id', contentIds);
    for (const row of favs ?? []) {
      const bucket = map.get(row.content_id);
      if (bucket) bucket.isFavorited = true;
    }
  }

  return map;
}
