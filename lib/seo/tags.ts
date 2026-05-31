/**
 * lib/seo/tags.ts
 *
 * Curated catalog of category/keyword landing pages (/videos/{slug}).
 *
 * These power programmatic SEO: each tag becomes an indexable aggregation
 * page targeting a high-volume adult-category search term, with its own
 * title, description, H1, and a live video grid. The set is intentionally
 * mainstream-category only (no age-adjacent or non-consent terms).
 */

export type SeoTag = {
  /** URL slug → /videos/{slug} */
  slug: string;
  /** eporner search query this tag maps to */
  query: string;
  /** Human display name (H1, breadcrumbs) */
  label: string;
};

/**
 * Seed tags — pre-rendered at build, listed in the sitemap, and given
 * bespoke metadata. Slugs are kebab-case; queries are the eporner search
 * phrase; labels are the display name.
 */
export const SEO_TAGS: SeoTag[] = [
  { slug: 'casting', query: 'casting', label: 'Casting' },
  { slug: 'live-cams', query: 'live cams', label: 'Live Cams' },
  { slug: 'webcam', query: 'webcam', label: 'Webcam' },
  { slug: 'amateur', query: 'amateur', label: 'Amateur' },
  { slug: 'milf', query: 'milf', label: 'MILF' },
  { slug: 'mature', query: 'mature', label: 'Mature' },
  { slug: 'latina', query: 'latina', label: 'Latina' },
  { slug: 'asian', query: 'asian', label: 'Asian' },
  { slug: 'ebony', query: 'ebony', label: 'Ebony' },
  { slug: 'blonde', query: 'blonde', label: 'Blonde' },
  { slug: 'brunette', query: 'brunette', label: 'Brunette' },
  { slug: 'redhead', query: 'redhead', label: 'Redhead' },
  { slug: 'big-tits', query: 'big tits', label: 'Big Tits' },
  { slug: 'lingerie', query: 'lingerie', label: 'Lingerie' },
  { slug: 'cosplay', query: 'cosplay', label: 'Cosplay' },
  { slug: 'pov', query: 'pov', label: 'POV' },
  { slug: 'couple', query: 'couple', label: 'Couple' },
  { slug: 'solo', query: 'solo', label: 'Solo' },
  { slug: 'fetish', query: 'fetish', label: 'Fetish' },
  { slug: 'feet', query: 'feet', label: 'Feet' },
  { slug: 'massage', query: 'massage', label: 'Massage' },
  { slug: 'outdoor', query: 'outdoor', label: 'Outdoor' },
  { slug: 'public', query: 'public', label: 'Public' },
  { slug: 'office', query: 'office', label: 'Office' },
  { slug: 'interracial', query: 'interracial', label: 'Interracial' },
  { slug: 'threesome', query: 'threesome', label: 'Threesome' },
  { slug: 'anal', query: 'anal', label: 'Anal' },
  { slug: 'bbw', query: 'bbw', label: 'BBW' },
  { slug: 'petite', query: 'petite', label: 'Petite' },
  { slug: 'curvy', query: 'curvy', label: 'Curvy' },
  { slug: 'tattoo', query: 'tattoo', label: 'Tattooed' },
  { slug: 'stockings', query: 'stockings', label: 'Stockings' },
  { slug: 'uniform', query: 'uniform', label: 'Uniform' },
  { slug: 'luxury', query: 'luxury', label: 'Luxury' },
  { slug: 'pornstar', query: 'pornstar', label: 'Pornstars' },
  { slug: 'verified', query: 'verified amateur', label: 'Verified Amateurs' },
];

const BY_SLUG = new Map(SEO_TAGS.map((t) => [t.slug, t]));

export function findTag(slug: string): SeoTag | undefined {
  return BY_SLUG.get(slug.toLowerCase());
}

/** kebab-case any string into a URL slug. */
export function slugify(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

/** Turn an arbitrary slug back into a readable search phrase. */
export function deslugify(slug: string): string {
  return slug.replace(/-/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 60);
}

/**
 * SEO title + description for a tag page. Bespoke copy for the platform's
 * own niches (casting / live cams / luxury), templated keyword-rich copy
 * for everything else.
 */
export function tagSeo(label: string): { title: string; description: string } {
  const l = label;
  const overrides: Record<string, { title: string; description: string }> = {
    Casting: {
      title: `Adult Casting Videos & Open Auditions — Watch & Apply | Babe Hub`,
      description: `Watch the latest adult casting videos and audition tapes, then apply to real paid casting calls. New ${l.toLowerCase()} scenes daily on Babe Hub — free to watch, free to apply.`,
    },
    'Live Cams': {
      title: `Live Cam Videos & Cam Model Jobs — Watch Free | Babe Hub`,
      description: `Stream the hottest live cam recordings and find cam model work. Thousands of free webcam videos plus open cam studio jobs on Babe Hub.`,
    },
    Luxury: {
      title: `Luxury Adult Videos — Premium Editorial Content | Babe Hub`,
      description: `High-production luxury adult videos — couture, cinematic, exclusive. Watch premium ${l.toLowerCase()} content and connect with elite creators on Babe Hub.`,
    },
  };
  if (overrides[l]) return overrides[l];
  return {
    title: `${l} Porn Videos — Watch Free ${l} Content | Babe Hub`,
    description: `Watch the best free ${l.toLowerCase()} porn videos and ${l.toLowerCase()} cam models on Babe Hub. Fresh ${l.toLowerCase()} content added daily — discover top creators and apply to ${l.toLowerCase()} casting calls.`,
  };
}

/** Pick N related tags (excluding the current slug) for internal linking. */
export function relatedTags(currentSlug: string, n = 12): SeoTag[] {
  return SEO_TAGS.filter((t) => t.slug !== currentSlug).slice(0, n);
}
