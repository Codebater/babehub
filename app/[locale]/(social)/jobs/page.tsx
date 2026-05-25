import type { Metadata } from 'next';
import { Link } from '@/i18n/navigation';
import { Briefcase, MapPin, Sparkles, Clock, ShieldCheck } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import AdStrip from '../_components/AdStrip';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Jobs — Babe Hub',
  description:
    'Open jobs from creators, agencies and brands on Babe Hub. Apply directly from the platform.',
  alternates: { canonical: '/jobs' },
};

type Props = {
  searchParams: Promise<{
    q?: string;
    category?: string;
    location?: string;
  }>;
};

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

function timeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const day = Math.floor(ms / 86_400_000);
  if (day < 1) return 'today';
  if (day < 30) return `${day}d ago`;
  return `${Math.floor(day / 30)}mo ago`;
}

export default async function JobsPage({ searchParams }: Props) {
  const { q, category, location } = await searchParams;
  const supabase = await createClient();

  // RLS already filters to published + approved + not-expired jobs the
  // viewer can see (public OR verified_only with verified viewer OR own).
  // We layer optional filters on top.
  let query = supabase
    .from('jobs')
    .select(
      'id, title, description, budget_min_cents, budget_max_cents, currency, location_kind, location_text, tags, categories, requires_verification, published_at, poster_id, featured_until, promoted_score',
    )
    .order('promoted_score', { ascending: false })
    .order('published_at', { ascending: false })
    .limit(40);

  if (category?.trim()) {
    query = query.contains('categories', [category.trim().toLowerCase()]);
  }
  if (location === 'remote' || location === 'onsite' || location === 'hybrid') {
    query = query.eq('location_kind', location);
  }
  if (q?.trim()) {
    // Postgres full-text query on the tsvector column maintained by trigger.
    query = query.textSearch('search_doc', q.trim(), { type: 'websearch' });
  }

  const { data: jobs } = await query;

  // Resolve poster handles in a single follow-up query.
  const posterIds = Array.from(new Set((jobs ?? []).map((j) => j.poster_id)));
  const { data: posters } = posterIds.length
    ? await supabase
        .from('profiles')
        .select('id, handle, display_name, avatar_url, is_verified')
        .in('id', posterIds)
    : { data: [] };
  const posterMap = new Map(
    (posters ?? []).map((p) => [
      p.id,
      {
        handle: p.handle,
        displayName: p.display_name || p.handle,
        avatarUrl: p.avatar_url,
        isVerified: p.is_verified,
      },
    ]),
  );

  return (
    <main className="mx-auto max-w-7xl px-6 py-10">
      <header className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm text-text-secondary">
            Open jobs from creators, agencies and brands. Apply with one click — the
            recruiter sees your professional profile attached.
          </p>
        </div>
        <Link
          href="/app/recruiter/jobs/new"
          className="inline-flex items-center gap-2 self-start rounded-full bg-primary px-4 py-2 text-sm font-bold text-white shadow-lg shadow-primary/30 transition-all hover:scale-[1.02] hover:bg-pink-400 sm:self-auto"
        >
          <Briefcase className="h-4 w-4" />
          Post a job
        </Link>
      </header>

      {/* Old-school ad strip — between the page header and the filter
          chips. Same shape as the /explore-top placement so brand-side
          surfaces feel like one family. */}
      <div className="mb-6">
        <AdStrip
          placement="jobs-top"
          headline="Hire faster — feature your job here"
          sub="Premium placement at the top of the board. Pitch a slot in 60 seconds."
        />
      </div>

      {/* Filter chips */}
      <FilterChips
        activeCategory={category ?? ''}
        activeLocation={location ?? ''}
        activeQuery={q ?? ''}
      />

      {!jobs || jobs.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-border-color bg-secondary/40 p-12 text-center">
          <Briefcase className="mx-auto h-10 w-10 text-text-secondary/60" />
          <p className="mt-3 text-text-secondary">
            {q || category || location
              ? 'No jobs match those filters.'
              : 'No jobs posted yet. Be the first — click "Post a job" above.'}
          </p>
        </div>
      ) : (
        <ul className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {jobs.map((job) => {
            const poster = posterMap.get(job.poster_id);
            const budget = formatBudget(
              job.budget_min_cents,
              job.budget_max_cents,
              job.currency,
            );
            const featured =
              job.featured_until && new Date(job.featured_until) > new Date();
            return (
              <li key={job.id}>
                <Link
                  href={`/jobs/${job.id}` as '/jobs/[id]'}
                  className={`group block overflow-hidden rounded-2xl border bg-card p-5 transition-colors hover:border-primary ${
                    featured ? 'border-amber-300/40' : 'border-border-color'
                  }`}
                >
                  {featured && (
                    <p className="mb-2 inline-flex items-center gap-1 rounded-full bg-amber-300/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-amber-300">
                      <Sparkles className="h-3 w-3" />
                      Featured
                    </p>
                  )}
                  <h3 className="line-clamp-2 text-base font-black tracking-tight text-text-main group-hover:text-primary">
                    {job.title}
                  </h3>
                  {job.description && (
                    <p className="mt-2 line-clamp-3 text-sm text-text-secondary">
                      {job.description}
                    </p>
                  )}

                  <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-text-secondary">
                    {budget && (
                      <span className="font-bold text-text-main">{budget}</span>
                    )}
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {job.location_kind === 'remote'
                        ? 'Remote'
                        : job.location_text || job.location_kind}
                    </span>
                    {job.requires_verification && (
                      <span className="inline-flex items-center gap-1 text-primary">
                        <ShieldCheck className="h-3 w-3" />
                        Verified only
                      </span>
                    )}
                  </div>

                  {(job.categories.length > 0 || job.tags.length > 0) && (
                    <div className="mt-3 flex flex-wrap gap-1">
                      {job.categories.slice(0, 3).map((c) => (
                        <span
                          key={`cat-${c}`}
                          className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary"
                        >
                          {c}
                        </span>
                      ))}
                      {job.tags.slice(0, 3).map((t) => (
                        <span
                          key={`tag-${t}`}
                          className="rounded-full border border-border-color px-2 py-0.5 text-[10px] text-text-secondary"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="mt-4 flex items-center justify-between border-t border-border-color/40 pt-3">
                    {poster ? (
                      <span className="flex items-center gap-2 text-xs text-text-secondary">
                        <span className="h-5 w-5 overflow-hidden rounded-full bg-secondary">
                          {poster.avatarUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={poster.avatarUrl}
                              alt=""
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <span className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/40 to-pink-600/40 text-[9px] font-black text-white">
                              {poster.displayName.slice(0, 1).toUpperCase()}
                            </span>
                          )}
                        </span>
                        @{poster.handle}
                        {poster.isVerified && (
                          <ShieldCheck className="h-3 w-3 text-primary" />
                        )}
                      </span>
                    ) : (
                      <span />
                    )}
                    {job.published_at && (
                      <span className="inline-flex items-center gap-1 text-[11px] text-text-secondary">
                        <Clock className="h-3 w-3" />
                        {timeAgo(job.published_at)}
                      </span>
                    )}
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}

// Inline server component — filter chips that update URL search params
function FilterChips({
  activeCategory,
  activeLocation,
  activeQuery,
}: {
  activeCategory: string;
  activeLocation: string;
  activeQuery: string;
}) {
  const cats = ['casting', 'live cams', 'luxury', 'ugc', 'modeling', 'photography'];
  const locs = [
    { v: '', label: 'Anywhere' },
    { v: 'remote', label: 'Remote' },
    { v: 'onsite', label: 'On-site' },
    { v: 'hybrid', label: 'Hybrid' },
  ];

  const baseQuery = (overrides: Record<string, string | undefined>) => {
    const sp = new URLSearchParams();
    const merged = {
      q: activeQuery,
      category: activeCategory,
      location: activeLocation,
      ...overrides,
    };
    for (const [k, v] of Object.entries(merged)) if (v) sp.set(k, v);
    return sp.toString();
  };

  return (
    <div className="space-y-3">
      <div className="-mx-1 flex gap-2 overflow-x-auto pb-1">
        {locs.map((l) => {
          const active = activeLocation === l.v;
          const qs = baseQuery({ location: l.v });
          return (
            <Link
              key={l.label}
              href={(qs ? `/jobs?${qs}` : '/jobs') as '/jobs'}
              className={`shrink-0 rounded-full px-4 py-1.5 text-xs font-bold transition-colors ${
                active
                  ? 'bg-primary text-white'
                  : 'border border-border-color bg-card/40 text-text-secondary hover:border-primary hover:text-primary'
              }`}
            >
              {l.label}
            </Link>
          );
        })}
      </div>
      <div className="-mx-1 flex gap-2 overflow-x-auto pb-1">
        {[''].concat(cats).map((c) => {
          const active = activeCategory === c;
          const qs = baseQuery({ category: c });
          const label = c || 'All categories';
          return (
            <Link
              key={label}
              href={(qs ? `/jobs?${qs}` : '/jobs') as '/jobs'}
              className={`shrink-0 rounded-full px-3 py-1 text-[11px] font-medium transition-colors ${
                active
                  ? 'bg-primary/15 text-primary'
                  : 'text-text-secondary hover:text-primary'
              }`}
            >
              {label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
