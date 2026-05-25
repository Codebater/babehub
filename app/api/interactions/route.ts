import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { loadInteractionSummary } from '@/lib/interactions/load';
import type { ContentProvider } from '@/lib/interactions/types';

/**
 * GET /api/interactions?provider=…&content_id=…
 *
 * Returns the InteractionSummary (like count, viewer's liked/favorited
 * state, comment thread) for a single video. Used by VideoModal to
 * lazy-load the social block when a user opens a video — server
 * components can't reach into a client-only modal, so we expose this
 * route for the modal's client-side fetch.
 *
 * Public-readable: anon callers get likeCount + comments but isLiked
 * and isFavorited will always be false (no session = no rows).
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const provider = searchParams.get('provider') as ContentProvider | null;
  const contentId = searchParams.get('content_id');

  if (
    !provider ||
    (provider !== 'creator_post' && provider !== 'eporner') ||
    !contentId
  ) {
    return NextResponse.json({ error: 'invalid_params' }, { status: 400 });
  }

  // viewerId so the modal can render the Delete button on the user's
  // own comments without an extra getUser() call.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const summary = await loadInteractionSummary(provider, contentId);

  return NextResponse.json({
    ...summary,
    viewerId: user?.id ?? null,
    isSignedIn: Boolean(user),
  });
}
