'use client';

import { useState } from 'react';
import {
  Compass,
  LayoutGrid,
  Briefcase,
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
  Megaphone,
  ShieldAlert,
  FileText,
  X,
  User,
  MessageSquare,
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
  hasUnreadChat?: boolean;
};

const CATEGORIES = [
  {
    label: 'Casting',
    href: '/explore?q=casting',
    icon: Clapperboard,
    color: 'bg-pink-500/15 text-pink-400',
    glow: 'shadow-pink-500/20',
  },
  {
    label: 'Live Cams',
    href: '/explore?q=live%20cams',
    icon: Radio,
    color: 'bg-blue-500/15 text-blue-400',
    glow: 'shadow-blue-500/20',
  },
  {
    label: 'Luxury',
    href: '/explore?q=luxury',
    icon: Gem,
    color: 'bg-amber-500/15 text-amber-400',
    glow: 'shadow-amber-500/20',
  },
  {
    label: 'Creators',
    href: '/creators',
    icon: Users,
    color: 'bg-purple-500/15 text-purple-400',
    glow: 'shadow-purple-500/20',
  },
  {
    label: 'Jobs',
    href: '/jobs',
    icon: Briefcase,
    color: 'bg-emerald-500/15 text-emerald-400',
    glow: 'shadow-emerald-500/20',
  },
  {
    label: 'Blog',
    href: '/blog',
    icon: BookOpen,
    color: 'bg-orange-500/15 text-orange-400',
    glow: 'shadow-orange-500/20',
  },
  {
    label: 'Explore',
    href: '/explore',
    icon: Compass,
    color: 'bg-teal-500/15 text-teal-400',
    glow: 'shadow-teal-500/20',
  },
  {
    label: 'Marketing',
    href: '/marketing',
    icon: Megaphone,
    color: 'bg-indigo-500/15 text-indigo-400',
    glow: 'shadow-indigo-500/20',
  },
];

