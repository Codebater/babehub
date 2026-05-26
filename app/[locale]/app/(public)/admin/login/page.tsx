import type { Metadata } from 'next';
import { Link } from '@/i18n/navigation';
import { redirect } from 'next/navigation';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import AdminLoginForm from './AdminLoginForm';

/**
 * `/app/admin/login` — dedicated admin sign-in page.
 *
 * Bookmarkable, focused entry point separate from the public-facing
 * /app/login. The form posts to the same Supabase actions but rides
 * a hidden `next=/app/admin/users` field so the post-auth callback
 * lands the visitor in the admin section instead of /explore.
 *
 * Admin promotion is not the page's job — it happens in
 * /auth/callback against the `ADMIN_EMAILS` env var. So even if a
 * non-admin email signs in here, they get a normal session; they
 * just won't see admin surfaces (the `requireAdmin()` guard on
 * /app/admin/users sends them back to /app/dashboard).
 *
 * Robots: noindex so this URL doesn't surface in search results.
 */
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Admin sign in — Babe Hub',
  description: 'Sign in to the Babe Hub admin section.',
  robots: { index: false, follow: false },
};

export default async function AdminLoginPage() {
  // If the user already has a session, jump straight to the admin
  // landing — the requireAdmin guard there decides whether to keep
  // them or bounce them to /app/dashboard.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) redirect('/app/admin/users');

  return (
    <main className="min-h-screen bg-background px-4 py-10 md:py-16">
      <div className="mx-auto max-w-md">
        <Link
          href="/app/login"
          className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-text-secondary transition-colors hover:text-amber-300"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to user sign in
        </Link>

        <header className="mt-6 mb-8 text-center">
          <p className="inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-400/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.25em] text-amber-300">
            <ShieldAlert className="h-3 w-3" />
            Admins only
          </p>
          <h1 className="mt-4 text-3xl font-black tracking-tight text-text-main md:text-4xl">
            Admin sign in
          </h1>
          <p className="mt-2 text-sm text-text-secondary">
            Sign in with the email listed in <code className="rounded bg-secondary px-1.5 py-0.5 font-mono text-[11px]">ADMIN_EMAILS</code>.
            The post-auth callback promotes your account to{' '}
            <code className="rounded bg-secondary px-1.5 py-0.5 font-mono text-[11px]">role = &apos;admin&apos;</code> and lands you in the user management table.
          </p>
        </header>

        <AdminLoginForm />

        <p className="mt-6 text-center text-[11px] text-text-secondary">
          Not an admin?{' '}
          <Link
            href="/app/login"
            className="font-bold text-amber-300 underline-offset-2 hover:underline"
          >
            Use the regular sign-in
          </Link>
          .
        </p>
      </div>
    </main>
  );
}
