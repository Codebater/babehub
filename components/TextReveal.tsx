import React, { useRef, useEffect, useState, useMemo } from 'react';

interface TextRevealProps {
  children: string;
  className?: string;
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'p' | 'span';
}

const TextReveal: React.FC<TextRevealProps> = ({ children, className, as = 'p' }) => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(entry.target);
        }
      },
      {
        rootMargin: '0px 0px -50px 0px',
        threshold: 0.1,
      }
    );

    const currentRef = ref.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, []);

  const Tag = as;
  const words = useMemo(() => children.split(' '), [children]);

  return (
    <Tag ref={ref as any} className={className} aria-label={children}>
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
