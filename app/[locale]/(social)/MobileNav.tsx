'use client';

import { useState } from 'react';
import {
  Compass,
  LayoutGrid,
  Briefcase,
  User,
  LogIn,
  Plus,
  Star,
  LayoutDashboard,
  LogOut,
  Clapperboard,
  Radio,
  Gem,
  Users,
  BookOpen,
  Home,
  ShieldAlert,
  FileText,
  X,
} from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { usePathname } from 'next/navigation';
import { signOut } from '../app/(public)/login/actions';

type Profile = {
  handle: string;
  display_name: string;
  avatar_url: string | null;
};

type Props = {
  profile: Profile | null;
  isCreator: boolean;
  isAdmin: boolean;
  hasProfessionalProfile: boolean;
};

const CATEGORIES = [
  { label: 'Casting', href: '/explore?q=casting', icon: <Clapperboard className="h-6 w-6" /> },
  { label: 'Live Cams', href: '/explore?q=live%20cams', icon: <Radio className="h-6 w-6" /> },
  { label: 'Luxury', href: '/explore?q=luxury', icon: <Gem className="h-6 w-6" /> },
  { label: 'Creators', href: '/creators', icon: <Users className="h-6 w-6" /> },
  { label: 'Jobs', href: '/jobs', icon: <Briefcase className="h-6 w-6" /> },
  { label: 'Blog', href: '/blog', icon: <BookOpen className="h-6 w-6" /> },
  { label: 'Explore', href: '/explore', icon: <Compass className="h-6 w-6" /> },
  { label: 'Marketing', href: '/marketing', icon: <Home className="h-6 w-6" /> },
];

