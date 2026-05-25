/**
 * Deterministic casting-number assignment.
 *
 * Used by /explore when the user is filtering for "casting" videos —
 * every visible card gets a unique 3-4 digit number rendered over the
 * thumbnail like a real casting slate ("CASTING N° 237"). Goals:
 *
 *   1. **Stable per video.** Same video id → same number on every
 *      render so the user sees a consistent identifier even after a
 *      refresh or a "Load more" round-trip.
 *   2. **Unique within the visible set.** No two simultaneously-visible
 *      cards may share a number — the "Load more" flow carries a Set
 *      of already-used numbers and threads it through subsequent
 *      batches.
 *   3. **Stateless / pure.** No DB, no session storage. Pure function
 *      of (video id, used set).
 *
 * Algorithm:
 *   - FNV-1a hash of the id → modulo MAX → 1-based number.
 *   - If that number is already taken, walk forward (wrapping at MAX)
 *     until we find a free slot. Walking deterministically — same
 *     input set → same output assignment regardless of order.
 *
 * MAX is 4 digits to keep collisions extremely rare at typical
 * page sizes (24-200 visible items) without making numbers look too
 * long. Visual treatment elsewhere zero-pads to 4 digits.
 */

const MAX = 9999;

function fnv1a(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    // imul keeps the multiplication inside int32 so the hash doesn't
    // float-drift across very long ids.
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h | 0);
}

/**
 * Assign numbers to a batch of videos. Returns a Map<id, number> for
 * easy lookup. The provided `taken` Set is mutated to include every
 * number assigned in this call — pass the same set across multiple
 * calls (e.g. initial render + Load more) to guarantee uniqueness
 * across the union.
 */
export function assignCastingNumbers<T extends { id: string }>(
  videos: T[],
  taken: Set<number> = new Set(),
): Map<string, number> {
  const out = new Map<string, number>();
  for (const v of videos) {
    let n = (fnv1a(v.id) % MAX) + 1;
    let guard = 0;
    while (taken.has(n) && guard < MAX) {
      n = (n % MAX) + 1; // walk forward, wrapping
      guard += 1;
    }
    taken.add(n);
    out.set(v.id, n);
  }
  return out;
}

/** Format as a casting slate number, e.g. 237 → "0237". */
export function formatCastingNumber(n: number): string {
  return n.toString().padStart(4, '0');
}
