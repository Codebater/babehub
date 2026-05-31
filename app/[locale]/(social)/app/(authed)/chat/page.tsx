import { MessageSquare, Sparkles } from 'lucide-react';
import { requireOnboarded } from '@/lib/auth/guards';
import { createAdminClient } from '@/lib/supabase/admin';
import { userEnsureThread, userMarkRead } from '../admin/chat/actions';
import ChatWindow from '../admin/chat/_components/ChatWindow';

export const dynamic = 'force-dynamic';

const RATE_LIMIT = 10;
const RATE_WINDOW_HOURS = 24;

/**
 * `/app/chat` — user's inbox. One thread per user with the BabeHub team.
 *
 * - Beta badge prominent at the top
 * - Shows remaining rate-limit quota so the user knows their budget
 * - Auto-creates a thread on first visit (server action + redirect avoids
 *   a double-render; upsert is idempotent so safe to call every page load)
 */
export default async function UserChatPage() {
  const { user, profile } = await requireOnboarded();

  const db = createAdminClient() as any;

  // Always ensure a thread exists (idempotent upsert)
  const threadId = await userEnsureThread();

  // Mark as read
  await userMarkRead(threadId);

  // Fetch messages
  const { data: rawMessages } = await db
    .from('admin_messages')
    .select('id, body, is_from_admin, created_at, sender_id, profiles:sender_id(handle)')
    .eq('thread_id', threadId)
    .order('created_at', { ascending: true });

  const messages = (rawMessages ?? []).map((m: any) => ({
    id: m.id,
    body: m.body,
    is_from_admin: m.is_from_admin,
    created_at: m.created_at,
    sender_handle: m.profiles?.handle ?? '?',
  }));

  // Compute remaining rate-limit quota
  const windowStart = new Date(
    Date.now() - RATE_WINDOW_HOURS * 60 * 60 * 1000,
  ).toISOString();

  const { count: usedCount } = await db
    .from('admin_messages')
    .select('id', { count: 'exact', head: true })
    .eq('sender_id', user.id)
    .eq('is_from_admin', false)
    .gte('created_at', windowStart);

  const remaining = Math.max(0, RATE_LIMIT - (usedCount ?? 0));

  return (
    <main className="flex h-[calc(100vh-8rem)] flex-col">
      {/* Header */}
      <header className="border-b border-border-color bg-card px-4 py-4 md:px-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-primary" />
              <h1 className="text-lg font-black tracking-tight text-text-main">
                BabeHub Team
              </h1>
              {/* Beta badge */}
              <span className="inline-flex items-center gap-1 rounded-full border border-amber-400/40 bg-amber-400/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest text-amber-300">
                <Sparkles className="h-2.5 w-2.5" />
                Beta
              </span>
            </div>
            <p className="mt-1 text-xs text-text-secondary">
              Direct line to our team. We aim to respond within 24 hours.
            </p>
          </div>
          <div className="shrink-0 text-right">
            <p className="text-[10px] font-bold uppercase tracking-widest text-text-secondary/60">
              Quota
            </p>
            <p className="text-sm font-bold text-text-main">
              {remaining}
              <span className="text-[10px] font-normal text-text-secondary">
                /{RATE_LIMIT} today
              </span>
            </p>
          </div>
        </div>

        {/* Beta info strip */}
        <div className="mt-3 rounded-xl border border-amber-400/20 bg-amber-400/5 px-3 py-2 text-[11px] text-amber-300/80">
          <strong className="text-amber-300">Chat is in beta.</strong> You can send up to{' '}
          {RATE_LIMIT} messages per day. For urgent matters, use the contact form instead.
        </div>
      </header>

      {/* Chat window */}
      <div className="flex-1 overflow-hidden">
        <ChatWindow
          threadId={threadId}
          messages={messages}
          isAdmin={false}
          myHandle={profile.handle}
          rateRemaining={remaining}
          rateLimit={RATE_LIMIT}
        />
      </div>
    </main>
  );
}
