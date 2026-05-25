'use server';

import { loadFeedPage } from './data';
import type { FeedPage } from './types';

/**
 * Server Action invoked by <LoadMoreButton /> when the user clicks to
 * fetch the next batch from the eporner API. Plain wrapper around
 * `loadFeedPage` in `./data.ts` — the data function itself lives outside
 * this `'use server'` file so the server-rendered /explore page can call
 * it as a regular async fn without going through the Server Actions RPC
 * layer.
 */
export async function loadMoreFeed(
  page: number,
  options: { query?: string; order?: string } = {},
): Promise<FeedPage> {
  return loadFeedPage(page, options);
}
