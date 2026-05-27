import type { Metadata } from 'next';
import { Sparkles, Check, Lock, ArrowRight } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { requireUser } from '@/lib/auth/guards';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  title: 'BabeHub Premium · $10/mo',
  description:
    'Unlock the full Casting catalog and every creator’s otherwise-blurred posts for $10/mo.',
  robots: { index: false, follow: false },
};

type Props = {
  searchParams: Promise<{ cancelled?: string; error?: string }>;
};

/**
 * `/app/premium` — platform-wide Premium upgrade landing.
 *
 * Premium is NOT a creator subscription — it's a flat $10/mo top-up that:
 *   • unlocks the full /explore?q=casting catalog (currently blurred for free)
 *   • unlocks every creator's tier-locked posts (no per-creator subscription)
 *   • lifts the free content caps to the elevated set (10 videos / 25 pics / ...)
 *
 * The Subscribe button POSTs to /api/nowpayments/create-premium-invoice
 * which writes a payment_invoices row with purpose='premium' and 303s
 * the browser to NOWPayments' hosted checkout. After payment lands, the
 * IPN webhook flips profiles.is_premium=true + premium_until=now()+30d.
 *
 * If the user is already premium with a future expiry, we tell them
 * how long they have left + still let them re-up (stacking +30d on top).
 */
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

  // Admins + verified accounts are always elevated — they don't need Premium.
  const grantedByRole = isAdmin || isVerified;

  return (
    <main className="mx-auto max-w-2xl px-4 py-10 md:px-6 md:py-16">
      {/* Cancel / error banners */}
      {sp.cancelled === '1' && (
        <div className="mb-6 rounded-2xl border border-amber-400/40 bg-amber-400/10 p-4 text-sm text-amber-200">
          You cancelled the payment. No charge was made — try again any time.
        </div>
      )}
      {sp.error === 'payment_provider_error' && (
        <div className="mb-6 rounded-2xl border border-red-400/40 bg-red-400/10 p-4 text-sm text-red-200">
          Couldn&apos;t reach NOWPayments. Refresh and try again — if it keeps
          failing, drop us a note via the Contact link in the footer.
        </div>
      )}
      {sp.error === 'invoice_record_failed' && (
        <div className="mb-6 rounded-2xl border border-red-400/40 bg-red-400/10 p-4 text-sm text-red-200">
          Invoice created on NOWPayments but we couldn&apos;t save it locally.
          Please try again; no charge has been made.
        </div>
      )}

      {/* Hero */}
      <div className="relative overflow-hidden rounded-3xl border border-amber-400/30 bg-gradient-to-br from-black via-zinc-950 to-amber-950/30 p-8 md:p-10">
        <span
          aria-hidden
          className="pointer-events-none absolute -right-20 -top-20 h-48 w-48 rounded-full bg-amber-400/20 blur-3xl"
        />
        <span
          aria-hidden
          className="pointer-events-none absolute -bottom-20 -left-20 h-48 w-48 rounded-full bg-primary/20 blur-3xl"
        />

        <p className="relative inline-flex items-center gap-2 rounded-full border border-amber-400/40 bg-amber-400/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.25em] text-amber-300">
          <Sparkles className="h-3 w-3" />
          BabeHub Premium
        </p>
        <h1 className="relative mt-4 text-3xl font-black tracking-tight text-text-main md:text-4xl">
          Unlock the full catalog.
        </h1>
        <p className="relative mt-3 max-w-xl text-base text-text-secondary md:text-lg">
          One flat fee unlocks <strong className="text-white">every</strong> Casting
          video, every creator&apos;s otherwise-blurred post, and lifts your
          posting limits. No per-creator subscriptions. Cancel any time.
        </p>

        <div className="relative mt-6 flex items-baseline gap-2">
          <span className="text-5xl font-black tracking-tight text-text-main">$10</span>
          <span className="text-base font-bold text-text-secondary">/month</span>
        </div>

        <ul className="relative mt-6 grid grid-cols-1 gap-2 sm:grid-cols-2">
          {[
            'Full Casting catalog (no blur)',
            'Every creator’s locked posts',
            '10 videos / 25 pictures',
            '25 public / 10 private posts',
            '25 jobs you can post',
            'Crypto-only, no card data shared',
          ].map((perk) => (
            <li
              key={perk}
              className="flex items-start gap-2 text-sm text-text-secondary"
            >
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
              <span>{perk}</span>
            </li>
          ))}
        </ul>

        {/* CTA — three states */}
        <div className="relative mt-8">
          {grantedByRole ? (
            <div className="rounded-2xl border border-green-400/30 bg-green-400/10 p-4 text-sm text-green-200">
              <p className="font-bold">You already have elevated access.</p>
              <p className="mt-1">
                {isAdmin
                  ? 'Admins get every Premium perk free.'
                  : 'BabeHub Verified accounts get every Premium perk free.'}
              </p>
              <Link
                href="/explore"
                className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-green-300 hover:underline"
              >
                Back to /explore <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          ) : hasActivePremium ? (
            <>
              <div className="rounded-2xl border border-amber-400/30 bg-amber-400/10 p-4 text-sm text-amber-200">
                <p className="font-bold">You&apos;re Premium.</p>
                {profile?.premium_until && (
                  <p className="mt-1">
                    Active until{' '}
                    <strong className="text-white">
                      {new Date(profile.premium_until).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </strong>
                    . Pay again now to stack +30 days on top of that.
                  </p>
                )}
              </div>
              <form
                action="/api/nowpayments/create-premium-invoice"
                method="POST"
                className="mt-4"
              >
                <button
                  type="submit"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-amber-400/40 bg-amber-400/10 px-6 py-3 text-sm font-black uppercase tracking-widest text-amber-200 transition-all hover:border-amber-400 hover:bg-amber-400/20"
                >
                  Extend +30 days · $10
                  <ArrowRight className="h-4 w-4" />
                </button>
              </form>
            </>
          ) : (
            <form action="/api/nowpayments/create-premium-invoice" method="POST">
              <button
                type="submit"
                className="group inline-flex w-full items-center justify-center gap-2 rounded-full bg-amber-400 px-6 py-3 text-sm font-black uppercase tracking-widest text-black shadow-lg shadow-amber-400/30 transition-all hover:scale-[1.01] hover:bg-amber-300"
              >
                <Lock className="h-4 w-4" />
                Unlock Premium · $10/mo
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </button>
              <p className="mt-3 text-center text-xs text-text-secondary">
                Pay in BTC / ETH / USDT / 50+ crypto via NOWPayments.
                <br />
                Cancel any time. No card data ever shared with us.
              </p>
            </form>
          )}
        </div>
      </div>

      <p className="mt-6 text-center text-xs text-text-secondary">
        Already subscribed to a creator?{' '}
        <Link href="/explore" className="text-primary hover:underline">
          Keep browsing /explore
        </Link>
        .
      </p>
    </main>
  );
}
