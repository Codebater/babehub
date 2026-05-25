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

/**
 * Discriminated union the unified <VideoModal> accepts.
 *   - 'iframe' → eporner-style embed (uses <iframe src>)
 *   - 'video'  → creator-uploaded video with a signed URL (uses <video src>)
 *                Includes the creator handle so the modal can render a
 *                "View creator profile →" CTA for subscription conversion.
 */
export type ModalPayload =
  | {
      kind: 'iframe';
      embed: string;
      title: string;
      /** Public URL on the source platform (eporner.com). */
      sourceUrl: string;
      /** Eporner video id — used as content_id for the interactions table. */
      contentId: string;
      /** Thumbnail cached on the favorite row for the /favorites list. */
      thumbUrl?: string;
      /** Comma-separated keywords for the footer chip line. Optional. */
      keywords?: string;
    }
  | {
      kind: 'video';
      src: string;
      title: string;
      /** posts.id — used as content_id for the interactions table. */
      contentId: string;
      creatorHandle: string;
      creatorName: string;
      thumbUrl?: string;
    };
