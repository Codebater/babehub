import type { MediaItem } from '@/components/MediaTile';

export const PAGE_SIZE = 20;

export type FeedPost = {
  id: string;
  body: string;
  kind: 'text' | 'image' | 'video' | 'gallery';
  media_ids: string[];
  tier_required_id: string | null;
  published_at: string | null;
  creator: {
    handle: string;
    display_name: string;
    avatar_url: string | null;
    is_verified: boolean;
  };
  mediaItems: MediaItem[];
};

export type FeedPage = {
  posts: FeedPost[];
  /** True when there might be more posts past this batch. */
  hasMore: boolean;
};
