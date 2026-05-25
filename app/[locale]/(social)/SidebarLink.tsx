'use client';

import { usePathname, useSearchParams } from 'next/navigation';
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
  matchQuery,
  children,
}: {
  href: string;
  label: string;
  compact?: boolean;
  /**
   * If set, the link is only "active" when both the path matches AND the
   * current ?q= search param equals this value. Used so e.g. the Casting
   * link (/explore?q=casting) doesn't fight with the plain Explore link
   * (/explore) for the highlight when both have the same pathname.
   *
   * Pass an empty string to require that NO ?q= is present (plain Explore).
   */
  matchQuery?: string;
  /** Icon JSX, e.g. `<Compass className="h-5 w-5" />`. */
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // next-intl's Link expects either a string pathname OR an object
  // { pathname, query }. If the caller passed "/explore?q=casting" as a
  // single string, next-intl treats the literal "?q=casting" as part of
  // the path which routes to a 404. Parse the query out and pass the
  // object form so the route lands on /explore and the query is preserved.
  const [hrefPath, hrefQueryString = ''] = href.split('?');
  const hrefQuery: Record<string, string> = {};
  if (hrefQueryString) {
    new URLSearchParams(hrefQueryString).forEach((value, key) => {
      hrefQuery[key] = value;
    });
  }
  const linkHref =
    Object.keys(hrefQuery).length > 0
      ? { pathname: hrefPath as '/explore', query: hrefQuery }
      : (hrefPath as '/explore');

  const currentQuery = searchParams?.get('q') ?? '';

  const pathMatches =
    pathname === hrefPath ||
    (hrefPath !== '/' && hrefPath !== '/explore' && pathname?.startsWith(hrefPath + '/')) ||
    (hrefPath === '/explore' && pathname === '/explore');

  // If matchQuery was passed, also require the search param to match
  // exactly. Otherwise plain pathname match is enough.
  const queryMatches = matchQuery === undefined ? true : currentQuery === matchQuery;

  const isActive = pathMatches && queryMatches;

  // Icon wrapper: hovering the link animates the icon (scale + tilt +
  // color shift to primary) so categories feel alive on hover. The
  // `group` class on the outer Link enables the group-hover selectors
  // here. Active links already glow primary; the hover effect makes
  // every link feel interactive too.
  const iconWrapClass =
    'inline-flex shrink-0 transition-transform duration-200 ease-out group-hover:scale-110 group-hover:-rotate-6' +
    (isActive ? ' text-primary' : ' group-hover:text-primary');

  if (compact) {
    return (
      <Link
        href={linkHref}
        className={`group flex flex-col items-center gap-0.5 rounded-md px-3 py-1.5 text-[10px] font-medium transition-colors ${
          isActive ? 'text-primary' : 'text-text-secondary hover:text-text-main'
        }`}
      >
        <span className={iconWrapClass}>{children}</span>
        {label}
      </Link>
    );
  }

  return (
    <Link
      href={linkHref}
      className={`group flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors ${
        isActive
          ? 'bg-primary/10 text-primary'
          : 'text-text-secondary hover:bg-secondary hover:text-text-main'
      }`}
    >
      <span className={iconWrapClass}>{children}</span>
      {label}
    </Link>
  );
}