export default function MobileNav({
  profile,
  isCreator,
  isAdmin,
  hasProfessionalProfile,
  hasUnreadChat = false,
}: Props) {
  const [sheet, setSheet] = useState<'browse' | 'me' | null>(null);
  const pathname = usePathname();
  const close = () => setSheet(null);

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/');

  return (
    <>
      {/* ── Bottom Tab Bar ─────────────────────────────────────────────── */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-40 md:hidden"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        {/* Frosted glass bar */}
        <div className="flex items-stretch justify-around border-t border-white/[0.06] bg-black/85 shadow-[0_-1px_0_0_rgba(255,255,255,0.04)] backdrop-blur-2xl">

          {/* Explore */}
          <Link
            href="/explore"
            className="flex flex-1 flex-col items-center justify-center gap-0.5 py-2.5"
          >
            <span className={`flex h-9 w-9 items-center justify-center rounded-2xl transition-all ${isActive('/explore') ? 'bg-primary/20' : ''}`}>
              <Compass className={`h-5 w-5 transition-colors ${isActive('/explore') ? 'text-primary' : 'text-white/50'}`} />
            </span>
            <span className={`text-[9px] font-semibold uppercase tracking-wider transition-colors ${isActive('/explore') ? 'text-primary' : 'text-white/40'}`}>
              Explore
            </span>
          </Link>

          {/* Browse — opens category sheet */}
          <div className="flex flex-1 flex-col items-center justify-center gap-0.5 py-2.5">
            <button
              type="button"
              onClick={() => setSheet((s) => (s === 'browse' ? null : 'browse'))}
              className="flex w-full flex-col items-center gap-0.5"
            >
              <span className={`flex h-9 w-9 items-center justify-center rounded-2xl transition-all ${sheet === 'browse' ? 'bg-primary/20' : ''}`}>
                <LayoutGrid className={`h-5 w-5 transition-colors ${sheet === 'browse' ? 'text-primary' : 'text-white/50'}`} />
              </span>
              <span className={`text-[9px] font-semibold uppercase tracking-wider transition-colors ${sheet === 'browse' ? 'text-primary' : 'text-white/40'}`}>
                Browse
              </span>
            </button>
          </div>

          {/* Centre action — New post (creators) or Jobs */}
          <div className="flex flex-1 flex-col items-center justify-center py-2">
            {isCreator ? (
              <Link
                href="/app/dashboard/posts/new"
                className="flex flex-col items-center gap-0.5"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-pink-600 shadow-lg shadow-primary/40 transition-transform active:scale-95">
                  <Plus className="h-5 w-5 text-white" />
                </span>
                <span className="text-[9px] font-semibold uppercase tracking-wider text-white/40">New</span>
              </Link>
            ) : (
              <Link
                href="/jobs"
                className="flex flex-col items-center gap-0.5"
              >
                <span className={`flex h-9 w-9 items-center justify-center rounded-2xl transition-all ${isActive('/jobs') ? 'bg-primary/20' : ''}`}>
                  <Briefcase className={`h-5 w-5 transition-colors ${isActive('/jobs') ? 'text-primary' : 'text-white/50'}`} />
                </span>
                <span className={`text-[9px] font-semibold uppercase tracking-wider transition-colors ${isActive('/jobs') ? 'text-primary' : 'text-white/40'}`}>
                  Jobs
                </span>
              </Link>
            )}
          </div>

          {/* Me / Account */}
          <div className="flex flex-1 flex-col items-center justify-center gap-0.5 py-2.5">
            {profile ? (
              <button
                type="button"
                onClick={() => setSheet((s) => (s === 'me' ? null : 'me'))}
                className="flex w-full flex-col items-center gap-0.5"
              >
                <span className={`relative flex h-9 w-9 items-center justify-center rounded-2xl transition-all ${sheet === 'me' ? 'ring-2 ring-primary ring-offset-1 ring-offset-black' : ''}`}>
                  {profile.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={profile.avatar_url}
                      alt=""
                      className="h-8 w-8 rounded-xl object-cover"
                    />
                  ) : (
                    <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-pink-600 text-[11px] font-black text-white">
                      {(profile.display_name || profile.handle).slice(0, 1).toUpperCase()}
                    </span>
                  )}
                  {hasUnreadChat && (
                    <span className="absolute right-0.5 top-0.5 h-2.5 w-2.5 rounded-full border-2 border-black bg-primary" />
                  )}
                </span>
                <span className={`text-[9px] font-semibold uppercase tracking-wider transition-colors ${sheet === 'me' ? 'text-primary' : 'text-white/40'}`}>
                  Me
                </span>
              </button>
            ) : (
              <Link
                href="/app/login"
                className="flex flex-col items-center gap-0.5"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-2xl">
                  <LogIn className="h-5 w-5 text-white/50" />
                </span>
                <span className="text-[9px] font-semibold uppercase tracking-wider text-white/40">
                  Sign in
                </span>
              </Link>
            )}
          </div>
        </div>
      </nav>

      {/* ── Browse Category Sheet ────────────────────────────────────────── */}
      {sheet === 'browse' && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={close}
            aria-hidden
          />
          {/* Sheet */}
          <div className="absolute bottom-0 left-0 right-0 animate-slide-up rounded-t-3xl bg-[#0f0f0f] pb-safe">
            {/* Pull handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="h-1 w-10 rounded-full bg-white/20" />
            </div>
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3">
              <p className="text-sm font-bold text-white/70">Browse</p>
              <button
                type="button"
                onClick={close}
                className="flex h-7 w-7 items-center justify-center rounded-full bg-white/10 text-white/60 transition-colors hover:bg-white/20"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            {/* Category grid */}
            <div className="grid grid-cols-4 gap-2 px-4 pb-28 pt-2">
              {CATEGORIES.map((cat) => {
                const Icon = cat.icon;
                return (
                  <Link
                    key={cat.href}
                    href={cat.href as '/explore'}
                    onClick={close}
                    className="flex flex-col items-center gap-2.5 rounded-2xl p-3 text-center transition-all active:scale-95"
                  >
                    <span className={`flex h-14 w-14 items-center justify-center rounded-2xl shadow-lg ${cat.color} ${cat.glow}`}>
                      <Icon className="h-6 w-6" />
                    </span>
                    <span className="text-[10px] font-semibold leading-tight text-white/80">
                      {cat.label}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── Account Sheet ────────────────────────────────────────────────── */}
      {sheet === 'me' && profile && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={close}
            aria-hidden
          />
          {/* Sheet */}
          <div className="absolute bottom-0 left-0 right-0 animate-slide-up rounded-t-3xl bg-[#0f0f0f] pb-safe">
            {/* Pull handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="h-1 w-10 rounded-full bg-white/20" />
            </div>

            {/* Profile header with gradient */}
            <div className="relative overflow-hidden px-5 pb-5 pt-3">
              {/* Ambient glow behind avatar */}
              <div className="pointer-events-none absolute -top-10 left-1/2 h-40 w-40 -translate-x-1/2 rounded-full bg-primary/20 blur-3xl" aria-hidden />
              <div className="relative flex items-center gap-4">
                <span className="h-14 w-14 shrink-0 overflow-hidden rounded-2xl ring-2 ring-primary/40">
                  {profile.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={profile.avatar_url}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary to-pink-600 text-xl font-black text-white">
                      {(profile.display_name || profile.handle).slice(0, 1).toUpperCase()}
                    </span>
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-base font-black text-white">
                    {profile.display_name || profile.handle}
                  </p>
                  <p className="truncate text-sm text-white/50">@{profile.handle}</p>
                </div>
                <button
                  type="button"
                  onClick={close}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/10 text-white/60 hover:bg-white/20"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Divider */}
            <div className="mx-5 h-px bg-white/[0.06]" />

            {/* Menu items */}
            <div className="px-3 py-3">
              {isAdmin && (
                <AccountLink
                  href="/app/admin"
                  onClick={close}
                  icon={<ShieldAlert className="h-4 w-4" />}
                  iconBg="bg-primary/20 text-primary"
                >
                  Admin hub
                </AccountLink>
              )}
              <AccountLink
                href={hasProfessionalProfile ? (`/c/${profile.handle}` as '/c/[handle]') : '/app/professional/edit'}
                onClick={close}
                icon={<User className="h-4 w-4" />}
                iconBg="bg-white/10 text-white/70"
              >
                My profile
                {!hasProfessionalProfile && (
                  <span className="ml-auto rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-primary">
                    Set up
                  </span>
                )}
              </AccountLink>
              <AccountLink
                href="/favorites"
                onClick={close}
                icon={<Star className="h-4 w-4" />}
                iconBg="bg-amber-500/15 text-amber-400"
              >
                Favorites
              </AccountLink>
              <AccountLink
                href="/app/dashboard"
                onClick={close}
                icon={<LayoutDashboard className="h-4 w-4" />}
                iconBg="bg-blue-500/15 text-blue-400"
              >
                Dashboard
              </AccountLink>
              {isCreator && (
                <AccountLink
                  href="/app/dashboard/posts/new"
                  onClick={close}
                  icon={<Plus className="h-4 w-4" />}
                  iconBg="bg-primary/20 text-primary"
                >
                  New post
                </AccountLink>
              )}
              <AccountLink
                href="/app/creator/applications"
                onClick={close}
                icon={<FileText className="h-4 w-4" />}
                iconBg="bg-emerald-500/15 text-emerald-400"
              >
                My applications
              </AccountLink>
              <AccountLink
                href="/app/chat"
                onClick={close}
                icon={<MessageSquare className="h-4 w-4" />}
                iconBg="bg-primary/20 text-primary"
              >
                Messages
                {hasUnreadChat && (
                  <span className="ml-auto h-2.5 w-2.5 rounded-full bg-primary" />
                )}
              </AccountLink>
            </div>

            {/* Sign out — distinct red zone */}
            <div className="mx-3 mb-6 mt-1 overflow-hidden rounded-2xl border border-red-500/20 bg-red-500/5">
              <form action={signOut}>
                <button
                  type="submit"
                  className="flex w-full items-center gap-3 px-4 py-3.5 text-sm font-semibold text-red-400 transition-colors hover:bg-red-500/10 active:bg-red-500/10"
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

/* ── Helpers ─────────────────────────────────────────────────────────── */

function AccountLink({
  href,
  onClick,
  icon,
  iconBg,
  children,
}: {
  href: string;
  onClick: () => void;
  icon: React.ReactNode;
  iconBg: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href as '/favorites'}
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-white/80 transition-colors hover:bg-white/5 active:bg-white/5"
    >
      <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${iconBg}`}>
        {icon}
      </span>
      {children}
    </Link>
  );
}
