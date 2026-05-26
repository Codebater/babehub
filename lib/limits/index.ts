import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';

/**
 * Platform content caps.
 *
 * Free tier — every signed-up user gets these out of the gate:
 *   • 2 videos
 *   • 5 pictures
 *   • 5 public posts
 *   • 2 private posts (tier-locked)
 *   • 5 jobs
 *
 * Elevated tier — granted to:
 *   • BabeHub Verified accounts (is_verified=true, admin-approved)
 *   • Premium subscribers ($10/mo, is_premium=true)
 *   • Admins (role='admin', free pass)
 *
 * 5× the free caps across the board, scaled from "10 videos" the
 * platform pitches as the headline upgrade benefit.
 */
export const FREE_LIMITS = {
  videos: 2,
  pictures: 5,
  publicPosts: 5,
  privatePosts: 2,
  jobs: 5,
} as const;

export const ELEVATED_LIMITS = {
  videos: 10,
  pictures: 25,
  publicPosts: 25,
  privatePosts: 10,
  jobs: 25,
} as const;

export type Limits = typeof FREE_LIMITS;

/**
 * Minimal viewer shape — what every "is this user premium / elevated"
 * check needs. Accepts a partial profile so callers can pass whatever
 * subset of columns their SELECT pulled.
 */
export type PremiumViewer = Pick<
  Database['public']['Tables']['profiles']['Row'],
  'role' | 'is_verified' | 'is_premium' | 'premium_until'
>;

/**
 * True if the viewer should see unlocked Casting + creator-blurred
 * content. Combines three signals:
 *   1. role === 'admin' (always)
 *   2. is_verified === true (BabeHub Verified accounts)
 *   3. is_premium === true AND (premium_until is null OR future)
 */
export function isElevated(p: PremiumViewer | null | undefined): boolean {
  if (!p) return false;
  if (p.role === 'admin') return true;
  if (p.is_verified) return true;
  if (!p.is_premium) return false;
  if (!p.premium_until) return true; // admin-granted, no expiry
  return new Date(p.premium_until).getTime() > Date.now();
}

/** Lookup the cap set for a given viewer. */
export function getLimits(p: PremiumViewer | null | undefined): Limits {
  return isElevated(p) ? ELEVATED_LIMITS : FREE_LIMITS;
}

/**
 * Current usage across all five content axes, all in one round-trip.
 * Used by the dashboard's "Your usage" panel and by every server
 * action that needs to check "is this user at their cap?".
 */
export type Usage = {
  videos: number;
  pictures: number;
  publicPosts: number;
  privatePosts: number;
  jobs: number;
};

export async function loadUsage(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<Usage> {
  // Posts split by tier (null = public, non-null = private). Plus
  // counts for jobs. Media counts are separate because they live in
  // their own table — but we can also derive video / picture counts
  // from media.kind.
  const [posts, jobs, media] = await Promise.all([
    supabase
      .from('posts')
      .select('id, tier_required_id')
      .eq('creator_id', userId),
    supabase
      .from('jobs')
      .select('id', { count: 'exact', head: true })
      .eq('poster_id', userId),
    supabase.from('media').select('id, kind').eq('owner_id', userId),
  ]);

  let publicPosts = 0;
  let privatePosts = 0;
  for (const p of posts.data ?? []) {
    if (p.tier_required_id) privatePosts += 1;
    else publicPosts += 1;
  }

  let videos = 0;
  let pictures = 0;
  for (const m of media.data ?? []) {
    if (m.kind === 'video') videos += 1;
    else if (m.kind === 'image') pictures += 1;
  }

  return {
    videos,
    pictures,
    publicPosts,
    privatePosts,
    jobs: jobs.count ?? 0,
  };
}

/**
 * Helper exposed to client UIs that need to render "X / Y used"
 * progress bars. Returns the combined usage + caps payload.
 */
export async function loadLimitsAndUsage(
  supabase: SupabaseClient<Database>,
  viewer: PremiumViewer,
  userId: string,
): Promise<{ limits: Limits; usage: Usage; elevated: boolean }> {
  const usage = await loadUsage(supabase, userId);
  return {
    limits: getLimits(viewer),
    usage,
    elevated: isElevated(viewer),
  };
}
