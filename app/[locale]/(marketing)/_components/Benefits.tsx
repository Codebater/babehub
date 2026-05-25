'use client';

import { useState, useEffect, useRef, useMemo, type RefObject } from 'react';
import { useTranslations } from 'next-intl';
import { DollarSignIcon, ClockIcon, TrendingUpIcon, CheckIcon } from './IconComponents';
import TextReveal from './TextReveal';

interface BenefitsProps {
  onApplyClick: () => void;
  sectionRef: RefObject<HTMLElement | null>;
}

export default function Benefits({ onApplyClick, sectionRef }: BenefitsProps) {
  const t = useTranslations();

  const benefitCards = useMemo(
    () => [
      { id: 'income', icon: <DollarSignIcon className="w-8 h-8 text-primary" />, title: t('benefits.income.title'), description: t('benefits.income.description') },
      { id: 'time', icon: <ClockIcon className="w-8 h-8 text-primary" />, title: t('benefits.time.title'), description: t('benefits.time.description') },
      { id: 'growth', icon: <TrendingUpIcon className="w-8 h-8 text-primary" />, title: t('benefits.growth.title'), description: t('benefits.growth.description') },
      { id: 'security', icon: <CheckIcon className="w-8 h-8 text-primary" strokeWidth="2" />, title: t('benefits.security.title'), description: t('benefits.security.description') },
    ],
    [t],
  );

  const allCards = useMemo(() => [...benefitCards, { type: 'cta' as const, id: 'cta' }], [benefitCards]);
  const numCards = allCards.length;
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const container = scrollContainerRef.current;
      if (!container) return;
      const { top, height } = container.getBoundingClientRect();
      const vh = window.innerHeight;
      const progress = (vh * 0.75 - top) / (height - vh * 0.5);
      setScrollProgress(Math.max(0, Math.min(1, progress)));
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <section ref={sectionRef} id="benefits" className="bg-background transition-colors duration-700 py-20 overflow-x-clip">
      <div className="container mx-auto px-6">
        <div className="text-center mb-12 max-w-3xl mx-auto">
          <div className="relative inline-block mb-4">
            <h2 className="text-4xl font-bold text-text-main">{t('benefits.title')}</h2>
            <svg className="absolute -top-2 -left-4 w-[calc(100%+2rem)] h-[calc(100%+1rem)]" viewBox="0 0 100 30" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M5.33124 16.6359C14.3981 7.28475 32.1476 2.82229 50.1517 5.16795C68.1558 7.51361 85.007 16.7424 94.2125 24.3333"
                stroke="var(--color-primary)"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="animate-scribble"
                style={{ strokeDasharray: 100, strokeDashoffset: 100 }}
              />
            </svg>
          </div>
          <TextReveal as="p" className="text-lg text-text-secondary">
            {t('benefits.subtitle')}
          </TextReveal>
        </div>

        <div ref={scrollContainerRef} className="relative hidden md:block" style={{ height: `${numCards * 50}vh` }}>
          <div className="sticky top-0 h-screen flex items-center justify-center">
            <div className="relative w-full max-w-3xl" style={{ height: '320px' }}>
              {allCards.map((card, i) => {
                const totalProgress = scrollProgress * numCards;
                const localProgress = Math.max(0, Math.min(1, totalProgress - i));
                const stack = numCards - 1 - i;
                const finalY = stack * 1.0;
                const finalScale = 1 - stack * 0.03;
                const initialY = 30;
                const translateY = initialY + (finalY - initialY) * localProgress;
                const scale = 1 + (finalScale - 1) * localProgress;
                const opacity = localProgress > 0 ? 1 : 0;
                return (
                  <div
                    key={card.id}
                    className="w-full max-w-3xl overflow-hidden rounded-3xl border border-white/10 shadow-2xl shadow-black/40 transition-all duration-500 ease-out"
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      zIndex: i,
                      opacity,
                      transform: `translateY(${translateY}rem) scale(${scale})`,
                      willChange: 'transform, opacity',
                    }}
                  >
                    {'icon' in card ? (
                      // Benefit card — banner-style: dark gradient + soft primary
                      // glow blob in the corner + bigger typography. Same visual
                      // language as the Casting / Live Cams / Luxury hero banners
                      // on /explore.
                      <div className="relative h-full overflow-hidden rounded-3xl bg-gradient-to-br from-zinc-950 via-black to-zinc-900 p-8">
                        <div
                          className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-primary/20 blur-3xl"
                          aria-hidden
                        />
                        <div className="relative flex flex-col items-start space-y-4 sm:flex-row sm:space-x-6 sm:space-y-0">
                          <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-2xl border border-primary/30 bg-primary/10 backdrop-blur-sm">
                            {card.icon}
                          </div>
                          <div>
                            <h3 className="mb-2 text-2xl font-black tracking-tight text-white">{card.title}</h3>
                            <p className="leading-relaxed text-white/70">{card.description}</p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      // CTA card — heavier banner treatment: clapperboard-style
                      // ribbon stripe on top + larger primary glow + the apply
                      // button. Mirrors the casting banner on /explore?q=casting.
                      <div className="relative flex h-full flex-col justify-center overflow-hidden rounded-3xl bg-gradient-to-br from-black via-zinc-900 to-black p-8 py-16 text-center">
                        <div
                          className="pointer-events-none absolute inset-x-0 top-0 h-3"
                          style={{
                            backgroundImage:
                              'repeating-linear-gradient(-30deg, #ffffff 0 16px, #000000 16px 32px)',
                          }}
                          aria-hidden
                        />
                        <div
                          className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-primary/30 blur-3xl"
                          aria-hidden
                        />
                        <div className="relative">
                          <h3 className="mb-4 text-3xl font-black tracking-tight text-white">
                            {t('benefits.cta.title_part1')}
                            <span className="text-primary">{t('benefits.cta.title_highlight')}</span>
                            {t('benefits.cta.title_part2')}
                          </h3>
                          <p className="mx-auto mb-8 max-w-lg text-lg text-white/70">{t('benefits.cta.subtitle')}</p>
                          <button
                            onClick={onApplyClick}
                            className="self-center rounded-full bg-primary px-8 py-3 font-black text-white shadow-lg shadow-primary/40 transition-all duration-300 hover:scale-105 hover:bg-pink-400"
                          >
                            {t('benefits.cta.button')}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Mobile — same banner-style cards as the desktop scroll-stack
            so the visual language stays consistent at narrow widths. */}
        <div className="space-y-6 md:hidden">
          {benefitCards.map((card) => (
            <div
              key={card.id}
              className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-zinc-950 via-black to-zinc-900 p-6 shadow-2xl shadow-black/40"
            >
              <div
                className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-primary/20 blur-3xl"
                aria-hidden
              />
              <div className="relative flex flex-col items-start space-y-4 sm:flex-row sm:space-x-6 sm:space-y-0">
                <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl border border-primary/30 bg-primary/10 backdrop-blur-sm">
                  {card.icon}
                </div>
                <div>
                  <h3 className="mb-2 text-xl font-black tracking-tight text-white">{card.title}</h3>
                  <p className="text-sm leading-relaxed text-white/70">{card.description}</p>
                </div>
              </div>
            </div>
          ))}
          <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-black via-zinc-900 to-black p-8 py-12 text-center shadow-2xl shadow-black/40">
            <div
              className="pointer-events-none absolute inset-x-0 top-0 h-3"
              style={{
                backgroundImage:
                  'repeating-linear-gradient(-30deg, #ffffff 0 12px, #000000 12px 24px)',
              }}
              aria-hidden
            />
            <div
              className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-primary/30 blur-3xl"
              aria-hidden
            />
            <div className="relative">
              <h3 className="mb-4 text-2xl font-black tracking-tight text-white">
                {t('benefits.cta.title_part1')}
                <span className="text-primary">{t('benefits.cta.title_highlight')}</span>
                {t('benefits.cta.title_part2')}
              </h3>
              <p className="text-md mx-auto mb-6 max-w-lg text-white/70">{t('benefits.cta.subtitle')}</p>
              <button
                onClick={onApplyClick}
                className="self-center rounded-full bg-primary px-8 py-3 font-black text-white shadow-lg shadow-primary/40 transition-all duration-300 hover:scale-105 hover:bg-pink-400"
              >
                {t('benefits.cta.button')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
