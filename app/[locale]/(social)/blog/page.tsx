import type { Metadata } from 'next';
import { Link } from '@/i18n/navigation';
import { Calendar, Clock, ArrowRight, BookOpen, Briefcase, Sparkles } from 'lucide-react';
import { loadAllBlogPosts } from '@/lib/blog/db';
import { createClient } from '@/lib/supabase/server';
import { loadFeaturedJobs } from '@/lib/jobs/featured';

// Switched from `force-dynamic` to ISR (5-minute revalidate) — blog
// posts change at most a few times a day. Cached HTML serves every
// subsequent visitor within the window; admin-published posts surface
// in the next render after the window expires. Big perf win without
// losing the "publish now → live within minutes" guarantee.
export const revalidate = 300;

/**
 * `/blog` — public blog index. Server-rendered, static-friendly
 * (every post is a build-time TypeScript module).
 *
 * SEO: dedicated metadata + JSON-LD Blog schema embedded inline so
 * Google sees the page as a publication, not just a listing.
 */
export const metadata: Metadata = {
  title: 'Blog — OnlyFans Tips, Creator Guides & Industry Insights',
  description:
    'OnlyFans growth tips, creator monetization playbooks, casting call guides, and adult industry insights. Learn how to scale your content income on Babe Hub.',
  keywords: [
    'OnlyFans tips',
    'OnlyFans growth guide',
    'how to make money OnlyFans',
    'content creator monetization',
    'adult creator advice',
    'OnlyFans marketing tips',
    'creator income guide',
    'adult content industry',
    'casting call tips',
    'how to get casting calls',
    'adult model career tips',
  ],
  alternates: { canonical: '/blog' },
  openGraph: {
    title: 'Babe Hub Blog — Creator Guides & OnlyFans Tips',
    description:
      'Actionable guides on OnlyFans growth, creator monetization, and landing casting calls.',
    type: 'website',
    images: ['/og-image.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Babe Hub Blog — Creator Guides & OnlyFans Tips',
    description:
      'Actionable guides on OnlyFans growth, creator monetization, and landing casting calls.',
  },
};

function formatDate(iso: string): string {
  return new Date(iso + 'T00:00:00Z').toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  });
}

// Real featured jobs only — each card links to /jobs/{id} so the
// reader lands on the detail page and can apply. Showcase demos were
// dropped because they're not real DB rows and couldn't deep-link to
// a specific job. Once the catalog is small the row just renders
// fewer cards; once it grows past 6 the highest-budget jobs auto-fill
// the slots that admin manual picks don't claim.
type FeaturedJobItem = {
  id: string;
  date: string;
  title: string;
  href: string;
};

async function loadFeaturedJobsForBlog(): Promise<FeaturedJobItem[]> {
  const supabase = await createClient();
  const real = await loadFeaturedJobs(supabase, 6);
  return real
    .filter((j) => j.published_at)
    .map((j) => ({
      id: j.id,
      date: j.published_at!.slice(0, 10),
      title: j.title,
      href: `/jobs/${j.id}`,
    }))
    .sort((a, b) => (a.date < b.date ? 1 : -1));
}

