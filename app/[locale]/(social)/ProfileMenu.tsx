'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import {
  ChevronUp,
  Star,
  LayoutDashboard,
  Plus,
  LogOut,
  Megaphone,
  Briefcase,
  Loader2,
  FileText,
  ShieldAlert,
} from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { signOut } from '../app/(public)/login/actions';
import { useSurveyModal } from './SurveyModalProvider';
import { toggleRole } from './app/(authed)/professional/edit/actions';

/**
 * Signed-in profile pill at the bottom of the desktop sidebar. Click
 * opens a popover above the pill that contains every "personal"
 * destination: My profile, Favorites, Dashboard, (creators) New post,
 * Settings, Sign out.
 *
 * Pattern matches X/Twitter's bottom-left account menu — the main nav
 * stays clean (only Categories + the BabeHub logo), and everything
 * personal lives one click away under the avatar.
 *
 * Client component because it owns open/closed state + outside-click /
 * Esc dismissal. The signOut server action is imported and used as the
 * form's action prop — that's the supported pattern for invoking
 * server actions from client components.
 */
type Props = {
  profile: {
    handle: string;
    display_name: string;
    avatar_url: string | null;
  };
  isCreator: boolean;
  /**
   * True when the viewer's profile.role is 'admin'. Drives the admin
   * shortcut at the top of the popover (Users table for now; more
   * surfaces — verification queue, content moderation — land here as
   * they're built).
   */
  isAdmin?: boolean;
  /**
   * True when the viewer's profile.roles[] already contains at least
   * one buy-side role (recruiter / agency / brand / service_provider).
   * Drives the "Recruiter mode" toggle in the menu.
   */
  isRecruiter?: boolean;
  /**
   * True when the viewer has a `professional_profiles` row. Drives
   * the smart "Profile" menu entry: yes → /c/{handle}, no → setup.
   */
  hasProfessionalProfile?: boolean;
};

