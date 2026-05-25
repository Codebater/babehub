import Link from 'next/link';

/**
 * Custom 404 for unknown creator handles. Triggered by `notFound()` in
 * `app/[locale]/c/[handle]/page.tsx` when the handle doesn't match any
 * row in `public.profiles`.
 *
 * Stays on-brand with the platform look (dark surface, primary pink
 * accent) rather than dropping users into the generic Next.js 404.
 */
export default function CreatorNotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background px-6 py-12 text-text-main">
      <div className="max-w-md text-center">
        <p className="text-sm font-bold uppercase tracking-widest text-primary">404</p>
        <h1 className="mt-3 text-4xl font-black tracking-tight">Creator not found</h1>
        <p className="mt-3 text-text-secondary">
          We couldn&apos;t find a creator with that handle. They might&apos;ve
          changed their handle, deleted their account, or never existed.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/"
            className="rounded-full bg-primary px-6 py-3 font-bold text-white shadow-lg shadow-primary/20 transition-all hover:bg-pink-400 hover:scale-[1.02]"
          >
            Back to home
          </Link>
          <Link
            href="/app/login"
            className="rounded-full border border-border-color px-6 py-3 font-medium text-text-secondary transition-colors hover:border-primary hover:text-primary"
          >
            Sign in
          </Link>
        </div>
      </div>
    </main>
  );
}
