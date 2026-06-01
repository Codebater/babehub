import { Link } from '@/i18n/navigation';
import {
  Users,
  Briefcase,
  Mail,
  Megaphone,
  ShieldAlert,
  ArrowRight,
  Clock,
  Film,
  MessageSquare,
  BarChart3,
  FileText,
  Image as ImageIcon,
  Bell,
  CheckCircle2,
} from 'lucide-react';
import { requireAdmin } from '@/lib/auth/guards';
import { loadAdminCounts } from '@/lib/admin/counts';

export const dynamic = 'force-dynamic';

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

  type ActivityItem = { kind: 'app' | 'inq'; id: string; label: string; sub: string; date: string; status: string };
  const activity: ActivityItem[] = [];
  for (const a of recentApps ?? [])
    activity.push({ kind: 'app', id: a.id, label: a.name || a.email, sub: a.name ? a.email : 'Apply BabeHub', date: a.created_at, status: a.status });
  for (const i of recentInquiries ?? [])
    activity.push({ kind: 'inq', id: i.id, label: i.company || i.name || i.email, sub: i.kinds.length ? i.kinds.map((k: string) => k.replace('_', ' ')).join(', ') : 'B2B inquiry', date: i.created_at, status: i.status });
  activity.sort((a, b) => (a.date < b.date ? 1 : -1));
  const recent = activity.slice(0, 6);

  // "Needs attention" — only the things with pending work.
  const attention = [
    { n: counts.newApplications, href: '/app/admin/applications', label: 'application', icon: <Mail className="h-3.5 w-3.5" />, tone: 'primary' as const },
    { n: counts.pendingVideos, href: '/app/admin/videos', label: 'video to review', icon: <Film className="h-3.5 w-3.5" />, tone: 'amber' as const },
    { n: counts.unreadChats, href: '/app/admin/chat', label: 'unread chat', icon: <MessageSquare className="h-3.5 w-3.5" />, tone: 'primary' as const },
    { n: counts.newInquiries, href: '/app/admin/inquiries', label: 'brand inquiry', icon: <Megaphone className="h-3.5 w-3.5" />, tone: 'amber' as const },
  ].filter((a) => a.n > 0);

  const totalPending = attention.reduce((s, a) => s + a.n, 0);

  return (
    <main className="mx-auto max-w-7xl px-4 py-6 md:px-6 md:py-10">
      {/* ── Hero ─────────────────────────────────────────────────── */}
      <section className="mb-6 overflow-hidden rounded-2xl border border-primary/30 bg-gradient-to-br from-card via-card to-pink-950/30 p-6 md:p-8">
        <p className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.25em] text-primary">
          <ShieldAlert className="h-3 w-3" />
          Admin
        </p>
        <h1 className="mt-3 text-2xl font-black tracking-tight text-text-main md:text-3xl">
          Hi {profile.display_name || profile.handle}.
        </h1>
        <p className="mt-1.5 text-sm text-text-secondary">
          {totalPending === 0
            ? 'Everything is handled — no pending work right now.'
            : `${totalPending} item${totalPending === 1 ? '' : 's'} need your attention.`}
        </p>
      </section>

      {/* ── Needs attention ─────────────────────────────────────── */}
      <section className="mb-8">
        <h2 className="mb-3 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.25em] text-text-secondary">
          <Bell className="h-3 w-3" />
          Needs attention
        </h2>
        {attention.length === 0 ? (
          <div className="flex items-center gap-3 rounded-2xl border border-green-400/25 bg-green-400/5 px-5 py-4">
            <CheckCircle2 className="h-5 w-5 shrink-0 text-green-400" />
            <p className="text-sm text-green-300/90">All clear — nothing waiting in any queue.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {attention.map((a) => (
              <Link
                key={a.href}
                href={a.href as never}
                className={`group flex items-center gap-3 rounded-2xl border p-4 transition-all hover:scale-[1.02] ${
                  a.tone === 'primary' ? 'border-primary/40 bg-primary/8 hover:border-primary' : 'border-amber-400/40 bg-amber-400/8 hover:border-amber-400'
                }`}
              >
                <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${a.tone === 'primary' ? 'bg-primary/15 text-primary' : 'bg-amber-400/15 text-amber-300'}`}>
                  {a.icon}
                </span>
                <div className="min-w-0">
                  <p className="text-xl font-black leading-none text-text-main">{a.n}</p>
                  <p className="mt-0.5 text-[11px] text-text-secondary">
                    {a.label}{a.n === 1 ? '' : 's'} waiting
                  </p>
                </div>
                <ArrowRight className="ml-auto h-4 w-4 shrink-0 text-text-secondary transition-transform group-hover:translate-x-0.5" />
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* ── All sections ────────────────────────────────────────── */}
      <Group title="People & pipeline">
        <Tile href="/app/admin/users" icon={<Users className="h-4 w-4" />} title="Users" value={counts.users} sub={`${counts.verified} verified`} accent="primary" />
        <Tile href="/app/admin/applications" icon={<Mail className="h-4 w-4" />} title="Applications" value={counts.totalApplications} sub={counts.newApplications > 0 ? `${counts.newApplications} new` : 'all reviewed'} pending={counts.newApplications} accent="primary" />
        <Tile href="/app/admin/videos" icon={<Film className="h-4 w-4" />} title="Videos" value={counts.pendingVideos} sub={counts.pendingVideos > 0 ? 'to review' : 'queue clear'} pending={counts.pendingVideos} accent="amber" />
        <Tile href="/app/admin/inquiries" icon={<Megaphone className="h-4 w-4" />} title="Inquiries" value={counts.totalInquiries} sub={counts.newInquiries > 0 ? `${counts.newInquiries} new` : 'B2B brands'} pending={counts.newInquiries} accent="amber" />
      </Group>

      <Group title="Content">
        <Tile href="/app/admin/jobs" icon={<Briefcase className="h-4 w-4" />} title="Jobs" value={counts.totalJobs} sub={`${counts.featuredJobs} featured`} accent="amber" />
        <Tile href="/app/admin/blog" icon={<FileText className="h-4 w-4" />} title="Blog" value={counts.blogPosts} sub={counts.blogDrafts > 0 ? `${counts.blogDrafts} drafts` : 'published'} accent="primary" />
        <Tile href="/app/admin/marketing" icon={<ImageIcon className="h-4 w-4" />} title="Marketing" value="—" sub="site images" accent="sky" />
      </Group>

      <Group title="Comms & insights">
        <Tile href="/app/admin/chat" icon={<MessageSquare className="h-4 w-4" />} title="Chat" value={counts.totalChats} sub={counts.unreadChats > 0 ? `${counts.unreadChats} unread` : 'all read'} pending={counts.unreadChats} accent="primary" />
        <Tile href="/app/admin/analytics" icon={<BarChart3 className="h-4 w-4" />} title="Analytics" value="↗" sub="traffic & funnel" accent="sky" />
      </Group>

      {/* ── Recent activity ─────────────────────────────────────── */}
      <section className="mt-2">
        <h2 className="mb-3 text-[10px] font-bold uppercase tracking-[0.25em] text-text-secondary">Recent activity</h2>
        {recent.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border-color bg-secondary/40 p-10 text-center text-sm text-text-secondary">
            No submissions yet. Applications and inquiries will surface here as they arrive.
          </div>
        ) : (
          <ul className="space-y-2">
            {recent.map((item) => (
              <li key={`${item.kind}-${item.id}`}>
                <Link
                  href={(item.kind === 'app' ? '/app/admin/applications' : '/app/admin/inquiries') as never}
                  className="group flex items-center justify-between gap-3 rounded-xl border border-border-color bg-card p-3 transition-colors hover:border-primary/40"
                >
                  <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border ${item.kind === 'app' ? 'border-primary/30 bg-primary/10 text-primary' : 'border-amber-400/30 bg-amber-400/10 text-amber-300'}`}>
                    {item.kind === 'app' ? <Mail className="h-4 w-4" /> : <Megaphone className="h-4 w-4" />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-text-main">{item.label}</p>
                    <p className="truncate text-[11px] text-text-secondary">{item.sub}</p>
                  </div>
                  <span className="hidden text-[10px] font-bold uppercase tracking-widest text-text-secondary sm:inline-flex sm:items-center sm:gap-1">
                    <Clock className="h-3 w-3" />
                    {timeAgo(item.date)}
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

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-6">
      <h2 className="mb-3 text-[10px] font-bold uppercase tracking-[0.25em] text-text-secondary">{title}</h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">{children}</div>
    </section>
  );
}

function Tile({
  href,
  icon,
  title,
  value,
  sub,
  pending,
  accent,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  value: number | string;
  sub: string;
  pending?: number;
  accent: 'primary' | 'amber' | 'sky';
}) {
  const iconCls =
    accent === 'primary' ? 'border-primary/30 bg-primary/10 text-primary'
    : accent === 'amber' ? 'border-amber-400/30 bg-amber-400/10 text-amber-300'
    : 'border-sky-400/30 bg-sky-400/10 text-sky-300';
  return (
    <Link
      href={href as never}
      className="group relative flex flex-col rounded-2xl border border-border-color bg-card p-4 transition-all hover:scale-[1.02] hover:border-primary/40"
    >
      <div className="flex items-center justify-between">
        <span className={`flex h-9 w-9 items-center justify-center rounded-lg border ${iconCls}`}>{icon}</span>
        {pending !== undefined && pending > 0 && (
          <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-bold text-white">
            {pending}
          </span>
        )}
      </div>
      <p className="mt-3 text-[10px] font-bold uppercase tracking-[0.2em] text-text-secondary">{title}</p>
      <p className="mt-0.5 text-2xl font-black text-text-main">
        {typeof value === 'number' ? value.toLocaleString() : value}
      </p>
      <p className="text-[11px] text-text-secondary">{sub}</p>
    </Link>
  );
}
