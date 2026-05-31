/**
 * lib/chat/notify.ts
 *
 * Server-only helper — sends system notifications into a user's
 * admin_thread as is_from_admin=true messages.
 *
 * Call from any server action or API route where you want to surface
 * application status updates in the user's chat inbox. Best-effort:
 * every error is swallowed so the caller is never blocked.
 */
import { createAdminClient } from '@/lib/supabase/admin';

/**
 * Post a notification message to the user's admin chat thread.
 * Creates the thread if it doesn't exist yet.
 *
 * @param userId  - profiles.id of the target user
 * @param message - plain-text body (supports newlines; max 2000 chars)
 */
export async function notifyUserInChat(
  userId: string,
  message: string,
): Promise<void> {
  try {
    const db = createAdminClient() as any;

    // 1. Upsert thread (idempotent — unique on user_id)
    const { data: thread } = await db
      .from('admin_threads')
      .upsert({ user_id: userId }, { onConflict: 'user_id' })
      .select('id')
      .single();

    if (!thread?.id) return;

    // 2. Resolve sender — first admin profile (or skip if none exists)
    const { data: adminProfile } = await db
      .from('profiles')
      .select('id')
      .eq('role', 'admin')
      .limit(1)
      .maybeSingle();

    if (!adminProfile?.id) return;

    // 3. Insert notification message
    await db.from('admin_messages').insert({
      thread_id: thread.id,
      sender_id: adminProfile.id,
      is_from_admin: true,
      body: message.trim().slice(0, 2000),
    });
  } catch {
    // Best-effort — never block the caller
  }
}

// ── Pre-built message templates ──────────────────────────────────────

export const ChatMessages = {
  /** BabeHub application received (survey submission) */
  surveyReceived: () =>
    `✅ We've received your BabeHub application!\n\nOur team reviews every submission personally. You'll hear from us within 24–48 hours if you're a strong match. In the meantime, feel free to complete your profile — it helps us understand you better.\n\n— BabeHub Team`,

  /** BabeHub application status changed */
  surveyStatus: (status: string) => {
    switch (status) {
      case 'reviewing':
        return `👀 Your BabeHub application is now being reviewed by our team. We'll update you here as soon as we have news.`;
      case 'contacted':
        return `📬 We've reached out to you about your application — please check your email for a message from us.`;
      case 'accepted':
        return `🎉 Congratulations! Your BabeHub application has been **accepted**.\n\nWelcome to the community! Our team will be in touch with next steps shortly.\n\n👉 **Reply to this message** with any questions — we're right here and happy to chat. We're excited to work with you! 🚀`;
      case 'rejected':
        return `Thank you for applying to BabeHub. After careful consideration, we're unable to offer you a spot at this time.\n\nYou're welcome to apply again in the future — the platform evolves quickly and new opportunities open up regularly.`;
      default:
        return null;
    }
  },

  /** Job application submitted */
  jobApplied: (jobTitle: string) =>
    `📋 Your application for **${jobTitle}** has been submitted.\n\nThe recruiter has been notified and will review your profile and intro message. We'll update you here when there's news.`,

  /** Video uploaded — pending review */
  videoSubmitted: (title: string) =>
    `🎬 Your video **"${title}"** has been received and is now **being reviewed** by our team.\n\nWe check every upload to keep the platform safe and high-quality. You'll get a message here as soon as it's approved — usually within 24 hours.\n\nThanks for contributing to BabeHub!`,

  /** Video approved — now live */
  videoApproved: (title: string) =>
    `✅ Great news — your video **"${title}"** has been **approved** and is now live on your profile and the Explore feed!\n\nKeep the content coming. The more you upload, the more discovery and earning opportunities open up.\n\n👉 Reply here if you have any questions.`,

  /** Video rejected — with optional reason */
  videoRejected: (title: string, reason?: string) =>
    `Your video **"${title}"** wasn't approved this time.${reason ? `\n\n**Reason:** ${reason}` : ''}\n\nThis is usually about quality, content guidelines, or technical issues. Feel free to upload a revised version — and reply here if you'd like clarification from our team.`,

  /** Job application status changed (applicant-facing) */
  jobStatus: (jobTitle: string, status: string) => {
    switch (status) {
      case 'viewed':
        return `👀 The recruiter has viewed your application for **${jobTitle}**.`;
      case 'shortlisted':
        return `⭐ You've been shortlisted for **${jobTitle}**!\n\nThe recruiter is interested and will be in touch soon. Stand by.`;
      case 'accepted':
        return `🎉 Congratulations — you've been **accepted** for **${jobTitle}**!\n\nThe recruiter will contact you directly with next steps.\n\n👉 **Reply here** if you have any questions for our team. Well done!`;
      case 'rejected':
        return `Update on **${jobTitle}**: the recruiter has filled the position.\n\nDon't be discouraged — there are many more opportunities on BabeHub. Keep applying!`;
      default:
        return null;
    }
  },
};
