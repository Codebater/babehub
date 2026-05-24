import { createClient } from '@/lib/supabase/server';
import { getSignedMediaUrls } from '@/lib/storage/signedUrls';
import type { MediaItem } from '@/components/MediaTile';
import { PAGE_SIZE, type FeedPage, type FeedPost } from './types';

/**
 * Plain server-side helper (NOT a Server Action). Used by the server-
 * component render of /explore and re-exported by the `loadMoreFeed`
 * action below so the client "Load more" button can fetch the next batch.
 *
 * Lives outside the `'use server'` file because Next.js treats `'use
 * server'` files specially — only async functions can be exported, and
 * the bundler routes calls through the Server Actions protocol layer
 * even when invoked from another server component. Pulling the data fn
 * into its own non-action module sidesteps those constraints.
 */
export async function loadFeedPage(offset: number): Promise<FeedPage> {
  const supabase = await createClient();

  // Pull one row extra to determine whether there's a next page without
  // doing a separate COUNT(*).
  const { data: rows } = await supabase
    .from('posts')
    .select(
      'id, body, kind, media_ids, tier_required_id, published_at, creator:profiles!posts_creator_id_fkey(handle, display_name, avatar_url, is_verified)',
    )
    .not('published_at', 'is', null)
    .is('tier_required_id', null) // public feed only
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
