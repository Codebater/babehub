import { Link } from '@/i18n/navigation';
import { Plus, FileText, Calendar, ShieldAlert, ExternalLink, Pencil } from 'lucide-react';
import { requireAdmin } from '@/lib/auth/guards';
import { ALL_POSTS } from '@/lib/blog/posts';
import AdminBlogDeleteButton from './AdminBlogDeleteButton';

export const dynamic = 'force-dynamic';

/**
 * `/app/admin/blog` — admin's blog post management list.
 *
 * Shows two sections:
 *   1. DB posts — admin-authored. Each has Edit + Delete buttons.
 *      Drafts (published_at null) sit above published rows.
 *   2. Static registry posts — built-in launch content from
 *      lib/blog/posts.tsx. Read-only here; they live in the repo
 *      and require a code deploy to change. Listed for context so
 *      the admin sees the full published set in one place.
 */
function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

export default async function AdminBlogPage() {
  const { supabase } = await requireAdmin();
  const { data: dbPosts } = await supabase
    .from('blog_posts')
    .select('id, slug, title, description, tags, author, published_at, created_at, updated_at')
    .order('published_at', { ascending: false, nullsFirst: true })
    .order('created_at', { ascending: false });

  const dbSlugs = new Set((dbPosts ?? []).map((p) => p.slug));
  const staticOnly = ALL_POSTS.filter((p) => !dbSlugs.has(p.slug));

  return (
    <main className="mx-auto max-w-7xl px-4 py-6 md:px-6 md:py-10">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.25em] text-primary">
            <ShieldAlert className="h-3 w-3" />
            Admin · Blog
          </p>
          <h1 className="mt-3 text-2xl font-black tracking-tight text-text-main md:text-3xl">
            Blog posts
          </h1>
          <p className="mt-1 text-sm text-text-secondary">
            Admin-authored posts publish to <code className="rounded bg-secondary px-1 font-mono text-[11px]">/blog</code>
            {' '}immediately. Draft rows stay hidden until you click publish.
          </p>
        </div>
        <Link
          href={'/app/admin/blog/new' as never}
          className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-bold text-white shadow-lg shadow-primary/30 transition-all hover:scale-[1.02] hover:bg-pink-400"
        >
          <Plus className="h-4 w-4" />
          New post
        </Link>
      </header>

      {/* DB posts */}
      <section className="mb-8">
        <h2 className="mb-3 text-[10px] font-bold uppercase tracking-[0.25em] text-text-secondary">
          Admin-authored · {(dbPosts ?? []).length}
        </h2>
        {!dbPosts || dbPosts.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border-color bg-secondary/40 p-10 text-center">
            <FileText className="mx-auto h-8 w-8 text-text-secondary/60" />
            <p className="mt-2 text-sm text-text-secondary">
              No admin-authored posts yet. Click &quot;New post&quot; to publish your first one.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-border-color/40 overflow-hidden rounded-2xl border border-border-color bg-card">
            {dbPosts.map((p) => {
              const isDraft = !p.published_at;
              return (
                <li key={p.id} className="flex flex-wrap items-center gap-3 p-4 md:p-5">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        href={`/blog/${p.slug}` as '/blog/[slug]'}
                        className="text-sm font-bold text-text-main hover:text-primary md:text-base"
                      >
                        {p.title}
                      </Link>
                      {isDraft ? (
                        <span className="inline-flex rounded-full bg-amber-400/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-amber-300">
                          Draft
                        </span>
                      ) : (
                        <span className="inline-flex rounded-full bg-green-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-green-400">
                          Published
                        </span>
                      )}
                    </div>
                    <p className="mt-1 line-clamp-1 text-xs text-text-secondary md:text-sm">
                      {p.description || <em>No description</em>}
                    </p>
                    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-text-secondary">
                      <span>/{p.slug}</span>
                      <span aria-hidden>·</span>
                      <span className="inline-flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {isDraft ? `Created ${formatDate(p.created_at)}` : `Published ${formatDate(p.published_at)}`}
                      </span>
                      {p.tags.length > 0 && (
                        <>
                          <span aria-hidden>·</span>
                          <span>{p.tags.slice(0, 3).join(', ')}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <Link
                      href={`/app/admin/blog/${p.id}` as never}
                      className="inline-flex items-center gap-1 rounded-md border border-border-color px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-text-secondary transition-colors hover:border-primary/40 hover:text-primary"
                    >
                      <Pencil className="h-3 w-3" />
                      Edit
                    </Link>
                    <Link
                      href={`/blog/${p.slug}` as '/blog/[slug]'}
                      className="inline-flex items-center gap-1 rounded-md border border-border-color px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-text-secondary transition-colors hover:border-primary/40 hover:text-primary"
                    >
                      View
                      <ExternalLink className="h-3 w-3" />
                    </Link>
                    <AdminBlogDeleteButton id={p.id} title={p.title} />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* Static registry posts — read-only here. */}
      {staticOnly.length > 0 && (
        <section>
          <h2 className="mb-3 text-[10px] font-bold uppercase tracking-[0.25em] text-text-secondary">
            Static registry · {staticOnly.length}
          </h2>
          <ul className="divide-y divide-border-color/40 overflow-hidden rounded-2xl border border-border-color/60 bg-card/60">
            {staticOnly.map((p) => (
              <li key={p.slug} className="flex flex-wrap items-center gap-3 p-4 md:p-5">
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/blog/${p.slug}` as '/blog/[slug]'}
                    className="text-sm font-bold text-text-main hover:text-primary md:text-base"
                  >
                    {p.title}
                  </Link>
                  <p className="mt-1 line-clamp-1 text-xs text-text-secondary md:text-sm">
                    {p.description}
                  </p>
                  <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-text-secondary">
                    <span>/{p.slug}</span>
                    <span aria-hidden>·</span>
                    <span>{formatDate(p.date)}</span>
                    <span aria-hidden>·</span>
                    <span>built-in</span>
                  </div>
                </div>
                <Link
                  href={`/blog/${p.slug}` as '/blog/[slug]'}
                  className="inline-flex items-center gap-1 rounded-md border border-border-color px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-text-secondary transition-colors hover:border-primary/40 hover:text-primary"
                >
                  View
                  <ExternalLink className="h-3 w-3" />
                </Link>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-[11px] text-text-secondary">
            Built-in posts live in <code className="rounded bg-secondary px-1 font-mono">lib/blog/posts.tsx</code> and need a code deploy to change. To override one, publish a new admin post with the same slug — the DB version wins.
          </p>
        </section>
      )}
    </main>
  );
}
