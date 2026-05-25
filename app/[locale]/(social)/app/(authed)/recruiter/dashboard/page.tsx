import { Link } from '@/i18n/navigation';
import { Briefcase, Plus, MailOpen, Pause, Archive } from 'lucide-react';
import { requireRecruiter } from '@/lib/auth/guards';

export const dynamic = 'force-dynamic';

/**
 * `/app/recruiter/dashboard` — recruiter home. Lists every job the
 * viewer has posted, with status + a per-job applications count.
 *
 * Gated by `requireRecruiter()` — viewer must have at least one
 * buy-side role in `profiles.roles[]`. The ProfileMenu "Switch on
 * recruiter mode" button adds 'recruiter' to roles[], so this surface
 * is reachable from any signed-in profile by toggling the menu item.
 */
export default async function RecruiterDashboardPage() {
  const { user, supabase } = await requireRecruiter();

  const { data: jobs } = await supabase
    .from('jobs')
    .select(
      'id, title, status, moderation_status, published_at, created_at, expires_at, categories, location_kind',
    )
    .eq('poster_id', user.id)
    .order('created_at', { ascending: false });

  const jobIds = (jobs ?? []).map((j) => j.id);
  // Count applications per job in a single query. Group on the client.
  const { data: applications } = jobIds.length
    ? await supabase
        .from('job_applications')
        .select('job_id, status')
        .in('job_id', jobIds)
    : { data: [] };

  const countsByJob = new Map<string, { total: number; pending: number }>();
  for (const id of jobIds) countsByJob.set(id, { total: 0, pending: 0 });
  for (const a of applications ?? []) {
    const c = countsByJob.get(a.job_id);
    if (!c) continue;
    c.total += 1;
    if (a.status === 'pending') c.pending += 1;
  }

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-text-secondary">
          Post jobs, review applicants, hire creators. Free to post during MVP-1;
          token cost is wired in Sprint 3.
        </p>
        <Link
          href="/app/recruiter/jobs/new"
          className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-bold text-white shadow-lg shadow-primary/30 transition-all hover:scale-[1.02] hover:bg-pink-400"
        >
          <Plus className="h-4 w-4" />
          New job
        </Link>
      </header>

      {!jobs || jobs.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border-color bg-secondary/40 p-12 text-center">
          <Briefcase className="mx-auto h-10 w-10 text-text-secondary/60" />
          <p className="mt-3 text-sm text-text-secondary">
            No jobs yet. Click <strong>New job</strong> above to post your first.
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {jobs.map((job) => {
            const counts = countsByJob.get(job.id) ?? { total: 0, pending: 0 };
            return (
              <li
                key={job.id}
                className="overflow-hidden rounded-2xl border border-border-color bg-card"
              >
                <div className="flex flex-wrap items-start justify-between gap-3 p-5">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge status={job.status} />
                      {job.moderation_status === 'pending' && (
                        <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-amber-400">
                          Pending review
                        </span>
                      )}
                      {job.moderation_status === 'rejected' && (
                        <span className="rounded-full bg-red-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-red-400">
                          Rejected
                        </span>
                      )}
                    </div>
                    <Link
                      href={`/jobs/${job.id}` as '/jobs/[id]'}
                      className="mt-2 block text-lg font-black tracking-tight text-text-main hover:text-primary"
                    >
                      {job.title}
                    </Link>
                    <p className="mt-1 text-xs text-text-secondary">
                      {job.categories.length > 0 && (
                        <>{job.categories.join(' · ')} · </>
                      )}
                      {job.location_kind}
                    </p>
                  </div>
                  <Link
                    href={
                      `/app/recruiter/jobs/${job.id}/applications` as '/app/recruiter/jobs/[id]/applications'
                    }
                    className="inline-flex shrink-0 items-center gap-2 rounded-full border border-border-color px-3 py-1.5 text-xs font-bold text-text-main transition-colors hover:border-primary hover:text-primary"
                  >
                    <MailOpen className="h-3.5 w-3.5" />
                    {counts.total} {counts.total === 1 ? 'applicant' : 'applicants'}
                    {counts.pending > 0 && (
                      <span className="rounded-full bg-primary/20 px-1.5 py-0.5 text-[10px] text-primary">
                        {counts.pending} new
                      </span>
                    )}
                  </Link>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string; icon: typeof Pause }> = {
    draft: {
      label: 'Draft',
      cls: 'bg-secondary text-text-secondary',
      icon: Archive,
    },
    published: {
      label: 'Live',
      cls: 'bg-green-500/15 text-green-400',
      icon: Briefcase,
    },
    paused: { label: 'Paused', cls: 'bg-amber-500/15 text-amber-400', icon: Pause },
    expired: {
      label: 'Expired',
      cls: 'bg-zinc-500/15 text-zinc-400',
      icon: Archive,
    },
    closed: { label: 'Closed', cls: 'bg-zinc-500/15 text-zinc-400', icon: Archive },
  };
  const c = map[status] ?? map.draft;
  const Icon = c.icon;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest ${c.cls}`}
    >
      <Icon className="h-3 w-3" />
      {c.label}
    </span>
  );
}