export default function MobileNav({
  profile,
  isCreator,
  isAdmin,
  hasProfessionalProfile,
}: Props) {
  const [sheet, setSheet] = useState<'browse' | 'me' | null>(null);
  const pathname = usePathname();
  const close = () => setSheet(null);

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/');

  return (
    <>
      {/* ── Bottom Tab Bar ─────────────────────────────────────────────── */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 flex items-stretch justify-around border-t border-border-color bg-card/95 backdrop-blur md:hidden">
        {/* Explore */}
        <Link
          href="/explore"
          className={`flex flex-1 flex-col items-center justify-center gap-1 py-2.5 text-[10px] font-semibold uppercase tracking-widest transition-colors ${
            isActive('/explore') ? 'text-primary' : 'text-text-secondary hover:text-text-main'
          }`}
        >
          <Compass className="h-5 w-5" />
          Explore
        </Link>

        {/* Browse — opens category sheet */}
        <button
          type="button"
          onClick={() => setSheet((s) => (s === 'browse' ? null : 'browse'))}
          className={`flex flex-1 flex-col items-center justify-center gap-1 py-2.5 text-[10px] font-semibold uppercase tracking-widest transition-colors ${
            sheet === 'browse' ? 'text-primary' : 'text-text-secondary hover:text-text-main'
          }`}
        >
          <LayoutGrid className="h-5 w-5" />
          Browse
        </button>

        {/* Create (creators) or Jobs (everyone else) */}
        {isCreator ? (
          <Link
            href="/app/dashboard/posts/new"
            className="flex flex-1 flex-col items-center justify-center gap-1 py-2.5 text-[10px] font-semibold uppercase tracking-widest text-text-secondary transition-colors hover:text-text-main"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary shadow-lg shadow-primary/30">
              <Plus className="h-4 w-4 text-white" />
            </span>
            <span className="-mt-0.5">New</span>
          </Link>
        ) : (
          <Link
            href="/jobs"
            className={`flex flex-1 flex-col items-center justify-center gap-1 py-2.5 text-[10px] font-semibold uppercase tracking-widest transition-colors ${
              isActive('/jobs') ? 'text-primary' : 'text-text-secondary hover:text-text-main'
            }`}
          >
            <Briefcase className="h-5 w-5" />
            Jobs
          </Link>
        )}

        {/* Me / Account — opens account sheet or sign-in */}
        {profile ? (
          <button
            type="button"
            onClick={() => setSheet((s) => (s === 'me' ? null : 'me'))}
            className={`flex flex-1 flex-col items-center justify-center gap-1 py-2.5 text-[10px] font-semibold uppercase tracking-widest transition-colors ${
              sheet === 'me' ? 'text-primary' : 'text-text-secondary hover:text-text-main'
            }`}
          >
            {profile.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={profile.avatar_url}
                alt=""
                className={`h-6 w-6 rounded-full object-cover ring-2 transition-all ${
                  sheet === 'me' ? 'ring-primary' : 'ring-transparent'
                }`}
              />
            ) : (
              <span
                className={`flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-primary/40 to-pink-600/40 text-[10px] font-black text-white ring-2 transition-all ${
                  sheet === 'me' ? 'ring-primary' : 'ring-transparent'
                }`}
              >
                {(profile.display_name || profile.handle).slice(0, 1).toUpperCase()}
              </span>
            )}
            Me
          </button>
        ) : (
          <Link
            href="/app/login"
            className="flex flex-1 flex-col items-center justify-center gap-1 py-2.5 text-[10px] font-semibold uppercase tracking-widest text-text-secondary transition-colors hover:text-text-main"
          >
            <LogIn className="h-5 w-5" />
            Sign in
          </Link>
        )}
      </nav>

      {/* ── Browse Category Sheet ────────────────────────────────────────── */}
      {sheet === 'browse' && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={close}
            aria-hidden
          />
          <div className="absolute bottom-0 left-0 right-0 animate-slide-up rounded-t-3xl border-t border-border-color bg-card pb-safe">
            <div className="flex items-center justify-between border-b border-border-color/40 px-5 py-4">
              <p className="text-sm font-bold uppercase tracking-widest text-text-secondary">
                Browse
              </p>
              <button
                type="button"
                onClick={close}
                className="flex h-7 w-7 items-center justify-center rounded-full text-text-secondary hover:bg-secondary hover:text-text-main"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="grid grid-cols-4 gap-1 p-4 pb-20">
              {CATEGORIES.map((cat) => (
                <Link
                  key={cat.href}
                  href={cat.href as '/explore'}
                  onClick={close}
                  className="flex flex-col items-center gap-2 rounded-2xl px-2 py-4 text-center transition-colors hover:bg-secondary active:bg-secondary"
                >
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary text-text-main">
                    {cat.icon}
                  </span>
                  <span className="text-[11px] font-semibold leading-tight text-text-main">
                    {cat.label}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Account Sheet ────────────────────────────────────────────────── */}
      {sheet === 'me' && profile && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={close}
            aria-hidden
          />
          <div className="absolute bottom-0 left-0 right-0 animate-slide-up rounded-t-3xl border-t border-border-color bg-card pb-safe">
            {/* Profile header */}
            <div className="flex items-center gap-4 border-b border-border-color/40 px-5 py-5">
              <span className="h-12 w-12 shrink-0 overflow-hidden rounded-full bg-secondary">
                {profile.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={profile.avatar_url}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/40 to-pink-600/40 text-lg font-black text-white">
                    {(profile.display_name || profile.handle).slice(0, 1).toUpperCase()}
                  </span>
                )}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-bold text-text-main">
                  {profile.display_name || profile.handle}
                </p>
                <p className="truncate text-sm text-text-secondary">@{profile.handle}</p>
              </div>
              <button
                type="button"
                onClick={close}
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-text-secondary hover:bg-secondary hover:text-text-main"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Menu items */}
            <div className="px-3 py-3 pb-20">
              {isAdmin && (
                <SheetLink href="/app/admin" onClick={close} icon={<ShieldAlert className="h-4 w-4 text-primary" />}>
                  Admin hub
                </SheetLink>
              )}
              <SheetLink
                href={hasProfessionalProfile ? (`/c/${profile.handle}` as '/c/[handle]') : '/app/professional/edit'}
                onClick={close}
                icon={<User className="h-4 w-4" />}
              >
                My profile
                {!hasProfessionalProfile && (
                  <span className="ml-auto rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-primary">
                    Set up
                  </span>
                )}
              </SheetLink>
              <SheetLink href="/favorites" onClick={close} icon={<Star className="h-4 w-4" />}>
                Favorites
              </SheetLink>
              <SheetLink href="/app/dashboard" onClick={close} icon={<LayoutDashboard className="h-4 w-4" />}>
                Dashboard
              </SheetLink>
              {isCreator && (
                <SheetLink href="/app/dashboard/posts/new" onClick={close} icon={<Plus className="h-4 w-4" />}>
                  New post
                </SheetLink>
              )}
              <SheetLink href="/app/creator/applications" onClick={close} icon={<FileText className="h-4 w-4" />}>
                My applications
              </SheetLink>

              <div className="my-2 border-t border-border-color/40" />

              <form action={signOut}>
                <button
                  type="submit"
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-text-secondary transition-colors hover:bg-red-500/10 hover:text-red-400 active:bg-red-500/10"
                >
                  <LogOut className="h-4 w-4" />
                  Sign out
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function SheetLink({
  href,
  onClick,
  icon,
  children,
}: {
  href: string;
  onClick: () => void;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href as '/favorites'}
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-text-main transition-colors hover:bg-secondary active:bg-secondary"
    >
      {icon}
      {children}
    </Link>
  );
}
