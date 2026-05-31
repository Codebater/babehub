import { Link } from '@/i18n/navigation';
import { ShieldCheck, ShieldAlert, FileText, Image as ImageIcon, Globe, Sparkles, MessageSquare } from 'lucide-react';
import { requireAdmin } from '@/lib/auth/guards';
import AdminUserActions from './AdminUserActions';

export const dynamic = 'force-dynamic';

/**
 * `/app/admin/users` — admin user-management table.
 *
 * Auth: `requireAdmin()` redirects non-admins to /app/dashboard.
 *
 * What it shows per row:
 *   - Avatar + handle + display name
 *   - role (fan / creator / admin / etc.)
 *   - country (free-form, captured at onboarding or settings)
 *   - applied_babehub (yes / no) — survey submission flag
 *   - is_verified — BabeHub badge holders, unlocked content upload
 *   - posts + media counts — derived per row via a single grouped query
 *   - status chips: frozen / banned
 *   - action buttons: verify / freeze / ban (per-row toggles)
 *
 * Data shape: one `profiles` SELECT + two grouped counts (posts.creator_id
 * and media.owner_id). 3 round-trips total regardless of user count, so
 * the table scales to a few thousand users before pagination matters.
 */
export default async function AdminUsersPage() {
  const { supabase } = await requireAdmin();

  // Profiles — newest first. Limit 200 to keep the render quick; once
  // user count outgrows that, paginate with `?page=` query params.
  const { data: profiles } = await supabase
    .from('profiles')
    .select(
      'id, handle, display_name, avatar_url, role, country, is_verified, verified_at, is_frozen, is_banned, applied_babehub, is_premium, premium_until, created_at',
    )
    .order('created_at', { ascending: false })
    .limit(200);

  // Aggregated content counts per user. Two grouped queries returning
  // arrays of {creator_id, count} / {owner_id, count} that we collapse
  // into Maps for O(1) lookup in the row render.
  //
  // Supabase's PostgREST doesn't expose group-by directly, so we fetch
  // raw id columns and tally client-side. For 200 users + N posts this
  // is still trivial; if/when it isn't, drop a tiny SQL view that
  // pre-computes the counts.
  const userIds = (profiles ?? []).map((p) => p.id);

  const [{ data: postRows }, { data: mediaRows }] = await Promise.all([
    userIds.length
      ? supabase.from('posts').select('creator_id').in('creator_id', userIds)
      : Promise.resolve({ data: [] as { creator_id: string }[] }),
    userIds.length
      ? supabase.from('media').select('owner_id, kind').in('owner_id', userIds)
      : Promise.resolve({ data: [] as { owner_id: string; kind: 'image' | 'video' }[] }),
  ]);

  const postCount = new Map<string, number>();
  for (const r of postRows ?? []) {
    postCount.set(r.creator_id, (postCount.get(r.creator_id) ?? 0) + 1);
  }
  const imageCount = new Map<string, number>();
  const videoCount = new Map<string, number>();
  for (const m of mediaRows ?? []) {
    const map = m.kind === 'image' ? imageCount : videoCount;
    map.set(m.owner_id, (map.get(m.owner_id) ?? 0) + 1);
  }

  // Headline counters at the top of the page.
  const total = profiles?.length ?? 0;
  const verifiedCount = (profiles ?? []).filter((p) => p.is_verified).length;
  const frozenCount = (profiles ?? []).filter((p) => p.is_frozen).length;
  const bannedCount = (profiles ?? []).filter((p) => p.is_banned).length;
  const appliedCount = (profiles ?? []).filter((p) => p.applied_babehub).length;
  const premiumCount = (profiles ?? []).filter(
    (p) => p.is_premium && (!p.premium_until || new Date(p.premium_until) > new Date()),
  ).length;

  return (
    <main className="mx-auto max-w-7xl px-4 py-6 md:px-6 md:py-10">
      <header className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.25em] text-primary">
            <ShieldAlert className="h-3 w-3" />
            Admin · Users
          </p>
          <h1 className="mt-3 text-2xl font-black tracking-tight text-text-main md:text-3xl">
            User management
          </h1>
          <p className="mt-1 text-sm text-text-secondary">
            Verify, freeze, or ban accounts. Verified accounts upload freely;
            others should be reviewed before posting (per-post moderation lands
            in the next sprint).
          </p>
        </div>
      </header>

      {/* ── Quick counters ─────────────────────────────────────── */}
      <section className="mb-6 grid grid-cols-3 gap-3 sm:grid-cols-6">
        <Counter label="Users" value={total} />
        <Counter label="Verified" value={verifiedCount} accent="primary" />
        <Counter label="Premium" value={premiumCount} accent="amber" />
        <Counter label="Frozen" value={frozenCount} accent="sky" />
        <Counter label="Banned" value={bannedCount} accent="red" />
        <Counter label="Applied" value={appliedCount} accent="green" />
      </section>

      {/* ── Users table ────────────────────────────────────────── */}
      <section className="overflow-x-auto rounded-2xl border border-border-color bg-card">
        <table className="w-full min-w-[900px] text-sm">
          <thead className="border-b border-border-color/60 text-left text-[10px] font-bold uppercase tracking-widest text-text-secondary">
            <tr>
              <th className="px-4 py-3">User</th>
              <th className="px-3 py-3">Role</th>
              <th className="px-3 py-3">Country</th>
              <th className="px-3 py-3">Content</th>
              <th className="px-3 py-3">Premium</th>
              <th className="px-3 py-3">Applied</th>
              <th className="px-3 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-color/40">
            {(profiles ?? []).map((p) => {
              const pc = postCount.get(p.id) ?? 0;
              const ic = imageCount.get(p.id) ?? 0;
              const vc = videoCount.get(p.id) ?? 0;
              return (
                <tr key={p.id} className={p.is_banned ? 'opacity-50' : ''}>
                  <td className="px-4 py-3">
                    <Link
                      href={`/c/${p.handle}` as '/c/[handle]'}
                      className="group inline-flex items-center gap-2"
                    >
                      <span className="h-8 w-8 shrink-0 overflow-hidden rounded-full bg-secondary">
                        {p.avatar_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={p.avatar_url} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <span className="flex h-full w-full items-center justify-center text-xs font-bold text-text-secondary">
                            {(p.display_name || p.handle).slice(0, 1).toUpperCase()}
                          </span>
                        )}
                      </span>
                      <span className="min-w-0">
                        <span className="flex items-center gap-1 text-sm font-bold text-text-main group-hover:text-primary">
                          {p.display_name || p.handle}
                          {p.is_verified && (
                            <ShieldCheck className="h-3.5 w-3.5 text-primary" aria-label="BabeHub Verified" />
                          )}
                        </span>
                        <span className="block text-xs text-text-secondary">@{p.handle}</span>
                      </span>
                    </Link>
                  </td>
                  <td className="px-3 py-3 text-xs capitalize text-text-secondary">{p.role}</td>
                  <td className="px-3 py-3 text-xs text-text-secondary">
                    {p.country ? (
                      <span className="inline-flex items-center gap-1">
                        <Globe className="h-3 w-3" />
                        {p.country}
                      </span>
                    ) : (
                      <span className="text-text-secondary/40">—</span>
                    )}
                  </td>
                  <td className="px-3 py-3 text-xs text-text-secondary">
                    <span className="inline-flex items-center gap-2">
                      <span className="inline-flex items-center gap-1" title="Posts">
                        <FileText className="h-3 w-3" />
                        {pc}
                      </span>
                      <span className="inline-flex items-center gap-1" title="Images">
                        <ImageIcon className="h-3 w-3" />
                        {ic}
                      </span>
                      <span className="inline-flex items-center gap-1" title="Videos">
                        <span className="font-mono text-[10px]">VID</span>
                        {vc}
                      </span>
                    </span>
                  </td>
                  <td className="px-3 py-3 text-xs">
                    {(() => {
                      const active =
                        p.is_premium &&
                        (!p.premium_until || new Date(p.premium_until) > new Date());
                      if (!active) return <span className="text-text-secondary/40">—</span>;
                      const until = p.premium_until
                        ? new Date(p.premium_until).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: '2-digit',
                          })
                        : null;
                      return (
                        <span
                          className="inline-flex items-center gap-1 rounded-full bg-amber-400/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-amber-300"
                          title={until ? `Expires ${until}` : undefined}
                        >
                          <Sparkles className="h-2.5 w-2.5" />
                          {until ?? 'Active'}
                        </span>
                      );
                    })()}
                  </td>
                  <td className="px-3 py-3 text-xs">
                    {p.applied_babehub ? (
                      <span className="inline-flex rounded-full bg-green-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-green-400">
                        Yes
                      </span>
                    ) : (
                      <span className="text-text-secondary/50">No</span>
                    )}
                  </td>
                  <td className="px-3 py-3 text-xs">
                    <div className="flex flex-wrap gap-1">
                      {p.is_frozen && (
                        <span className="inline-flex rounded-full bg-sky-400/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-sky-300">
                          Frozen
                        </span>
                      )}
                      {p.is_banned && (
                        <span className="inline-flex rounded-full bg-red-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-red-400">
                          Banned
                        </span>
                      )}
                      {!p.is_frozen && !p.is_banned && (
                        <span className="text-text-secondary/40">Active</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap items-center gap-2 justify-end">
                      <Link
                        href={`/app/admin/chat/${p.handle}` as never}
                        className="inline-flex items-center gap-1 rounded-md border border-border-color px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-text-secondary transition-colors hover:border-primary/40 hover:text-primary"
                        title="Open chat with this user"
                      >
                        <MessageSquare className="h-3 w-3" />
                        Message
                      </Link>
                      <AdminUserActions
                        userId={p.id}
                        isVerified={p.is_verified}
                        isFrozen={p.is_frozen}
                        isBanned={p.is_banned}
                        isPremium={
                          p.is_premium &&
                          (!p.premium_until || new Date(p.premium_until) > new Date())
                        }
                      />
                    </div>
                  </td>
                </tr>
              );
            })}
            {(!profiles || profiles.length === 0) && (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-text-secondary">
                  No users yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>

      <p className="mt-4 text-[11px] text-text-secondary">
        Showing the {total} most recently signed-up users. Per-post moderation
        queue lands in the next sprint — for now, freeze a non-verified user to
        block them from posting.
      </p>
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
  accent?: 'primary' | 'sky' | 'red' | 'amber' | 'green';
}) {
  const tone =
    accent === 'primary'
      ? 'text-primary'
      : accent === 'sky'
        ? 'text-sky-300'
        : accent === 'red'
          ? 'text-red-400'
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
