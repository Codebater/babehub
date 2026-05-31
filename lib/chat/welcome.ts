/**
 * lib/chat/welcome.ts
 *
 * Idempotent "welcome message" creation for newly-signed-up users.
 *
 * Called from EVERY signup entry point — the magic-link / OAuth callback,
 * the instant password-signup path (Confirm-email OFF), and the 6-digit
 * token-verify fallback — because not all of them flow through
 * /auth/callback. Safe to call repeatedly: it no-ops once a thread exists.
 */
import { createAdminClient } from '@/lib/supabase/admin';

const WELCOME_BODY = `Welcome to BabeHub! 👋

Great to have you here. To get started, please complete your profile:

• Set a handle and display name
• Upload a profile photo
• Write a short bio about yourself
• Choose your categories and niche

Your profile is how brands, agencies, and casting directors discover you — so the more complete it is, the better your chances.

👉 Have a question? Just reply to this message — our team is active here and happy to help.

— The BabeHub Team 🚀`;

/**
 * Ensure a freshly-signed-up user has a chat thread with a welcome
 * message from the BabeHub team. Best-effort: any failure is swallowed
 * so it never blocks the signup flow.
 */
export async function ensureWelcomeMessage(userId: string): Promise<void> {
  try {
    const db = createAdminClient() as any;

    // Already has a thread? (welcome already sent, or an admin opened one)
    const { data: existing } = await db
      .from('admin_threads')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();
    if (existing) return;

    // Need an admin account to author the welcome message. If there isn't
    // one yet, bail without creating an empty thread so a later entry
    // point can retry once an admin exists.
    const { data: adminProfile } = await db
      .from('profiles')
      .select('id')
      .eq('role', 'admin')
      .limit(1)
      .maybeSingle();
    if (!adminProfile?.id) return;

    const { data: thread } = await db
      .from('admin_threads')
      .insert({ user_id: userId })
      .select('id')
      .single();
    if (!thread?.id) return;

    await db.from('admin_messages').insert({
      thread_id: thread.id,
      sender_id: adminProfile.id,
      is_from_admin: true,
      body: WELCOME_BODY,
    });
  } catch {
    // Best-effort — never block signup.
  }
}
