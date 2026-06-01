import { BarChart3, ShieldAlert, TrendingDown } from 'lucide-react';
import { requireAdmin } from '@/lib/auth/guards';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

type Row = { name: string; session_id: string | null; created_at: string };

// Steps of the creator apply funnel, in order.
const FUNNEL: { name: string; label: string }[] = [
  { name: 'apply_open', label: 'Opened the form' },
  { name: 'apply_step2', label: 'Reached step 2 (platform)' },
  { name: 'apply_step3', label: 'Reached step 3 (contact)' },
  { name: 'apply_submit', label: 'Pressed submit' },
  { name: 'apply_success', label: 'Submitted successfully' },
];

/** Unique sessions that fired each event in the row set. */
function uniqueByEvent(rows: Row[]): Map<string, Set<string>> {
  const m = new Map<string, Set<string>>();
  for (const r of rows) {
    const sid = r.session_id ?? `row-${r.created_at}`;
    if (!m.has(r.name)) m.set(r.name, new Set());
    m.get(r.name)!.add(sid);
  }
  return m;
}

export default async function AdminAnalyticsPage() {
  await requireAdmin();
  const db = createAdminClient() as any;

  const now = Date.now();
  const d30 = new Date(now - 30 * 864e5).toISOString();
  const d7 = new Date(now - 7 * 864e5).toISOString();

  const { data: rows30 } = await db
    .from('analytics_events')
    .select('name, session_id, created_at')
    .gte('created_at', d30)
    .order('created_at', { ascending: false })
    .limit(100000);

  const all: Row[] = rows30 ?? [];
  const rows7 = all.filter((r) => r.created_at >= d7);

  const u30 = uniqueByEvent(all);
  const u7 = uniqueByEvent(rows7);

  const count = (m: Map<string, Set<string>>, name: string) => m.get(name)?.size ?? 0;

  const opens30 = count(u30, 'apply_open');
  const success30 = count(u30, 'apply_success');
  const errors30 = count(u30, 'apply_error');
  const overallConv = opens30 > 0 ? Math.round((success30 / opens30) * 100) : 0;

  // Completed submissions in the DB (cross-check against the funnel).
  const { count: dbSubs } = await db
    .from('survey_submissions')
    .select('id', { count: 'exact', head: true });

  const totalEvents = all.length;

  return (
    <main className="mx-auto max-w-3xl px-4 py-6 md:px-6 md:py-10">
      <header className="mb-6">
        <p className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.25em] text-primary">
          <ShieldAlert className="h-3 w-3" />
          Admin · Analytics
        </p>
        <h1 className="mt-3 text-2xl font-black tracking-tight text-text-main md:text-3xl">
          Apply funnel
        </h1>
        <p className="mt-1 text-sm text-text-secondary">
          How many people open the application and where they drop off. Anonymous,
          session-based — last 30 days.
        </p>
      </header>

      {totalEvents === 0 ? (
        <div className="rounded-2xl border border-dashed border-border-color bg-secondary/40 px-6 py-12 text-center">
          <BarChart3 className="mx-auto mb-3 h-8 w-8 text-text-secondary/40" />
          <p className="text-sm text-text-secondary">
            No funnel data yet. Once visitors start opening the apply form, the funnel
            will populate here.
          </p>
        </div>
      ) : (
        <>
          {/* Headline numbers */}
          <section className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat label="Opened (30d)" value={opens30} />
            <Stat label="Submitted (30d)" value={success30} accent="green" />
            <Stat label="Open→Submit" value={`${overallConv}%`} accent="primary" />
            <Stat label="Errors" value={errors30} accent={errors30 > 0 ? 'red' : undefined} />
          </section>

          {/* Funnel bars */}
          <section className="rounded-2xl border border-border-color bg-card p-5">
            <h2 className="mb-4 text-[10px] font-bold uppercase tracking-[0.25em] text-text-secondary/70">
              Funnel (unique people · 30d)
            </h2>
            <div className="space-y-3">
              {FUNNEL.map((step, i) => {
                const c = count(u30, step.name);
                const c7 = count(u7, step.name);
                const pct = opens30 > 0 ? Math.round((c / opens30) * 100) : 0;
                const prev = i > 0 ? count(u30, FUNNEL[i - 1].name) : c;
                const dropFromPrev = prev > 0 ? Math.round(((prev - c) / prev) * 100) : 0;
                return (
                  <div key={step.name}>
                    <div className="mb-1 flex items-center justify-between text-xs">
                      <span className="font-medium text-text-main">{step.label}</span>
                      <span className="tabular-nums text-text-secondary">
                        <span className="font-bold text-text-main">{c}</span>
                        <span className="text-text-secondary/60"> · {pct}%</span>
                        <span className="ml-2 text-[10px] text-text-secondary/50">7d: {c7}</span>
                      </span>
                    </div>
                    <div className="h-2.5 w-full overflow-hidden rounded-full bg-secondary">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-primary to-pink-500 transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    {i > 0 && dropFromPrev > 0 && (
                      <p className="mt-0.5 inline-flex items-center gap-1 text-[10px] text-red-400/80">
                        <TrendingDown className="h-2.5 w-2.5" />
                        {dropFromPrev}% dropped off here
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          <p className="mt-4 text-[11px] text-text-secondary">
            Cross-check: {dbSubs ?? 0} completed application{(dbSubs ?? 0) === 1 ? '' : 's'} saved
            in the database (all time). Funnel counts are unique anonymous sessions and only
            cover visits since tracking went live.
          </p>
        </>
      )}
    </main>
  );
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: number | string;
  accent?: 'primary' | 'green' | 'red';
}) {
  const tone =
    accent === 'primary'
      ? 'text-primary'
      : accent === 'green'
        ? 'text-green-400'
        : accent === 'red'
          ? 'text-red-400'
          : 'text-text-main';
  return (
    <div className="rounded-xl border border-border-color bg-card p-3">
      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-text-secondary">{label}</p>
      <p className={`mt-1 text-2xl font-black ${tone}`}>{value}</p>
    </div>
  );
}
