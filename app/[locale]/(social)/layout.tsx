import {
  Compass,
  User,
  LayoutDashboard,
  Settings,
  Plus,
  LogIn,
  LogOut,
  Home,
  Clapperboard,
  Star,
  Radio,
  Gem,
} from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { createClient } from '@/lib/supabase/server';
import { signOut } from '../app/(public)/login/actions';
import SidebarLink from './SidebarLink';

/**
 * Shared layout for the social-media surfaces: /explore and /c/{handle}.
 * Renders a persistent left sidebar on desktop and a bottom tab bar on
 * mobile, so signed-in users have one-click access to their profile +
 * dashboard + settings from any discovery page.
 *
 * For signed-out visitors the sidebar shows Sign in / Sign up CTAs +
 * the explore link only — no profile-required surfaces.
 *
 * Profile fetch is server-side via the cookie-aware Supabase client so
 * the rendered nav is always in sync with the current session (no
 * client-side auth flash). The layout reads cookies(), so all
 * descendant routes are dynamic — which is already the case for
 * /explore and /c/{handle}.
 */
export default async function SocialLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let profile: {
    handle: string;
    display_name: string;
    avatar_url: string | null;
    role: 'fan' | 'creator' | 'chatter' | 'admin';
  } | null = null;

  if (user) {
    const { data } = await supabase
      .from('profiles')
      .select('handle, display_name, avatar_url, role')
      .eq('id', user.id)
      .maybeSingle();
    if (data) profile = data;
  }

  const isCreator = profile?.role === 'creator';

  return (
    <div className="min-h-screen bg-background md:flex">
      {/* ── Desktop sidebar ────────────────────────────────────────────── */}
      <aside className="hidden md:fixed md:left-0 md:top-0 md:flex md:h-screen md:w-60 md:flex-col md:border-r md:border-border-color md:bg-card/40 md:p-4">
        <Link
          href="/explore"
          className="mb-8 px-2 text-2xl font-black tracking-tight text-text-main hover:text-primary"
        >
          Babe<span className="text-primary">Hub</span>
        </Link>

        <nav className="flex-1 space-y-1">
          <SidebarLink href="/explore" label="Explore" matchQuery="">
            <Compass className="h-5 w-5" />
          </SidebarLink>
          {profile && (
            <>
              <SidebarLink href={`/c/${profile.handle}`} label="My profile">
                <User className="h-5 w-5" />
              </SidebarLink>
              <SidebarLink href="/favorites" label="Favorites">
                <Star className="h-5 w-5" />
              </SidebarLink>
              <SidebarLink href="/app/dashboard" label="Dashboard">
                <LayoutDashboard className="h-5 w-5" />
              </SidebarLink>
              {isCreator && (
                <SidebarLink href="/app/dashboard/posts/new" label="New post">
                  <Plus className="h-5 w-5" />
                </SidebarLink>
              )}
            </>
          )}

          {/* ── Categories ───────────────────────────────────────────────── */}
          <div className="pt-4">
            <p className="px-3 pb-1 text-[10px] font-bold uppercase tracking-widest text-text-secondary/70">
              Categories
            </p>
            <SidebarLink href="/explore?q=casting" label="Casting" matchQuery="casting">
              <Clapperboard className="h-5 w-5" />
            </SidebarLink>
            <SidebarLink
              href="/explore?q=live%20cams"
              label="Live Cams"
              matchQuery="live cams"
            >
              <Radio className="h-5 w-5" />
            </SidebarLink>
            <SidebarLink
              href="/explore?q=luxury"
              label="Luxury Shoots"
              matchQuery="luxury"
            >
              <Gem className="h-5 w-5" />
            </SidebarLink>
            <SidebarLink href="/" label="Marketing site">
              <Home className="h-5 w-5" />
            </SidebarLink>
          </div>
        </nav>

        {profile ? (
          <div className="border-t border-border-color/40 pt-4">
            <div className="mb-3 flex items-center gap-2">
              <Link
                href={`/c/${profile.handle}`}
                className="flex min-w-0 flex-1 items-center gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-secondary"
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
              <Link
                href="/app/settings"
                title="Settings"
                aria-label="Settings"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-text-secondary transition-colors hover:bg-secondary hover:text-primary"
              >
                <Settings className="h-4 w-4" />
              </Link>
            </div>
            <form action={signOut}>
              <button
                type="submit"
                className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-text-secondary transition-colors hover:bg-red-500/10 hover:text-red-400"
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </button>
            </form>
          </div>
        ) : (
          <div className="space-y-2 border-t border-border-color/40 pt-4">
            <p className="px-2 pb-1 text-xs text-text-secondary">Join the platform</p>
            <Link
              href="/app/login"
              className="block w-full rounded-full bg-primary py-2 text-center text-sm font-bold text-white shadow-lg shadow-primary/20 transition-all hover:bg-pink-400 hover:scale-[1.02]"
            >
              Sign up
            </Link>
            <Link
              href="/app/login"
              className="block w-full rounded-full border border-border-color py-2 text-center text-sm font-medium text-text-main transition-colors hover:border-primary hover:text-primary"
            >
              Sign in
            </Link>
          </div>
        )}
      </aside>

      {/* ── Main content ───────────────────────────────────────────────── */}
      {/* `md:ml-60` reserves space for the fixed sidebar.
          `pb-16 md:pb-0` keeps content above the mobile bottom-tab bar. */}
      <div className="min-h-screen flex-1 pb-16 md:ml-60 md:pb-0">
        {children}
      </div>

      {/* ── Mobile bottom tab bar ─────────────────────────────────────── */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around border-t border-border-color bg-card/95 px-2 py-2 backdrop-blur md:hidden">
        <SidebarLink compact href="/explore" label="Explore">
          <Compass className="h-5 w-5" />
        </SidebarLink>
        {profile ? (
          <>
            <SidebarLink compact href={`/c/${profile.handle}`} label="Profile">
              <User className="h-5 w-5" />
            </SidebarLink>
            {isCreator && (
              <SidebarLink compact href="/app/dashboard/posts/new" label="New">
                <Plus className="h-5 w-5" />
              </SidebarLink>
            )}
            <SidebarLink compact href="/app/dashboard" label="Dashboard">
              <LayoutDashboard className="h-5 w-5" />
            </SidebarLink>
            <SidebarLink compact href="/app/settings" label="Settings">
              <Settings className="h-5 w-5" />
            </SidebarLink>
          </>
        ) : (
          <SidebarLink compact href="/app/login" label="Sign in">
            <LogIn className="h-5 w-5" />
          </SidebarLink>
        )}
      </nav>
    </div>
  );
}
