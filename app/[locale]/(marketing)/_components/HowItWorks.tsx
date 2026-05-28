'use client';

import { useState, useEffect, useRef, useMemo, useLayoutEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import TextReveal from './TextReveal';

type LineMetrics = { top: number; height: number };

export default function HowItWorks({ illustrationUrl }: { illustrationUrl?: string }) {
  const t = useTranslations();

  const steps = useMemo(
    () => [
      { number: '01', title: t('howItWorks.step1.title'), description: t('howItWorks.step1.description') },
      { number: '02', title: t('howItWorks.step2.title'), description: t('howItWorks.step2.description') },
      { number: '03', title: t('howItWorks.step3.title'), description: t('howItWorks.step3.description') },
      { number: '04', title: t('howItWorks.step4.title'), description: t('howItWorks.step4.description') },
    ],
    [t],
  );

  const [activeStepIndex, setActiveStepIndex] = useState(-1);
  const [lineProgress, setLineProgress] = useState(0);
  const [lineMetrics, setLineMetrics] = useState<LineMetrics>({ top: 0, height: 0 });

  const stepRefs = useRef<(HTMLDivElement | null)[]>([]);
  const markerRefs = useRef<(HTMLDivElement | null)[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    stepRefs.current = stepRefs.current.slice(0, steps.length);
    markerRefs.current = markerRefs.current.slice(0, steps.length);
  }, [steps]);

  const updateLineMetrics = useCallback(() => {
    const container = containerRef.current;
    const first = markerRefs.current[0];
    const last = markerRefs.current[steps.length - 1];
    if (!container || !first || !last) return;
    const cr = container.getBoundingClientRect();
    const fr = first.getBoundingClientRect();
    const lr = last.getBoundingClientRect();
    const top = fr.top + fr.height / 2 - cr.top;
    const lastCenter = lr.top + lr.height / 2 - cr.top;
    const height = Math.max(0, lastCenter - top);
    setLineMetrics({ top, height });
  }, [steps.length]);

  useLayoutEffect(() => {
    updateLineMetrics();
    const ro = new ResizeObserver(() => updateLineMetrics());
    if (containerRef.current) ro.observe(containerRef.current);
    markerRefs.current.forEach((el) => el && ro.observe(el));
    window.addEventListener('resize', updateLineMetrics);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', updateLineMetrics);
    };
  }, [steps, updateLineMetrics]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const i = stepRefs.current.indexOf(entry.target as HTMLDivElement);
            if (i !== -1) setActiveStepIndex((prev) => Math.max(prev, i));
          }
        });
      },
      { rootMargin: '0px 0px -40% 0px', threshold: 0 },
    );
    stepRefs.current.forEach((ref) => ref && observer.observe(ref));
    return () => {
      stepRefs.current.forEach((ref) => ref && observer.unobserve(ref));
    };
  }, [steps]);

  useEffect(() => {
    const updateProgress = () => {
      const container = containerRef.current;
      if (!container) return;
      const { height } = container.getBoundingClientRect();
      const scrollY = window.scrollY;
      const viewportHeight = window.innerHeight;
      const pct = (scrollY - (container.offsetTop - viewportHeight * 0.8)) / (height - viewportHeight * 0.2);
      setLineProgress(Math.max(0, Math.min(1, pct)));
    };
    window.addEventListener('scroll', updateProgress, { passive: true });
    window.addEventListener('resize', updateProgress);
    const id = setTimeout(updateProgress, 100);
    return () => {
      window.removeEventListener('scroll', updateProgress);
      window.removeEventListener('resize', updateProgress);
      clearTimeout(id);
    };
  }, []);

  const stepsColumn = (
    <div ref={containerRef} className="relative">
      <div
        className="pointer-events-none absolute left-5 z-0 w-px -translate-x-1/2 bg-border-color"
        style={{ top: lineMetrics.top, height: lineMetrics.height }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute left-5 z-0 w-0.5 origin-top bg-primary will-change-transform"
        style={{
          top: lineMetrics.top,
          height: lineMetrics.height,
          transform: `translateX(-50%) scaleY(${lineProgress})`,
          transformOrigin: 'top center',
        }}
        aria-hidden
      />
      <div className="relative z-10 flex flex-col">
        {steps.map((step, i) => {
          const isActive = i <= activeStepIndex;
          return (
            <div key={i} className="flex gap-5 pb-16 last:pb-0 md:gap-6">
              <div className="flex w-10 shrink-0 justify-center">
                <div
                  ref={(el) => {
                    markerRefs.current[i] = el;
                  }}
                  className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all duration-500 ${
                    isActive
                      ? 'scale-110 border-primary bg-primary text-white shadow-lg shadow-primary/40'
                      : 'scale-100 border-border-color bg-secondary text-primary'
                  }`}
                >
                  <span className="font-bold">{step.number}</span>
                </div>
              </div>
              <div
                ref={(el) => {
                  stepRefs.current[i] = el;
                }}
                className={`min-w-0 flex-1 transition-all duration-700 ${
                  isActive ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-50'
                }`}
              >
                <h3 className="mb-2 text-2xl font-bold text-text-main">{step.title}</h3>
                <p className="text-text-secondary">{step.description}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <section id="how-it-works" className="py-20 bg-secondary transition-colors duration-700">
      <div className="container mx-auto px-6">
        <div className="mb-16 text-center">
          <TextReveal as="h2" className="mb-4 text-4xl font-bold text-text-main">
            {t('howItWorks.title')}
          </TextReveal>
          <TextReveal as="p" className="mx-auto max-w-2xl text-lg text-text-secondary">
            {t('howItWorks.subtitle')}
          </TextReveal>
        </div>

        {illustrationUrl ? (
          /* Two-column layout when an illustration is set */
          <div className="mx-auto flex max-w-5xl flex-col items-center gap-12 lg:flex-row lg:items-start lg:gap-16">
            <div className="w-full lg:flex-1">{stepsColumn}</div>
            <div className="w-full lg:flex-1 flex items-center justify-center">
              <div className="overflow-hidden rounded-3xl border border-border-color/30 shadow-2xl shadow-primary/10">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={illustrationUrl}
                  alt="How it works illustration"
                  className="w-full object-cover"
                />
              </div>
            </div>
          </div>
        ) : (
          /* Single-column centered layout — original behaviour */
          <div className="mx-auto max-w-2xl">{stepsColumn}</div>
        )}
      </div>
    </section>
  );
}
