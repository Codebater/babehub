import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Link } from '@/i18n/navigation';
import { Flame, ArrowRight, Sparkles } from 'lucide-react';
import { loadFeedPage } from '../../explore/data';
import VideoCard from '../../explore/VideoCard';
import AdStrip from '../../_components/AdStrip';
import ApplyButton from '../../_components/ApplyButton';
import { findTag, deslugify, tagSeo, relatedTags } from '@/lib/seo/tags';
import { boostViews } from '@/lib/format/views';

const DOMAIN = 'https://babehub.net';

// SSR per request — the parent (social) layout reads cookies, so these
// pages render dynamically. The eporner search fetch is cached 5 min, so
// repeat crawls stay fast.
export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ tag: string; locale: string }> };

function resolve(slug: string) {
  const known = findTag(slug);
  if (known) return { query: known.query, label: known.label, known: true };
  const phrase = deslugify(slug);
  const label = phrase.replace(/\b\w/g, (c) => c.toUpperCase());
  return { query: phrase, label, known: false };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { tag } = await params;
  const { label } = resolve(tag);
  const { title, description } = tagSeo(label);
  const url = `${DOMAIN}/videos/${tag}`;
  return {
    title,
    description,
    keywords: [
      `${label.toLowerCase()} porn`,
      `${label.toLowerCase()} videos`,
      `free ${label.toLowerCase()}`,
      `${label.toLowerCase()} cam`,
      `${label.toLowerCase()} casting`,
      'adult videos',
      'Babe Hub',
    ],
    alternates: { canonical: `/videos/${tag}` },
    openGraph: {
      type: 'website',
      url,
      title,
      description,
    },
    twitter: { card: 'summary_large_image', title, description },
  };
}

export default async function TagPage({ params }: Props) {
  const { tag } = await params;
  const { query, label, known } = resolve(tag);

  // Quality videos first — top-weekly reads better on a landing page.
  const firstPage = await loadFeedPage(1, { query, order: 'top-weekly' });

  // An unknown slug with zero results is a thin/empty page — don't index it.
  if (!known && firstPage.videos.length === 0) notFound();

  const { title, description } = tagSeo(label);
  const related = relatedTags(tag, 14);
  const videos = firstPage.videos.slice(0, 24);

  // ── Structured data: CollectionPage + ItemList of VideoObjects ──────────
  const itemListLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: title,
    description,
    url: `${DOMAIN}/videos/${tag}`,
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: videos.length,
      itemListElement: videos.map((v, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        item: {
          '@type': 'VideoObject',
          name: v.title,
          description: (v.keywords || v.title).slice(0, 200),
          thumbnailUrl: v.default_thumb?.src ? [v.default_thumb.src] : undefined,
          uploadDate: v.added ? new Date(v.added).toISOString() : undefined,
          duration:
            v.length_sec > 0
              ? `PT${Math.floor(v.length_sec / 60)}M${v.length_sec % 60}S`
              : undefined,
          embedUrl: v.embed,
          contentUrl: v.url,
          interactionStatistic: {
            '@type': 'InteractionCounter',
            interactionType: { '@type': 'WatchAction' },
            userInteractionCount: boostViews(v.views, v.id),
          },
        },
      })),
    },
  };

  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: DOMAIN },
      { '@type': 'ListItem', position: 2, name: 'Videos', item: `${DOMAIN}/explore` },
      { '@type': 'ListItem', position: 3, name: label, item: `${DOMAIN}/videos/${tag}` },
    ],
  };

  return (
    <main className="mx-auto max-w-7xl px-4 py-6 md:px-6 md:py-8">
      {/* eslint-disable-next-line react/no-danger */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListLd) }} />
      {/* eslint-disable-next-line react/no-danger */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />

      {/* Breadcrumb */}
      <nav className="mb-3 flex items-center gap-1.5 text-[11px] text-text-secondary">
        <Link href="/explore" className="hover:text-primary">Videos</Link>
        <span aria-hidden>/</span>
        <span className="text-text-main">{label}</span>
      </nav>

      {/* ── SEO header ─────────────────────────────────────────── */}
      <header className="mb-5">
        <h1 className="text-2xl font-black tracking-tight text-text-main md:text-3xl">
          {label} Videos
        </h1>
        <p className="mt-2 max-w-3xl text-sm text-text-secondary">
          {description}
        </p>
      </header>

      <div className="mb-6">
        <AdStrip placement={`videos-${tag}-top`} />
      </div>

      {/* ── Video grid ────────────────────────────────────────── */}
      {videos.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border-color bg-secondary/40 p-12 text-center text-text-secondary">
          No {label.toLowerCase()} videos right now — check back soon.
        </div>
      ) : (
        <section className="grid grid-cols-2 gap-1 sm:gap-3 lg:grid-cols-3 xl:grid-cols-4">
          {videos.map((video) => (
            <VideoCard key={video.id} video={video} />
          ))}
        </section>
      )}

      {/* ── Apply CTA ─────────────────────────────────────────── */}
      <section className="mt-8 flex flex-col items-start gap-3 rounded-2xl border border-primary/20 bg-primary/5 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="flex items-center gap-1.5 text-sm font-bold text-text-main">
            <Sparkles className="h-4 w-4 text-primary" />
            Want to feature in {label.toLowerCase()} content?
          </p>
          <p className="mt-0.5 text-xs text-text-secondary">
            Apply to BabeHub — casting, live cams, luxury & OnlyFans talent wanted. Free to apply.
          </p>
        </div>
        <ApplyButton variant="primary" label="Apply now" withArrow />
      </section>

      {/* ── Related categories (internal linking for crawl depth) ── */}
      <section className="mt-10">
        <h2 className="mb-3 flex items-center gap-1.5 text-sm font-bold text-text-main">
          <Flame className="h-4 w-4 text-primary" />
          Browse more categories
        </h2>
        <div className="flex flex-wrap gap-2">
          {related.map((t) => (
            <Link
              key={t.slug}
              href={`/videos/${t.slug}` as never}
              className="inline-flex items-center gap-1 rounded-full border border-border-color bg-card px-3 py-1.5 text-xs font-medium text-text-secondary transition-all hover:border-primary/40 hover:text-primary"
            >
              {t.label}
              <ArrowRight className="h-3 w-3 opacity-50" />
            </Link>
          ))}
        </div>
      </section>

      {/* ── SEO footer copy ───────────────────────────────────── */}
      <section className="mt-10 border-t border-border-color/40 pt-6">
        <h2 className="mb-2 text-sm font-bold text-text-main">About {label} videos on Babe Hub</h2>
        <p className="max-w-3xl text-xs leading-relaxed text-text-secondary/80">
          Babe Hub is the home of {label.toLowerCase()} videos, live cams, and adult casting.
          Watch free {label.toLowerCase()} content updated daily, discover verified creators, and
          apply to real paid {label.toLowerCase()} casting calls and cam model jobs. Whether
          you&apos;re here to watch or to get cast, Babe Hub connects fans, creators, agencies, and
          brands across every adult niche. All performers are 18+.
        </p>
      </section>
    </main>
  );
}
