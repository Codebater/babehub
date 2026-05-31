import { Link } from '@/i18n/navigation';
import { ShieldAlert, Film, Clock } from 'lucide-react';
import { requireAdmin } from '@/lib/auth/guards';
import { createAdminClient } from '@/lib/supabase/admin';
import VideoReviewActions from './VideoReviewActions';

export const dynamic = 'force-dynamic';

export default async function AdminVideosPage() {
  await requireAdmin();
  const db = createAdminClient() as any;

  // Pending queue first; recent reviewed below for reference.
  const { data: pendingRows } = await db
    .from('video_submissions')
    .select('id, user_id, title, storage_bucket, storage_path, byte_size, created_at, profiles:user_id(handle, display_name, avatar_url)')
    .eq('status', 'pending')
    .order('created_at', { ascending: true });

  const pending = (pendingRows ?? []) as any[];

  // Mint short-lived signed URLs so the admin can preview each clip.
  const signed = new Map<string, string>();
  await Promise.all(
    pending.map(async (s) => {
      const { data } = await db.storage.from(s.storage_bucket).createSignedUrl(s.storage_path, 3600);
      if (data?.signedUrl) signed.set(s.id, data.signedUrl);
    }),
  );

  // Recently reviewed (last 10) for an audit trail.
  const { data: reviewedRows } = await db
    .from('video_submissions')
    .select('id, title, status, reviewed_at, profiles:user_id(handle)')
    .neq('status', 'pending')
    .order('reviewed_at', { ascending: false })
    .limit(10);
  const reviewed = (reviewedRows ?? []) as any[];

  return (
    <main className="mx-auto max-w-4xl px-4 py-6 md:px-6 md:py-10">
      <header className="mb-6">
        <p className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.25em] text-primary">
          <ShieldAlert className="h-3 w-3" />
          Admin · Videos
        </p>
        <h1 className="mt-3 text-2xl font-black tracking-tight text-text-main md:text-3xl">
          Video review queue
        </h1>
        <p className="mt-1 text-sm text-text-secondary">
          {pending.length > 0
            ? `${pending.length} video${pending.length === 1 ? '' : 's'} awaiting review`
            : 'No videos awaiting review.'}
          {' '}Approving publishes the video to the uploader&apos;s profile and the Explore feed.
        </p>
      </header>

      {/* Pending queue */}
      {pending.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border-color bg-secondary/40 px-6 py-12 text-center">
          <Film className="mx-auto mb-3 h-8 w-8 text-text-secondary/40" />
          <p className="text-sm text-text-secondary">All caught up — nothing to review.</p>
        </div>
      ) : (
        <ul className="space-y-4">
          {pending.map((s) => {
            const p = s.profiles;
            const url = signed.get(s.id);
            return (
              <li
                key={s.id}
                className="overflow-hidden rounded-2xl border border-border-color bg-card md:flex"
              >
                {/* Player */}
                <div className="aspect-video w-full bg-black md:w-72 md:shrink-0">
                  {url ? (
                    <video src={url} controls preload="metadata" playsInline className="h-full w-full object-contain" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xs text-text-secondary/60">
                      Preview unavailable
                    </div>
                  )}
                </div>

                {/* Details + actions */}
                <div className="flex min-w-0 flex-1 flex-col gap-3 p-4">
                  <div>
                    <h3 className="text-sm font-bold text-text-main">{s.title}</h3>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-text-secondary">
                      {p && (
                        <Link
                          href={`/c/${p.handle}` as '/c/[handle]'}
                          className="inline-flex items-center gap-1.5 hover:text-primary"
                        >
                          <span className="h-4 w-4 overflow-hidden rounded-full bg-secondary">
                            {p.avatar_url ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={p.avatar_url} alt="" className="h-full w-full object-cover" />
                            ) : (
                              <span className="flex h-full w-full items-center justify-center text-[8px] font-bold text-text-secondary">
                                {(p.display_name || p.handle).slice(0, 1).toUpperCase()}
                              </span>
                            )}
                          </span>
                          @{p.handle}
                        </Link>
                      )}
                      <span className="inline-flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(s.created_at).toLocaleString('en-GB', {
                          day: '2-digit',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                      {s.byte_size && (
                        <span>{(s.byte_size / 1024 / 1024).toFixed(1)} MB</span>
                      )}
                    </div>
                  </div>

                  <div className="mt-auto">
                    <VideoReviewActions submissionId={s.id} />
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {/* Recently reviewed */}
      {reviewed.length > 0 && (
        <section className="mt-10">
          <h2 className="mb-3 text-[10px] font-bold uppercase tracking-[0.25em] text-text-secondary/70">
            Recently reviewed
          </h2>
          <ul className="divide-y divide-border-color/40 overflow-hidden rounded-2xl border border-border-color bg-card">
            {reviewed.map((r) => (
              <li key={r.id} className="flex items-center gap-3 px-4 py-2.5 text-xs">
                <span
                  className={`inline-flex shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest ${
                    r.status === 'approved'
                      ? 'bg-green-500/15 text-green-400'
                      : 'bg-red-500/15 text-red-400'
                  }`}
                >
                  {r.status}
                </span>
                <span className="min-w-0 flex-1 truncate text-text-main">{r.title}</span>
                <span className="shrink-0 text-text-secondary/60">@{r.profiles?.handle}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
