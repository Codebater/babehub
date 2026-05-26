/**
 * Universal loading skeleton for every (social)-shell route.
 *
 * App Router auto-shows this inside a React Suspense boundary while a
 * sibling route segment's server data is loading. When the user
 * clicks Explore -> Jobs -> Dashboard, the skeleton appears instantly
 * (no perceived blocking on the previous page) while the new page
 * runs its server queries.
 *
 * Page-specific skeletons can be added later by dropping a
 * `loading.tsx` inside that route's folder; Next picks the closest.
 */
export default function SocialLoading() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-6 md:px-6 md:py-10">
      <div className="mb-6 h-14 animate-pulse rounded-2xl bg-card/50 md:mb-8 md:h-16" />
      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
        <div className="h-28 animate-pulse rounded-2xl bg-card/40" />
        <div className="h-28 animate-pulse rounded-2xl bg-card/40 [animation-delay:75ms]" />
        <div className="h-28 animate-pulse rounded-2xl bg-card/40 [animation-delay:150ms]" />
      </div>
      <div className="space-y-3">
        <div className="h-4 w-2/3 animate-pulse rounded bg-card/30" />
        <div className="h-4 w-4/5 animate-pulse rounded bg-card/30 [animation-delay:75ms]" />
        <div className="h-4 w-1/2 animate-pulse rounded bg-card/30 [animation-delay:150ms]" />
      </div>
    </main>
  );
}
