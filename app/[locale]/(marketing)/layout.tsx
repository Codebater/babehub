/**
 * Marketing route group layout. Currently a passthrough so we can later add
 * marketing-only shells (e.g. dark theme overrides, marketing nav) without
 * touching the platform (`(app)`) routes.
 */
export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
