'use client';

import { useState, useTransition, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Search, X, Loader2 } from 'lucide-react';

/**
 * Search bar on /explore. Submits a query string via the URL (`?q=...`)
 * so the search state is shareable + survives reload. The server
 * component on `/explore` reads `searchParams.q` and passes it through
 * to the eporner client.
 *
 * Wrapped in a transition so the input doesn't freeze while the server
 * re-renders the page with the new query.
 */
export default function SearchBar({ initialQuery }: { initialQuery: string }) {
  const router = useRouter();
  const [value, setValue] = useState(initialQuery);
  const [pending, startTransition] = useTransition();

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = value.trim();
    const url = trimmed ? `/explore?q=${encodeURIComponent(trimmed)}` : '/explore';
    startTransition(() => {
      router.push(url);
    });
  };

  const onClear = () => {
    setValue('');
    startTransition(() => {
      router.push('/explore');
    });
  };

  return (
    <form
      onSubmit={onSubmit}
      role="search"
      className="relative flex items-center gap-2 rounded-full border border-border-color bg-card px-4 py-2 focus-within:border-primary"
    >
      <Search className="h-4 w-4 shrink-0 text-text-secondary" />
      <input
        type="search"
        name="q"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Search videos…"
        autoComplete="off"
        className="flex-1 bg-transparent text-sm text-text-main placeholder-text-secondary focus:outline-none"
      />
      {value && (
        <button
          type="button"
          onClick={onClear}
          aria-label="Clear search"
          className="rounded-full p-1 text-text-secondary transition-colors hover:bg-secondary hover:text-text-main"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
      {pending && <Loader2 className="h-4 w-4 animate-spin text-text-secondary" />}
    </form>
  );
}
