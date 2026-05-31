import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ShieldCheck, MessageSquare, Eye, Clock, ChevronLeft, Sparkles } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { getSignedMediaUrls } from '@/lib/storage/signedUrls';
import { loadInteractionSummary } from '@/lib/interactions/load';
import VideoActions from '@/components/VideoActions';
import CommentThread from '@/components/CommentThread';
import AdStrip from '@/app/[locale]/(social)/_components/AdStrip';
import ApplyButton from '@/app/[locale]/(social)/_components/ApplyButton';
import { slugify } from '@/lib/seo/tags';

/**
 * `/v/{provider}/{contentId}` — dedicated page for one video. Lives
 * inside the (social) shell so the sidebar / bottom tab bar stay
 * visible; this is "a page in our platform" instead of a floating
 * modal over the feed.
 *
 *   provider = 'eporner'      → contentId is the eporner video id.
 *                                Player metadata (embed URL, title,
 *                                thumb, source URL, keywords) is
 *                                threaded through as URL search
 *                                params from the calling card, so we
 *                                don't need an extra eporner API
 *                                round-trip per page render.
 *   provider = 'creator_post' → contentId is posts.id. We load the
 *                                post + creator + signed media URL
 *                                from Supabase.
 *
 * Either way the page renders the same three-section layout:
 *   1. Big 16:9 player
 *   2. Title / meta / actions row
 *   3. Comment thread
 *
 * Shareable: a clean URL anyone can paste, the back button works,
 * cmd-click opens in a new tab.
 */
export const dynamic = 'force-dynamic';

type Provider = 'eporner' | 'creator_post';

type Props = {
  params: Promise<{ provider: string; contentId: string; locale: string }>;
  searchParams: Promise<{
    embed?: string;
    title?: string;
    thumb?: string;
    source?: string;
    keywords?: string;
    length?: string;
    views?: string;
  }>;
};

function isValidProvider(p: string): p is Provider {
  return p === 'eporner' || p === 'creator_post';
}

async function loadCreatorPost(postId: string) {
  const supabase = await createClient();
  const { data: post } = await supabase
    .from('posts')
    .select(
      'id, body, creator_id, media_ids, published_at, kind, like_count, comment_count, tier_required_id',
    )
    .eq('id', postId)
    .maybeSingle();
  if (!post) return null;

  const { data: creator } = await supabase
    .from('profiles')
    .select('handle, display_name, avatar_url, is_verified')
    .eq('id', post.creator_id)
    .single();

  const mediaUrlMap = await getSignedMediaUrls(post.media_ids ?? []);
  const firstVideoId = (post.media_ids ?? []).find(
    (id) => mediaUrlMap.get(id)?.kind === 'video',
  );
  const firstMedia = firstVideoId ? mediaUrlMap.get(firstVideoId) : undefined;

  return { post, creator, videoUrl: firstMedia?.url ?? null };
}

export async function generateMetadata({
  params,
  searchParams,
}: Props): Promise<Metadata> {
  const { provider, contentId } = await params;
  const sp = await searchParams;

  if (provider === 'eporner') {
    const title = sp.title ?? 'Video';
    const kw = (sp.keywords ?? '')
      .split(',')
      .map((k) => k.trim())
      .filter(Boolean);
    const kwLabel = kw.slice(0, 6).join(', ');
    const description = kwLabel
      ? `Watch ${title} free on Babe Hub. ${kwLabel}. HD adult video — discover more, find creators, and apply to casting calls.`
      : `Watch ${title} free on Babe Hub — HD adult video. Discover creators and apply to casting calls.`;
    return {
      title: `${title} — Watch Free | Babe Hub`,
      description,
      openGraph: {
        type: 'video.other',
        title,
        description,
        images: sp.thumb ? [sp.thumb] : undefined,
      },
      // Individual catalog video pages are param-driven (eporner has no
      // get-by-id endpoint), so a bare crawl can't self-render. Keep them
      // noindex but FOLLOW so their keyword links pass equity to the
      // indexable /videos/{tag} category pages — the real SEO engine.
      robots: { index: false, follow: true },
    };
  }
  if (provider === 'creator_post') {
    const result = await loadCreatorPost(contentId);
    if (!result) return { title: 'Video not found' };
    const { post, creator } = result;
    const title = `${creator?.display_name || creator?.handle || 'Creator'} — Babe Hub`;
    return {
      title,
      description: post.body?.slice(0, 160) || undefined,
      openGraph: {
        title,
        description: post.body?.slice(0, 160) || undefined,
        type: 'video.other',
      },
    };
  }
  return { title: 'Video' };
}

