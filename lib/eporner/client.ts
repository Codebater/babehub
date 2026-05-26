/**
 * Typed wrapper around the eporner v2 search API.
 *
 * Endpoint: https://www.eporner.com/api/v2/video/search/
 * Docs:     https://www.eporner.com/api/v2/
 *
 * No API key is required. Responses are cached by Next.js's built-in
 * data cache (5 minute revalidation by default) so repeated /explore
 * renders don't hammer the upstream API.
 *
 * eporner's player is iframe-only — they do NOT expose raw MP4 URLs.
 * The `embed` field on each video is what goes into an `<iframe src>`.
 */

const SEARCH_URL = 'https://www.eporner.com/api/v2/video/search/';

export type EpornerThumb = {
  size: 'small' | 'medium' | 'big';
  width: number;
  height: number;
  src: string;
};

export type EpornerVideo = {
  id: string;
  title: string;
  keywords: string;
  views: number;
  rate: string;
  /** Public watch URL on eporner.com */
  url: string;
  added: string;
  length_sec: number;
  length_min: string;
  /** iframe player URL — drop into <iframe src> */
  embed: string;
  default_thumb: EpornerThumb;
  thumbs: EpornerThumb[];
};

export type EpornerSearchResponse = {
  count: number;
  start: number;
  per_page: number;
  page: number;
  time_ms: number;
  total_count: number;
  total_pages: number;
  videos: EpornerVideo[];
};

export type EpornerSearchOptions = {
  /** Search phrase. Use 'all' or '*' for unfiltered latest. */
  query?: string;
  /** 1-indexed. */
  page?: number;
  /** Max 1000. */
  per_page?: number;
  /** 'latest' | 'top-weekly' | 'top-monthly' | 'longest' | 'shortest' | 'top-rated' */
  order?: string;
  /** 'small' | 'medium' | 'big' */
  thumbsize?: string;
  /** Long-quality video filter — pass '1' to include only HD/long-form. */
  lq?: '0' | '1';
  /** Optional ISO category — see eporner docs for full list. */
  gay?: '0' | '1';
  /** Seconds to cache the response in Next.js fetch cache. */
  revalidateSeconds?: number;
  /**
   * Filter out AI-generated / deepfake videos client-side after the
   * API responds. Eporner doesn't expose an upstream "no AI" flag,
   * so we scan `title + keywords` for a small allow-list of AI
   * markers and drop matches. Defaults to true — every caller gets
   * AI-free results unless they opt out.
   */
  excludeAi?: boolean;
};

/**
 * Word-boundary regex matching common AI / deepfake markers. Run
 * against the lowercased `title + ' ' + keywords` string. Anchored
 * on \b so e.g. "Stuart" doesn't match "art" inside "AI art".
 *
 * Conservative on purpose — adding "virtual" or "cgi" would catch
 * legitimate non-AI content. Adjust here as new AI marker terms
 * become common on the upstream catalog.
 */
const AI_MARKER_RE =
  /\b(ai|ai-generated|aigenerated|ai_generated|deepfake|deep-fake|deepfaked|midjourney|stable[\s-]?diffusion|dall[\s-]?e|sora|aigen|synthetic\s+person|ai\s+girl|ai\s+model|ai\s+porn|ai\s+actress)\b/i;

export function isAiGenerated(v: { title: string; keywords: string }): boolean {
  return AI_MARKER_RE.test(`${v.title} ${v.keywords}`);
}

export async function searchVideos(
  options: EpornerSearchOptions = {},
): Promise<EpornerSearchResponse> {
  const params = new URLSearchParams({
    query: options.query ?? 'all',
    page: String(options.page ?? 1),
    per_page: String(options.per_page ?? 24),
    order: options.order ?? 'latest',
    thumbsize: options.thumbsize ?? 'big',
    format: 'json',
  });
  if (options.lq) params.set('lq', options.lq);
  if (options.gay) params.set('gay', options.gay);

  const url = `${SEARCH_URL}?${params.toString()}`;

  const res = await fetch(url, {
    // A realistic User-Agent so eporner's edge layer doesn't reject the
    // request as bot-traffic. Some adult APIs return empty / 403 to
    // generic User-Agents like Node's default `node/x.y` UA.
    headers: {
      'User-Agent':
        'Mozilla/5.0 (compatible; BabeHub/1.0; +https://babehub.net)',
      Accept: 'application/json',
    },
    next: { revalidate: options.revalidateSeconds ?? 300 }, // 5 min default
  });

  if (!res.ok) {
    const errBody = await res.text();
    console.error('[eporner] search failed', res.status, errBody.slice(0, 300));
    throw new Error(`eporner search failed (${res.status}): ${errBody.slice(0, 200)}`);
  }

  const data = (await res.json()) as EpornerSearchResponse;

  // Default-on AI filter. We log the drop count so it's visible in
  // dev whether the filter is doing anything noticeable.
  const excludeAi = options.excludeAi !== false;
  let filtered = data.videos;
  let droppedAi = 0;
  if (excludeAi) {
    filtered = data.videos.filter((v) => {
      const isAi = isAiGenerated(v);
      if (isAi) droppedAi += 1;
      return !isAi;
    });
  }

  console.log(
    '[eporner] search ok — page',
    data.page,
    'of',
    data.total_pages,
    '· videos in batch:',
    filtered.length,
    excludeAi && droppedAi > 0 ? `(− ${droppedAi} AI)` : '',
    '· total catalog:',
    data.total_count,
  );

  return { ...data, videos: filtered };
}
