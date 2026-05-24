'use server';

import { loadFeedPage } from './data';
import type { FeedPage } from './types';

/**
 * Server Action invoked by <LoadMoreButton /> when the user clicks to
 * fetch the next batch. Plain wrapper around `loadFeedPage` in `./data.ts`
 * — the data function itself is kept out of this `'use server'` file so
 * the server-rendered /explore page can call it as a regular async fn
 * without going through the Server Actions RPC layer.
 */
export async function loadMoreFeed(offset: number): Promise<FeedPage> {
  return loadFeedPage(offset);
}
