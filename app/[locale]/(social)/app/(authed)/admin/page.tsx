import { Link } from '@/i18n/navigation';
import {
  Users,
  Briefcase,
  Mail,
  Megaphone,
  ShieldCheck,
  ShieldAlert,
  Sparkles,
  ArrowRight,
  Clock,
} from 'lucide-react';
import { requireAdmin } from '@/lib/auth/guards';
import { loadAdminCounts } from '@/lib/admin/counts';

export const dynamic = 'force-dynamic';

/**
 * `/app/admin` — the admin hub landing page.
 *
 * Hero card with the admin's handle + a "what's new" pulse, then a
 * grid of four big section cards (Users / Jobs / Applications /
 * Inquiries) each carrying:
 *   - icon + section name
 *   - headline metric (e.g. "200 users" or "12 new applications")
 *   - one secondary metric (e.g. "8 verified", "6 featured")
 *   - "Open →" link straight into the section
 *
 * Below the grid: a recent-activity feed merging the latest 4
 * applications and latest 4 inquiries into one chronological list, so
 * the admin sees the live pulse without clicking into each subsection.
 */
function timeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const min = Math.floor(ms / 60_000);
  if (min < 1) return 'just now';
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  if (day < 30) return `${day}d ago`;
  return `${Math.floor(day / 30)}mo ago`;
}

