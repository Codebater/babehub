import { BarChart3, ShieldAlert, TrendingDown, Eye, Users, FileText } from 'lucide-react';
import { requireAdmin } from '@/lib/auth/guards';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

type Row = { name: string; session_id: string | null; path: string | null; created_at: string };

const LOCALE_RE = /^\/(en|de|es|fr|ja|pt|th)(?=\/|$)/;
function normalizePath(p: string | null): string {
  if (!p) return '/';
  let s = p.replace(LOCALE_RE, '');
  s = s.split('?')[0].replace(/\/+$/, '');
  return s || '/';
}

/** Unique sessions that fired ANY of the given event names. */
function uSessions(rows: Row[], names: string[]): number {
  const set = new Set<string>();
  for (const r of rows) {
    if (names.includes(r.name)) set.add(r.session_id ?? `row-${r.created_at}`);
  }
  return set.size;
}

export default async function AdminAnalyticsPage() {
  await requireAdmin();
  const db = createAdminClient() as any;

  const now = Date.now();
  const d30 = new Date(now - 30 * 864e5).toISOString();
  const d7 = new Date(now - 7 * 864e5).toISOString();

  const { data } = await db
    .from('analytics_events')
    .select('name, session_id, path, created_at')
    .gte('created_at', d30)
    .order('created_at', { ascending: false })
    .limit(200000);

  const all: Row[] = data ?? [];
  const r7 = all.filter((x) => x.created_at >= d7);

  // ── Traffic ───────────────────────────────────────────────────────────
  const pv = all.filter((x) => x.name === 'pageview');
  const pv7 = r7.filter((x) => x.name === 'pageview');
  const pageviews30 = pv.length;
  const pageviews7 = pv7.length;
  const visitors30 = new Set(pv.map((x) => x.session_id ?? '')).size;
  const visitors7 = new Set(pv7.map((x) => x.session_id ?? '')).size;

  const pageTally = new Map<string, number>();
  for (const x of pv) {
    const k = normalizePath(x.path);
    pageTally.set(k, (pageTally.get(k) ?? 0) + 1);
  }
  const topPages = [...pageTally.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10);

  // ── Apply funnel (quick + full combined) ──────────────────────────────
  const opened30 = uSessions(all, ['apply_open']);
  const submitPressed30 = uSessions(all, ['quick_apply_submit', 'apply_submit']);
  const submitted30 = uSessions(all, ['quick_apply_success', 'apply_success']);
  const wentDetailed30 = uSessions(all, ['apply_step2']);
  const conv = opened30 > 0 ? Math.round((submitted30 / opened30) * 100) : 0;

  const funnel = [
    { label: 'Opened the apply form', count: opened30, c7: uSessions(r7, ['apply_open']) },
    { label: 'Pressed submit', count: submitPressed30, c7: uSessions(r7, ['quick_apply_submit', 'apply_submit']) },
    { label: 'Submitted successfully', count: submitted30, c7: uSessions(r7, ['quick_apply_success', 'apply_success']) },
  ];

  const { count: dbSubs } = await db
    .from('survey_submissions')
    .select('id', { count: 'exact', head: true });

  const empty = all.length === 0;

  return (
    <main className="mx-auto max-w-3xl px-4 py-6 md:px-6 md:py-10">
      <header className="mb-6">
        <p className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.25em] text-primary">
          <ShieldAlert className="h-3 w-3" />
          Admin · Analytics
        </p>
        <h1 className="mt-3 text-2xl font-black tracking-tight text-text-main md:text-3xl">
          Traffic & apply funnel
        </h1>
        <p className="mt-1 text-sm text-text-secondary">
          Anonymous, session-based. Last 30 days (7-day figures shown alongside).
        </p>
      </header>

      {empty ? (
        <div className="rounded-2xl border border-dashed border-border-color bg-secondary/40 px-6 py-12 text-center">
          <BarChart3 className="mx-auto mb-3 h-8 w-8 text-text-secondary/40" />
          <p className="text-sm text-text-secondary">
            No data yet — once visitors arrive, traffic and the apply funnel populate here.
          </p>
        </div>
      ) : (
        <>
          {/* ── Website traffic ──────────────────────────────────── */}
          <section className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat icon={<Eye className="h-4 w-4" />} label="Page views 30d" value={pageviews30} sub={`${pageviews7} in 7d`} />
            <Stat icon={<Users className="h-4 w-4" />} label="Visitors 30d" value={visitors30} sub={`${visitors7} in 7d`} accent="sky" />
            <Stat icon={<FileText className="h-4 w-4" />} label="Submitted 30d" value={submitted30} accent="green" />
            <Stat icon={<BarChart3 className="h-4 w-4" />} label="Open→Submit" value={`${conv}%`} accent="primary" />
          </section>

          {/* ── Apply funnel ─────────────────────────────────────── */}
          <section className="mb-6 rounded-2xl border border-border-color bg-card p-5">
            <h2 className="mb-4 text-[10px] font-bold uppercase tracking-[0.25em] text-text-secondary/70">
              Apply funnel (unique people · 30d)
            </h2>
            <div className="space-y-3">
              {funnel.map((s, i) => {
                const pct = opened30 > 0 ? Math.round((s.count / opened30) * 100) : 0;
                const prev = i > 0 ? funnel[i - 1].count : s.count;
                const drop = prev > 0 ? Math.round(((prev - s.count) / prev) * 100) : 0;
                return (
                  <div key={s.label}>
                    <div className="mb-1 flex items-center justify-between text-xs">
                      <span className="font-medium text-text-main">{s.label}</span>
                      <span className="tabular-nums text-text-secondary">
                        <span className="font-bold text-text-main">{s.count}</span>
                        <span className="text-text-secondary/60"> · {pct}%</span>
                        <span className="ml-2 text-[10px] text-text-secondary/50">7d: {s.c7}</span>
                      </span>
                    </div>
                    <div className="h-2.5 w-full overflow-hidden rounded-full bg-secondary">
                      <div className="h-full rounded-full bg-gradient-to-r from-primary to-pink-500" style={{ width: `${pct}%` }} />
                    </div>
                    {i > 0 && drop > 0 && (
                      <p className="mt-0.5 inline-flex items-center gap-1 text-[10px] text-red-400/80">
                        <TrendingDown className="h-2.5 w-2.5" />
                        {drop}% dropped off here
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
            <p className="mt-3 text-[11px] text-text-secondary/70">
              {wentDetailed30} {wentDetailed30 === 1 ? 'person' : 'people'} switched to the detailed
              application · {dbSubs ?? 0} total submissions saved (all time).
            </p>
          </section>

          {/* ── Top pages ────────────────────────────────────────── */}
          <section className="rounded-2xl border border-border-color bg-card p-5">
            <h2 className="mb-4 text-[10px] font-bold uppercase tracking-[0.25em] text-text-secondary/70">
              Top pages (30d)
            </h2>
            {topPages.length === 0 ? (
              <p className="text-xs text-text-secondary">No page views recorded yet.</p>
            ) : (
              <ul className="space-y-1.5">
                {topPages.map(([path, n]) => {
                  const pct = pageviews30 > 0 ? Math.round((n / pageviews30) * 100) : 0;
                  return (
                    <li key={path} className="flex items-center gap-3">
                      <span className="w-40 shrink-0 truncate font-mono text-[11px] text-text-main">{path}</span>
                      <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-secondary">
                        <span className="block h-full rounded-full bg-sky-400/70" style={{ width: `${pct}%` }} />
                      </span>
                      <span className="w-12 shrink-0 text-right text-[11px] tabular-nums text-text-secondary">{n}</span>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </>
      )}
    </main>
  );
}

function Stat({
  icon,
  label,
  value,
  sub,
  accent,
}: {
  icon?: React.ReactNode;
  label: string;
  value: number | string;
  sub?: string;
  accent?: 'primary' | 'green' | 'sky';
}) {
  const tone =
    accent === 'primary' ? 'text-primary'
    : accent === 'green' ? 'text-green-400'
    : accent === 'sky' ? 'text-sky-300'
    : 'text-text-main';
  return (
    <div className="rounded-xl border border-border-color bg-card p-3">
      <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-text-secondary">
        {icon}{label}
      </p>
      <p className={`mt-1 text-2xl font-black ${tone}`}>{value}</p>
      {sub && <p className="text-[10px] text-text-secondary/60">{sub}</p>}
    </div>
  );
}
