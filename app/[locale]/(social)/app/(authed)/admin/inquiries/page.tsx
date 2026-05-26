import { ShieldAlert, Mail, MessageSquare, Calendar, Globe, Building2, Megaphone, Briefcase, Sparkles } from 'lucide-react';
import { requireAdmin } from '@/lib/auth/guards';
import SubmissionStatusButtons from '../_components/SubmissionStatusButtons';
import SubmissionDeleteButton from '../_components/SubmissionDeleteButton';

export const dynamic = 'force-dynamic';

/**
 * `/app/admin/inquiries` — B2B sponsored-banner / featured-job /
 * collab inquiry queue.
 *
 * Reads `public.banner_inquiries` directly (no more Airtable round-
 * trip). Each row carries the multi-select `kinds[]` array, plus
 * optional company / website / budget / timeline / message and the
 * required email.
 *
 * Same workflow as /app/admin/applications: new → reviewing →
 * contacted → accepted | rejected.
 */
const KIND_LABEL: Record<string, string> = {
  banner: 'Sponsored banner',
  featured_job: 'Featured job',
  collab: 'Creator collab',
};

const KIND_ICON: Record<string, React.ReactNode> = {
  banner: <Megaphone className="h-3 w-3" />,
  featured_job: <Briefcase className="h-3 w-3" />,
  collab: <Sparkles className="h-3 w-3" />,
};

type Status = 'new' | 'reviewing' | 'contacted' | 'accepted' | 'rejected';

const STATUS_TONE: Record<Status, string> = {
  new: 'bg-amber-400/15 text-amber-300',
  reviewing: 'bg-sky-400/15 text-sky-300',
  contacted: 'bg-primary/15 text-primary',
  accepted: 'bg-green-500/15 text-green-400',
  rejected: 'bg-red-500/15 text-red-400',
};

function formatDate(iso: string): string {
  const d = new Date(iso);
  return `${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} · ${d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
}

export default async function AdminInquiriesPage() {
  const { supabase } = await requireAdmin();

  const { data: rows } = await supabase
    .from('banner_inquiries')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(200);

  const total = rows?.length ?? 0;
  const byStatus = (s: Status) => (rows ?? []).filter((r) => r.status === s).length;

  return (
    <main className="mx-auto max-w-7xl px-4 py-6 md:px-6 md:py-10">
      <header className="mb-6">
        <p className="inline-flex items-center gap-2 rounded-full border border-amber-400/40 bg-amber-400/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.25em] text-amber-300">
          <ShieldAlert className="h-3 w-3" />
          Admin · Inquiries
        </p>
        <h1 className="mt-3 text-2xl font-black tracking-tight text-text-main md:text-3xl">
          B2B banner inquiries
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-text-secondary">
          Brand-side submissions from the BannerInquiryModal (banner /
          featured job / collab). Status changes record{' '}
          <code className="rounded bg-secondary px-1 font-mono text-[11px]">reviewed_by</code> +{' '}
          <code className="rounded bg-secondary px-1 font-mono text-[11px]">reviewed_at</code>.
        </p>
      </header>

      <section className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-5">
        <Counter label="Total" value={total} />
        <Counter label="New" value={byStatus('new')} accent="amber" />
        <Counter label="Reviewing" value={byStatus('reviewing')} accent="sky" />
        <Counter label="Contacted" value={byStatus('contacted')} accent="primary" />
        <Counter label="Accepted" value={byStatus('accepted')} accent="green" />
      </section>

      {!rows || rows.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border-color bg-secondary/40 p-12 text-center">
          <Megaphone className="mx-auto h-10 w-10 text-text-secondary/60" />
          <p className="mt-3 text-text-secondary">
            No inquiries yet. Submissions from the &quot;Pitch a slot&quot; modals land here.
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {rows.map((r) => (
            <li
              key={r.id}
              className="overflow-hidden rounded-2xl border border-border-color bg-card"
            >
              <div className="flex flex-wrap items-start justify-between gap-3 p-4 md:p-5">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-bold text-text-main">
                      {r.company || r.name || <span className="italic text-text-secondary">Anonymous brand</span>}
                    </p>
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest ${STATUS_TONE[r.status as Status]}`}
                    >
                      {r.status}
                    </span>
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-text-secondary">
                    <a
                      href={`mailto:${r.email}`}
                      className="inline-flex items-center gap-1 hover:text-amber-300"
                    >
                      <Mail className="h-3 w-3" />
                      {r.email}
                    </a>
                    {r.telegram && (
                      <span className="inline-flex items-center gap-1">
                        <MessageSquare className="h-3 w-3" />
                        {r.telegram}
                      </span>
                    )}
                    {r.website && (
                      <a
                        href={
                          r.website.startsWith('http')
                            ? r.website
                            : `https://${r.website}`
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 hover:text-amber-300"
                      >
                        <Globe className="h-3 w-3" />
                        {r.website}
                      </a>
                    )}
                    <span className="inline-flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {formatDate(r.created_at)}
                    </span>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <SubmissionStatusButtons id={r.id} kind="inquiry" current={r.status as Status} />
                  <SubmissionDeleteButton id={r.id} kind="inquiry" />
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 border-t border-border-color/40 px-4 py-3 md:px-5">
                <p className="text-[10px] font-bold uppercase tracking-widest text-text-secondary">
                  Wants:
                </p>
                {r.kinds.length === 0 ? (
                  <span className="text-xs text-text-secondary/40">—</span>
                ) : (
                  r.kinds.map((k: string) => (
                    <span
                      key={k}
                      className="inline-flex items-center gap-1 rounded-full bg-amber-400/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-amber-300"
                    >
                      {KIND_ICON[k] ?? <Sparkles className="h-3 w-3" />}
                      {KIND_LABEL[k] ?? k}
                    </span>
                  ))
                )}
                {r.budget && (
                  <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-text-main/[0.05] px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-text-main">
                    <Building2 className="h-3 w-3" />
                    Budget · {r.budget}
                  </span>
                )}
                {r.timeline && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-text-main/[0.05] px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-text-main">
                    Timeline · {r.timeline}
                  </span>
                )}
              </div>

              {r.message && (
                <div className="border-t border-border-color/40 px-4 py-3 text-xs md:px-5">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-text-secondary">
                    Message
                  </p>
                  <p className="mt-1 whitespace-pre-wrap text-text-main">{r.message}</p>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}

function Counter({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent?: 'primary' | 'sky' | 'amber' | 'green';
}) {
  const tone =
    accent === 'primary'
      ? 'text-primary'
      : accent === 'sky'
        ? 'text-sky-300'
        : accent === 'amber'
          ? 'text-amber-300'
          : accent === 'green'
            ? 'text-green-400'
            : 'text-text-main';
  return (
    <div className="rounded-xl border border-border-color bg-card p-3">
      <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-text-secondary">
        {label}
      </p>
      <p className={`mt-1 text-xl font-black ${tone}`}>{value.toLocaleString()}</p>
    </div>
  );
}
