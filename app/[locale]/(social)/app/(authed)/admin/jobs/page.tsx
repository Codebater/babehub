import { Link } from '@/i18n/navigation';
import { Briefcase, Sparkles, ShieldAlert } from 'lucide-react';
import { requireAdmin } from '@/lib/auth/guards';
import { loadFeaturedJobs } from '@/lib/jobs/featured';
import AdminJobFeatureButtons from './AdminJobFeatureButtons';

export const dynamic = 'force-dynamic';

/**
 * `/app/admin/jobs` — promotion-management view.
 *
 * Two stacked sections:
 *   1. "Currently featured" — the platform-wide top-6 the calendar
 *      surfaces in amber. Same logic loadFeaturedJobs() uses for the
 *      calendar, blog row, and jobs board. Shows manual picks first,
 *      then auto-fills by highest budget.
 *   2. "All jobs" — paginated-ish (40 most recent) table where the
 *      admin can promote any job by picking a 7/30/90-day duration.
 *
 * Every action revalidates /jobs, /blog, /explore, /app/admin/jobs —
 * so flipping a row here instantly updates every surface that reads
 * the featured set.
 */
function formatBudget(min: number | null, max: number | null, currency: string) {
  if (!min && !max) return null;
  const fmt = (n: number) =>
    (n / 100).toLocaleString(undefined, {
      style: 'currency',
      currency: (currency || 'USD').toUpperCase(),
      maximumFractionDigits: 0,
    });
  if (min && max) return `${fmt(min)} – ${fmt(max)}`;
  if (min) return `from ${fmt(min)}`;
  return `up to ${fmt(max!)}`;
}

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export default async function AdminJobsPage() {
  const { supabase } = await requireAdmin();

  // Currently-featured slice (uses the shared loader so admin sees
  // exactly what the calendar / blog / board see — no drift).
  const featured = await loadFeaturedJobs(supabase, 6);

  // Full recent list — 40 newest jobs. Enough for the admin to scan
  // and pick from without paginating yet.
  const { data: all } = await supabase
    .from('jobs')
    .select(
      'id, title, published_at, featured_until, budget_min_cents, budget_max_cents, currency, status, poster_id',
    )
    .order('published_at', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false })
    .limit(40);

  // Resolve poster handles so admin sees who's behind each row.
  const posterIds = Array.from(new Set((all ?? []).map((j) => j.poster_id)));
  const { data: posters } = posterIds.length
    ? await supabase
        .from('profiles')
        .select('id, handle, display_name, is_verified')
        .in('id', posterIds)
    : { data: [] };
  const posterMap = new Map((posters ?? []).map((p) => [p.id, p]));

  return (
    <main className="mx-auto max-w-7xl px-4 py-6 md:px-6 md:py-10">
      <header className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="inline-flex items-center gap-2 rounded-full border border-amber-400/40 bg-amber-400/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.25em] text-amber-300">
            <ShieldAlert className="h-3 w-3" />
            Admin · Jobs
          </p>
          <h1 className="mt-3 text-2xl font-black tracking-tight text-text-main md:text-3xl">
            Featured jobs
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-text-secondary">
            The sidebar calendar, blog index, and jobs board all surface
            up to <strong>6</strong> featured jobs. Manual picks below come
            first; remaining slots auto-fill with the highest-budget jobs
            on the platform.
          </p>
        </div>
        <Link
          href={'/app/admin/users' as never}
          className="self-start rounded-full border border-border-color px-4 py-2 text-xs font-bold uppercase tracking-widest text-text-secondary transition-colors hover:border-primary hover:text-primary"
        >
          → Users
        </Link>
      </header>

      {/* ── Currently featured (top 6 across the platform) ───────── */}
      <section className="mb-10">
        <h2 className="mb-3 text-[10px] font-bold uppercase tracking-[0.25em] text-text-secondary">
          Currently featured — top {featured.length} of 6
        </h2>
        {featured.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border-color bg-secondary/40 p-8 text-center text-sm text-text-secondary">
            No featured jobs yet. Pick from the list below; auto-fill by
            budget kicks in for any unused slots.
          </div>
        ) : (
          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((j) => {
              const isManual =
                !!j.featured_until && new Date(j.featured_until) > new Date();
              return (
                <li
                  key={j.id}
                  className="flex h-full flex-col rounded-2xl border border-amber-400/30 bg-gradient-to-br from-card to-amber-950/15 p-4"
                >
                  <p className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-amber-300">
                    <Sparkles className="h-3 w-3" />
                    {isManual ? 'Manual pick' : 'Auto · by budget'}
                  </p>
                  <p className="mt-2 line-clamp-2 text-sm font-bold text-text-main">{j.title}</p>
                  <p className="mt-1 text-xs text-text-secondary">
                    {formatBudget(j.budget_min_cents, j.budget_max_cents, j.currency) ?? 'No budget'}
                  </p>
                  {isManual && (
                    <p className="mt-1 text-[10px] text-text-secondary">
                      Until {formatDate(j.featured_until)}
                    </p>
                  )}
                  <div className="mt-3">
                    <AdminJobFeatureButtons jobId={j.id} featuredUntil={j.featured_until} />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* ── Full job list (admin can promote any) ────────────────── */}
      <section>
        <h2 className="mb-3 text-[10px] font-bold uppercase tracking-[0.25em] text-text-secondary">
          All jobs · {all?.length ?? 0} most recent
        </h2>
        <div className="overflow-x-auto rounded-2xl border border-border-color bg-card">
          <table className="w-full min-w-[900px] text-sm">
            <thead className="border-b border-border-color/60 text-left text-[10px] font-bold uppercase tracking-widest text-text-secondary">
              <tr>
                <th className="px-4 py-3">Job</th>
                <th className="px-3 py-3">Poster</th>
                <th className="px-3 py-3">Budget</th>
                <th className="px-3 py-3">Status</th>
                <th className="px-3 py-3">Featured</th>
                <th className="px-4 py-3 text-right">Promote</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-color/40">
              {(all ?? []).map((j) => {
                const poster = posterMap.get(j.poster_id);
                const isManual =
                  !!j.featured_until && new Date(j.featured_until) > new Date();
                return (
                  <tr key={j.id}>
                    <td className="px-4 py-3">
                      <Link
                        href={`/jobs/${j.id}` as '/jobs/[id]'}
                        className="line-clamp-2 text-sm font-bold text-text-main hover:text-primary"
                      >
                        {j.title}
                      </Link>
                      <p className="mt-0.5 text-[11px] text-text-secondary">
                        {formatDate(j.published_at)}
                      </p>
                    </td>
                    <td className="px-3 py-3">
                      {poster ? (
                        <Link
                          href={`/c/${poster.handle}` as '/c/[handle]'}
                          className="text-xs text-text-secondary hover:text-primary"
                        >
                          @{poster.handle}
                        </Link>
                      ) : (
                        <span className="text-xs text-text-secondary/40">—</span>
                      )}
                    </td>
                    <td className="px-3 py-3 text-xs text-text-secondary">
                      {formatBudget(j.budget_min_cents, j.budget_max_cents, j.currency) ?? (
                        <span className="text-text-secondary/40">—</span>
                      )}
                    </td>
                    <td className="px-3 py-3 text-xs capitalize text-text-secondary">
                      {j.status}
                    </td>
                    <td className="px-3 py-3 text-xs">
                      {isManual ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-400/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-amber-300">
                          <Sparkles className="h-3 w-3" />
                          Until {formatDate(j.featured_until)}
                        </span>
                      ) : (
                        <span className="text-text-secondary/40">Auto pool</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <AdminJobFeatureButtons jobId={j.id} featuredUntil={j.featured_until} />
                    </td>
                  </tr>
                );
              })}
              {(!all || all.length === 0) && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-text-secondary">
                    <Briefcase className="mx-auto h-8 w-8 text-text-secondary/40" />
                    <p className="mt-2">No jobs posted yet.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <p className="mt-4 text-[11px] text-text-secondary">
        Unfeatured jobs compete for the remaining slots ranked by{' '}
        <code className="rounded bg-secondary px-1.5 py-0.5 font-mono">budget_max_cents</code> descending.
      </p>
    </main>
  );
}
