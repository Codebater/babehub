import { Link } from '@/i18n/navigation';
import { MessageSquare, ShieldAlert } from 'lucide-react';
import { requireAdmin } from '@/lib/auth/guards';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export default async function AdminChatListPage() {
  await requireAdmin();

  const db = createAdminClient() as any;

  // Fetch threads with user profile + last message
  const { data: threads } = await db
    .from('admin_threads')
    .select(
      `id, user_id, updated_at, admin_last_read_at,
       profiles:user_id ( handle, display_name, avatar_url, role )`,
    )
    .order('updated_at', { ascending: false });

  // For each thread, get the last message and unread count
  const threadIds = (threads ?? []).map((t: any) => t.id);

  const [{ data: lastMessages }, { data: unreadRows }] = await Promise.all([
    threadIds.length
      ? db
          .from('admin_messages')
          .select('thread_id, body, created_at, is_from_admin')
          .in('thread_id', threadIds)
          .order('created_at', { ascending: false })
      : Promise.resolve({ data: [] }),
    // Count user messages sent after admin_last_read_at per thread
    threadIds.length
      ? db
          .from('admin_messages')
          .select('thread_id')
          .in('thread_id', threadIds)
          .eq('is_from_admin', false)
      : Promise.resolve({ data: [] }),
  ]);

  // Build lookup maps
  const lastMsgMap = new Map<string, { body: string; created_at: string; is_from_admin: boolean }>();
  for (const m of lastMessages ?? []) {
    if (!lastMsgMap.has(m.thread_id)) lastMsgMap.set(m.thread_id, m);
  }

  // Compute unread per thread (user messages after admin_last_read_at)
  const unreadMap = new Map<string, number>();
  for (const t of threads ?? []) {
    const readCutoff = t.admin_last_read_at ? new Date(t.admin_last_read_at) : new Date(0);
    const unread = (unreadRows ?? []).filter(
      (m: any) =>
        m.thread_id === t.id &&
        new Date((lastMessages ?? []).find((lm: any) => lm.thread_id === t.id && m === m)?.created_at ?? 0) > readCutoff,
    ).length;
    unreadMap.set(t.id, unread);
  }

  // Better unread: count from lastMessages filtered by cutoff per thread
  const lastMsgsByThread = new Map<string, { body: string; created_at: string; is_from_admin: boolean }[]>();
  for (const m of lastMessages ?? []) {
    if (!lastMsgsByThread.has(m.thread_id)) lastMsgsByThread.set(m.thread_id, []);
    lastMsgsByThread.get(m.thread_id)!.push(m);
  }
  const unreadCountMap = new Map<string, number>();
  for (const t of threads ?? []) {
    const readCutoff = t.admin_last_read_at ? new Date(t.admin_last_read_at) : new Date(0);
    const msgs = lastMsgsByThread.get(t.id) ?? [];
    const count = msgs.filter(
      (m) => !m.is_from_admin && new Date(m.created_at) > readCutoff,
    ).length;
    unreadCountMap.set(t.id, count);
  }

  const totalUnread = Array.from(unreadCountMap.values()).reduce((a, b) => a + b, 0);

  return (
    <main className="mx-auto max-w-3xl px-4 py-6 md:px-6 md:py-10">
      <header className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.25em] text-primary">
            <ShieldAlert className="h-3 w-3" />
            Admin · Chat
          </p>
          <h1 className="mt-3 text-2xl font-black tracking-tight text-text-main md:text-3xl">
            Inbox
          </h1>
          <p className="mt-1 text-sm text-text-secondary">
            {totalUnread > 0
              ? `${totalUnread} unread message${totalUnread !== 1 ? 's' : ''}`
              : 'All caught up'}
            {' · '}
            {(threads ?? []).length} conversation{(threads ?? []).length !== 1 ? 's' : ''}
          </p>
        </div>
      </header>

      <section className="space-y-2">
        {(threads ?? []).length === 0 && (
          <div className="rounded-2xl border border-border-color bg-card px-6 py-12 text-center">
            <MessageSquare className="mx-auto mb-3 h-8 w-8 text-text-secondary/40" />
            <p className="text-sm text-text-secondary">No conversations yet.</p>
            <p className="mt-1 text-xs text-text-secondary/60">
              Open a user from the Users tab and click&nbsp;
              <span className="font-bold">Message</span>.
            </p>
          </div>
        )}
        {(threads ?? []).map((t: any) => {
          const profile = t.profiles;
          const lastMsg = lastMsgMap.get(t.id);
          const unread = unreadCountMap.get(t.id) ?? 0;
          return (
            <Link
              key={t.id}
              href={`/app/admin/chat/${profile?.handle}` as never}
              className={`group flex items-center gap-4 rounded-2xl border px-4 py-3.5 transition-all hover:border-primary/40 ${
                unread > 0
                  ? 'border-primary/30 bg-primary/5'
                  : 'border-border-color bg-card'
              }`}
            >
              {/* Avatar */}
              <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full bg-secondary">
                {profile?.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" />
                ) : (
                  <span className="flex h-full w-full items-center justify-center text-sm font-bold text-text-secondary">
                    {(profile?.display_name || profile?.handle || '?').slice(0, 1).toUpperCase()}
                  </span>
                )}
              </div>

              {/* Text */}
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline gap-2">
                  <span className="font-bold text-text-main group-hover:text-primary">
                    {profile?.display_name || profile?.handle}
                  </span>
                  <span className="text-[10px] text-text-secondary/60">@{profile?.handle}</span>
                </div>
                <p className="mt-0.5 truncate text-xs text-text-secondary">
                  {lastMsg
                    ? `${lastMsg.is_from_admin ? 'You: ' : ''}${lastMsg.body}`
                    : 'Thread opened — no messages yet'}
                </p>
              </div>

              {/* Right side */}
              <div className="flex shrink-0 flex-col items-end gap-1">
                {unread > 0 && (
                  <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-bold text-white">
                    {unread}
                  </span>
                )}
                {lastMsg && (
                  <span className="text-[10px] text-text-secondary/50">
                    {new Date(lastMsg.created_at).toLocaleString('en-GB', {
                      day: '2-digit',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                )}
              </div>
            </Link>
          );
        })}
      </section>
    </main>
  );
}
