'use client';

import { useState, useRef, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Header from './Header';
import Hero from './Hero';
import Benefits from './Benefits';
import MarketingDashboard from './MarketingDashboard';
import LogoCloudMarquee from './LogoCloudMarquee';
import HowItWorks from './HowItWorks';
import FAQ from './FAQ';
import Apply from './Apply';
import Footer from './Footer';
import SurveyModal from './SurveyModal';

/**
 * Marketing home shell. Mirrors the old `App.tsx` orchestration minus the
 * Vite-SPA-era `Preloader` (Next.js SSG renders the page instantly — covering
 * it with a 2-second opacity-0 wrapper just hid content from the user).
 *
 * Still client-side because of:
 *   - cross-section state (apply modal open/closed)
 *   - the scroll-spy that flips `html.theme-pink` while Benefits is in view
 *
 * Embed mode: when this page is loaded with `?embed=1`, the Header and
 * Footer are hidden. Used by the social-shell /marketing route, which
 * loads this page in an iframe and doesn't want a double-stacked
 * marketing Header on top of the platform sidebar.
 */
export default function HomeShell() {
  const searchParams = useSearchParams();
  const isEmbedded = searchParams?.get('embed') === '1';
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
    };
  }, []);

  const open = () => setIsSurveyModalOpen(true);
  const close = () => setIsSurveyModalOpen(false);

  return (
    <div className="bg-background font-sans transition-colors duration-700">
      {!isEmbedded && <Header onApplyClick={open} />}
      <main>
        <Hero onApplyClick={open} />
        <Benefits onApplyClick={open} sectionRef={benefitsRef} />
        <MarketingDashboard onApplyClick={open} />
        <LogoCloudMarquee />
        <HowItWorks />
        <FAQ />
        <Apply onApplyClick={open} />
      </main>
      {!isEmbedded && <Footer />}

      <SurveyModal isOpen={isSurveyModalOpen} onClose={close} />
    </div>
  );
}
