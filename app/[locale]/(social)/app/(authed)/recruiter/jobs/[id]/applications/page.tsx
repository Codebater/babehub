import { notFound } from 'next/navigation';
import { Link } from '@/i18n/navigation';
import { ShieldCheck, Mail } from 'lucide-react';
import { requireRecruiter } from '@/lib/auth/guards';
import ApplicationStatusButtons from './ApplicationStatusButtons';

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ id: string; locale: string }> };

/**
 * Recruiter's applications inbox for a single job. Lists every
 * applicant + their intro + a status button row that drives the
 * pending → viewed → shortlisted → accepted/rejected progression
 * via the `setApplicationStatus` server action.
 */
export default async function JobApplicationsPage({ params }: Props) {
  const { id } = await params;
  const { user, supabase } = await requireRecruiter();

  // Confirm the viewer owns this job before loading applications.
  const { data: job } = await supabase
    .from('jobs')
    .select('id, title, poster_id, categories')
    .eq('id', id)
    .maybeSingle();
  if (!job || job.poster_id !== user.id) notFound();

  const { data: applications } = await supabase
    .from('job_applications')
    .select(
      'id, applicant_id, intro_message, status, created_at, viewed_at, decided_at',
    )
    .eq('job_id', id)
    .order('created_at', { ascending: false });

  const applicantIds = Array.from(
    new Set((applications ?? []).map((a) => a.applicant_id)),
  );
  const { data: applicants } = applicantIds.length
    ? await supabase
        .from('profiles')
        .select('id, handle, display_name, avatar_url, is_verified')
        .in('id', applicantIds)
    : { data: [] };
  const applicantMap = new Map((applicants ?? []).map((p) => [p.id, p]));

  // Pull professional headlines so the inbox shows context at a glance.
  const { data: pros } = applicantIds.length
    ? await supabase
        .from('professional_profiles')
        .select('user_id, headline, hourly_rate_cents, currency, region')
        .in('user_id', applicantIds)
    : { data: [] };
  const proMap = new Map((pros ?? []).map((p) => [p.user_id, p]));

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <Link
        href="/app/recruiter/dashboard"
        className="text-sm text-text-secondary transition-colors hover:text-primary"
      >
        ← All jobs
      </Link>

      <h1 className="mt-2 text-2xl font-black tracking-tight text-text-main sm:text-3xl">
        Applicants — {job.title}
      </h1>
      <p className="mt-1 text-sm text-text-secondary">
        {applications?.length ?? 0}{' '}
        {applications?.length === 1 ? 'application' : 'applications'}
      </p>

      {!applications || applications.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-border-color bg-secondary/40 p-12 text-center">
          <Mail className="mx-auto h-10 w-10 text-text-secondary/60" />
          <p className="mt-3 text-sm text-text-secondary">
            No applications yet. Share the job link to invite candidates:{' '}
            <code className="rounded bg-secondary px-2 py-0.5 text-xs text-primary">
              /jobs/{job.id}
            </code>
          </p>
        </div>
      ) : (
        <ul className="mt-6 space-y-3">
          {applications.map((app) => {
            const profile = applicantMap.get(app.applicant_id);
            const pro = proMap.get(app.applicant_id);
            return (
              <li
                key={app.id}
                className="overflow-hidden rounded-2xl border border-border-color bg-card"
              >
                <div className="flex flex-wrap items-start justify-between gap-4 p-5">
                  <div className="flex min-w-0 flex-1 items-start gap-3">
                    <span className="h-12 w-12 shrink-0 overflow-hidden rounded-full bg-secondary">
                      {profile?.avatar_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={profile.avatar_url}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/40 to-pink-600/40 text-sm font-black text-white">
                          {(profile?.display_name || profile?.handle || '?')
                            .slice(0, 1)
                            .toUpperCase()}
                        </span>
                      )}
                    </span>
                    <div className="min-w-0 flex-1">
                      <Link
                        href={(profile ? `/c/${profile.handle}` : '/jobs') as '/c/[handle]'}
                        className="inline-flex items-center gap-1 text-base font-bold text-text-main hover:text-primary"
                      >
                        {profile?.display_name || profile?.handle || 'Unknown'}
                        {profile?.is_verified && (
                          <ShieldCheck className="h-4 w-4 text-primary" />
                        )}
                      </Link>
                      {pro?.headline && (
                        <p className="mt-0.5 line-clamp-1 text-sm text-text-secondary">
                          {pro.headline}
                        </p>
                      )}
                      {(pro?.region ||
                        (typeof pro?.hourly_rate_cents === 'number' &&
                          pro.hourly_rate_cents > 0)) && (
                        <p className="mt-0.5 text-xs text-text-secondary">
                          {pro?.region}
                          {pro?.region &&
                            typeof pro?.hourly_rate_cents === 'number' &&
                            pro.hourly_rate_cents > 0 &&
                            ' · '}
                          {typeof pro?.hourly_rate_cents === 'number' &&
                            pro.hourly_rate_cents > 0 &&
                            `${(pro.hourly_rate_cents / 100).toLocaleString(undefined, {
                              style: 'currency',
                              currency: (pro.currency || 'USD').toUpperCase(),
                              maximumFractionDigits: 0,
                            })}/hr`}
                        </p>
                      )}
                    </div>
                  </div>

                  <StatusBadge status={app.status} />
                </div>

                {app.intro_message && (
                  <div className="border-t border-border-color/40 p-5">
                    <p className="whitespace-pre-wrap text-sm text-text-main">
                      {app.intro_message}
                    </p>
                  </div>
                )}

                <div className="border-t border-border-color/40 bg-secondary/30 px-5 py-3">
                  <ApplicationStatusButtons
                    applicationId={app.id}
                    currentStatus={app.status}
                  />
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
