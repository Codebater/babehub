import type { EpornerVideo } from '@/lib/eporner/client';

export const PAGE_SIZE = 24;

/** Re-export so the explore subtree doesn't have to know about lib/eporner. */
export type FeedVideo = EpornerVideo;

export type FeedPage = {
  videos: FeedVideo[];
  /** True when there are more pages past the current one. */
  hasMore: boolean;
  /** 1-indexed page number this batch represents (so the caller knows what to ask next). */
  page: number;
};