export default async function BlogIndexPage() {
  // Merged DB + static registry. Admin-published rows show up alongside
  // hand-crafted launch posts; DB rows with a matching slug override
  // their static counterparts (the admin's edits win).
  const posts = await loadAllBlogPosts();
  const [featured, ...rest] = posts;
  const featuredJobs = await loadFeaturedJobsForBlog();

  // JSON-LD Blog schema — tells Google + Bing this is a publication
  // hub with N articles. Each article gets its own BlogPosting on its
  // detail page, so the graph is fully connected.
  const blogLd = {
    '@context': 'https://schema.org',
    '@type': 'Blog',
    name: 'Babe Hub Blog',
    description: metadata.description,
    url: 'https://babehub.net/blog',
    publisher: {
      '@type': 'Organization',
      name: 'Babe Hub',
      url: 'https://babehub.net',
    },
    blogPost: posts.map((p) => ({
      '@type': 'BlogPosting',
      headline: p.title,
      description: p.description,
      datePublished: p.date,
      url: `https://babehub.net/blog/${p.slug}`,
      author: { '@type': 'Person', name: p.author },
      keywords: p.tags.join(', '),
    })),
  };

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      {/* eslint-disable-next-line react/no-danger */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(blogLd) }}
      />

      {/* ── Header ──────────────────────────────────────────────── */}
      <header className="mb-10">
        <p className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.25em] text-primary">
          <BookOpen className="h-3 w-3" />
          The Babe Hub Blog
        </p>
        <h1 className="mt-4 text-3xl font-black tracking-tight text-text-main sm:text-4xl">
          Playbooks, deep-dives, and guides.
        </h1>
        <p className="mt-3 max-w-2xl text-base text-text-secondary">
          For creators launching their first tier, brands sponsoring a placement,
          and everyone in between. Updated monthly.
        </p>
      </header>

      {posts.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border-color bg-secondary/40 p-12 text-center">
          <p className="text-text-secondary">No posts yet — check back soon.</p>
        </div>
      ) : (
        <>
          {/* ── Featured (most recent) ─────────────────────────── */}
          <Link
            href={`/blog/${featured.slug}` as '/blog/[slug]'}
            className="group block overflow-hidden rounded-3xl border border-border-color bg-gradient-to-br from-card via-card to-pink-950/30 p-8 transition-all hover:border-primary/50 sm:p-10"
          >
            <p className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.25em] text-primary">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              Featured · {formatDate(featured.date)}
            </p>
            <h2 className="mt-3 text-2xl font-black leading-tight tracking-tight text-text-main transition-colors group-hover:text-primary sm:text-3xl">
              {featured.title}
            </h2>
            <p className="mt-3 max-w-2xl text-sm text-text-secondary sm:text-base">
              {featured.description}
            </p>
            <div className="mt-5 flex flex-wrap items-center gap-3 text-xs text-text-secondary">
              <span className="inline-flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                {featured.readingMinutes} min read
              </span>
              <span aria-hidden>·</span>
              <span>{featured.author}</span>
              <span className="ml-auto inline-flex items-center gap-1 text-primary transition-transform group-hover:translate-x-0.5">
                Read article
                <ArrowRight className="h-3.5 w-3.5" />
              </span>
            </div>
          </Link>

          {/* ── Featured jobs row ──────────────────────────────────
              Brands paying for `featured_until` slots get a card on
              the blog index too — the same entries the sidebar
              calendar surfaces in amber. Doubles the visibility for
              the same fee, and gives blog readers a parallel surface
              into the marketplace without leaving the page. */}
          {featuredJobs.length > 0 && (
            <section className="mt-10">
              <div className="mb-4 flex items-baseline justify-between">
                <h2 className="text-sm font-bold uppercase tracking-widest text-text-secondary">
                  Featured jobs this month
                </h2>
                <Link
                  href="/jobs"
                  className="text-xs font-bold uppercase tracking-widest text-amber-300 hover:underline"
                >
                  See all →
                </Link>
              </div>
              <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {featuredJobs.slice(0, 6).map((job) => (
                  <li key={job.id}>
                    <Link
                      href={job.href as never}
                      className="group flex h-full flex-col rounded-2xl border border-amber-400/20 bg-gradient-to-br from-card to-amber-950/10 p-5 transition-all hover:border-amber-400/50 hover:scale-[1.01]"
                    >
                      <p className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-amber-300">
                        <Briefcase className="h-3 w-3" />
                        Featured job · {formatDate(job.date)}
                      </p>
                      <h3 className="mt-2 text-base font-bold leading-snug text-text-main transition-colors group-hover:text-amber-200">
                        {job.title}
                      </h3>
                      <span className="mt-3 inline-flex items-center gap-1 text-xs text-text-secondary opacity-0 transition-opacity group-hover:opacity-100">
                        <Sparkles className="h-3 w-3 text-amber-300" />
                        View on the jobs board
                        <ArrowRight className="h-3 w-3" />
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* ── Rest of the catalog ────────────────────────────── */}
          {rest.length > 0 && (
            <section className="mt-10">
              <h2 className="mb-4 text-sm font-bold uppercase tracking-widest text-text-secondary">
                More from the blog
              </h2>
              <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                {rest.map((post) => (
                  <li key={post.slug}>
                    <Link
                      href={`/blog/${post.slug}` as '/blog/[slug]'}
                      className="group flex h-full flex-col rounded-2xl border border-border-color bg-card p-6 transition-all hover:border-primary/50"
                    >
                      <p className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-text-secondary">
                        <Calendar className="h-3 w-3" />
                        {formatDate(post.date)}
                      </p>
                      <h3 className="mt-2 text-lg font-bold leading-snug text-text-main transition-colors group-hover:text-primary">
                        {post.title}
                      </h3>
                      <p className="mt-2 flex-1 text-sm text-text-secondary">
                        {post.description}
                      </p>
                      <div className="mt-4 flex flex-wrap items-center gap-2">
                        {post.tags.slice(0, 3).map((tag) => (
                          <span
                            key={tag}
                            className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-text-secondary"
                          >
                            {tag}
                          </span>
                        ))}
                        <span className="ml-auto inline-flex items-center gap-1 text-xs text-text-secondary">
                          <Clock className="h-3 w-3" />
                          {post.readingMinutes} min
                        </span>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </>
      )}
    </main>
  );
}
