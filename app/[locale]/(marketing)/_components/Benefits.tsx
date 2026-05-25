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

  // Each card gets its own banner theme matching one of the platform's
  // section banners (Luxury / Casting / Live Cams). Distinct gradients +
  // glow colors so the scroll-stack feels like a tour through the
  // platform's section palettes instead of a uniform card stack.
  const benefitCards = useMemo(
    () => [
      {
        id: 'income',
        theme: 'luxury' as const,
        icon: <DollarSignIcon className="w-8 h-8 text-amber-300" />,
        title: t('benefits.income.title'),
        description: t('benefits.income.description'),
      },
      {
        id: 'time',
        theme: 'casting' as const,
        icon: <ClockIcon className="w-8 h-8 text-white" />,
        title: t('benefits.time.title'),
        description: t('benefits.time.description'),
      },
      {
        id: 'growth',
        theme: 'livecams' as const,
        icon: <TrendingUpIcon className="w-8 h-8 text-red-300" />,
        title: t('benefits.growth.title'),
        description: t('benefits.growth.description'),
      },
      {
        id: 'security',
        theme: 'luxury' as const,
        icon: <CheckIcon className="w-8 h-8 text-amber-300" strokeWidth="2" />,
        title: t('benefits.security.title'),
        description: t('benefits.security.description'),
      },
    ],
    [t],
  );

  // Tailwind class bundles per theme. Each maps to one of the section
  // banner palettes on /explore. Background gradient + ambient glow
  // colors + icon tile border picked to match its banner.
  const CARD_THEMES = {
    luxury: {
      bg: 'bg-gradient-to-br from-black via-zinc-900 to-purple-950/60',
      border: 'border-amber-300/20',
      iconBg: 'bg-amber-300/10',
      iconBorder: 'border-amber-300/30',
      glow1: 'bg-amber-300/20',
      glow2: 'bg-purple-500/20',
    },
    casting: {
      bg: 'bg-gradient-to-br from-zinc-950 via-black to-zinc-900',
      border: 'border-white/10',
      iconBg: 'bg-white/10',
      iconBorder: 'border-white/30',
      glow1: 'bg-white/10',
      glow2: 'bg-primary/15',
    },
    livecams: {
      bg: 'bg-gradient-to-br from-black via-red-950/60 to-black',
      border: 'border-red-500/20',
      iconBg: 'bg-red-500/15',
      iconBorder: 'border-red-500/30',
      glow1: 'bg-red-500/25',
      glow2: 'bg-red-500/15',
    },
  } as const;

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
                const theme =
                  'icon' in card ? CARD_THEMES[card.theme] : null;
                return (
                  <div
                    key={card.id}
                    className={`w-full max-w-3xl overflow-hidden rounded-3xl border shadow-2xl shadow-black/40 transition-all duration-500 ease-out ${
                      theme ? theme.border : 'border-white/10'
                    }`}
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
                    {'icon' in card && theme ? (
                      // Themed benefit card — luxury / casting / live cams
                      // gradient matching the corresponding section banner
                      // on /explore.
                      <div className={`relative h-full overflow-hidden rounded-3xl ${theme.bg} p-8`}>
                        <div
                          className={`pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full ${theme.glow1} blur-3xl`}
                          aria-hidden
                        />
                        <div
                          className={`pointer-events-none absolute -bottom-24 -left-24 h-72 w-72 rounded-full ${theme.glow2} blur-3xl`}
                          aria-hidden
                        />
                        <div className="relative flex flex-col items-start space-y-4 sm:flex-row sm:space-x-6 sm:space-y-0">
                          <div
                            className={`flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-2xl border ${theme.iconBorder} ${theme.iconBg} backdrop-blur-sm`}
                          >
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

        {/* Mobile — same themed cards as the desktop scroll-stack so
            the visual language stays consistent at narrow widths. */}
        <div className="space-y-6 md:hidden">
          {benefitCards.map((card) => {
            const theme = CARD_THEMES[card.theme];
            return (
              <div
                key={card.id}
                className={`relative overflow-hidden rounded-3xl border shadow-2xl shadow-black/40 ${theme.border} ${theme.bg} p-6`}
              >
                <div
                  className={`pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full ${theme.glow1} blur-3xl`}
                  aria-hidden
                />
                <div
                  className={`pointer-events-none absolute -bottom-16 -left-16 h-48 w-48 rounded-full ${theme.glow2} blur-3xl`}
                  aria-hidden
                />
                <div className="relative flex flex-col items-start space-y-4 sm:flex-row sm:space-x-6 sm:space-y-0">
                  <div
                    className={`flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl border ${theme.iconBorder} ${theme.iconBg} backdrop-blur-sm`}
                  >
                    {card.icon}
                  </div>
                  <div>
                    <h3 className="mb-2 text-xl font-black tracking-tight text-white">{card.title}</h3>
                    <p className="text-sm leading-relaxed text-white/70">{card.description}</p>
                  </div>
                </div>
              </div>
            );
          })}
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
