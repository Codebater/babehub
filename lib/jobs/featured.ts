import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';

/**
 * Unified loader for "featured" jobs across the calendar / blog / jobs
 * board surfaces.
 *
 * Selection logic (in priority order):
 *   1. Admin-picked manual features — `featured_until > now()`,
 *      ordered by featured_until DESC so the most-recently-promoted
 *      run on top.
 *   2. Auto-features by budget — jobs without a manual `featured_until`,
 *      ordered by `budget_max_cents` DESC (highest paid first), then
 *      `budget_min_cents` DESC as a tie-break, then `published_at` DESC.
 *
 * Both lists are concatenated and truncated to `limit` (default 6).
 * Manual picks always win until they hit the limit.
 *
 * RLS-aware: uses the cookie client passed in by the caller, so
 * unpublished / expired / wrong-visibility jobs are filtered server-
 * side without any extra clause here.
 */
export type FeaturedJobRow = {
  id: string;
  title: string;
  published_at: string | null;
  featured_until: string | null;
  budget_min_cents: number | null;
  budget_max_cents: number | null;
  currency: string;
};

export async function loadFeaturedJobs(
  supabase: SupabaseClient<Database>,
  limit = 6,
): Promise<FeaturedJobRow[]> {
  const nowIso = new Date().toISOString();

  // ── 1. Manual admin picks ──────────────────────────────────────
  const manualPromise = supabase
    .from('jobs')
    .select(
      'id, title, published_at, featured_until, budget_min_cents, budget_max_cents, currency',
    )
    .not('featured_until', 'is', null)
    .gt('featured_until', nowIso)
    .not('published_at', 'is', null)
    .order('featured_until', { ascending: false })
    .limit(limit);

  // ── 2. Auto-pick by budget ─────────────────────────────────────
  // We over-fetch slightly so once we dedupe against the manual set
  // we still have `limit` rows left in the worst case.
  const autoPromise = supabase
    .from('jobs')
    .select(
      'id, title, published_at, featured_until, budget_min_cents, budget_max_cents, currency',
    )
    .is('featured_until', null)
    .not('published_at', 'is', null)
    .not('budget_max_cents', 'is', null)
    .order('budget_max_cents', { ascending: false, nullsFirst: false })
    .order('budget_min_cents', { ascending: false, nullsFirst: false })
    .order('published_at', { ascending: false })
    .limit(limit * 2);

  const [{ data: manual }, { data: auto }] = await Promise.all([
    manualPromise,
    autoPromise,
  ]);

  const seen = new Set<string>();
  const combined: FeaturedJobRow[] = [];
  for (const j of manual ?? []) {
    if (!j.id || seen.has(j.id)) continue;
    seen.add(j.id);
    combined.push(j);
    if (combined.length >= limit) break;
  }
  for (const j of auto ?? []) {
    if (combined.length >= limit) break;
    if (!j.id || seen.has(j.id)) continue;
    seen.add(j.id);
    combined.push(j);
  }
  return combined;
}

/**
 * Convenience for the calendar / blog / jobs board: which signal flagged
 * this row as featured? Cleaner than callers checking `featured_until`
 * themselves.
 */
export function isManualFeature(j: FeaturedJobRow): boolean {
  return !!j.featured_until && new Date(j.featured_until) > new Date();
}
