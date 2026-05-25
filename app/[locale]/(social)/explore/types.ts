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

/**
 * A creator-uploaded video post resolved with its signed playback URL.
 * Surfaced in the "Featured creators" row above the eporner grid.
 */
export type CreatorFeedVideo = {
  postId: string;
  body: string;
  publishedAt: string | null;
  /** Signed Supabase Storage URL — 1h expiry, mint via getSignedMediaUrls. */
  videoUrl: string;
  /** Static poster, if we ever generate one. Currently null → first-frame fallback. */
  posterUrl: string | null;
  creator: {
    handle: string;
    displayName: string;
    avatarUrl: string | null;
    isVerified: boolean;
  };
};

// `ModalPayload` + `VideoModal` removed in Sprint 2e cleanup. Cards
// now navigate to /v/{provider}/{contentId} instead of opening an
// inline modal. The video-page route owns its own per-provider props.
