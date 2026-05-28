import { notFound } from 'next/navigation';
import { Link } from '@/i18n/navigation';
import { ArrowLeft, ShieldAlert } from 'lucide-react';
import { requireAdmin } from '@/lib/auth/guards';
import { upsertBlogPost } from '../../actions';

export const dynamic = 'force-dynamic';

/**
 * `/app/admin/blog/[id]` — edit an existing admin-authored blog post.
 *
 * Loads the post by ID, pre-fills all fields. The slug is shown as
 * read-only text (changing URLs would break incoming links) but passed
 * as a hidden field so the upsert action finds the right row. All other
 * fields are fully editable.
 */
type Props = { params: Promise<{ id: string }> };

export default async function EditBlogPostPage({ params }: Props) {
  const { id } = await params;
  const { supabase } = await requireAdmin();

  const { data: post } = await supabase
    .from('blog_posts')
    .select('id, slug, title, description, body, tags, author, reading_minutes, published_at')
    .eq('id', id)
    .single();

  if (!post) notFound();

  const tagsDisplay = (post.tags ?? []).join(', ');

  return (
    <main className="mx-auto max-w-3xl px-4 py-6 md:px-6 md:py-10">
      <Link
        href={'/app/admin/blog' as never}
        className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-text-secondary transition-colors hover:text-primary"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to blog list
      </Link>

      <header className="mt-6">
        <p className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.25em] text-primary">
          <ShieldAlert className="h-3 w-3" />
          Admin · Edit post
        </p>
        <h1 className="mt-3 text-2xl font-black tracking-tight text-text-main md:text-3xl">
          Edit post
        </h1>
        <p className="mt-1 text-sm text-text-secondary">
          Slug{' '}
          <code className="rounded bg-secondary px-1 font-mono text-[11px] text-primary">
            /{post.slug}
          </code>{' '}
          is fixed — changing it would break existing links. Edit all other fields freely.
        </p>
      </header>

      <form action={upsertBlogPost} className="mt-6 space-y-5">
        {/* Slug is the upsert key — pass as hidden so it matches the existing row */}
        <input type="hidden" name="slug" value={post.slug} />

        {/* Display-only slug (not editable) */}
        <div>
          <span className="mb-1 block text-sm font-bold text-text-main">Slug</span>
          <div className="flex items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-900/60 px-3 py-2.5 text-sm text-zinc-400">
            <span className="text-zinc-600">/blog/</span>
            {post.slug}
            <span className="ml-auto rounded-full bg-zinc-800 px-2 py-0.5 text-[10px] uppercase tracking-widest text-zinc-500">
              locked
            </span>
          </div>
        </div>

        <Field label="Title" hint="Shows as the H1 + the SEO <title>. Keep it under 70 chars.">
          <input
            name="title"
            type="text"
            required
            maxLength={200}
            defaultValue={post.title}
            className={inputClass}
          />
        </Field>

        <Field
          label="Description"
          hint="Meta description + intro line. 140-160 chars is the SEO sweet spot."
        >
          <textarea
            name="description"
            rows={2}
            maxLength={300}
            defaultValue={post.description ?? ''}
            className={`${inputClass} resize-y`}
          />
        </Field>

        <Field
          label="Body"
          hint="Plain text. Use blank lines between paragraphs. Each paragraph becomes a <p>."
        >
          <textarea
            name="body"
            rows={16}
            required
            defaultValue={post.body}
            className={`${inputClass} resize-y`}
          />
        </Field>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Field label="Tags" hint="Comma-separated. e.g. creators, guide, onboarding">
            <input
              name="tags"
              type="text"
              maxLength={200}
              defaultValue={tagsDisplay}
              className={inputClass}
            />
          </Field>
          <Field label="Author" hint="Display name.">
            <input
              name="author"
              type="text"
              maxLength={80}
              defaultValue={post.author ?? 'BabeHub Team'}
              className={inputClass}
            />
          </Field>
          <Field label="Reading minutes" hint="Estimate. Shown next to the title.">
            <input
              name="reading_minutes"
              type="number"
              min={1}
              max={60}
              defaultValue={post.reading_minutes ?? 3}
              className={inputClass}
            />
          </Field>
        </div>

        <div className="flex flex-wrap items-center gap-3 border-t border-border-color/40 pt-6">
          <button
            type="submit"
            name="publish"
            value="1"
            className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-primary/30 transition-all hover:scale-[1.02] hover:bg-pink-400"
          >
            Publish →
          </button>
          <button
            type="submit"
            className="inline-flex items-center gap-2 rounded-full border border-border-color px-5 py-2.5 text-sm font-bold text-text-main transition-colors hover:border-primary hover:text-primary"
          >
            Save draft
          </button>
          {post.published_at && (
            <span className="text-xs text-text-secondary">
              Currently published — saving as draft will hide it from{' '}
              <code className="rounded bg-secondary px-1 font-mono">/blog</code>
            </span>
          )}
        </div>
      </form>
    </main>
  );
}

const inputClass =
  'w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white placeholder:text-zinc-500 focus:border-primary focus:outline-none [color-scheme:dark]';

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-bold text-text-main">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-text-secondary">{hint}</span>}
    </label>
  );
}
