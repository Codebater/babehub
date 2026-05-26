import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';

/**
 * Single batched query for the admin hub + tab nav badges.
 *
 * All five counts execute in parallel via Promise.all — each is a
 * HEAD-only count query so we pay one row of network per metric, no
 * payload. Returns 0 on any individual failure so the UI never breaks
 * because one query stuttered.
 *
 * Used by:
 *   - /app/admin/layout.tsx — feeds the tab nav badges
 *   - /app/admin/page.tsx   — feeds the landing hub's stat cards
 */
export type AdminCounts = {
  users: number;
  verified: number;
  applied: number;
  featuredJobs: number;
  totalJobs: number;
  newApplications: number;
  totalApplications: number;
  newInquiries: number;
  totalInquiries: number;
  blogPosts: number;
  blogDrafts: number;
};

export async function loadAdminCounts(
  supabase: SupabaseClient<Database>,
): Promise<AdminCounts> {
  const nowIso = new Date().toISOString();

  const [
    users,
    verified,
    applied,
    featuredJobs,
    totalJobs,
    newApplications,
    totalApplications,
    newInquiries,
    totalInquiries,
    blogPosts,
    blogDrafts,
  ] = await Promise.all([
    supabase.from('profiles').select('id', { count: 'exact', head: true }),
    supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('is_verified', true),
    supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('applied_babehub', true),
    supabase
      .from('jobs')
      .select('id', { count: 'exact', head: true })
      .not('featured_until', 'is', null)
      .gt('featured_until', nowIso),
    supabase.from('jobs').select('id', { count: 'exact', head: true }),
    supabase
      .from('survey_submissions')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'new'),
    supabase.from('survey_submissions').select('id', { count: 'exact', head: true }),
    supabase
      .from('banner_inquiries')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'new'),
    supabase.from('banner_inquiries').select('id', { count: 'exact', head: true }),
    supabase.from('blog_posts').select('id', { count: 'exact', head: true }),
    supabase
      .from('blog_posts')
      .select('id', { count: 'exact', head: true })
      .is('published_at', null),
  ]);

  return {
    users: users.count ?? 0,
    verified: verified.count ?? 0,
    applied: applied.count ?? 0,
    featuredJobs: featuredJobs.count ?? 0,
    totalJobs: totalJobs.count ?? 0,
    newApplications: newApplications.count ?? 0,
    totalApplications: totalApplications.count ?? 0,
    newInquiries: newInquiries.count ?? 0,
    totalInquiries: totalInquiries.count ?? 0,
    blogPosts: blogPosts.count ?? 0,
    blogDrafts: blogDrafts.count ?? 0,
  };
}
