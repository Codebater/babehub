import type { Metadata } from 'next';
import {
  Sparkles,
  Check,
  Lock,
  ArrowRight,
  Clapperboard,
  Star,
  Briefcase,
  MessageSquare,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { requireUser } from '@/lib/auth/guards';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  title: 'BabeHub Premium · Unlock Everything',
  description:
    'Unlock Casting, Creator content, Job applications, and more. $10/mo — crypto only.',
  robots: { index: false, follow: false },
};

type Props = {
  searchParams: Promise<{ cancelled?: string; error?: string }>;
};

// ── Feature cards ──────────────────────────────────────────────────────────
const FEATURES = [
  {
    id: 'casting',
    icon: Clapperboard,
    color: 'text-primary',
    border: 'border-primary/20',
    bg: 'bg-primary/5',
    glow: 'bg-primary/15',
    badge: null,
    title: 'Full Casting Catalog',
    description:
      'Every casting video — unblurred, unlimited. The complete archive of numbered takes, auditions, and open calls updated weekly.',
    perks: ['No blur, no teaser limit', 'Casting number archive', 'Apply directly from any card'],
  },
  {
    id: 'creators',
    icon: Star,
    color: 'text-amber-300',
    border: 'border-amber-300/20',
    bg: 'bg-amber-300/5',
    glow: 'bg-amber-300/15',
    badge: null,
    title: 'Creator Content',
    description:
      'Unlock every creator's tier-locked posts across the platform in one flat fee — no per-creator subscription needed.',
    perks: ['All locked posts unlocked', 'Luxury & premium shoots', 'New content as it drops'],
  },
  {
    id: 'jobs',
    icon: Briefcase,
    color: 'text-sky-300',
    border: 'border-sky-300/20',
    bg: 'bg-sky-300/5',
    glow: 'bg-sky-300/15',
    badge: null,
    title: 'Applications & Job Posts',
    description:
      'Apply to casting calls and paid job listings. Post your own opportunities. Full access to the talent marketplace.',
    perks: ['Apply to any listing', 'Post up to 25 jobs', 'Priority application visibility'],
  },
  {
    id: 'chat',
    icon: MessageSquare,
    color: 'text-purple-300',
    border: 'border-purple-300/20',
    bg: 'bg-purple-300/5',
    glow: 'bg-purple-300/10',
    badge: 'Coming Soon',
    title: 'Direct Chat',
    description:
      'One-on-one encrypted messaging with creators, agencies, and talent — currently in development for Premium members first.',
    perks: ['Creator & agency DMs', 'Priority support channel', 'Early beta access'],
  },
] as const;

