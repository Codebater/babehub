'use server';

import { createClient } from '@/lib/supabase/server';
import { getSignedMediaUrls } from '@/lib/storage/signedUrls';
import type { MediaItem } from '@/components/MediaTile';
import { PAGE_SIZE, type FeedPage, type FeedPost } from './types';

/**
 * Loads one page of public-feed posts, joined to their creator + signed
 * media URLs. Used by both the initial server render in /explore/page.tsx
 * and the "Load more" Server Action below.
 */
export async function loadFeedPage(offset: number): Promise<FeedPage> {
  const supabase = await createClient();

  // Pull one row extra to determine whether there's a next page without
  // doing a separate COUNT(*) (which can be slow as the table grows).
  const { data: rows } = await supabase
    .from('posts')
    .select(
      'id, body, kind, media_ids, tier_required_id, published_at, creator:profiles!posts_creator_id_fkey(handle, display_name, avatar_url, is_verified)',
    )
    .not('published_at', 'is', null)
    .is('tier_required_id', null) // public-feed: free posts only
    .order('published_at', { ascending: false })
    .range(offset, offset + PAGE_SIZE);

  const all = rows ?? [];
  const hasMore = all.length > PAGE_SIZE;
  const pageRows = hasMore ? all.slice(0, PAGE_SIZE) : all;

  // Batch-mint signed URLs for every referenced media id across the page.
  const allMediaIds = pageRows.flatMap((r) => r.media_ids ?? []);
  const urlMap = await getSignedMediaUrls(allMediaIds);

  const posts: FeedPost[] = pageRows.map((r) => {
    const creator = Array.isArray(r.creator) ? r.creator[0] : r.creator;
    const mediaItems: MediaItem[] = (r.media_ids ?? [])
      .map((id) => urlMap.get(id))
      .filter((m): m is { url: string; kind: 'image' | 'video' } => Boolean(m));
    return {
      id: r.id,
      body: r.body,
      kind: r.kind as FeedPost['kind'],
      media_ids: r.media_ids ?? [],
      tier_required_id: r.tier_required_id,
      published_at: r.published_at,
      creator: creator ?? { handle: '', display_name: '', avatar_url: null, is_verified: false },
      mediaItems,
    };
  });

  return { posts, hasMore };
}

/**
 * Server Action invoked by <LoadMoreButton /> when the user clicks to
 * fetch the next batch.
 */
export async function loadMoreFeed(offset: number): Promise<FeedPage> {
  return loadFeedPage(offset);
}
