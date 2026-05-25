'use client';

import { useState, useRef, useEffect } from 'react';
import Hero from '../../(marketing)/_components/Hero';
import Benefits from '../../(marketing)/_components/Benefits';
import MarketingDashboard from '../../(marketing)/_components/MarketingDashboard';
import LogoCloudMarquee from '../../(marketing)/_components/LogoCloudMarquee';
import HowItWorks from '../../(marketing)/_components/HowItWorks';
import FAQ from '../../(marketing)/_components/FAQ';
import Apply from '../../(marketing)/_components/Apply';
import SurveyModal from '../../(marketing)/_components/SurveyModal';

/**
 * Inline marketing content for /marketing inside the (social) shell.
 *
 * Reuses every section component from the standalone marketing home
 * EXCEPT the Header and Footer:
 *   - The social sidebar already provides nav + logo + sign-in, so the
 *     marketing Header would be redundant (and stylistically conflict
 *     with the sidebar layout).
 *   - The social shell already has legal-footer chips in the sidebar;
 *     duplicating the marketing Footer would push the page very long
 *     with little extra value. (Re-enable later if we miss the
 *     language switcher / multi-link footer.)
 *
 * Cross-section state lives here:
 *   - the Apply survey modal (opens on every "Apply" button across
 *     the embedded sections)
 *   - the scroll-spy that flips `html.theme-pink` while the Benefits
 *     section is in view, matching the standalone marketing home so
 *     the visual tone stays consistent.
 */
export default function MarketingInline() {
  const [isSurveyModalOpen, setIsSurveyModalOpen] = useState(false);
  const benefitsRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          document.documentElement.classList.add('theme-pink');
        } else {
          document.documentElement.classList.remove('theme-pink');
        }
      },
      { rootMargin: '-50% 0px -50% 0px', threshold: 0 },
    );

    const current = benefitsRef.current;
    if (current) observer.observe(current);
    return () => {
      if (current) observer.unobserve(current);
      // Reset the pink theme class on unmount so navigating away from
      // /marketing doesn't leave the rest of the platform tinted.
      document.documentElement.classList.remove('theme-pink');
    };
  }, []);

  const open = () => setIsSurveyModalOpen(true);
  const close = () => setIsSurveyModalOpen(false);

  return (
    <div className="bg-background font-sans transition-colors duration-700">
      <Hero onApplyClick={open} />
      <Benefits onApplyClick={open} sectionRef={benefitsRef} />
      <MarketingDashboard onApplyClick={open} />
      <LogoCloudMarquee />
      <HowItWorks />
      <FAQ />
      <Apply onApplyClick={open} />

      <SurveyModal isOpen={isSurveyModalOpen} onClose={close} />
    </div>
  );
}
