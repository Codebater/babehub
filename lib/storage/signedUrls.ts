import { createAdminClient } from '@/lib/supabase/admin';

export type SignedMedia = {
  url: string;
  kind: 'image' | 'video';
};

/**
 * Mint short-lived signed URLs for a batch of media rows.
 *
 * Why the admin client? The `posts` storage bucket is private with an RLS
 * policy that only lets the OWNER read. Subscribers viewing a tier-gated
 * post need to see the files too, but they don't own them — so we mint a
 * signed URL server-side and embed it in the rendered HTML.
 *
 * Security: callers MUST only pass media ids that the viewer is already
 * authorized to see. The standard pattern: load posts with the RLS-aware
 * cookie client first (which filters out posts the viewer can't access),
 * then collect those posts' media_ids and pass them here. RLS on `posts`
 * is the gate; this function just hands out short-lived view URLs.
 *
 * Returns a Map<media_id, { url, kind }>. Missing entries indicate either
 * an unknown media id or an expired/failed sign — caller should render a
 * graceful fallback (e.g. broken-media placeholder).
 *
 * The `kind` field lets the renderer pick `<img>` vs `<video>` without an
 * extra DB round trip.
 */
export async function getSignedMediaUrls(
  mediaIds: string[],
  options: { expiresIn?: number } = {},
): Promise<Map<string, SignedMedia>> {
  const result = new Map<string, SignedMedia>();
  if (mediaIds.length === 0) return result;

  const uniqueIds = Array.from(new Set(mediaIds));
  const expiresIn = options.expiresIn ?? 60 * 60; // 1 hour default

  const admin = createAdminClient();

  const { data: rows, error } = await admin
    .from('media')
    .select('id, kind, storage_bucket, storage_path')
    .in('id', uniqueIds);

  if (error || !rows) return result;

  type Row = (typeof rows)[number];
  // Group by bucket so we can use createSignedUrls (batch) per bucket.
  const byBucket = new Map<string, Row[]>();
  for (const row of rows) {
    const bucket = row.storage_bucket;
    const entry = byBucket.get(bucket) ?? [];
    entry.push(row);
    byBucket.set(bucket, entry);
  }

  await Promise.all(
    Array.from(byBucket.entries()).map(async ([bucket, items]) => {
      const { data: signed } = await admin.storage
        .from(bucket)
        .createSignedUrls(
          items.map((i) => i.storage_path),
          expiresIn,
        );
      if (!signed) return;
      signed.forEach((s, idx) => {
        const item = items[idx];
        if (item && s.signedUrl) {
          result.set(item.id, { url: s.signedUrl, kind: item.kind });
        }
      });
    }),
  );

  return result;
}
