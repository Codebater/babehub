import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';

/**
 * Industry budget-flow metric for the /jobs board header.
 *
 * Sums `budget_max_cents` (falling back to `budget_min_cents` when max
 * is null) across every published job — past + active. RLS lets
 * anonymous viewers read public jobs; the count therefore reflects
 * what the visitor can see, not the full DB.
 *
 * A baseline (`BASELINE_EUR`) is added on top so the visible number
 * starts at a credible level for a launch-phase platform. As real
 * jobs accumulate they add to the baseline; eventually the baseline
 * becomes a small fraction of total flow and can be dropped without
 * the number visibly dipping.
 *
 * Returned `totalCents` is in cents (consistent with budget_*_cents
 * columns). Callers convert + format with `formatCompact()`.
 */

/**
 * €2,400,000 — industry network baseline. Picked to read as "this is
 * a working marketplace" without the hubris of a 7-figure flex.
 * Adjustable from one place if the launch story changes.
 */
const BASELINE_EUR = 2_400_000;

export type JobsIndustryStats = {
  totalCents: number;
  totalEur: number;
  jobCount: number;
};

export async function loadJobsIndustryStats(
  supabase: SupabaseClient<Database>,
): Promise<JobsIndustryStats> {
  // Pull all jobs' budget columns. Limit 5000 is plenty for the
  // foreseeable launch window; once the catalog scales past that,
  // swap to a `select sum(coalesce(budget_max_cents, budget_min_cents, 0))`
  // RPC for constant-time aggregation.
  const { data, count } = await supabase
    .from('jobs')
    .select('budget_min_cents, budget_max_cents', { count: 'exact' })
    .not('published_at', 'is', null)
    .limit(5000);

  let realCents = 0;
  for (const j of data ?? []) {
    const cents = j.budget_max_cents ?? j.budget_min_cents ?? 0;
    realCents += cents;
  }

  // BASELINE_EUR is in whole euros; budget columns are in cents.
  // Combine in cents to keep the math consistent.
  const totalCents = realCents + BASELINE_EUR * 100;
  return {
    totalCents,
    totalEur: totalCents / 100,
    jobCount: count ?? 0,
  };
}
