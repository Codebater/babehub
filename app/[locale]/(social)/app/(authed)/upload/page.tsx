import { Film, Clock, CheckCircle2, XCircle, ShieldCheck } from 'lucide-react';
import { requireOnboarded } from '@/lib/auth/guards';
import { getLimits } from '@/lib/limits';
import { createAdminClient } from '@/lib/supabase/admin';
import UploadVideoForm from './UploadVideoForm';

export const dynamic = 'force-dynamic';

const MAX_PENDING = 3;

const STATUS_META: Record<string, { label: string; cls: string; icon: typeof Clock }> = {
  pending: { label: 'In review', cls: 'text-amber-300', icon: Clock },
  approved: { label: 'Approved', cls: 'text-green-400', icon: CheckCircle2 },
  rejected: { label: 'Not approved', cls: 'text-red-400', icon: XCircle },
};

export default async function UploadPage() {
  const { user, profile } = await requireOnboarded();

  const db = createAdminClient() as any;
  const { data: submissions } = await db
    .from('video_submissions')
    .select('id, title, status, rejection_reason, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  const rows = (submissions ?? []) as {
    id: string;
    title: string;
    status: string;
    rejection_reason: string | null;
    created_at: string;
  }[];

  const pending = rows.filter((r) => r.status === 'pending').length;
  const approved = rows.filter((r) => r.status === 'approved').length;
  const maxApproved = getLimits(profile as any).videos;

  const atPendingCap = pending >= MAX_PENDING;
  const atApprovedCap = approved >= maxApproved;
  const canUpload = !atPendingCap && !atApprovedCap;

  const capMessage = atPendingCap
    ? `You have ${pending} videos awaiting review. Wait for those to be processed before uploading more.`
    : atApprovedCap
      ? `You've reached your limit of ${maxApproved} published videos. Get BabeHub Verified or go Premium to upload more.`
      : undefined;

  return (
    <main className="mx-auto max-w-2xl px-4 py-8 md:px-6 md:py-12">
      <header className="mb-6">
        <p className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.25em] text-primary">
          <Film className="h-3 w-3" />
          Upload
        </p>
        <h1 className="mt-3 text-2xl font-black tracking-tight text-text-main md:text-3xl">
          Upload a video
        </h1>
        <p className="mt-1.5 text-sm text-text-secondary">
          Upload your video to BabeHub. Our team reviews every submission before it goes
          live on your profile and the Explore feed — usually within 24 hours.
        </p>

        {/* Usage chips */}
        <div className="mt-4 flex flex-wrap gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border-color bg-secondary/60 px-3 py-1 text-[11px] text-text-secondary">
            <Clock className="h-3 w-3 text-amber-300" />
            {pending}/{MAX_PENDING} in review
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border-color bg-secondary/60 px-3 py-1 text-[11px] text-text-secondary">
            <CheckCircle2 className="h-3 w-3 text-green-400" />
            {approved}/{maxApproved} published
          </span>
        </div>
      </header>

      <UploadVideoForm canUpload={canUpload} capMessage={capMessage} />

      {/* Submission history */}
      {rows.length > 0 && (
        <section className="mt-10">
          <h2 className="mb-3 text-[10px] font-bold uppercase tracking-[0.25em] text-text-secondary/70">
            Your submissions
          </h2>
          <ul className="space-y-2">
            {rows.map((r) => {
              const meta = STATUS_META[r.status] ?? STATUS_META.pending;
              const Icon = meta.icon;
              return (
                <li
                  key={r.id}
                  className="flex items-start gap-3 rounded-xl border border-border-color bg-card px-4 py-3"
                >
                  <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${meta.cls}`} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-text-main">{r.title}</p>
                    <p className={`text-xs font-medium ${meta.cls}`}>
                      {meta.label}
                      <span className="ml-2 font-normal text-text-secondary/60">
                        {new Date(r.created_at).toLocaleDateString('en-GB', {
                          day: '2-digit',
                          month: 'short',
                        })}
                      </span>
                    </p>
                    {r.status === 'rejected' && r.rejection_reason && (
                      <p className="mt-1 text-[11px] text-text-secondary">
                        {r.rejection_reason}
                      </p>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {/* Trust footer */}
      <p className="mt-8 flex items-center justify-center gap-1.5 text-center text-[11px] text-text-secondary/60">
        <ShieldCheck className="h-3 w-3" />
        All uploads are confidential and reviewed by a human before going live.
      </p>
    </main>
  );
}