export default async function PremiumPage({ searchParams }: Props) {
  const { user, supabase } = await requireUser();
  const sp = await searchParams;

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_premium, premium_until, is_verified, role')
    .eq('id', user.id)
    .maybeSingle();

  const isAdmin = profile?.role === 'admin';
  const isVerified = !!profile?.is_verified;
  const hasActivePremium =
    !!profile?.is_premium &&
    (!profile.premium_until || new Date(profile.premium_until).getTime() > Date.now());

  const grantedByRole = isAdmin || isVerified;
  const unlocked = grantedByRole || hasActivePremium;

  return (
    <main className="mx-auto max-w-3xl px-4 py-8 md:px-6 md:py-14">

      {/* ── Error / cancel banners ─────────────────────────────────────── */}
      {sp.cancelled === '1' && (
        <div className="mb-6 rounded-2xl border border-amber-400/30 bg-amber-400/8 px-4 py-3 text-sm text-amber-200">
          Payment cancelled — no charge was made.
        </div>
      )}
      {(sp.error === 'payment_provider_error' || sp.error === 'invoice_record_failed') && (
        <div className="mb-6 rounded-2xl border border-red-400/30 bg-red-400/8 px-4 py-3 text-sm text-red-200">
          Something went wrong. Refresh and try again — no charge has been made.
        </div>
      )}

      {/* ── Hero ──────────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-3xl border border-amber-400/25 bg-gradient-to-br from-zinc-950 via-black to-amber-950/20 px-6 py-8 md:px-10 md:py-12">
        {/* Glows */}
        <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-amber-400/15 blur-3xl" aria-hidden />
        <div className="pointer-events-none absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-primary/10 blur-3xl" aria-hidden />

        <div className="relative flex flex-col items-start gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-amber-400/40 bg-amber-400/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.25em] text-amber-300">
              <Sparkles className="h-3 w-3" />
              BabeHub Premium
            </span>
            <h1 className="mt-4 text-3xl font-black tracking-tight text-white md:text-4xl">
              One price.<br />Everything unlocked.
            </h1>
            <p className="mt-3 max-w-sm text-sm text-white/60 md:text-base">
              Flat monthly fee — no per-creator subscriptions, no hidden tiers.
              Pay in crypto. Cancel any time.
            </p>
          </div>

          {/* Price block */}
          <div className="shrink-0 rounded-2xl border border-amber-400/30 bg-black/50 px-6 py-5 text-center backdrop-blur-sm">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-300/70">Monthly</p>
            <p className="mt-1 text-5xl font-black tracking-tight text-white">$10</p>
            <p className="mt-0.5 text-xs text-white/40">per month</p>
          </div>
        </div>

        {/* Status / CTA */}
        <div className="relative mt-8">
          {grantedByRole ? (
            <div className="flex items-start gap-3 rounded-2xl border border-green-400/30 bg-green-400/8 p-4">
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-green-400" />
              <div>
                <p className="text-sm font-bold text-green-200">You have elevated access</p>
                <p className="mt-0.5 text-xs text-green-200/70">
                  {isAdmin ? 'Admins get all Premium perks for free.' : 'Verified accounts get all Premium perks for free.'}
                </p>
                <Link href="/explore" className="mt-2 inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-widest text-green-300 hover:underline">
                  Back to /explore <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            </div>
          ) : hasActivePremium ? (
            <div className="space-y-4">
              <div className="flex items-start gap-3 rounded-2xl border border-amber-400/30 bg-amber-400/8 p-4">
                <Zap className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" />
                <div>
                  <p className="text-sm font-bold text-amber-200">Premium active</p>
                  {profile?.premium_until && (
                    <p className="mt-0.5 text-xs text-amber-200/70">
                      Until{' '}
                      <strong className="text-white">
                        {new Date(profile.premium_until).toLocaleDateString('en-US', {
                          year: 'numeric', month: 'long', day: 'numeric',
                        })}
                      </strong>
                      . Extend now to stack +30 days.
                    </p>
                  )}
                </div>
              </div>
              <form action="/api/nowpayments/create-premium-invoice" method="POST">
                <button
                  type="submit"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-amber-400/40 bg-amber-400/10 px-6 py-3 text-sm font-black uppercase tracking-widest text-amber-200 transition-all hover:border-amber-400 hover:bg-amber-400/15"
                >
                  Extend +30 days · $10
                  <ArrowRight className="h-4 w-4" />
                </button>
              </form>
            </div>
          ) : (
            <div className="space-y-3">
              <form action="/api/nowpayments/create-premium-invoice" method="POST">
                <button
                  type="submit"
                  className="group inline-flex w-full items-center justify-center gap-2 rounded-full bg-amber-400 px-6 py-3.5 text-sm font-black uppercase tracking-widest text-black shadow-xl shadow-amber-400/25 transition-all hover:scale-[1.01] hover:bg-amber-300"
                >
                  <Lock className="h-4 w-4" />
                  Unlock Premium · $10/mo
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </button>
              </form>
              <p className="text-center text-[11px] text-white/30">
                BTC · ETH · USDT · 50+ crypto via NOWPayments · No card data stored
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ── What you unlock ───────────────────────────────────────────── */}
      <div className="mt-8">
        <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.3em] text-text-secondary/60">
          What you unlock
        </p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {FEATURES.map((f) => {
            const Icon = f.icon;
            const isComing = f.badge === 'Coming Soon';
            return (
              <div
                key={f.id}
                className={`relative overflow-hidden rounded-2xl border p-5 transition-all ${f.border} ${f.bg} ${isComing ? 'opacity-70' : ''}`}
              >
                {/* Corner glow */}
                <div className={`pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full blur-2xl ${f.glow}`} aria-hidden />

                <div className="relative">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-2">
                    <div className={`flex h-9 w-9 items-center justify-center rounded-xl border ${f.border} ${f.bg}`}>
                      <Icon className={`h-4 w-4 ${f.color}`} />
                    </div>
                    {isComing ? (
                      <span className="inline-flex items-center gap-1 rounded-full border border-purple-300/30 bg-purple-300/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest text-purple-300">
                        Coming Soon
                      </span>
                    ) : unlocked ? (
                      <span className="inline-flex items-center gap-1 rounded-full border border-green-400/30 bg-green-400/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest text-green-400">
                        <Check className="h-2.5 w-2.5" />
                        Unlocked
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full border border-amber-400/30 bg-amber-400/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest text-amber-300">
                        <Lock className="h-2.5 w-2.5" />
                        Premium
                      </span>
                    )}
                  </div>

                  {/* Title + description */}
                  <h3 className="mt-3 text-sm font-bold text-text-main">{f.title}</h3>
                  <p className="mt-1 text-xs leading-relaxed text-text-secondary/80">{f.description}</p>

                  {/* Perks */}
                  <ul className="mt-3 space-y-1">
                    {f.perks.map((perk) => (
                      <li key={perk} className="flex items-center gap-2 text-[11px] text-text-secondary/70">
                        <Check className={`h-3 w-3 shrink-0 ${isComing ? 'text-purple-300/50' : f.color}`} />
                        {perk}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Bottom note ───────────────────────────────────────────────── */}
      <p className="mt-8 text-center text-xs text-text-secondary/50">
        Premium is a platform-wide pass — not a creator subscription.
        {' '}Creator tiers are separate and support individual creators directly.{' '}
        <Link href="/explore" className="text-primary hover:underline">
          Back to /explore
        </Link>
      </p>
    </main>
  );
}
