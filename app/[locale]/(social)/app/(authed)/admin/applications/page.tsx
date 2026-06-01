import { ShieldAlert, Mail, Globe, MessageSquare, Calendar, ExternalLink } from 'lucide-react';
import { requireAdmin } from '@/lib/auth/guards';
import SubmissionStatusButtons from '../_components/SubmissionStatusButtons';
import SubmissionDeleteButton from '../_components/SubmissionDeleteButton';

export const dynamic = 'force-dynamic';

/**
 * `/app/admin/applications` — Apply BabeHub creator-side survey queue.
 *
 * Reads `public.survey_submissions` directly (no more Airtable round-
 * trip). Each row shows: submitter contact, social presence, country,
 * goals, the checkbox flags, current status, and a per-row status
 * workflow (new → reviewing → contacted → accepted | rejected).
 *
 * RLS already restricts SELECT to admins, so the guard + the table's
 * policy together mean this query simply returns nothing for a wrong-
 * role caller. The `requireAdmin()` guard is the user-facing redirect.
 */
function formatDate(iso: string): string {
  const d = new Date(iso);
  return `${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} · ${d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
}

function yn(v: boolean | null): string {
  if (v === true) return 'Yes';
  if (v === false) return 'No';
  return '—';
}

type Status = 'new' | 'reviewing' | 'contacted' | 'accepted' | 'rejected';

const STATUS_TONE: Record<Status, string> = {
  new: 'bg-primary/15 text-primary',
  reviewing: 'bg-sky-400/15 text-sky-300',
  contacted: 'bg-amber-400/15 text-amber-300',
  accepted: 'bg-green-500/15 text-green-400',
  rejected: 'bg-red-500/15 text-red-400',
};

export default async function AdminApplicationsPage() {
  const { supabase } = await requireAdmin();

  const { data: rows } = await supabase
    .from('survey_submissions')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(200);

  const total = rows?.length ?? 0;
  const byStatus = (s: Status) => (rows ?? []).filter((r) => r.status === s).length;

  return (
    <main className="mx-auto max-w-7xl px-4 py-6 md:px-6 md:py-10">
      <header className="mb-6">
        <p className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.25em] text-primary">
          <ShieldAlert className="h-3 w-3" />
          Admin · Applications
        </p>
        <h1 className="mt-3 text-2xl font-black tracking-tight text-text-main md:text-3xl">
          Apply BabeHub submissions
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-text-secondary">
          Creator-side survey submissions. Status changes auto-record{' '}
          <code className="rounded bg-secondary px-1 font-mono text-[11px]">reviewed_by</code> +{' '}
          <code className="rounded bg-secondary px-1 font-mono text-[11px]">reviewed_at</code>.
        </p>
      </header>

      <section className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-5">
        <Counter label="Total" value={total} />
        <Counter label="New" value={byStatus('new')} accent="primary" />
        <Counter label="Reviewing" value={byStatus('reviewing')} accent="sky" />
        <Counter label="Contacted" value={byStatus('contacted')} accent="amber" />
        <Counter label="Accepted" value={byStatus('accepted')} accent="green" />
      </section>

      {!rows || rows.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border-color bg-secondary/40 p-12 text-center">
          <Mail className="mx-auto h-10 w-10 text-text-secondary/60" />
          <p className="mt-3 text-text-secondary">
            No applications yet. Submissions from the Apply BabeHub modal land here.
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
                      {r.name || <span className="italic text-text-secondary">Anonymous</span>}
                    </p>
                    {(() => {
                      const g = (r as { gender?: string | null }).gender;
                      if (!g) return null;
                      const label = g === 'non_binary' ? 'Non-binary' : g.charAt(0).toUpperCase() + g.slice(1);
                      const tone = g === 'woman' ? 'bg-pink-500/15 text-pink-400' : g === 'man' ? 'bg-sky-500/15 text-sky-300' : 'bg-amber-400/15 text-amber-300';
                      return (
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest ${tone}`}>
                          {label}
                        </span>
                      );
                    })()}
                    {r.is_active_creator !== null && (
                      <span className="inline-flex rounded-full bg-secondary px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-text-secondary">
                        {r.is_active_creator ? 'Pro' : 'Beginner'}
                      </span>
                    )}
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest ${STATUS_TONE[r.status as Status]}`}
                    >
                      {r.status}
                    </span>
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-text-secondary">
                    <a
                      href={`mailto:${r.email}`}
                      className="inline-flex items-center gap-1 hover:text-primary"
                    >
                      <Mail className="h-3 w-3" />
                      {r.email}
                    </a>
                    {r.whatsapp && (
                      <span className="inline-flex items-center gap-1">
                        <MessageSquare className="h-3 w-3" />
                        {r.whatsapp}
                      </span>
                    )}
                    {r.country && (
                      <span className="inline-flex items-center gap-1">
                        <Globe className="h-3 w-3" />
                        {r.country}
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {formatDate(r.created_at)}
                    </span>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <SubmissionStatusButtons id={r.id} kind="survey" current={r.status as Status} />
                  <SubmissionDeleteButton id={r.id} kind="survey" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-x-4 gap-y-2 border-t border-border-color/40 px-4 py-3 text-xs text-text-secondary md:grid-cols-4 md:px-5">
                <Field label="Over 18" value={yn(r.is_over_18)} />
                <Field label="Active creator" value={yn(r.is_active_creator)} />
                <Field label="Earning revenue" value={yn(r.is_generating_revenue)} />
                <Field label="Monthly" value={r.monthly_earnings || '—'} />
                <Field label="Platform" value={r.social_platform || '—'} />
                <Field
                  label="Handle"
                  value={
                    r.social_handle ? (
                      <span className="inline-flex items-center gap-0.5 text-text-main">
                        {r.social_handle}
                        <ExternalLink className="h-3 w-3 text-text-secondary/60" />
                      </span>
                    ) : (
                      '—'
                    )
                  }
                />
                <Field label="Content" value={r.content_type || '—'} />
                <Field
                  label="Campaigns"
                  value={r.interested_in_campaigns ? 'Yes' : 'No'}
                />
              </div>

              {(r.goals || r.agrees_to_profit_share) && (
                <div className="border-t border-border-color/40 px-4 py-3 text-xs md:px-5">
                  {r.goals && (
                    <p className="text-text-main">
                      <span className="mr-1 text-[10px] font-bold uppercase tracking-widest text-text-secondary">
                        Goals:
                      </span>
                      {r.goals}
                    </p>
                  )}
                  {r.agrees_to_profit_share && (
                    <p className="mt-1 text-[11px] text-green-400">
                      ✓ Agreed to profit-share terms
                    </p>
                  )}
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

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-widest text-text-secondary">
        {label}
      </p>
      <p className="mt-0.5 text-text-main">{value}</p>
    </div>
  );
}
