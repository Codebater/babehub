import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Link } from '@/i18n/navigation';
import LoginForm from './LoginForm';
import { Briefcase, TrendingUp, ShieldCheck, Users } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Sign In — Babe Hub | Adult Creator Jobs & Monetization',
  description:
    'Join Babe Hub to apply for casting calls and adult creator jobs, or monetize your content as a verified creator. Free to join.',
  robots: { index: false },
};

/**
 * `/app/login`. Public; redirects already-signed-in users straight to the
 * explore feed. Google OAuth removed — email (magic link or password) only.
 */
export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string }>;
}) {
  const { error, next } = await searchParams;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect(next && next.startsWith('/') ? next : '/explore');
  }

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-5 py-10">
      {/* Ambient glow — purely decorative */}
      <div
        className="pointer-events-none absolute -top-40 left-1/2 h-[28rem] w-[28rem] -translate-x-1/2 rounded-full bg-primary/20 blur-[120px]"
        aria-hidden
      />

      <div className="relative z-10 w-full max-w-md">
        {/* ── Brand header ───────────────────────────────────────── */}
        <div className="mb-8 text-center">
          <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.25em] text-primary">
            Free to join
          </p>
          <h1 className="text-3xl font-black tracking-tight text-text-main sm:text-4xl">
            Join Babe Hub
          </h1>
          <p className="mt-2 text-sm text-text-secondary">
            The #1 platform for adult creators &amp; agencies.
          </p>

          {/* Value props — 2×2 card grid, fully visible on mobile */}
          <div className="mt-6 grid grid-cols-2 gap-3 text-left">
            <div className="flex flex-col gap-2.5 rounded-2xl border border-border-color bg-card p-4">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/15">
                <Briefcase className="h-4.5 w-4.5 h-[18px] w-[18px] text-primary" />
              </span>
              <span className="text-xs font-semibold leading-snug text-text-main">
                Apply for casting calls &amp; jobs
              </span>
            </div>
            <div className="flex flex-col gap-2.5 rounded-2xl border border-border-color bg-card p-4">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/15">
                <TrendingUp className="h-[18px] w-[18px] text-primary" />
              </span>
              <span className="text-xs font-semibold leading-snug text-text-main">
                Monetize your content
              </span>
            </div>
            <div className="flex flex-col gap-2.5 rounded-2xl border border-border-color bg-card p-4">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/15">
                <ShieldCheck className="h-[18px] w-[18px] text-primary" />
              </span>
              <span className="text-xs font-semibold leading-snug text-text-main">
                Get verified &amp; build your brand
              </span>
            </div>
            <div className="flex flex-col gap-2.5 rounded-2xl border border-border-color bg-card p-4">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/15">
                <Users className="h-[18px] w-[18px] text-primary" />
              </span>
              <span className="text-xs font-semibold leading-snug text-text-main">
                Connect with top agencies
              </span>
            </div>
          </div>
        </div>

        {/* ── Auth card ──────────────────────────────────────────── */}
        <div className="rounded-2xl border border-border-color bg-card p-6 shadow-xl shadow-black/30">
          {error && (
            <div className="mb-4 rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-400">
              {decodeURIComponent(error)}
            </div>
          )}
          <LoginForm />
        </div>

        <p className="mt-6 text-center text-xs text-text-secondary">
          By signing in you agree to our{' '}
          <Link href={'/terms' as never} className="underline-offset-2 hover:text-text-main hover:underline">
            terms
          </Link>{' '}
          and{' '}
          <Link href={'/privacy' as never} className="underline-offset-2 hover:text-text-main hover:underline">
            privacy notice
          </Link>
          .
        </p>
      </div>
    </main>
  );
}