export default function ProfileMenu({
  profile,
  isCreator,
  isAdmin = false,
  isRecruiter = false,
  hasProfessionalProfile = false,
}: Props) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  // Apply modal trigger comes from the shell-wide provider so every
  // page inside (social) opens the same modal instance.
  const { openApply } = useSurveyModal();
  const ref = useRef<HTMLDivElement>(null);

  const enableRecruiterMode = () => {
    setOpen(false);
    startTransition(async () => {
      // Default the buy-side role to 'recruiter'. Users can pick
      // 'agency' / 'brand' later from a dedicated settings screen.
      await toggleRole('recruiter', 'add');
    });
  };

  useEffect(() => {
    if (!open) return;
    const onClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onClickOutside);
    document.addEventListener('keydown', onEsc);
    return () => {
      document.removeEventListener('mousedown', onClickOutside);
      document.removeEventListener('keydown', onEsc);
    };
  }, [open]);

  const itemClass =
    'flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-text-main transition-colors hover:bg-secondary';
  const close = () => setOpen(false);

  return (
    <div ref={ref} className="relative pt-4">
      {/* ── Popover ───────────────────────────────────────────────────── */}
      {open && (
        <div
          role="menu"
          className="animate-fade-in-up absolute bottom-full left-0 right-0 z-50 mb-2 overflow-hidden rounded-2xl border border-border-color bg-card p-2 shadow-2xl shadow-black/40"
        >
          {/* Featured: Apply BabeHub — pink primary CTA at the top of
              the menu. Opens the SurveyModal directly (rendered below)
              instead of navigating to /#apply, so the apply form pops
              up over whatever page the user is currently on. */}
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              openApply();
            }}
            className="mb-1 flex w-full items-center gap-3 rounded-xl bg-primary px-3 py-2 text-sm font-bold text-white shadow-lg shadow-primary/30 transition-all hover:bg-pink-400 hover:scale-[1.02]"
            role="menuitem"
          >
            <Megaphone className="h-4 w-4" />
            Apply BabeHub
          </button>

          {/* Admin shortcut — only rendered when role === 'admin'.
              Single entry into the admin hub. Sub-sections (Users /
              Jobs / Applications / Inquiries) are reachable from the
              tabbed nav inside the admin shell, so cluttering the
              popover with four duplicate entries was busywork. */}
          {isAdmin && (
            <Link
              href={'/app/admin' as never}
              onClick={close}
              className={itemClass}
              role="menuitem"
            >
              <ShieldAlert className="h-4 w-4 text-primary" />
              Admin hub
            </Link>
          )}

          {/* "My profile" entry deliberately removed — the platform has
              a single canonical profile concept (the Professional
              profile below). The public /c/{handle} page still exists
              and is reachable via @-handle links / sharing, but it's
              not duplicated as a menu item alongside the editor. */}
          <Link
            href="/favorites"
            onClick={close}
            className={itemClass}
            role="menuitem"
          >
            <Star className="h-4 w-4" />
            Favorites
          </Link>
          <Link
            href="/app/dashboard"
            onClick={close}
            className={itemClass}
            role="menuitem"
          >
            <LayoutDashboard className="h-4 w-4" />
            Dashboard
          </Link>
          {isCreator && (
            <Link
              href="/app/dashboard/posts/new"
              onClick={close}
              className={itemClass}
              role="menuitem"
            >
              <Plus className="h-4 w-4" />
              New post
            </Link>
          )}
          <Link
            href="/app/creator/applications"
            onClick={close}
            className={itemClass}
            role="menuitem"
          >
            <FileText className="h-4 w-4" />
            My applications
          </Link>
          {/* Single "Profile" entry — smart-routed:
                 • Pro profile set up → go to the public /c/{handle}
                 • Not set up yet     → go to the Profile editor
              The Settings entry is gone — those fields (cover, avatar,
              handle, display_name, bio) now live in the same editor. */}
          <Link
            href={
              hasProfessionalProfile
                ? (`/c/${profile.handle}` as '/c/[handle]')
                : '/app/professional/edit'
            }
            onClick={close}
            className={itemClass}
            role="menuitem"
          >
            <Briefcase className="h-4 w-4" />
            Profile
            {!hasProfessionalProfile && (
              <span className="ml-auto rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-primary">
                Set up
              </span>
            )}
          </Link>

          {/* Recruiter-mode toggle. Visible only when the user hasn't
              already opted into a buy-side role — appends 'recruiter' to
              profiles.roles[] (additive, doesn't change profile.role).
              Once switched on, the menu surfaces a "Recruiter dashboard"
              entry instead (Sprint 2). */}
          {!isRecruiter && (
            <button
              type="button"
              onClick={enableRecruiterMode}
              disabled={pending}
              className={`${itemClass} disabled:opacity-60`}
              role="menuitem"
            >
              {pending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Briefcase className="h-4 w-4 text-primary" />
              )}
              Switch on recruiter mode
            </button>
          )}
          {isRecruiter && (
            <Link
              href="/app/recruiter/dashboard"
              onClick={close}
              className={itemClass}
              role="menuitem"
            >
              <Briefcase className="h-4 w-4 text-primary" />
              Recruiter dashboard
            </Link>
          )}

          <div className="my-1 border-t border-border-color/40" />

          <form action={signOut}>
            <button
              type="submit"
              role="menuitem"
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-text-secondary transition-colors hover:bg-red-500/10 hover:text-red-400"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </form>
        </div>
      )}

      {/* ── Trigger ─────────────────────────────────────────────────────
          Two distinct hit areas so the click-on-user-→-profile expectation
          works AND the menu stays reachable:
            • Avatar + name = a <Link> straight to /c/{handle}
            • Chevron       = a separate button that toggles the popover
          Wrapped in a flex row that shares the same hover bg, but each
          half handles its own click. */}
      <div
        className={`flex w-full items-center gap-3 rounded-xl px-2 py-2 transition-colors ${
          open ? 'bg-secondary' : 'hover:bg-secondary'
        }`}
      >
        <Link
          href={`/c/${profile.handle}` as '/c/[handle]'}
          className="flex min-w-0 flex-1 items-center gap-3 text-left"
        >
          <span className="h-9 w-9 shrink-0 overflow-hidden rounded-full bg-secondary">
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
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-bold text-text-main">
              {profile.display_name || profile.handle}
            </span>
            <span className="block truncate text-xs text-text-secondary">
              @{profile.handle}
            </span>
          </span>
        </Link>
        <button
          type="button"
          aria-haspopup="menu"
          aria-expanded={open}
          aria-label="Open profile menu"
          onClick={() => setOpen((v) => !v)}
          className="-mr-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-text-secondary transition-colors hover:bg-card hover:text-primary"
        >
          <ChevronUp
            className={`h-4 w-4 transition-transform ${open ? '' : 'rotate-180'}`}
          />
        </button>
      </div>

    </div>
  );
}
