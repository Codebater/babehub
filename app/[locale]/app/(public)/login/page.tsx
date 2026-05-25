import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import LoginForm from './LoginForm';

/**
 * `/app/login`. Public; redirects already-signed-in users straight to the
 * explore feed (platform's main surface) so we never show the magic-link
 * form to someone with an active session.
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
          <h1 className="text-3xl font-black tracking-tight text-text-main">Sign in to Babe Hub</h1>
          <p className="mt-2 text-sm text-text-secondary">
            We&apos;ll email you a magic link — no password needed.
          </p>
        </div>

        {error && (
          <div className="mb-4 rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-400">
            {decodeURIComponent(error)}
          </div>
        )}

        <LoginForm />

        <p className="mt-8 text-center text-xs text-text-secondary">
          By signing in you agree to our terms and acknowledge the privacy notice.
        </p>
      </div>
    </main>
  );
}
