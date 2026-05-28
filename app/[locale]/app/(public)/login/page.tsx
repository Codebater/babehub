import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import LoginForm from './LoginForm';
import { Briefcase, DollarSign } from 'lucide-react';

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
    <main className="flex min-h-screen items-center justify-center px-6 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-black tracking-tight text-text-main">
            Join Babe Hub
          </h1>
          <p className="mt-2 text-sm text-text-secondary">
            Sign in or create a free account to get started.
          </p>

          {/* Value props */}
          <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-center sm:gap-4">
            <span className="inline-flex items-center gap-2 rounded-full border border-border-color bg-secondary px-4 py-2 text-xs font-semibold text-text-main">
              <Briefcase className="h-3.5 w-3.5 text-primary shrink-0" />
              Apply for casting calls &amp; jobs
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border border-border-color bg-secondary px-4 py-2 text-xs font-semibold text-text-main">
              <DollarSign className="h-3.5 w-3.5 text-primary shrink-0" />
              Monetize your content
            </span>
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-400">
            {decodeURIComponent(error)}
          </div>
        )}

        <LoginForm />

        <p className="mt-8 text-center text-xs text-text-secondary">
          By signing in you agree to our{' '}
          <a href="/terms" className="underline-offset-2 hover:underline">
            terms
          </a>{' '}
          and{' '}
          <a href="/privacy" className="underline-offset-2 hover:underline">
            privacy notice
          </a>
          .
        </p>
      </div>
    </main>
  );
}
