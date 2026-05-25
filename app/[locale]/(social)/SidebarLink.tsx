'use client';

import { usePathname } from 'next/navigation';
import { Link } from '@/i18n/navigation';

/**
 * Sidebar / mobile-tab nav link with active-state styling.
 *
 * Client component (needs usePathname). The parent server component
 * passes the icon as `children` (already-rendered JSX) — we deliberately
 * avoid taking the icon as a `LucideIcon` component prop because
 * Server→Client component props must be serializable, and React
 * function components are not. (Original bug: "Error: Functions cannot
 * be passed directly to Client Components".)
 *
 * Two visual variants:
 *   - `compact={false}` (default) → full sidebar item: icon + label
 *   - `compact={true}` → mobile bottom-tab item: stacked icon over label
 */
export default function SidebarLink({
  href,
  label,
  compact = false,
  children,
}: {
  href: string;
  label: string;
  compact?: boolean;
  /** Icon JSX, e.g. `<Compass className="h-5 w-5" />`. */
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const isActive =
    pathname === href ||
    (href !== '/' && href !== '/explore' && pathname?.startsWith(href + '/')) ||
    (href === '/explore' && pathname === '/explore');

  if (compact) {
    return (
      <Link
        href={href}
        className={`flex flex-col items-center gap-0.5 rounded-md px-3 py-1.5 text-[10px] font-medium transition-colors ${
          isActive ? 'text-primary' : 'text-text-secondary hover:text-text-main'
        }`}
      >
        {children}
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
      {children}
      {label}
    </Link>
  );
}
