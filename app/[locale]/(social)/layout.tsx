import {
  Compass,
  User,
  LayoutDashboard,
  Settings,
  Plus,
  LogIn,
  Home,
  Clapperboard,
  Radio,
  Gem,
  Users,
} from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { createClient } from '@/lib/supabase/server';
import SidebarLink from './SidebarLink';
import ProfileMenu from './ProfileMenu';
import SurveyModalProvider from './SurveyModalProvider';

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
    <SurveyModalProvider>
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
          {/* Main nav intentionally minimal — personal destinations
              (Profile, Favorites, Dashboard, New post, Settings) live
              behind the ProfileMenu popover at the bottom of the
              sidebar. The Categories section is the primary content. */}
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
          <SidebarLink href="/creators" label="Creators">
            <Users className="h-5 w-5" />
          </SidebarLink>
          <SidebarLink href="/marketing" label="Marketing site">
            <Home className="h-5 w-5" />
          </SidebarLink>
        </nav>

        {profile ? (
          <ProfileMenu
            profile={{
              handle: profile.handle,
              display_name: profile.display_name,
              avatar_url: profile.avatar_url,
            }}
            isCreator={isCreator}
          />
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

        {/* ── Legal footer ───────────────────────────────────────────── */}
        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 px-2 text-[10px] text-text-secondary/70">
          <Link
            href="/legal/terms"
            className="transition-colors hover:text-primary"
          >
            Terms
          </Link>
          <span aria-hidden>·</span>
          <Link
            href="/legal/privacy"
            className="transition-colors hover:text-primary"
          >
            Privacy
          </Link>
          <span aria-hidden>·</span>
          <span>18+ only</span>
        </div>
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
    </SurveyModalProvider>
  );
}
