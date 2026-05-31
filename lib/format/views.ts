/**
 * Display-only view-count helpers for the catalog feed.
 *
 * `boostViews` inflates a raw view number by a stable per-video
 * multiplier (seeded by the video id) so the same video always shows the
 * same boosted count across renders, plus a baseline floor so even
 * low-traffic items look active. Never persisted — purely a display
 * treatment so the discovery feed reads as a busy, established platform.
 */
export function boostViews(raw: number, seed: string): number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = (Math.imul(h, 31) + seed.charCodeAt(i)) | 0;
  }
  const abs = Math.abs(h);
  const mult = 5 + (abs % 8); // 5×–12×
  const floor = 12_000 + (abs % 88_000); // 12k–100k baseline
  return Math.max(Math.round((raw || 0) * mult), floor);
}

/** Compact human-readable view count: 1.2M / 340K / 920. */
export function formatViews(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${Math.round(n / 1_000)}K`;
  return String(n);
}
