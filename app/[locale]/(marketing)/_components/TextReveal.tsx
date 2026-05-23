'use client';

import React, { useRef, useEffect, useState, useMemo } from 'react';

interface TextRevealProps {
  children: string;
  className?: string;
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'p' | 'span';
}

/**
 * SSR-safe TextReveal. Default state is `isVisible: true` so the server-
 * rendered HTML (and the first paint after hydration) is always readable.
 * The IntersectionObserver then *re-plays* the staggered fade on scroll-in
 * for users who land at the top of the page and scroll down — pure polish.
 *
 * Earlier version started at `opacity: 0; translateY(100%)` which, combined
 * with partial-locale `MISSING_MESSAGE` empties, presented as "text is not
 * there" (Phase 0.1 diagnosis).
 */
const TextReveal: React.FC<TextRevealProps> = ({ children, className, as = 'p' }) => {
  const [isVisible, setIsVisible] = useState(true);
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Skip the re-play animation for users who prefer reduced motion.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        // Re-trigger the fade only when the element re-enters the viewport
        // after having scrolled out — this gives the polished animation on
        // upward scroll-back without ever hiding text on first load.
        if (entry.isIntersecting) setIsVisible(true);
        else setIsVisible(false);
      },
      { rootMargin: '0px 0px -50px 0px', threshold: 0.1 },
    );

    observer.observe(el);
    return () => observer.unobserve(el);
  }, []);

  const Tag = as;
  const words = useMemo(() => children.split(' '), [children]);

  return (
    <Tag ref={ref as never} className={className} aria-label={children}>
      <span className="sr-only">{children}</span>
      {words.map((word, i) => (
        <span key={i} className="inline-block overflow-hidden align-bottom" aria-hidden="true">
          <span
            className="inline-block"
            style={{
              transform: isVisible ? 'translateY(0)' : 'translateY(100%)',
              opacity: isVisible ? 1 : 0,
              transition: `transform 0.6s cubic-bezier(0.22, 1, 0.36, 1) ${i * 50}ms, opacity 0.4s ease ${i * 50}ms`,
            }}
          >
            {word}&nbsp;
          </span>
        </span>
      ))}
    </Tag>
  );
};

export default TextReveal;
