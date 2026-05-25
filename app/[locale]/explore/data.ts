import { searchVideos } from '@/lib/eporner/client';
import { PAGE_SIZE, type FeedPage } from './types';

/**
 * Pulls one page of videos from the eporner search API.
 *
 * Why not from Supabase? Phase 1.3 pivots /explore from "creator-posted
 * content" to "third-party video catalog" — the user wants the platform
 * to feel like a video tube from day one, before our own creator base is
 * built up. Creator-posted content still lives on /c/{handle}; Phase 2+
 * may layer creator videos on top of the eporner feed.
 *
 * Caching: `searchVideos` uses Next.js `fetch` with `revalidate: 300`
 * so the same query+page combo only hits eporner once per 5 minutes
 * across all visitors.
 */
export async function loadFeedPage(
  page: number,
  options: { query?: string; order?: string } = {},
): Promise<FeedPage> {
  const response = await searchVideos({
    query: options.query ?? 'all',
    order: options.order ?? 'latest',
    page,
    per_page: PAGE_SIZE,
    thumbsize: 'big',
  });

  return {
    videos: response.videos,
    hasMore: response.page < response.total_pages,
    page: response.page,
  };
}
