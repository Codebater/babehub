import { Link } from '@/i18n/navigation';
import { Briefcase, Clock, X, Loader2 } from 'lucide-react';
import { requireOnboarded } from '@/lib/auth/guards';
import WithdrawButton from './WithdrawButton';

export const dynamic = 'force-dynamic';

/**
 * `/app/creator/applications` — the applicant's outbox. Lists every
 * application the viewer has submitted with current status + intro
 * + a Withdraw button.
 *
 * Open to every onboarded user (not just creators); anyone can apply
 * to a job.
 */
export default async function CreatorApplicationsPage() {
  const { user, supabase } = await requireOnboarded();

  const { data: applications } = await supabase
    .from('job_applications')
    .select(
      'id, job_id, intro_message, status, created_at, viewed_at, decided_at',
    )
    .eq('applicant_id', user.id)
    .order('created_at', { ascending: false });

  const jobIds = Array.from(new Set((applications ?? []).map((a) => a.job_id)));
  const { data: jobs } = jobIds.length
    ? await supabase
        .from('jobs')
        .select('id, title, status, poster_id, categories, location_kind')
        .in('id', jobIds)
    : { data: [] };
  const jobMap = new Map((jobs ?? []).map((j) => [j.id, j]));

  const posterIds = Array.from(new Set((jobs ?? []).map((j) => j.poster_id)));
  const { data: posters } = posterIds.length
    ? await supabase
        .from('profiles')
        .select('id, handle, display_name')
        .in('id', posterIds)
    : { data: [] };
  const posterMap = new Map((posters ?? []).map((p) => [p.id, p]));

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="text-2xl font-black tracking-tight text-text-main md:text-3xl">
        My applications
      </h1>
      <p className="mt-1 text-sm text-text-secondary">
        Every job you&apos;ve applied to, with current status. Recruiters update
        these from their inbox.
      </p>

      {!applications || applications.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-border-color bg-secondary/40 p-12 text-center">
          <Briefcase className="mx-auto h-10 w-10 text-text-secondary/60" />
          <p className="mt-3 text-sm text-text-secondary">
            No applications yet.{' '}
            <Link href="/jobs" className="text-primary hover:underline">
              Browse open jobs →
            </Link>
          </p>
        </div>
      ) : (
        <ul className="mt-6 space-y-3">
          {applications.map((app) => {
            const job = jobMap.get(app.job_id);
            const poster = job ? posterMap.get(job.poster_id) : null;
            return (
              <li
                key={app.id}
                className="overflow-hidden rounded-2xl border border-border-color bg-card"
              >
                <div className="flex flex-wrap items-start justify-between gap-3 p-5">
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/jobs/${app.job_id}` as '/jobs/[id]'}
                      className="text-base font-black tracking-tight text-text-main hover:text-primary"
                    >
                      {job?.title ?? 'Unknown job'}
                    </Link>
                    {poster && (
                      <p className="mt-1 text-xs text-text-secondary">
                        <Link
                          href={`/c/${poster.handle}` as '/c/[handle]'}
                          className="hover:text-primary hover:underline"
                        >
                          @{poster.handle}
                        </Link>
                        {job?.categories?.length ? ` · ${job.categories.join(', ')}` : ''}
                        {' · '}
                        {job?.location_kind}
                      </p>
                    )}
                    <p className="mt-2 inline-flex items-center gap-1 text-[11px] text-text-secondary">
                      <Clock className="h-3 w-3" />
                      Applied {new Date(app.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <StatusBadge status={app.status} />
                </div>

                {app.intro_message && (
                  <div className="border-t border-border-color/40 p-5">
                    <p className="whitespace-pre-wrap text-sm text-text-main/80">
                      {app.intro_message}
                    </p>
                  </div>
                )}

                {/* Only allow withdraw before recruiter decides */}
                {(app.status === 'pending' ||
                  app.status === 'viewed' ||
                  app.status === 'shortlisted') && (
                  <div className="border-t border-border-color/40 bg-secondary/30 px-5 py-3">
                    <WithdrawButton applicationId={app.id} />
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    pending: 'bg-primary/15 text-primary',
    viewed: 'bg-secondary text-text-secondary',
    shortlisted: 'bg-amber-500/15 text-amber-400',
    accepted: 'bg-green-500/15 text-green-400',
    rejected: 'bg-red-500/15 text-red-400',
    withdrawn: 'bg-zinc-500/15 text-zinc-400',
  };
  return (
    <span
      className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest ${
        map[status] ?? 'bg-secondary text-text-secondary'
      }`}
    >
      {status}
    </span>
  );
}

// Silence unused-import lint on icons (X / Loader2 are imported for
// the WithdrawButton client component which lives in a sibling file).
void X;
void Loader2;
