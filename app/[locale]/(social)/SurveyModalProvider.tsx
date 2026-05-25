'use client';

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import SurveyModal from '../(marketing)/_components/SurveyModal';

/**
 * Global "Apply BabeHub" modal context, lifted to the (social) shell
 * so every page inside the shell can pop the marketing-site SurveyModal
 * without navigating to /#apply.
 *
 * Pattern:
 *   - Wrap (social)/layout's children in <SurveyModalProvider>
 *   - Any child component grabs the opener via `useSurveyModal()` and
 *     fires `openApply()` on a click handler.
 *
 * The modal itself is rendered exactly once (here) so the same DOM node
 * is reused across every trigger. Closing animations and form state
 * persist as long as the user stays inside the (social) shell.
 */
type SurveyModalContextValue = {
  openApply: () => void;
  closeApply: () => void;
};

const SurveyModalContext = createContext<SurveyModalContextValue | null>(null);

export function useSurveyModal(): SurveyModalContextValue {
  const ctx = useContext(SurveyModalContext);
  if (!ctx) {
    // Returning a noop fallback instead of throwing means a stray hook
    // call outside the provider just does nothing — safer for SSR /
    // hydration edge cases than a runtime crash.
    return { openApply: () => {}, closeApply: () => {} };
  }
  return ctx;
}

export default function SurveyModalProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);

  const value = useMemo<SurveyModalContextValue>(
    () => ({
      openApply: () => setOpen(true),
      closeApply: () => setOpen(false),
    }),
    [],
  );

  const onClose = useCallback(() => setOpen(false), []);

  return (
    <SurveyModalContext.Provider value={value}>
      {children}
      <SurveyModal isOpen={open} onClose={onClose} />
    </SurveyModalContext.Provider>
  );
}
