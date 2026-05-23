import { defineRouting } from 'next-intl/routing';

/**
 * The 7 locales preserved from the previous Vite app (locales/{de,en,es,fr,ja,pt,th}.ts).
 *
 * `localePrefix: 'as-needed'` keeps the existing English URLs at the root
 * (e.g. `/`, `/onlyfans-management-germany`) — important to avoid SEO regressions
 * during the migration. Non-default locales are reachable at `/de`, `/es`, etc.
 */
export const routing = defineRouting({
  locales: ['en', 'de', 'es', 'fr', 'ja', 'pt', 'th'] as const,
  defaultLocale: 'en',
  localePrefix: 'as-needed',
  // Do NOT auto-route by Accept-Language. The non-default locale files are
  // partially translated; auto-routing a German browser to /de would surface
  // empty strings for any key missing from de.ts. Users opt in via the
  // LanguageSwitcher or by visiting /de, /es, etc. directly.
  localeDetection: false,
});

export type AppLocale = (typeof routing.locales)[number];