export default async function VideoPage({ params, searchParams }: Props) {
  const { provider: rawProvider, contentId } = await params;
  if (!isValidProvider(rawProvider)) notFound();
  const provider: Provider = rawProvider;

  const sp = await searchParams;

  // Pre-load engagement state in parallel with the page render. Anonymous
  // viewers get likeCount + comments; isLiked/isFavorited come back false.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [summary, creatorPostBundle] = await Promise.all([
    loadInteractionSummary(provider, contentId),
    provider === 'creator_post' ? loadCreatorPost(contentId) : Promise.resolve(null),
  ]);

  // Eporner branch — read player metadata from URL params (came from the
  // card click). If `embed` is missing, this URL was opened directly
  // without context; the calling card is the only place we have that
  // metadata.
  if (provider === 'eporner') {
    if (!sp.embed) {
      return (
        <main className="mx-auto max-w-3xl px-6 py-10">
          <div className="rounded-2xl border border-red-500/40 bg-red-500/5 p-8 text-center">
            <p className="text-text-main">Can&apos;t open this video directly.</p>
            <p className="mt-2 text-xs text-text-secondary">
              The eporner player URL wasn&apos;t passed in. Open it from the{' '}
              <Link href="/explore" className="text-primary hover:underline">
                Explore feed
              </Link>{' '}
              instead.
            </p>
          </div>
        </main>
      );
    }

    const title = sp.title ?? 'Video';
    const thumb = sp.thumb ?? null;
    const sourceUrl = sp.source ?? null;
    const keywordList = (sp.keywords ?? '')
      .split(',')
      .map((k) => k.trim())
      .filter(Boolean)
      .slice(0, 10);

    return (
      <main className="mx-auto max-w-5xl py-3 md:py-6">
        {/* ── Back nav ──────────────────────────────────────────── */}
        <div className="mb-3 px-4 sm:px-6">
          <Link
            href="/explore"
            className="inline-flex items-center gap-1.5 rounded-full border border-border-color px-3 py-1.5 text-xs font-bold text-text-secondary transition-all hover:border-primary/40 hover:text-primary"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            Explore
          </Link>
        </div>

        {/* ── Player — edge-to-edge on mobile ───────────────────── */}
        <div className="-mx-0 sm:px-0">
          <div className="aspect-video w-full overflow-hidden bg-black shadow-2xl sm:rounded-2xl">
            <iframe
              src={sp.embed}
              title={title}
              allow="autoplay; fullscreen; encrypted-media"
              allowFullScreen
              // Sandbox the third-party player: the video still plays
              // (allow-scripts + allow-same-origin), but WITHOUT
              // allow-popups / allow-top-navigation the catalog player's
              // overlay ad links can't open new tabs or redirect the page
              // — so the yellow sponsor links become dead, non-functional.
              sandbox="allow-scripts allow-same-origin allow-presentation allow-forms"
              referrerPolicy="no-referrer"
              className="h-full w-full border-0"
            />
          </div>
        </div>

        {/* ── Meta + actions ────────────────────────────────────── */}
        <div className="mt-4 px-4 sm:px-6">
          <h1 className="text-lg font-bold leading-snug tracking-tight text-text-main sm:text-xl md:text-2xl">
            {title}
          </h1>

          {/* Stats chips */}
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {sp.views && (
              <span className="inline-flex items-center gap-1 rounded-full border border-border-color/60 bg-secondary/60 px-2.5 py-1 text-[11px] text-text-secondary">
                <Eye className="h-3 w-3" /> {sp.views} views
              </span>
            )}
            {sp.length && (
              <span className="inline-flex items-center gap-1 rounded-full border border-border-color/60 bg-secondary/60 px-2.5 py-1 text-[11px] text-text-secondary">
                <Clock className="h-3 w-3" /> {sp.length}
              </span>
            )}
          </div>

          {/* Actions */}
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <VideoActions
              provider="eporner"
              contentId={contentId}
              initialLikeCount={summary.likeCount}
              initialIsLiked={summary.isLiked}
              initialIsFavorited={summary.isFavorited}
              isSignedIn={Boolean(user)}
              meta={{ title, thumbUrl: thumb, embedUrl: sp.embed, sourceUrl }}
            />
            <span className="inline-flex items-center gap-1 text-xs text-text-secondary">
              <MessageSquare className="h-3.5 w-3.5" />
              {summary.commentCount} {summary.commentCount === 1 ? 'comment' : 'comments'}
            </span>
          </div>

          {/* Keyword chips */}
          {keywordList.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-1.5">
              {keywordList.map((kw) => (
                <Link
                  key={kw}
                  href={`/videos/${slugify(kw)}` as never}
                  className="rounded-full border border-border-color/50 bg-secondary/40 px-2.5 py-1 text-[10px] text-text-secondary/70 transition-all hover:border-primary/40 hover:bg-primary/8 hover:text-primary"
                >
                  {kw}
                </Link>
              ))}
            </div>
          )}

          {/* Apply CTA strip */}
          <div className="mt-5 flex items-center justify-between gap-3 rounded-2xl border border-primary/20 bg-primary/5 px-4 py-3">
            <div className="min-w-0">
              <p className="flex items-center gap-1.5 text-xs font-bold text-text-main">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                Want to appear in content like this?
              </p>
              <p className="mt-0.5 text-[11px] text-text-secondary">
                Apply to BabeHub — casting, live cams, luxury & OnlyFans talent wanted.
              </p>
            </div>
            <ApplyButton
              variant="primary"
              label="Apply"
              withArrow
              className="shrink-0 !px-3 !py-1.5 !text-xs"
            />
          </div>

          {/* Ad strip */}
          <div className="mt-5">
            <AdStrip placement="video-eporner" />
          </div>
        </div>

        {/* ── Comments ──────────────────────────────────────────── */}
        <section className="mt-8 border-t border-border-color/40 px-4 pt-6 sm:px-6">
          <h2 className="mb-4 text-base font-bold text-text-main">
            {summary.commentCount > 0 ? `${summary.commentCount} comment${summary.commentCount === 1 ? '' : 's'}` : 'Comments'}
          </h2>
          <CommentThread
            provider="eporner"
            contentId={contentId}
            initialComments={summary.comments}
            viewerId={user?.id ?? null}
            isSignedIn={Boolean(user)}
          />
        </section>
      </main>
    );
  }

  // Creator post branch
  if (!creatorPostBundle) notFound();
  const { post, creator, videoUrl } = creatorPostBundle;

  const title = post.body?.slice(0, 80) || `Post by @${creator?.handle ?? ''}`;

  return (
    <main className="mx-auto max-w-5xl py-3 md:py-6">
      {/* Back nav */}
      <div className="mb-3 px-4 sm:px-6">
        {creator && (
          <Link
            href={`/c/${creator.handle}`}
            className="inline-flex items-center gap-1.5 rounded-full border border-border-color px-3 py-1.5 text-xs font-bold text-text-secondary transition-all hover:border-primary/40 hover:text-primary"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            @{creator.handle}
          </Link>
        )}
      </div>

      {/* Player — edge-to-edge on mobile */}
      {videoUrl ? (
        <div className="aspect-video w-full overflow-hidden bg-black shadow-2xl sm:rounded-2xl">
          <video src={videoUrl} controls autoPlay playsInline className="h-full w-full" />
        </div>
      ) : (
        <div className="flex aspect-video w-full items-center justify-center bg-secondary/50 text-text-secondary sm:rounded-2xl">
          This post has no video.
        </div>
      )}

      {/* Meta */}
      <div className="mt-4 px-4 sm:px-6">
        {/* Creator pill */}
        {creator && (
          <Link
            href={`/c/${creator.handle}`}
            className="mb-3 inline-flex items-center gap-2 rounded-full border border-border-color px-3 py-1.5 text-sm font-bold text-text-main transition-colors hover:border-primary hover:text-primary"
          >
            <span className="h-6 w-6 overflow-hidden rounded-full bg-secondary">
              {creator.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={creator.avatar_url} alt="" className="h-full w-full object-cover" />
              ) : (
                <span className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/40 to-pink-600/40 text-[10px] font-black text-white">
                  {(creator.display_name || creator.handle).slice(0, 1).toUpperCase()}
                </span>
              )}
            </span>
            <span className="inline-flex items-center gap-1 text-sm">
              {creator.display_name || creator.handle}
              {creator.is_verified && <ShieldCheck className="h-3.5 w-3.5 text-primary" />}
            </span>
          </Link>
        )}

        <h1 className="text-lg font-bold leading-snug tracking-tight text-text-main sm:text-xl">
          {title}
        </h1>

        {post.body && (
          <p className="mt-2 whitespace-pre-wrap text-sm text-text-secondary">{post.body}</p>
        )}

        {/* Actions */}
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <VideoActions
            provider="creator_post"
            contentId={contentId}
            initialLikeCount={summary.likeCount}
            initialIsLiked={summary.isLiked}
            initialIsFavorited={summary.isFavorited}
            isSignedIn={Boolean(user)}
            meta={{ title, thumbUrl: null }}
          />
          <span className="inline-flex items-center gap-1 text-xs text-text-secondary">
            <MessageSquare className="h-3.5 w-3.5" />
            {summary.commentCount} {summary.commentCount === 1 ? 'comment' : 'comments'}
          </span>
        </div>

        {/* Ad strip */}
        <div className="mt-5">
          <AdStrip placement="video-creator" />
        </div>
      </div>

      {/* Comments */}
      <section className="mt-8 border-t border-border-color/40 px-4 pt-6 sm:px-6">
        <h2 className="mb-4 text-base font-bold text-text-main">
          {summary.commentCount > 0 ? `${summary.commentCount} comment${summary.commentCount === 1 ? '' : 's'}` : 'Comments'}
        </h2>
        <CommentThread
          provider="creator_post"
          contentId={contentId}
          initialComments={summary.comments}
          viewerId={user?.id ?? null}
          isSignedIn={Boolean(user)}
        />
      </section>
    </main>
  );
}
