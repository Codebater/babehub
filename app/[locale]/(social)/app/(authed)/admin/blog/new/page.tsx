import { Link } from '@/i18n/navigation';
import { ArrowLeft, ShieldAlert } from 'lucide-react';
import { requireAdmin } from '@/lib/auth/guards';
import { upsertBlogPost } from '../../actions';

export const dynamic = 'force-dynamic';

/**
 * `/app/admin/blog/new` — admin composer for a new blog post.
 *
 * Plain HTML <form> + server action upsert (insert on first save,
 * update on subsequent saves with the same slug). Two submit
 * buttons: "Save draft" leaves `published_at` null (hidden from
 * /blog); "Publish now" flips it to `now()`.
 *
 * Body is plain text — paragraphs separated by blank lines. The
 * /blog/[slug] renderer splits on double newlines and wraps each
 * chunk in a <p>. Future enhancement: full markdown via
 * react-markdown.
 */
export default async function NewBlogPostPage() {
  await requireAdmin();

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
          Admin · New post
        </p>
        <h1 className="mt-3 text-2xl font-black tracking-tight text-text-main md:text-3xl">
          Publish a blog post
        </h1>
        <p className="mt-1 text-sm text-text-secondary">
          Lands on <code className="rounded bg-secondary px-1 font-mono text-[11px]">/blog/&#123;slug&#125;</code>{' '}
          once published. Save as draft to preview first.
        </p>
      </header>

      <form action={upsertBlogPost} className="mt-6 space-y-5">
        <Field
          label="Slug"
          hint="URL path. Lowercase letters, digits and dashes only. e.g. how-to-launch-2026"
        >
          <input
            name="slug"
            type="text"
            required
            pattern="[a-z0-9-]{3,80}"
            minLength={3}
            maxLength={80}
            placeholder="my-new-blog-post"
            className={inputClass}
            autoCapitalize="off"
            autoComplete="off"
          />
        </Field>

        <Field label="Title" hint="Shows as the H1 + the SEO <title>. Keep it under 70 chars.">
          <input
            name="title"
            type="text"
            required
            maxLength={200}
            placeholder="A compelling, scannable headline"
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
            placeholder="One sentence summary of the post."
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
            placeholder={`Lead paragraph that hooks the reader.\n\nSecond paragraph with the meat of the argument.\n\nClose with a call to action.`}
            className={`${inputClass} resize-y`}
          />
        </Field>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Field label="Tags" hint="Comma-separated. e.g. creators, guide, onboarding">
            <input
              name="tags"
              type="text"
              maxLength={200}
              placeholder="creators, guide"
              className={inputClass}
            />
          </Field>
          <Field label="Author" hint="Display name. Defaults to BabeHub Team.">
            <input
              name="author"
              type="text"
              maxLength={80}
              defaultValue="BabeHub Team"
              className={inputClass}
            />
          </Field>
          <Field label="Reading minutes" hint="Estimate. Shown next to the title.">
            <input
              name="reading_minutes"
              type="number"
              min={1}
              max={60}
              defaultValue={3}
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
            Publish now →
          </button>
          <button
            type="submit"
            className="inline-flex items-center gap-2 rounded-full border border-border-color px-5 py-2.5 text-sm font-bold text-text-main transition-colors hover:border-primary hover:text-primary"
          >
            Save draft
          </button>
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
