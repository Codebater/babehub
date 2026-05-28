'use client';

import { usePathname } from 'next/navigation';
import { Link } from '@/i18n/navigation';
import {
  LayoutDashboard,
  Users,
  Briefcase,
  Mail,
  Megaphone,
  ArrowLeft,
  FileText,
  ImageIcon,
} from 'lucide-react';
import type { AdminCounts } from '@/lib/admin/counts';

/**
 * Persistent admin navigation row mounted by /app/admin/layout.tsx.
 *
 * Shows five tabs (Hub / Users / Jobs / Applications / Inquiries) with
 * live counts. Pending-action counts (new applications, new inquiries)
 * render as primary-pink badges so the admin sees what needs attention
 * at a glance. The active tab is highlighted via pathname match.
 *
 * Far-right escape hatch back to `/explore` so the admin can leave the
 * tooling and use the platform as a regular user without hunting for
 * the sidebar.
 */
type Tab = {
  href: string;
  label: string;
  icon: React.ReactNode;
  /** Total count shown as the headline value. */
  count: number;
  /** "Needs attention" count rendered as a pink dot/badge. */
  pending?: number;
  /** Color accent for the tab when active. */
  accent: 'primary' | 'amber' | 'sky';
};

export default function AdminNav({ counts }: { counts: AdminCounts }) {
  const pathname = usePathname() ?? '';

  const tabs: Tab[] = [
    {
      href: '/app/admin',
      label: 'Hub',
      icon: <LayoutDashboard className="h-4 w-4" />,
      count: 0,
      accent: 'primary',
    },
    {
      href: '/app/admin/users',
      label: 'Users',
      icon: <Users className="h-4 w-4" />,
      count: counts.users,
      accent: 'primary',
    },
    {
      href: '/app/admin/jobs',
      label: 'Jobs',
      icon: <Briefcase className="h-4 w-4" />,
      count: counts.totalJobs,
      pending: counts.featuredJobs,
      accent: 'amber',
    },
    {
      href: '/app/admin/applications',
      label: 'Applications',
      icon: <Mail className="h-4 w-4" />,
      count: counts.totalApplications,
      pending: counts.newApplications,
      accent: 'primary',
    },
    {
      href: '/app/admin/inquiries',
      label: 'Inquiries',
      icon: <Megaphone className="h-4 w-4" />,
      count: counts.totalInquiries,
      pending: counts.newInquiries,
      accent: 'amber',
    },
    {
      href: '/app/admin/blog',
      label: 'Blog',
      icon: <FileText className="h-4 w-4" />,
      count: counts.blogPosts,
      pending: counts.blogDrafts,
      accent: 'primary',
    },
    {
      href: '/app/admin/marketing',
      label: 'Marketing',
      icon: <ImageIcon className="h-4 w-4" />,
      count: 0,
      accent: 'sky',
    },
  ];

  const isActive = (href: string) =>
    href === '/app/admin'
      ? pathname.endsWith('/app/admin') || pathname.endsWith('/admin')
      : pathname.includes(href);

  return (
    <header className="sticky top-0 z-30 border-b border-border-color bg-card/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-3 md:flex-row md:items-center md:justify-between md:px-6">
        <div className="flex items-center gap-3">
          <p className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.25em] text-primary">
            Admin
          </p>
          <p className="hidden text-xs text-text-secondary md:inline">
            Manage users · jobs · applications · inquiries
          </p>
        </div>

        <nav className="-mx-1 flex items-center gap-1 overflow-x-auto px-1 md:mx-0 md:px-0">
          {tabs.map((t) => {
            const active = isActive(t.href);
            const accentText =
              t.accent === 'primary'
                ? 'text-primary'
                : t.accent === 'amber'
                  ? 'text-amber-300'
                  : 'text-sky-300';
            const accentBg =
              t.accent === 'primary'
                ? 'bg-primary/10 border-primary/40'
                : t.accent === 'amber'
                  ? 'bg-amber-400/10 border-amber-400/40'
                  : 'bg-sky-400/10 border-sky-400/40';
            return (
              <Link
                key={t.href}
                href={t.href as never}
                className={`group inline-flex shrink-0 items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-bold transition-all ${
                  active
                    ? `${accentBg} ${accentText}`
                    : 'border-border-color bg-card text-text-secondary hover:border-border-color/80 hover:text-text-main'
                }`}
              >
                <span className={active ? accentText : ''}>{t.icon}</span>
                <span>{t.label}</span>
                {t.count > 0 && (
                  <span
                    className={`rounded-full px-1.5 py-0.5 text-[9px] font-bold tabular-nums ${
                      active
                        ? `${accentBg} ${accentText}`
                        : 'bg-secondary text-text-secondary'
                    }`}
                  >
                    {t.count.toLocaleString()}
                  </span>
                )}
                {t.pending && t.pending > 0 && (
                  <span
                    aria-label={`${t.pending} pending`}
                    title={`${t.pending} pending`}
                    className="inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[9px] font-bold text-white"
                  >
                    {t.pending}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <Link
          href="/explore"
          className="hidden shrink-0 items-center gap-1.5 rounded-full border border-border-color px-3 py-1.5 text-xs font-bold text-text-secondary transition-colors hover:border-primary hover:text-primary md:inline-flex"
        >
          <ArrowLeft className="h-3 w-3" />
          Exit
        </Link>
      </div>
    </header>
  );
}
