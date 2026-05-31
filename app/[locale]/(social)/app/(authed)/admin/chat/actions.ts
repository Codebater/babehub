'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireOnboarded } from '@/lib/auth/guards';
import { createAdminClient } from '@/lib/supabase/admin';

const RATE_WINDOW_HOURS = 24;

/**
 * Rate limit tiers:
 *   - Verified / admin   → unlimited (they're trusted insiders)
 *   - Applied (applied_babehub=true) → 30/day (ongoing working relationship)
 *   - New / regular      → 10/day  (beta, prevent spam)
 */
function rateLimitForProfile(profile: { is_verified: boolean; role: string; applied_babehub?: boolean | null }): number {
  if (profile.role === 'admin' || profile.is_verified) return Infinity;
  if (profile.applied_babehub) return 30;
  return 10;
}

// ── Admin actions ───────────────────────────────────────────────────────

/**
 * Admin opens (or creates) the thread for a given user.
 * Returns the thread id; used by the admin chat thread page.
 */
export async function adminOpenThread(userId: string): Promise<string> {
  const { profile } = await requireOnboarded();
  if (profile.role !== 'admin') redirect('/app/dashboard');

  const db = createAdminClient() as any;
  const { data, error } = await db
    .from('admin_threads')
    .upsert({ user_id: userId }, { onConflict: 'user_id' })
    .select('id')
    .single();

  if (error) throw new Error(error.message);
  return data.id as string;
}

/**
 * Admin sends a message in a thread.
 */
export async function adminSendMessage(
  threadId: string,
  body: string,
): Promise<{ ok: boolean; error?: string; remaining?: number }> {
  const { user, profile } = await requireOnboarded();
  if (profile.role !== 'admin') return { ok: false, error: 'Forbidden' };

  const trimmed = body.trim();
  if (!trimmed || trimmed.length > 2000)
    return { ok: false, error: 'Message must be 1–2000 characters.' };

  const db = createAdminClient() as any;
  const { error } = await db.from('admin_messages').insert({
    thread_id: threadId,
    sender_id: user.id,
    is_from_admin: true,
    body: trimmed,
  });
  if (error) return { ok: false, error: error.message };

  // Mark admin as having read up to now (their own send)
  await db
    .from('admin_threads')
    .update({ admin_last_read_at: new Date().toISOString() })
    .eq('id', threadId);

  revalidatePath('/app/admin/chat');
  revalidatePath(`/app/admin/chat/${threadId}`);
  return { ok: true };
}

/**
 * Mark the thread as read by the admin (call when admin opens a thread).
 */
export async function adminMarkRead(threadId: string): Promise<void> {
  const { profile } = await requireOnboarded();
  if (profile.role !== 'admin') return;

  const db = createAdminClient() as any;
  await db
    .from('admin_threads')
    .update({ admin_last_read_at: new Date().toISOString() })
    .eq('id', threadId);

  revalidatePath('/app/admin/chat');
}

// ── User actions ────────────────────────────────────────────────────────

/**
 * Ensure the current user has an admin_thread row, creating it if needed.
 * Returns the thread id.
 */
export async function userEnsureThread(): Promise<string> {
  const { user } = await requireOnboarded();

  const db = createAdminClient() as any;
  const { data, error } = await db
    .from('admin_threads')
    .upsert({ user_id: user.id }, { onConflict: 'user_id' })
    .select('id')
    .single();

  if (error) throw new Error(error.message);
  return data.id as string;
}

/**
 * User sends a message in their admin thread.
 * Enforces the RATE_LIMIT cap before inserting.
 */
export async function userSendMessage(
  threadId: string,
  body: string,
): Promise<{ ok: boolean; error?: string; remaining?: number }> {
  const { user, profile } = await requireOnboarded();

  const trimmed = body.trim();
  if (!trimmed || trimmed.length > 2000)
    return { ok: false, error: 'Message must be 1–2000 characters.' };

  const db = createAdminClient() as any;

  // Resolve tier-based rate limit for this user
  const rateLimit = rateLimitForProfile(profile as any);

  // Rate-limit check (skip entirely for unlimited tier)
  const windowStart = new Date(
    Date.now() - RATE_WINDOW_HOURS * 60 * 60 * 1000,
  ).toISOString();

  const { count: sentCount } = await db
    .from('admin_messages')
    .select('id', { count: 'exact', head: true })
    .eq('sender_id', user.id)
    .eq('is_from_admin', false)
    .gte('created_at', windowStart);

  const used = sentCount ?? 0;
  if (rateLimit !== Infinity && used >= rateLimit) {
    return {
      ok: false,
      error: `You've reached the limit of ${rateLimit} messages per ${RATE_WINDOW_HOURS} hours. Please wait before sending more.`,
      remaining: 0,
    };
  }

  const { error } = await db.from('admin_messages').insert({
    thread_id: threadId,
    sender_id: user.id,
    is_from_admin: false,
    body: trimmed,
  });
  if (error) return { ok: false, error: error.message };

  // Mark user as read (they just sent, so they've seen everything up to now)
  await db
    .from('admin_threads')
    .update({ user_last_read_at: new Date().toISOString() })
    .eq('id', threadId);

  revalidatePath('/app/chat');
  const remaining = rateLimit === Infinity ? Infinity : rateLimit - used - 1;
  return { ok: true, remaining };
}

/**
 * Mark the thread as read by the user (call when user opens their inbox).
 */
export async function userMarkRead(threadId: string): Promise<void> {
  const { user } = await requireOnboarded();

  const db = createAdminClient() as any;
  await db
    .from('admin_threads')
    .update({ user_last_read_at: new Date().toISOString() })
    .eq('id', threadId)
    .eq('user_id', user.id);
}
