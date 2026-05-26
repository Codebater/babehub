/**
 * Compact number formatter for "industry budget flow" style metrics.
 *
 *   formatCompact(1421000)   → "1.42M"
 *   formatCompact(14500)     → "14.5K"
 *   formatCompact(900)       → "900"
 *   formatCompact(2_400_000_000_000, '€') → "€2.40T"
 *
 * Adapted from Intl.NumberFormat's compact notation but stripped down
 * so the output stays a single short token (no locale-specific
 * suffixes, no rounded-trailing-zero noise). One decimal for K/M/B/T
 * so the value feels precise without overwhelming the badge.
 */
export function formatCompact(n: number, currency: string = ''): string {
  if (!Number.isFinite(n)) return `${currency}0`;
  const sign = n < 0 ? '-' : '';
  const abs = Math.abs(n);
  if (abs < 1_000) return `${sign}${currency}${Math.round(abs)}`;
  if (abs < 1_000_000) return `${sign}${currency}${(abs / 1_000).toFixed(1).replace(/\.0$/, '')}K`;
  if (abs < 1_000_000_000) return `${sign}${currency}${(abs / 1_000_000).toFixed(2).replace(/\.?0+$/, '')}M`;
  if (abs < 1_000_000_000_000)
    return `${sign}${currency}${(abs / 1_000_000_000).toFixed(2).replace(/\.?0+$/, '')}B`;
  return `${sign}${currency}${(abs / 1_000_000_000_000).toFixed(2).replace(/\.?0+$/, '')}T`;
}
