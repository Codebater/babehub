/**
 * Shared types for video interactions (likes, favorites, comments).
 *
 * Every interaction targets a (provider, content_id) pair:
 *   - provider = 'creator_post' → content_id = posts.id (uuid as text)
 *   - provider = 'eporner'      → content_id = eporner video id
 */

export type ContentProvider = 'creator_post' | 'eporner';

export type ContentRef = {
  provider: ContentProvider;
  contentId: string;
};

/**
 * Optional metadata cached on the favorite row so the user's
 * Favorites list can render without a separate eporner / DB fetch
 * for each item.
 */
export type ContentMeta = {
  title?: string | null;
  thumbUrl?: string | null;
  /** Eporner iframe embed URL — required to replay eporner favorites. */
  embedUrl?: string | null;
  /** Eporner public watch URL. */
  sourceUrl?: string | null;
};

export type CommentRow = {
  id: string;
  body: string;
  created_at: string;
  user_id: string;
  author: {
    handle: string;
    display_name: string;
    avatar_url: string | null;
  } | null;
};

export type InteractionSummary = {
  likeCount: number;
  isLiked: boolean;
  isFavorited: boolean;
  commentCount: number;
  comments: CommentRow[];
};
