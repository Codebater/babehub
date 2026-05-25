import { createClient } from '@/lib/supabase/server';
import { getSignedMediaUrls } from '@/lib/storage/signedUrls';
import type { CreatorFeedVideo } from './types';

/**
 * Featured creators row data — the last N free video posts from any
 * creator on the platform, with signed playback URLs minted via the
 * existing `getSignedMediaUrls` helper.
 *
 * The Supabase RLS policy on `posts` already restricts anonymous
 * viewers to public posts (tier_required_id IS NULL), so this query
 * is implicitly safe to run with the cookie-aware client. We still
 * filter `tier_required_id` explicitly for clarity + defense in depth.
 *
 * Posts with multiple media items pick the FIRST video in the array
 * as the headline — single-video posts are the common case for /explore
 * promotion, image galleries and mixed gallery posts get the first
 * video they contain (or are skipped if none).
 *
 * Returns up to `limit` cards, ordered by `published_at DESC`.
 */
export async function loadFeaturedCreatorVideos(
  limit = 10,
): Promise<CreatorFeedVideo[]> {
  const supabase = await createClient();

  // Pull a bit more than the limit so we have headroom to skip posts
  // whose first attached media isn't a video (e.g. mixed galleries).
  const oversample = limit * 2;

  const { data: rows } = await supabase
    .from('posts')
    .select(
      'id, body, media_ids, published_at, kind, creator:profiles!posts_creator_id_fkey(handle, display_name, avatar_url, is_verified)',
    )
    .not('published_at', 'is', null)
    .is('tier_required_id', null)
    .eq('kind', 'video')
    .order('published_at', { ascending: false })
    .limit(oversample);

  if (!rows || rows.length === 0) return [];

  // One batched signed-URL request for every referenced media id across
  // the candidates. The helper returns Map<id, { url, kind }> so we can
  // skip non-video media at zero extra cost.
  const allMediaIds = rows.flatMap((r) => r.media_ids ?? []);
  const urlMap = await getSignedMediaUrls(allMediaIds);

  const cards: CreatorFeedVideo[] = [];
  for (const row of rows) {
    if (cards.length >= limit) break;

    const firstVideoMediaId = (row.media_ids ?? []).find((id) => {
      const m = urlMap.get(id);
      return m?.kind === 'video';
    });
    if (!firstVideoMediaId) continue;

    const media = urlMap.get(firstVideoMediaId);
    if (!media) continue;

    const creator = Array.isArray(row.creator) ? row.creator[0] : row.creator;
    if (!creator) continue;

    cards.push({
      postId: row.id,
      body: row.body,
      publishedAt: row.published_at,
      videoUrl: media.url,
      posterUrl: null,
      creator: {
        handle: creator.handle,
        displayName: creator.display_name,
        avatarUrl: creator.avatar_url,
        isVerified: creator.is_verified,
      },
    });
  }

  return cards;
}
