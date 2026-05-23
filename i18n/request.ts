import { getRequestConfig } from 'next-intl/server';
import { routing } from './routing';

/**
 * Translations live in `locales/<code>.ts` (preserved from the old useLanguage hook).
 * They were already typed as nested objects — next-intl accepts the same shape as
 * its `messages` argument, so no transformation is needed.
 *
 * The non-English locale files are partially translated (legacy of the old
 * SPA). To avoid empty strings rendering on the page when a key is missing,
 * we install an English fallback: any unresolved key in `de`/`es`/`fr`/`ja`/
 * `pt`/`th` walks the `en` message tree and returns the English value.
 * Worst case the user sees an English word inside a German paragraph — far
 * better than a blank space.
 */
export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale =
    requested && (routing.locales as readonly string[]).includes(requested)
      ? requested
      : routing.defaultLocale;

  const messages = (await import(`../locales/${locale}`)).default;
  const fallbackMessages = (await import(`../locales/en`)).default;

  const getFromTree = (tree: unknown, path: string): unknown =>
    path.split('.').reduce<unknown>((acc, part) => {
      if (acc && typeof acc === 'object' && part in (acc as Record<string, unknown>)) {
        return (acc as Record<string, unknown>)[part];
      }
      return undefined;
    }, tree);

  return {
    locale,
    messages,
    // Silence MISSING_MESSAGE noise during build / dev; the fallback below
    // ensures the rendered value is still readable.
    onError(error) {
      if (error.code === 'MISSING_MESSAGE') return;
      // eslint-disable-next-line no-console
      console.error(error);
    },
    getMessageFallback({ namespace, key }) {
      const path = namespace ? `${namespace}.${key}` : key;
      const value = getFromTree(fallbackMessages, path);
      return typeof value === 'string' ? value : path;
    },
  };
});
