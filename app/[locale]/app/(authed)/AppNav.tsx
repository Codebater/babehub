'use client';

import { useEffect, useRef, useState } from 'react';
import { ChevronDown, LogOut, Settings as SettingsIcon, ExternalLink } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { signOut } from '../(public)/login/actions';

type Props = {
  profile: {
    handle: string;
    display_name: string;
    avatar_url: string | null;
  };
  isCreator: boolean;
};

/**
 * Persistent top navigation for every authenticated `/app/*` page. Logo
 * left-justified (Babe Hub wordmark linking to dashboard), section links
 * in the middle, profile menu on the right with avatar + display name +
 * dropdown (view public profile, settings, sign out).
 */
export default function AppNav({ profile, isCreator }: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close the profile dropdown on outside-click and Escape.
  useEffect(() => {
    if (!menuOpen) return;
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onEsc);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onEsc);
    };
  }, [menuOpen]);

  return (
    <header className="sticky top-0 z-40 border-b border-border-color/40 bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-6">
        <div className="flex items-center gap-6">
          <Link
            href="/app/dashboard"
            className="text-lg font-black tracking-tight text-text-main hover:text-primary"
          >
            Babe<span className="text-primary">Hub</span>
          </Link>

          <nav className="hidden gap-5 text-sm text-text-secondary md:flex">
            <Link href="/app/dashboard" className="transition-colors hover:text-text-main">
              Dashboard
            </Link>
            {isCreator && (
              <>
                <Link
                  href="/app/dashboard/tiers"
                  className="transition-colors hover:text-text-main"
                >
                  Tiers
                </Link>
                <Link
                  href="/app/dashboard/posts"
                  className="transition-colors hover:text-text-main"
                >
                  Posts
                </Link>
              </>
            )}
            <Link href="/app/settings" className="transition-colors hover:text-text-main">
              Settings
            </Link>
          </nav>
        </div>

        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            className="flex items-center gap-2 rounded-full border border-border-color px-2 py-1 transition-colors hover:border-primary/60"
            aria-haspopup="menu"
            aria-expanded={menuOpen}
          >
            <span className="h-7 w-7 overflow-hidden rounded-full bg-secondary">
              {profile.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={profile.avatar_url}
                  alt=""
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/40 to-pink-600/40 text-xs font-black text-white">
                  {(profile.display_name || profile.handle).slice(0, 1).toUpperCase()}
                </span>
              )}
            </span>
            <span className="hidden text-sm font-medium text-text-main sm:inline">
              {profile.display_name || profile.handle}
            </span>
            <ChevronDown className="h-3 w-3 text-text-secondary" />
          </button>

          {menuOpen && (
            <div
              role="menu"
              className="absolute right-0 top-full mt-2 w-56 overflow-hidden rounded-xl border border-border-color bg-card shadow-xl"
            >
              <div className="border-b border-border-color/40 px-4 py-3">
                <p className="truncate text-sm font-medium text-text-main">
                  {profile.display_name || profile.handle}
                </p>
                <p className="truncate text-xs text-text-secondary">@{profile.handle}</p>
              </div>
              <Link
                href={`/c/${profile.handle}`}
                className="flex items-center gap-2 px-4 py-2 text-sm text-text-main transition-colors hover:bg-secondary"
                onClick={() => setMenuOpen(false)}
              >
                <ExternalLink className="h-4 w-4 text-text-secondary" />
                View public profile
              </Link>
              <Link
                href="/app/settings"
                className="flex items-center gap-2 px-4 py-2 text-sm text-text-main transition-colors hover:bg-secondary"
                onClick={() => setMenuOpen(false)}
              >
                <SettingsIcon className="h-4 w-4 text-text-secondary" />
                Settings
              </Link>
              <form action={signOut}>
                <button
                  type="submit"
                  className="flex w-full items-center gap-2 border-t border-border-color/40 px-4 py-2 text-left text-sm text-red-400 transition-colors hover:bg-red-500/10"
                >
                  <LogOut className="h-4 w-4" />
                  Sign out
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
