/**
 * Shared layout for every `/app/*` route. Sets the dark surface tone for
 * the platform UI (distinct from the marketing site, which can theme-swap
 * to pink on Benefits scroll-spy).
 *
 * Sub-layouts:
 *   - `(public)/` — login + future password reset; viewable by anyone
 *   - `(authed)/` — dashboard, onboarding, etc; requires a session
 */
export default function AppRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-text-main font-sans">
      {children}
    </div>
  );
}
