import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Link } from '@/i18n/navigation';
import { Calendar, Clock, ArrowLeft, ArrowRight } from 'lucide-react';
import { ALL_POSTS } from '@/lib/blog/posts';
import { loadAllBlogPosts, loadBlogPostBySlug } from '@/lib/blog/db';
import AdStrip from '../../_components/AdStrip';

// ISR with a 5-minute window. Static-registry posts get SSG'd at
// build via generateStaticParams; DB posts render on first visit and
// then serve from cache. After 5 minutes a re-render picks up any
// admin edits. Trade-off: edits land within 5 min rather than
// instantly, but every cached request after the first is essentially
// free. revalidatePath('/blog/{slug}') in the admin action busts the
// cache immediately when the admin publishes/edits.
export const revalidate = 300;

type Props = {
  params: Promise<{ slug: string; locale: string }>;
};

/**
 * SSG every blog slug at build time. Adding a post to `ALL_POSTS`
 * generates a new static page; removing one returns 404.
 */
export function generateStaticParams() {
  return ALL_POSTS.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await loadBlogPostBySlug(slug);
  if (!post) return { title: 'Post not found — Babe Hub' };

  const canonical = `/blog/${post.slug}`;
  return {
    title: `${post.title} — Babe Hub`,
    description: post.description,
    keywords: post.tags,
    authors: [{ name: post.author }],
    alternates: { canonical },
    openGraph: {
      title: post.title,
      description: post.description,
      type: 'article',
      publishedTime: post.date,
      authors: [post.author],
      tags: post.tags,
      ...(post.cover ? { images: [post.cover] } : {}),
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.description,
      ...(post.cover ? { images: [post.cover] } : {}),
    },
  };
}

function formatDate(iso: string): string {
  return new Date(iso + 'T00:00:00Z').toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  });
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = await loadBlogPostBySlug(slug);
  if (!post) notFound();

  // Up to 2 related posts: same-tag-overlap > date-recency fallback.
  const allOthers = await loadAllBlogPosts();
  const others = allOthers.filter((p) => p.slug !== post.slug);
  const related = others
    .map((p) => ({
      post: p,
      score: p.tags.filter((t) => post.tags.includes(t)).length,
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 2)
    .map((x) => x.post);

  // JSON-LD BlogPosting — gives Google rich-result eligibility.
  const articleLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.description,
    datePublished: post.date,
    dateModified: post.date,
    author: { '@type': 'Person', name: post.author },
    publisher: {
      '@type': 'Organization',
      name: 'Babe Hub',
      url: 'https://babehub.net',
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `https://babehub.net/blog/${post.slug}`,
    },
    keywords: post.tags.join(', '),
    ...(post.cover ? { image: `https://babehub.net${post.cover}` } : {}),
  };

  // Breadcrumb schema — helps the URL display nicely in SERPs.
  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://babehub.net/' },
      { '@type': 'ListItem', position: 2, name: 'Blog', item: 'https://babehub.net/blog' },
      {
        '@type': 'ListItem',
        position: 3,
        name: post.title,
        item: `https://babehub.net/blog/${post.slug}`,
      },
    ],
  };

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      {/* eslint-disable-next-line react/no-danger */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleLd) }}
      />
      {/* eslint-disable-next-line react/no-danger */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />

      {/* ── Back link ───────────────────────────────────────────── */}
      <Link
        href="/blog"
        className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-text-secondary transition-colors hover:text-primary"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        All posts
      </Link>

      {/* ── Header ──────────────────────────────────────────────── */}
      <header className="mt-6">
        <div className="flex flex-wrap items-center gap-2">
          {post.tags.slice(0, 4).map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-secondary px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-text-secondary"
            >
              {tag}
            </span>
          ))}
        </div>

        <h1 className="mt-4 text-3xl font-black leading-tight tracking-tight text-text-main sm:text-4xl">
          {post.title}
        </h1>

        <p className="mt-3 text-base text-text-secondary sm:text-lg">
          {post.description}
        </p>

        <div className="mt-5 flex flex-wrap items-center gap-3 text-xs text-text-secondary">
          <span className="inline-flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5" />
            {formatDate(post.date)}
          </span>
          <span aria-hidden>·</span>
          <span>{post.author}</span>
          <span aria-hidden>·</span>
          <span className="inline-flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" />
            {post.readingMinutes} min read
          </span>
        </div>
      </header>

      <hr className="my-8 border-border-color/50" />

      {/* ── Body ────────────────────────────────────────────────── */}
      {/* @tailwindcss/typography drives heading sizes, link colors,
          list spacing, etc. `prose-invert` flips colors for the dark
          theme; `prose-headings:text-text-main` etc. lock in our
          design tokens over the default amber/zinc palette. */}
      <article
        className="prose prose-invert max-w-none
          prose-headings:font-black prose-headings:tracking-tight prose-headings:text-text-main
          prose-h2:mt-10 prose-h2:text-2xl
          prose-p:text-text-secondary prose-p:leading-relaxed
          prose-strong:text-text-main
          prose-a:text-primary prose-a:no-underline hover:prose-a:underline
          prose-code:rounded prose-code:bg-secondary prose-code:px-1.5 prose-code:py-0.5 prose-code:font-mono prose-code:text-xs prose-code:text-text-main prose-code:before:content-none prose-code:after:content-none
          prose-li:text-text-secondary"
      >
        {post.body}
      </article>

      {/* Ad strip mid-article-ish — appears once below the body so the
          reader naturally lands on it as a between-section beat. */}
      <div className="mt-12">
        <AdStrip placement={`blog-${post.slug}`} />
      </div>

      {/* ── Related ─────────────────────────────────────────────── */}
      {related.length > 0 && (
        <section className="mt-12">
          <h2 className="mb-4 text-sm font-bold uppercase tracking-widest text-text-secondary">
            Keep reading
          </h2>
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {related.map((r) => (
              <li key={r.slug}>
                <Link
                  href={`/blog/${r.slug}` as '/blog/[slug]'}
                  className="group flex h-full flex-col rounded-2xl border border-border-color bg-card p-5 transition-all hover:border-primary/50"
                >
                  <p className="text-[10px] font-bold uppercase tracking-widest text-text-secondary">
                    {formatDate(r.date)} · {r.readingMinutes} min
                  </p>
                  <p className="mt-2 text-base font-bold leading-snug text-text-main transition-colors group-hover:text-primary">
                    {r.title}
                  </p>
                  <span className="mt-3 inline-flex items-center gap-1 text-xs text-primary opacity-0 transition-opacity group-hover:opacity-100">
                    Read
                    <ArrowRight className="h-3 w-3" />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
