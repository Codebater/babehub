'use client';

import { usePathname } from 'next/navigation';
import { Link } from '@/i18n/navigation';
import type { LucideIcon } from 'lucide-react';

/**
 * Sidebar/mobile-tab nav link with active-state styling.
 *
 * Client component (needs usePathname). The parent layout is a server
 * component that hands down the route + icon + label as props; this
 * component just adds the live "am I the active route?" class.
 *
 * Two visual variants:
 *   - `compact={false}` (default) → full sidebar item: icon + label
 *   - `compact={true}` → mobile bottom-tab item: stacked icon over label
 */
export default function SidebarLink({
  href,
  icon: Icon,
  label,
  compact = false,
}: {
  href: string;
  icon: LucideIcon;
  label: string;
  compact?: boolean;
}) {
  const pathname = usePathname();

  // Strip the locale prefix from the pathname for comparison — usePathname
  // returns the canonical path without the locale segment when using
  // next-intl's navigation helpers, but be defensive in case it doesn't.
  const isActive =
    pathname === href ||
    (href !== '/explore' && pathname?.startsWith(href + '/')) ||
    (href === '/explore' && pathname === '/explore');

  if (compact) {
    return (
      <Link
        href={href}
        className={`flex flex-col items-center gap-0.5 rounded-md px-3 py-1.5 text-[10px] font-medium transition-colors ${
          isActive ? 'text-primary' : 'text-text-secondary hover:text-text-main'
        }`}
      >
        <Icon className="h-5 w-5" />
        {label}
      </Link>
    );
  }

  return (
    <Link
      href={href}
      className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors ${
        isActive
          ? 'bg-primary/10 text-primary'
          : 'text-text-secondary hover:bg-secondary hover:text-text-main'
      }`}
    >
      <Icon className="h-5 w-5" />
      {label}
    </Link>
  );
}
