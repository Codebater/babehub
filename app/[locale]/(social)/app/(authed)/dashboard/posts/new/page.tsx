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
    <main className="mx-auto max-w-3xl px-6 py-12">
      <Link
        href="/app/dashboard/posts"
        className="text-sm text-text-secondary transition-colors hover:text-primary"
      >
        ← All posts
      </Link>
      <h1 className="mt-2 text-3xl font-black tracking-tight text-text-main">New post</h1>
      <p className="mt-1 text-sm text-text-secondary">
        Write text now. Image and video upload land in the next iteration.
      </p>

      <div className="mt-8 rounded-2xl border border-border-color bg-card p-6">
        <PostComposer tiers={tiers ?? []} />
      </div>
    </main>
  );
}
