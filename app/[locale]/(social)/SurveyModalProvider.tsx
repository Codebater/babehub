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
import BannerInquiryModal from '../(marketing)/_components/BannerInquiryModal';

/**
 * Shell-wide modal context for both the creator-side "Apply BabeHub"
 * survey and the B2B "Sponsored banner / featured job / collab"
 * inquiry, lifted to the (social) shell so any page can pop either
 * modal without navigating.
 *
 * Pattern:
 *   - Wrap (social)/layout's children in <SurveyModalProvider>
 *   - Child component grabs the opener via `useSurveyModal()` and
 *     fires `openApply()` (creator funnel) or `openBanner()` (B2B
 *     funnel) on a click handler.
 *
 * Both modal instances live here and are reused across triggers, so
 * partial form state survives as long as the user stays in the shell.
 */
type SurveyModalContextValue = {
  openApply: () => void;
  closeApply: () => void;
  /** Open the B2B banner / featured-job / collab inquiry modal. */
  openBanner: () => void;
  closeBanner: () => void;
};

const SurveyModalContext = createContext<SurveyModalContextValue | null>(null);

export function useSurveyModal(): SurveyModalContextValue {
  const ctx = useContext(SurveyModalContext);
  if (!ctx) {
    // Returning a noop fallback instead of throwing means a stray hook
    // call outside the provider just does nothing — safer for SSR /
    // hydration edge cases than a runtime crash.
    return {
      openApply: () => {},
      closeApply: () => {},
      openBanner: () => {},
      closeBanner: () => {},
    };
  }
  return ctx;
}

export default function SurveyModalProvider({ children }: { children: ReactNode }) {
  const [applyOpen, setApplyOpen] = useState(false);
  const [bannerOpen, setBannerOpen] = useState(false);

  const value = useMemo<SurveyModalContextValue>(
    () => ({
      openApply: () => setApplyOpen(true),
      closeApply: () => setApplyOpen(false),
      openBanner: () => setBannerOpen(true),
      closeBanner: () => setBannerOpen(false),
    }),
    [],
  );

  const onCloseApply = useCallback(() => setApplyOpen(false), []);
  const onCloseBanner = useCallback(() => setBannerOpen(false), []);

  return (
    <SurveyModalContext.Provider value={value}>
      {children}
      <SurveyModal isOpen={applyOpen} onClose={onCloseApply} />
      <BannerInquiryModal isOpen={bannerOpen} onClose={onCloseBanner} />
    </SurveyModalContext.Provider>
  );
}
