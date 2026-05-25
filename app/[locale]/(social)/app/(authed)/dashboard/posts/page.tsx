import Link from 'next/link';
import { Lock, Plus } from 'lucide-react';
import { requireCreator } from '@/lib/auth/guards';
import PostActions from './PostActions';

export const dynamic = 'force-dynamic';

export default async function PostsPage() {
  const { user, supabase } = await requireCreator();

  const [{ data: posts }, { data: tiers }] = await Promise.all([
    supabase
      .from('posts')
      .select('id, body, tier_required_id, published_at, created_at, like_count, comment_count')
      .eq('creator_id', user.id)
      .order('created_at', { ascending: false }),
    supabase
      .from('subscription_tiers')
      .select('id, name')
      .eq('creator_id', user.id),
  ]);

  const tierLookup = new Map((tiers ?? []).map((t) => [t.id, t.name]));

  const drafts = (posts ?? []).filter((p) => !p.published_at);
  const published = (posts ?? []).filter((p) => p.published_at);

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-text-main md:text-4xl">
            Your posts
          </h1>
          <p className="mt-1 text-sm text-text-secondary">
            Anything you publish without a tier is public on your profile and
            shows up on /explore. Tier-gated posts unlock for active subscribers only.
          </p>
        </div>
        <Link
          href="/app/dashboard/posts/new"
          className="flex shrink-0 items-center gap-2 self-start rounded-full bg-primary px-4 py-2 text-sm font-bold text-white shadow-lg shadow-primary/20 transition-all hover:bg-pink-400 hover:scale-[1.02] sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          New post
        </Link>
      </header>

      {drafts.length > 0 && (
        <section className="mb-10">
          <h2 className="mb-3 text-sm font-bold uppercase tracking-widest text-text-secondary">
            Drafts ({drafts.length})
          </h2>
          <ul className="space-y-3">
            {drafts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                tierName={post.tier_required_id ? tierLookup.get(post.tier_required_id) : undefined}
                isDraft
              />
            ))}
          </ul>
        </section>
      )}

      <section>
        <h2 className="mb-3 text-sm font-bold uppercase tracking-widest text-text-secondary">
          Published ({published.length})
        </h2>
        {published.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border-color bg-secondary/40 p-10 text-center text-text-secondary">
            Nothing published yet. Click <strong>New post</strong> above to write your first.
          </div>
        ) : (
          <ul className="space-y-3">
            {published.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                tierName={post.tier_required_id ? tierLookup.get(post.tier_required_id) : undefined}
              />
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}

function PostCard({
  post,
  tierName,
  isDraft,
}: {
  post: {
    id: string;
    body: string;
    tier_required_id: string | null;
    published_at: string | null;
    created_at: string;
  };
  tierName: string | undefined;
  isDraft?: boolean;
}) {
  return (
    <li className="rounded-2xl border border-border-color bg-card p-5">
      <div className="mb-2 flex items-center gap-2 text-xs text-text-secondary">
        {isDraft ? (
          <span className="rounded-full bg-secondary px-2 py-0.5 font-bold uppercase tracking-widest text-text-secondary">
            Draft
          </span>
        ) : (
          <span>{post.published_at && new Date(post.published_at).toLocaleString()}</span>
        )}
        {tierName && (
          <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-primary">
            <Lock className="h-3 w-3" /> {tierName}
          </span>
        )}
        {!tierName && !isDraft && (
          <span className="rounded-full bg-green-500/10 px-2 py-0.5 text-green-400">Public</span>
        )}
      </div>
      <p className="whitespace-pre-wrap text-text-main">{post.body}</p>
      <PostActions postId={post.id} isDraft={Boolean(isDraft)} />
    </li>
  );
}
