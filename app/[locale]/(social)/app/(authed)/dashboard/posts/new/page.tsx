import Link from 'next/link';
import { requireCreator } from '@/lib/auth/guards';
import PostComposer from './PostComposer';

export const dynamic = 'force-dynamic';

export default async function NewPostPage() {
  const { user, supabase } = await requireCreator();

  const { data: tiers } = await supabase
    .from('subscription_tiers')
    .select('id, name, price_cents, currency')
    .eq('creator_id', user.id)
    .eq('active', true)
    .order('sort_order', { ascending: true });

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <header className="mb-8">
        <Link
          href="/app/dashboard/posts"
          className="text-sm text-text-secondary transition-colors hover:text-primary"
        >
          ← All posts
        </Link>
        <p className="mt-2 text-sm text-text-secondary">
          Write something, attach images or a video, then publish public or
          tier-locked.
        </p>
      </header>

      <div className="rounded-2xl border border-border-color bg-card p-6">
        <PostComposer tiers={tiers ?? []} />
      </div>
    </main>
  );
}
