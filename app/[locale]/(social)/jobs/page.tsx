import type { Metadata } from 'next';
import { Link } from '@/i18n/navigation';
import {
  Briefcase,
  MapPin,
  Sparkles,
  Clock,
  ShieldCheck,
  ArrowRight,
  Activity,
  Flame,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import AdStrip from '../_components/AdStrip';
import { loadJobsIndustryStats } from '@/lib/jobs/stats';
import { loadFeaturedJobs } from '@/lib/jobs/featured';
import { formatCompact } from '@/lib/format/compact';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  // Title + description tuned for the search intents the platform
  // serves: recruiters looking to "find adult applicants" / "find
  // adult creators", and creators looking for "adult creator jobs"
  // / "casting calls". Keywords are duplicated for legacy crawlers
  // that still weight the meta keywords field.
  title: 'Adult creator jobs · Find applicants & casting calls — Babe Hub',
  description:
    'Open adult-industry jobs: casting, live cams, brand collabs, photography. Find adult creators and applicants — apply or post a job in one click. Crypto-paid where possible, deadlines visible up front.',
  keywords: [
    'adult creator jobs',
    'find adult applicants',
    'find adult creators',
    'adult casting',
    'casting calls',
    'live cams jobs',
    'brand collab',
    'adult content creator hiring',
  ],
  alternates: { canonical: '/jobs' },
  openGraph: {
    type: 'website',
    title: 'Adult creator jobs · Find applicants & casting calls',
    description:
      'Open adult-industry jobs on Babe Hub — casting, live cams, brand collabs.',
    url: 'https://babehub.net/jobs',
  },
};

type SortKey = 'newest' | 'paid' | 'oldest';

