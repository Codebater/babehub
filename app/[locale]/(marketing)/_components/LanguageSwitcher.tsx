'use client';

import { useLocale } from 'next-intl';
import { useTransition } from 'react';
import { ChevronDownIcon } from './IconComponents';
import { useRouter, usePathname } from '@/i18n/navigation';
import type { AppLocale } from '@/i18n/routing';

const LANGUAGES: Record<AppLocale, string> = {
  en: 'English',
  de: 'Deutsch',
  es: 'Español',
  fr: 'Français',
  th: 'ภาษาไทย',
  ja: '日本語',
  pt: 'Português',
};

export default function LanguageSwitcher() {
  const locale = useLocale() as AppLocale;
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const switchTo = (next: AppLocale) => {
    if (next === locale) return;
    startTransition(() => {
      router.replace(pathname, { locale: next });
    });
  };

  return (
    <div className="relative group">
      <button
        type="button"
        className="flex items-center space-x-1 text-text-main hover:text-primary transition-colors duration-300 text-sm font-medium disabled:opacity-50"
        disabled={isPending}
      >
        <span className="hidden sm:inline">{LANGUAGES[locale]}</span>
        <span className="inline sm:hidden uppercase">{locale}</span>
        <ChevronDownIcon className="w-4 h-4" />
      </button>
      <div className="absolute top-full right-0 mt-2 w-32 bg-card border border-border-color rounded-md shadow-lg overflow-hidden opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-[101]">
        {(Object.entries(LANGUAGES) as [AppLocale, string][]).map(([key, name]) => (
          <button
            key={key}
            type="button"
            onClick={() => switchTo(key)}
            className={`block w-full text-left px-4 py-2 text-sm ${
              locale === key
                ? 'bg-primary/20 text-text-main font-semibold'
                : 'text-text-secondary hover:bg-secondary hover:text-text-main'
            }`}
          >
            {name}
          </button>
        ))}
      </div>
    </div>
  );
}
