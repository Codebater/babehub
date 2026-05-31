import { MessageSquare, Sparkles, Zap } from 'lucide-react';
import { requireOnboarded } from '@/lib/auth/guards';
import { createAdminClient } from '@/lib/supabase/admin';
import { userEnsureThread, userMarkRead } from '../admin/chat/actions';
import ChatWindow from '../admin/chat/_components/ChatWindow';

export const dynamic = 'force-dynamic';

const RATE_WINDOW_HOURS = 24;

/**
 * Rate limit tiers — mirrors the server-action logic so the UI shows
 * the correct quota without another round-trip.
 *   - Verified / admin   → unlimited
 *   - Applied (applied_babehub) → 30/day
 *   - Everyone else      → 10/day
 */
function resolveRateLimit(profile: {
  role: string;
  is_verified: boolean;
  applied_babehub?: boolean | null;
}): number {
  if (profile.role === 'admin' || profile.is_verified) return Infinity;
  if (profile.applied_babehub) return 30;
  return 10;
}

export default async function UserChatPage() {
  const { user, profile } = await requireOnboarded();

  const db = createAdminClient() as any;
  const fullProfile = profile as any;

  const rateLimit = resolveRateLimit({
    role: fullProfile.role,
    is_verified: fullProfile.is_verified ?? false,
    applied_babehub: fullProfile.applied_babehub,
  });

  // Ensure thread + mark read
  const threadId = await userEnsureThread();
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

  // Compute remaining quota (infinite for elevated users)
  const windowStart = new Date(
    Date.now() - RATE_WINDOW_HOURS * 60 * 60 * 1000,
  ).toISOString();

  const { count: usedCount } = await db
    .from('admin_messages')
    .select('id', { count: 'exact', head: true })
    .eq('sender_id', user.id)
    .eq('is_from_admin', false)
    .gte('created_at', windowStart);

  const used = usedCount ?? 0;
  const remaining = rateLimit === Infinity ? Infinity : Math.max(0, rateLimit - used);

  const isUnlimited = rateLimit === Infinity;
  const isAccepted = fullProfile.applied_babehub === true;

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
              {isUnlimited ? (
                <span className="inline-flex items-center gap-1 rounded-full border border-green-400/40 bg-green-400/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest text-green-400">
                  <Zap className="h-2.5 w-2.5" />
                  Unlimited
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full border border-amber-400/40 bg-amber-400/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest text-amber-300">
                  <Sparkles className="h-2.5 w-2.5" />
                  Beta
                </span>
              )}
            </div>
            <p className="mt-1 text-xs text-text-secondary">
              Direct line to our team. We aim to respond within 24 hours.
            </p>
          </div>

          {/* Quota indicator */}
          {!isUnlimited && (
            <div className="shrink-0 text-right">
              <p className="text-[10px] font-bold uppercase tracking-widest text-text-secondary/60">
                Today
              </p>
              <p className="text-sm font-bold text-text-main">
                {remaining}
                <span className="text-[10px] font-normal text-text-secondary">
                  /{rateLimit}
                </span>
              </p>
            </div>
          )}
        </div>

        {/* Status strip */}
        {isUnlimited ? (
          <div className="mt-3 rounded-xl border border-green-400/20 bg-green-400/5 px-3 py-2 text-[11px] text-green-300/80">
            <strong className="text-green-400">Unlimited access.</strong>{' '}
            You can message our team freely — no daily cap.
          </div>
        ) : isAccepted ? (
          <div className="mt-3 rounded-xl border border-primary/20 bg-primary/5 px-3 py-2 text-[11px] text-primary/80">
            <strong className="text-primary">Application member.</strong>{' '}
            You can send up to {rateLimit} messages per day. Reply here anytime.
          </div>
        ) : (
          <div className="mt-3 rounded-xl border border-amber-400/20 bg-amber-400/5 px-3 py-2 text-[11px] text-amber-300/80">
            <strong className="text-amber-300">Chat is in beta.</strong>{' '}
            {rateLimit} messages per day. For urgent matters, use the contact form.
          </div>
        )}
      </header>

      {/* Chat window */}
      <div className="flex-1 overflow-hidden">
        <ChatWindow
          threadId={threadId}
          messages={messages}
          isAdmin={false}
          myHandle={profile.handle}
          rateRemaining={remaining === Infinity ? 999 : remaining}
          rateLimit={rateLimit === Infinity ? 999 : rateLimit}
        />
      </div>
    </main>
  );
}