type Props = {
  searchParams: Promise<{
    q?: string;
    category?: string;
    location?: string;
    sort?: string;
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

/**
 * "Closes in 3d" / "Closes today" / "Closes in 5h". Reads back to the
 * applicant how much time they have left to send their intro before
 * the deadline hides the job from the board.
 */
function timeUntil(iso: string): string {
  const ms = new Date(iso).getTime() - Date.now();
  if (ms <= 0) return 'expired';
  const hour = Math.floor(ms / 3_600_000);
  if (hour < 24) return hour <= 1 ? 'in 1h' : `in ${hour}h`;
  const day = Math.floor(hour / 24);
  if (day === 1) return 'tomorrow';
  if (day < 30) return `in ${day}d`;
  return `in ${Math.floor(day / 30)}mo`;
}

/** Parse the `?sort=` param against the allow-list; default to newest. */
function parseSort(raw: string | undefined): SortKey {
  if (raw === 'paid' || raw === 'oldest') return raw;
  return 'newest';
}

export default async function JobsPage({ searchParams }: Props) {
  const { q, category, location, sort } = await searchParams;
  const sortKey = parseSort(sort);
  const supabase = await createClient();

  // RLS filters to published + approved + not-expired jobs the viewer
  // can see (public OR verified_only with verified viewer OR own).
  // We layer optional filters + sort on top.
  // Drop expired rows server-side so a recruiter's old deadline can't
  // leak into the public board. RLS already has its own deadline check
  // for non-owners; this query-level filter shaves a roundtrip for
  // authed users who own the row.
  const nowIso = new Date().toISOString();
  let query = supabase
    .from('jobs')
    .select(
      'id, title, description, budget_min_cents, budget_max_cents, currency, location_kind, location_text, tags, categories, requires_verification, published_at, poster_id, featured_until, promoted_score, expires_at',
    )
    .not('published_at', 'is', null)
    .or(`expires_at.is.null,expires_at.gt.${nowIso}`)
    .limit(50);

  // Sort by the selected key. "Newest" puts featured promoted_score
  // first so paying admins still win visibility; "paid" and "oldest"
  // sort purely on the column the user asked about (no featured
  // override, so the rule the visitor sees on the screen is honest).
  if (sortKey === 'newest') {
    query = query
      .order('promoted_score', { ascending: false })
      .order('published_at', { ascending: false });
  } else if (sortKey === 'paid') {
    query = query
      .order('budget_max_cents', { ascending: false, nullsFirst: false })
      .order('budget_min_cents', { ascending: false, nullsFirst: false })
      .order('published_at', { ascending: false });
  } else {
    // 'oldest' — chronological, oldest first
    query = query.order('published_at', { ascending: true });
  }

  if (category?.trim()) {
    query = query.contains('categories', [category.trim().toLowerCase()]);
  }
  if (location === 'remote' || location === 'onsite' || location === 'hybrid') {
    query = query.eq('location_kind', location);
  }
  if (q?.trim()) {
    query = query.textSearch('search_doc', q.trim(), { type: 'websearch' });
  }

  const [{ data: jobs }, industry, featuredJobs] = await Promise.all([
    query,
    loadJobsIndustryStats(supabase),
    // Real featured rows (admin manual picks + auto-by-budget). Shown
    // only on the unfiltered default-sort view (see below) — each
    // card deep-links to the specific /jobs/{id} detail page.
    loadFeaturedJobs(supabase, 3),
  ]);

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

  const isFiltered = Boolean(q || category || location);

  // ItemList JSON-LD describing the open jobs visible on this board.
  // Helps Google understand this as a job-board landing page (sibling
  // signal to the per-job JobPosting JSON-LD on each detail page).
  const itemListLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Open adult-creator jobs · Babe Hub',
    numberOfItems: (jobs ?? []).length,
    itemListElement: (jobs ?? []).slice(0, 30).map((j, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      url: `https://babehub.net/jobs/${j.id}`,
      name: j.title,
    })),
  };

  return (
    <main className="mx-auto max-w-7xl px-4 py-6 md:px-6 md:py-10">
      {/* eslint-disable-next-line react/no-danger */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListLd) }}
      />
      {/* ── Page header ─────────────────────────────────────────────
          Slimmed down: just the page intro + the "Post a job" CTA.
          The industry budget flow metric moved down to sit inline
          with the sort filter (denser visual rhythm, less wasted
          vertical real estate). */}
      <header className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <p className="max-w-2xl text-sm text-text-secondary">
          Open jobs from creators, agencies and brands. Apply with one click —
          the recruiter sees your professional profile attached.
        </p>
        <Link
          href="/app/recruiter/jobs/new"
          className="inline-flex items-center gap-2 self-start rounded-full bg-primary px-4 py-2 text-sm font-bold text-white shadow-lg shadow-primary/30 transition-all hover:scale-[1.02] hover:bg-pink-400 sm:self-auto"
        >
          <Briefcase className="h-4 w-4" />
          Post a job
        </Link>
      </header>

      {/* Old-school ad strip — between the page header and the filter
          chips. Same shape as the /explore-top placement. */}
      <div className="mb-6">
        <AdStrip placement="jobs-top" />
      </div>

      {/* ── Real featured row ─────────────────────────────────────
          Top-3 from `loadFeaturedJobs` (admin manual picks first,
          then auto-fill by budget). Each card deep-links to the
          specific /jobs/{id} page so a click goes straight to the
          apply surface. Only shown on the unfiltered default-sort
          view so search + sort changes aren't pre-empted by
          sponsorship. */}
      {!isFiltered && sortKey === 'newest' && featuredJobs.length > 0 && (
        <section className="mb-6">
          <p className="mb-2.5 inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.25em] text-amber-300">
            <Sparkles className="h-3 w-3" />
            Featured this month
          </p>

          {/* Horizontal strip layout — works great on mobile and desktop */}
          <ul className="space-y-2">
            {featuredJobs.slice(0, 3).map((job) => {
              const featuredBudget = formatBudget(
                job.budget_min_cents,
                job.budget_max_cents,
                job.currency,
              );
              return (
                <li key={job.id}>
                  <Link
                    href={`/jobs/${job.id}` as '/jobs/[id]'}
                    className="group flex items-center overflow-hidden rounded-xl border border-amber-400/20 bg-gradient-to-r from-amber-950/20 via-card to-card transition-all hover:border-amber-400/40 hover:from-amber-950/30"
                  >
                    {/* Left amber accent bar */}
                    <div className="h-full w-1 shrink-0 self-stretch bg-amber-400/50 group-hover:bg-amber-400/80 transition-colors" />

                    {/* Content */}
                    <div className="min-w-0 flex-1 px-3 py-3 sm:px-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-[0.25em] text-amber-300/80">
                          <Sparkles className="h-2.5 w-2.5" />
                          Featured
                        </span>
                        {job.categories.slice(0, 1).map((c) => (
                          <span key={c} className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-primary">
                            {c}
                          </span>
                        ))}
                      </div>
                      <h3 className="mt-0.5 truncate text-sm font-bold text-text-main transition-colors group-hover:text-amber-200">
                        {job.title}
                      </h3>
                      {featuredBudget && (
                        <p className="mt-0.5 text-xs font-bold text-text-secondary">
                          {featuredBudget}
                        </p>
                      )}
                    </div>

                    {/* Right CTA */}
                    <div className="shrink-0 pr-4">
                      <ArrowRight className="h-4 w-4 text-amber-300/40 transition-all group-hover:translate-x-0.5 group-hover:text-amber-300" />
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {/* Filter chips — sort + category + location, all roll up to
          URL search params so links stay shareable. Industry budget
          flow rides along the right edge of the sort row so the
          headline metric stays in view without claiming a whole hero
          band. */}
      <FilterChips
        activeSort={sortKey}
        activeCategory={category ?? ''}
        activeLocation={location ?? ''}
        activeQuery={q ?? ''}
        industryFlow={industry.totalEur}
        industryJobCount={industry.jobCount}
      />

      {/* ── Jobs table list ────────────────────────────────────────
          Replaces the card grid. Dense rows scale better to 100+
          jobs and read closer to a real "job board" UI. Each row is
          a single Link so the whole row is the click target.

          Featured rows (`featured_until > now`) get an amber accent
          border on the left to call them out without breaking the
          row rhythm. */}
      {!jobs || jobs.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-border-color bg-secondary/40 p-12 text-center">
          <Briefcase className="mx-auto h-10 w-10 text-text-secondary/60" />
          <p className="mt-3 text-text-secondary">
            {isFiltered
              ? 'No jobs match those filters.'
              : 'No jobs posted yet. Be the first — click "Post a job" above.'}
          </p>
        </div>
      ) : (
        <ul className="mt-6 divide-y divide-border-color/40 overflow-hidden rounded-2xl border border-border-color bg-card">
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
              <li key={job.id} className="group">
                <Link
                  href={`/jobs/${job.id}` as '/jobs/[id]'}
                  className={`flex items-center gap-3 px-0 py-3 transition-colors hover:bg-secondary/40 md:gap-6 md:px-5 md:py-4 ${
                    featured ? 'border-l-4 border-l-amber-400/70 pl-3 md:pl-0' : 'px-4 md:px-5'
                  }`}
                >
                  {/* ── Title + meta ─────────────────────────── */}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      {featured && (
                        <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-300/15 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-widest text-amber-300">
                          <Flame className="h-2.5 w-2.5" />
                          Featured
                        </span>
                      )}
                      {job.categories.slice(0, 1).map((c) => (
                        <span key={`cat-${c}`} className="hidden rounded-full bg-primary/10 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-widest text-primary sm:inline-flex">
                          {c}
                        </span>
                      ))}
                    </div>
                    <h3 className="mt-0.5 text-sm font-bold leading-snug text-text-main transition-colors group-hover:text-primary">
                      {job.title}
                    </h3>
                    <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-text-secondary">
                      <span className="inline-flex items-center gap-1 capitalize">
                        <MapPin className="h-3 w-3" />
                        {job.location_kind}
                        {job.location_text ? ` · ${job.location_text}` : ''}
                      </span>
                      {job.requires_verification && (
                        <span className="inline-flex items-center gap-1 text-primary">
                          <ShieldCheck className="h-3 w-3" />
                          Verified only
                        </span>
                      )}
                    </div>
                  </div>

                  {/* ── Poster — desktop only ─────────────────── */}
                  {poster && (
                    <div className="hidden shrink-0 items-center gap-2 text-xs text-text-secondary md:flex md:w-32">
                      <span className="h-6 w-6 shrink-0 overflow-hidden rounded-full bg-secondary">
                        {poster.avatarUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={poster.avatarUrl} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <span className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/40 to-pink-600/40 text-[10px] font-black text-white">
                            {poster.displayName.slice(0, 1).toUpperCase()}
                          </span>
                        )}
                      </span>
                      <span className="min-w-0 truncate">@{poster.handle}</span>
                    </div>
                  )}

                  {/* ── Budget + time ─────────────────────────── */}
                  <div className="shrink-0 text-right">
                    {budget ? (
                      <p className="text-sm font-black text-text-main">{budget}</p>
                    ) : (
                      <p className="text-xs text-text-secondary/40">—</p>
                    )}
                    <p className="mt-0.5 text-[10px] text-text-secondary/60">
                      {job.expires_at ? (
                        <span className="text-amber-300/80">Closes {timeUntil(job.expires_at)}</span>
                      ) : job.published_at ? (
                        timeAgo(job.published_at)
                      ) : null}
                    </p>
                  </div>

                  {/* ── Arrow ─────────────────────────────────── */}
                  <div className="shrink-0 pr-4 md:pr-0">
                    <ArrowRight className="h-4 w-4 text-text-secondary/30 transition-all group-hover:translate-x-0.5 group-hover:text-primary" />
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      <p className="mt-4 text-[11px] text-text-secondary">
        Expired and unpublished jobs are hidden automatically. Showing up to 50
        rows — pagination lands when the catalog crosses that threshold.
      </p>
    </main>
  );
}

// Inline server component — filter chips that update URL search params.
function FilterChips({
  activeSort,
  activeCategory,
  activeLocation,
  activeQuery,
  industryFlow,
  industryJobCount,
}: {
  activeSort: SortKey;
  activeCategory: string;
  activeLocation: string;
  activeQuery: string;
  industryFlow: number;
  industryJobCount: number;
}) {
  const sorts: { v: SortKey; label: string }[] = [
    { v: 'newest', label: 'Newest' },
    { v: 'paid', label: 'Highest paid' },
    { v: 'oldest', label: 'Chronological' },
  ];
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
      sort: activeSort,
      ...overrides,
    };
    Object.entries(merged).forEach(([k, v]) => {
      if (v && (k !== 'sort' || v !== 'newest')) sp.set(k, v);
    });
    const s = sp.toString();
    return s ? `?${s}` : '';
  };

  return (
    <nav className="space-y-3">
      {/* Sort row + industry budget flow metric on the right.
          Mobile: metric stacks above the sort pills. Desktop: metric
          sits on the right edge as a compact "stat chip", so the
          headline number stays in view alongside the sort controls
          without claiming a hero band. */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="text-[10px] font-bold uppercase tracking-widest text-text-secondary/70">
            Sort
          </span>
          {sorts.map((s) => {
            const active = s.v === activeSort;
            return (
              <Link
                key={s.v}
                href={`/jobs${baseQuery({ sort: s.v })}` as '/jobs'}
                className={`rounded-full px-3 py-1 font-bold transition-colors ${
                  active
                    ? 'bg-primary text-white'
                    : 'bg-secondary text-text-secondary hover:text-text-main'
                }`}
              >
                {s.label}
              </Link>
            );
          })}
        </div>

        {/* Inline industry flow chip — same data the old hero band
            displayed, compacted into a single line so it pairs with
            the sort controls instead of competing with them. */}
        <div
          className="inline-flex shrink-0 items-center gap-3 rounded-full border border-primary/30 bg-primary/[0.06] px-3 py-1.5"
          title={`${industryJobCount.toLocaleString()} active jobs · industry budget flow`}
        >
          <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.25em] text-primary">
            <Activity className="h-3 w-3" />
            Flow
          </span>
          <span className="text-base font-black tabular-nums text-text-main">
            {formatCompact(industryFlow, '€')}
          </span>
          <span className="hidden text-[10px] uppercase tracking-widest text-text-secondary sm:inline">
            · {industryJobCount.toLocaleString()} open
          </span>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="text-[10px] font-bold uppercase tracking-widest text-text-secondary/70">
          Category
        </span>
        <Link
          href={`/jobs${baseQuery({ category: '' })}` as '/jobs'}
          className={`rounded-full px-3 py-1 transition-colors ${
            !activeCategory
              ? 'bg-primary text-white'
              : 'bg-secondary text-text-secondary hover:text-text-main'
          }`}
        >
          All
        </Link>
        {cats.map((c) => (
          <Link
            key={c}
            href={`/jobs${baseQuery({ category: c })}` as '/jobs'}
            className={`rounded-full px-3 py-1 capitalize transition-colors ${
              activeCategory === c
                ? 'bg-primary text-white'
                : 'bg-secondary text-text-secondary hover:text-text-main'
            }`}
          >
            {c}
          </Link>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="text-[10px] font-bold uppercase tracking-widest text-text-secondary/70">
          Location
        </span>
        {locs.map((l) => (
          <Link
            key={l.v}
            href={`/jobs${baseQuery({ location: l.v })}` as '/jobs'}
            className={`rounded-full px-3 py-1 transition-colors ${
              activeLocation === l.v
                ? 'bg-primary text-white'
                : 'bg-secondary text-text-secondary hover:text-text-main'
            }`}
          >
            {l.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