export default async function AdminHubPage() {
  const { supabase, profile } = await requireAdmin();
  const counts = await loadAdminCounts(supabase);

  // Latest 4 from each pipeline for the recent-activity feed.
  const [{ data: recentApps }, { data: recentInquiries }] = await Promise.all([
    supabase
      .from('survey_submissions')
      .select('id, name, email, status, created_at')
      .order('created_at', { ascending: false })
      .limit(4),
    supabase
      .from('banner_inquiries')
      .select('id, company, name, email, kinds, status, created_at')
      .order('created_at', { ascending: false })
      .limit(4),
  ]);

  type ActivityItem =
    | { kind: 'app'; id: string; label: string; sub: string; date: string; status: string }
    | { kind: 'inq'; id: string; label: string; sub: string; date: string; status: string };

  const activity: ActivityItem[] = [];
  for (const a of recentApps ?? []) {
    activity.push({
      kind: 'app',
      id: a.id,
      label: a.name || a.email,
      sub: a.name ? a.email : 'Apply BabeHub',
      date: a.created_at,
      status: a.status,
    });
  }
  for (const i of recentInquiries ?? []) {
    activity.push({
      kind: 'inq',
      id: i.id,
      label: i.company || i.name || i.email,
      sub:
        i.kinds.length > 0
          ? i.kinds.map((k: string) => k.replace('_', ' ')).join(', ')
          : 'B2B inquiry',
      date: i.created_at,
      status: i.status,
    });
  }
  activity.sort((a, b) => (a.date < b.date ? 1 : -1));
  const recent = activity.slice(0, 6);

  return (
    <main className="mx-auto max-w-7xl px-4 py-6 md:px-6 md:py-10">
      {/* ── Hero greeting ─────────────────────────────────────────── */}
      <section className="mb-8 overflow-hidden rounded-2xl border border-primary/30 bg-gradient-to-br from-card via-card to-pink-950/30 p-6 md:p-8">
        <p className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.25em] text-primary">
          <ShieldAlert className="h-3 w-3" />
          Admin hub
        </p>
        <h1 className="mt-3 text-2xl font-black tracking-tight text-text-main md:text-3xl">
          Hi {profile.display_name || profile.handle}, welcome back.
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-text-secondary">
          {counts.newApplications + counts.newInquiries === 0
            ? 'No new submissions waiting. The queue is clear.'
            : `${counts.newApplications + counts.newInquiries} new submission${counts.newApplications + counts.newInquiries === 1 ? '' : 's'} are waiting for review.`}
        </p>

        {/* Quick-fire pending counters as colored chips */}
        <div className="mt-5 flex flex-wrap gap-2">
          {counts.newApplications > 0 && (
            <Link
              href={'/app/admin/applications' as never}
              className="inline-flex items-center gap-2 rounded-full bg-primary/15 px-3 py-1.5 text-xs font-bold text-primary transition-all hover:bg-primary hover:text-white"
            >
              <Mail className="h-3.5 w-3.5" />
              {counts.newApplications} new application{counts.newApplications === 1 ? '' : 's'}
              <ArrowRight className="h-3 w-3" />
            </Link>
          )}
          {counts.newInquiries > 0 && (
            <Link
              href={'/app/admin/inquiries' as never}
              className="inline-flex items-center gap-2 rounded-full bg-amber-400/15 px-3 py-1.5 text-xs font-bold text-amber-300 transition-all hover:bg-amber-400 hover:text-black"
            >
              <Megaphone className="h-3.5 w-3.5" />
              {counts.newInquiries} new inquir{counts.newInquiries === 1 ? 'y' : 'ies'}
              <ArrowRight className="h-3 w-3" />
            </Link>
          )}
        </div>
      </section>

      {/* ── Section cards ─────────────────────────────────────────── */}
      <section className="mb-8">
        <h2 className="mb-3 text-[10px] font-bold uppercase tracking-[0.25em] text-text-secondary">
          Sections
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <SectionCard
            href="/app/admin/users"
            icon={<Users className="h-4 w-4" />}
            title="Users"
            headline={counts.users}
            headlineLabel="Total users"
            secondary={[
              { label: 'Verified', value: counts.verified, icon: <ShieldCheck className="h-3 w-3" /> },
              { label: 'Applied', value: counts.applied, icon: <Mail className="h-3 w-3" /> },
            ]}
            accent="primary"
          />
          <SectionCard
            href="/app/admin/jobs"
            icon={<Briefcase className="h-4 w-4" />}
            title="Jobs"
            headline={counts.totalJobs}
            headlineLabel="Posted jobs"
            secondary={[
              { label: 'Featured', value: counts.featuredJobs, icon: <Sparkles className="h-3 w-3" /> },
            ]}
            accent="amber"
          />
          <SectionCard
            href="/app/admin/applications"
            icon={<Mail className="h-4 w-4" />}
            title="Applications"
            headline={counts.totalApplications}
            headlineLabel="Apply BabeHub"
            secondary={[
              { label: 'New', value: counts.newApplications, badge: counts.newApplications > 0 },
            ]}
            accent="primary"
          />
          <SectionCard
            href="/app/admin/inquiries"
            icon={<Megaphone className="h-4 w-4" />}
            title="Inquiries"
            headline={counts.totalInquiries}
            headlineLabel="B2B brand inquiries"
            secondary={[
              { label: 'New', value: counts.newInquiries, badge: counts.newInquiries > 0 },
            ]}
            accent="amber"
          />
        </div>
      </section>

      {/* ── Recent activity feed ──────────────────────────────────── */}
      <section>
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="text-[10px] font-bold uppercase tracking-[0.25em] text-text-secondary">
            Recent activity
          </h2>
          <div className="flex gap-3 text-[10px] font-bold uppercase tracking-widest">
            <Link href={'/app/admin/applications' as never} className="text-primary hover:underline">
              All applications →
            </Link>
            <Link href={'/app/admin/inquiries' as never} className="text-amber-300 hover:underline">
              All inquiries →
            </Link>
          </div>
        </div>
        {recent.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border-color bg-secondary/40 p-12 text-center text-sm text-text-secondary">
            No submissions yet. Once the Apply BabeHub or BannerInquiry modals
            run, entries will surface here.
          </div>
        ) : (
          <ul className="space-y-2">
            {recent.map((item) => (
              <li key={`${item.kind}-${item.id}`}>
                <Link
                  href={
                    (item.kind === 'app'
                      ? '/app/admin/applications'
                      : '/app/admin/inquiries') as never
                  }
                  className="group flex items-center justify-between gap-3 rounded-xl border border-border-color bg-card p-3 transition-colors hover:border-primary/40"
                >
                  <span
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border ${
                      item.kind === 'app'
                        ? 'border-primary/30 bg-primary/10 text-primary'
                        : 'border-amber-400/30 bg-amber-400/10 text-amber-300'
                    }`}
                  >
                    {item.kind === 'app' ? (
                      <Mail className="h-4 w-4" />
                    ) : (
                      <Megaphone className="h-4 w-4" />
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-text-main">
                      {item.label}
                    </p>
                    <p className="truncate text-[11px] text-text-secondary">
                      {item.sub}
                    </p>
                  </div>
                  <span className="hidden text-[10px] font-bold uppercase tracking-widest text-text-secondary sm:inline-flex sm:items-center sm:gap-1">
                    <Clock className="h-3 w-3" />
                    {timeAgo(item.date)}
                  </span>
                  <span
                    className={`hidden shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest md:inline-flex ${
                      item.status === 'new'
                        ? item.kind === 'app'
                          ? 'bg-primary/15 text-primary'
                          : 'bg-amber-400/15 text-amber-300'
                        : 'bg-secondary text-text-secondary'
                    }`}
                  >
                    {item.status}
                  </span>
                  <ArrowRight className="h-3.5 w-3.5 text-text-secondary transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}

/**
 * Big interactive section card. The whole card is one Link so any
 * click target lands on the destination — easier than tap-target
 * fights with multiple buttons inside.
 */
function SectionCard({
  href,
  icon,
  title,
  headline,
  headlineLabel,
  secondary,
  accent,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  headline: number;
  headlineLabel: string;
  secondary: { label: string; value: number; icon?: React.ReactNode; badge?: boolean }[];
  accent: 'primary' | 'amber';
}) {
  const accentBorder =
    accent === 'primary'
      ? 'hover:border-primary/50'
      : 'hover:border-amber-400/50';
  const accentIcon =
    accent === 'primary'
      ? 'border-primary/30 bg-primary/10 text-primary'
      : 'border-amber-400/30 bg-amber-400/10 text-amber-300';
  const accentText =
    accent === 'primary' ? 'text-primary' : 'text-amber-300';
  return (
    <Link
      href={href as never}
      className={`group flex h-full flex-col rounded-2xl border border-border-color bg-card p-5 transition-all hover:scale-[1.02] ${accentBorder}`}
    >
      <div className="flex items-center justify-between">
        <span
          className={`flex h-9 w-9 items-center justify-center rounded-lg border ${accentIcon}`}
        >
          {icon}
        </span>
        <ArrowRight className={`h-4 w-4 text-text-secondary transition-all group-hover:translate-x-0.5 ${accentText.replace('text-', 'group-hover:text-')}`} />
      </div>
      <p className="mt-4 text-[10px] font-bold uppercase tracking-[0.25em] text-text-secondary">
        {title}
      </p>
      <p className="mt-1 text-3xl font-black text-text-main">
        {headline.toLocaleString()}
      </p>
      <p className="text-xs text-text-secondary">{headlineLabel}</p>
      <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-text-secondary">
        {secondary.map((s) => (
          <span key={s.label} className="inline-flex items-center gap-1">
            {s.icon}
            <span className="font-bold text-text-main">{s.value.toLocaleString()}</span>
            {s.label}
            {s.badge && s.value > 0 && (
              <span className={`ml-0.5 inline-block h-1.5 w-1.5 rounded-full ${accent === 'primary' ? 'bg-primary' : 'bg-amber-400'}`} />
            )}
          </span>
        ))}
      </div>
    </Link>
  );
}
