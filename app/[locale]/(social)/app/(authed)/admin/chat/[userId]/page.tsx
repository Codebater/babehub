import { notFound } from 'next/navigation';
import { ArrowLeft, MessageSquare } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { requireAdmin } from '@/lib/auth/guards';
import { createAdminClient } from '@/lib/supabase/admin';
import { adminOpenThread, adminMarkRead } from '../actions';
import ChatWindow from '../_components/ChatWindow';

export const dynamic = 'force-dynamic';

/**
 * `/app/admin/chat/[userId]` — admin view of a thread with a specific user.
 *
 * The route param is the user's handle (human-readable URL). We resolve
 * the handle → profile.id → thread on the server before rendering.
 */
export default async function AdminThreadPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { profile: adminProfile } = await requireAdmin();

  const { userId: handle } = await params;

  const db = createAdminClient() as any;

  // Resolve handle → profile
  const { data: targetProfile } = await db
    .from('profiles')
    .select('id, handle, display_name, avatar_url, role')
    .eq('handle', handle)
    .single();

  if (!targetProfile) notFound();

  // Open or create the thread
  const threadId = await adminOpenThread(targetProfile.id);

  // Mark it read
  await adminMarkRead(threadId);

  // Fetch messages with sender handle
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

  return (
    <main className="flex h-[calc(100vh-8rem)] flex-col">
      {/* Thread header */}
      <header className="flex items-center gap-4 border-b border-border-color bg-card px-4 py-3 md:px-6">
        <Link
          href="/app/admin/chat"
          className="flex shrink-0 items-center gap-1.5 rounded-full border border-border-color px-3 py-1.5 text-xs font-bold text-text-secondary transition-colors hover:border-primary/40 hover:text-primary"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Inbox
        </Link>
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <div className="h-8 w-8 shrink-0 overflow-hidden rounded-full bg-secondary">
            {targetProfile.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={targetProfile.avatar_url}
                alt=""
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="flex h-full w-full items-center justify-center text-xs font-bold text-text-secondary">
                {(targetProfile.display_name || targetProfile.handle).slice(0, 1).toUpperCase()}
              </span>
            )}
          </div>
          <div className="min-w-0">
            <p className="font-bold text-text-main">
              {targetProfile.display_name || targetProfile.handle}
            </p>
            <p className="text-[10px] text-text-secondary">
              @{targetProfile.handle} · {targetProfile.role}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-primary" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-primary">
            Chat
          </span>
        </div>
      </header>

      {/* Chat */}
      <div className="flex-1 overflow-hidden">
        <ChatWindow
          threadId={threadId}
          messages={messages}
          isAdmin={true}
          myHandle={adminProfile.handle}
        />
      </div>
    </main>
  );
}
