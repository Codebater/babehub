/**
 * Shared route-level Suspense fallback for every page inside the
 * (social) shell. Next.js renders this instantly while the real
 * server component fetches data, so navigation feels snappy —
 * sidebar + bottom-tab bar stay anchored, only the content area
 * swaps for a low-amplitude shimmer.
 *
 * Three skeleton rows are enough — most pages settle within ~200ms,
 * and a longer placeholder would just teach users to wait.
 */
export default function SocialLoading() {
  return (
    <main className="mx-auto max-w-7xl px-6 py-10">
      <div className="mb-6 h-4 w-32 animate-pulse rounded bg-secondary" />
      <div className="mb-8 h-16 w-full animate-pulse rounded-2xl bg-secondary/60" />
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="overflow-hidden rounded-2xl border border-border-color bg-card"
          >
            <div className="aspect-video animate-pulse bg-secondary/70" />
            <div className="space-y-2 p-3">
              <div className="h-3 w-3/4 animate-pulse rounded bg-secondary" />
              <div className="h-2.5 w-1/2 animate-pulse rounded bg-secondary/60" />
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
