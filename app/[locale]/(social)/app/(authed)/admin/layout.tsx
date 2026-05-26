import type { Metadata } from 'next';
import { requireAdmin } from '@/lib/auth/guards';
import { loadAdminCounts } from '@/lib/admin/counts';
import AdminNav from './AdminNav';

/**
 * Robots noindex + noarchive across every admin page so the URLs
 * never end up in search results, link previews, or archive.org.
 * Cascades to every /app/admin/* route via Next.js metadata
 * inheritance — no need to repeat it on each page.
 */
export const metadata: Metadata = {
  robots: { index: false, follow: false, nocache: true },
};

/**
 * Shared layout for every `/app/admin/*` route.
 *
 * Two jobs:
 *   1. Auth-gate the whole subtree — requireAdmin() redirects non-admins
 *      to /app/dashboard before any child page renders, so admin pages
 *      below don't need to call it again (though doing so is harmless
 *      and the existing pages still do for defense-in-depth).
 *   2. Render the persistent tabbed AdminNav at the top so the admin
 *      can jump between sections (Hub / Users / Jobs / Applications /
 *      Inquiries) without going back to the sidebar / popover menu.
 *      Pending counts surface as primary-pink badges.
 *
 * Counts are fetched once here and prop-passed into AdminNav. Children
 * still load their own data independently — Next.js dedupes nothing
 * across them, so each page stays self-contained.
 */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { supabase } = await requireAdmin();
  const counts = await loadAdminCounts(supabase);

  return (
    <div className="min-h-screen bg-background">
      <AdminNav counts={counts} />
      {children}
    </div>
  );
}
