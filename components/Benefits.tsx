
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { DollarSignIcon, ClockIcon, TrendingUpIcon, CheckIcon } from './IconComponents';
import { useLanguage } from '../hooks/useLanguage';
import TextReveal from './TextReveal';

interface BenefitsProps {
    onApplyClick: () => void;
    sectionRef: React.RefObject<HTMLElement>;
}

const Benefits: React.FC<BenefitsProps> = ({ onApplyClick, sectionRef }) => {
    const { t } = useLanguage();

    const benefitCards = useMemo(() => [
        {
            id: 'income',
            icon: <DollarSignIcon className="w-8 h-8 text-primary" />,
            title: t('benefits.income.title'),
            description: t('benefits.income.description')
        },
        {
            id: 'time',
            icon: <ClockIcon className="w-8 h-8 text-primary" />,
            title: t('benefits.time.title'),
            description: t('benefits.time.description')
        },
        {
            id: 'growth',
            icon: <TrendingUpIcon className="w-8 h-8 text-primary" />,
            title: t('benefits.growth.title'),
            description: t('benefits.growth.description')
        },
        {
            id: 'security',
            icon: <CheckIcon className="w-8 h-8 text-primary" strokeWidth="2" />,
            title: t('benefits.security.title'),
            description: t('benefits.security.description')
        },
    ], [t]);
    
    const allCards = useMemo(() => [...benefitCards, { type: 'cta' as const, id: 'cta' }], [benefitCards]);
    const numCards = allCards.length;
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const [scrollProgress, setScrollProgress] = useState(0);

    useEffect(() => {
        const handleScroll = () => {
            const container = scrollContainerRef.current;
            if (!container) return;

            const { top, height } = container.getBoundingClientRect();
            const viewportHeight = window.innerHeight;
            
            const progress = (viewportHeight * 0.75 - top) / (height - viewportHeight * 0.5);
            const clampedProgress = Math.max(0, Math.min(1, progress));
            
            setScrollProgress(clampedProgress);
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        handleScroll(); // initial call

        return () => {
            window.removeEventListener('scroll', handleScroll);
        };
    }, []);

    return (
        <section ref={sectionRef} id="benefits" className="bg-background transition-colors duration-700 py-20 overflow-x-clip">
            <div className="container mx-auto px-6">
                <div className="text-center mb-12 max-w-3xl mx-auto">
                    <div className="relative inline-block mb-4">
                        <h2 className="text-4xl font-bold text-text-main">{t('benefits.title')}</h2>
                        <svg className="absolute -top-2 -left-4 w-[calc(100%+2rem)] h-[calc(100%+1rem)]" viewBox="0 0 100 30" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M5.33124 16.6359C14.3981 7.28475 32.1476 2.82229 50.1517 5.16795C68.1558 7.51361 85.007 16.7424 94.2125 24.3333" stroke="var(--color-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="animate-scribble" style={{ strokeDasharray: 100, strokeDashoffset: 100 }} />
                        </svg>
                    </div>
                    <TextReveal as="p" className="text-lg text-text-secondary">
                        {t('benefits.subtitle')}
                    </TextReveal>
                </div>

                <div ref={scrollContainerRef} className="relative hidden md:block" style={{ height: `${(numCards) * 50}vh` }}>
                    <div className="sticky top-0 h-screen flex items-center justify-center">
                         <div className="relative w-full max-w-3xl" style={{ height: '320px' }}>
                            {allCards.map((card, index) => {
                                const totalProgress = scrollProgress * numCards;
                                const cardLocalProgress = Math.max(0, Math.min(1, totalProgress - index));

                                const stackPosition = numCards - 1 - index;
                                
                                const finalY = stackPosition * 1.0; // Final vertical offset in rem
                                const finalScale = 1 - stackPosition * 0.03;
                                
                                const initialY = 30; // Start closer to the screen
                                
                                const translateY = initialY + (finalY - initialY) * cardLocalProgress;
                                const scale = 1 + (finalScale - 1) * cardLocalProgress;
                                const opacity = cardLocalProgress > 0 ? 1 : 0;
                                
                                return (
                                    <div
                                        key={card.id}
                                        className="w-full max-w-3xl rounded-3xl border border-border-color shadow-2xl transition-opacity duration-300"
                                        style={{
                                            position: 'absolute',
                                            top: '0',
                                            left: '0',
                                            right: '0',
                                            zIndex: index,
                                            opacity: opacity,
                                            transform: `translateY(${translateY}rem) scale(${scale})`,
                                            willChange: 'transform, opacity',
                                        }}
                                    >
                                        {'icon' in card ? (
                                            <div className="p-8 rounded-3xl bg-card h-full">
                                                <div className="flex flex-col sm:flex-row items-start space-y-4 sm:space-y-0 sm:space-x-6">
                                                    <div className="flex-shrink-0 w-16 h-16 bg-secondary border border-border-color rounded-xl flex items-center justify-center">
                                                        {card.icon}
                                                    </div>
                                                    <div>
                                                        <h3 className="text-2xl font-bold text-text-main mb-2">{card.title}</h3>
                                                        <p className="text-text-secondary leading-relaxed">{card.description}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="text-center p-8 py-16 rounded-3xl bg-secondary h-full flex flex-col justify-center">
                                                <h3 className="text-3xl font-bold text-text-main mb-4">
                                                  {t('benefits.cta.title_part1')}
                                                  <span className="text-primary">{t('benefits.cta.title_highlight')}</span>
                                                  {t('benefits.cta.title_part2')}
                                                </h3>
                                                <p className="text-lg text-text-secondary mb-8 max-w-lg mx-auto">
                                                    {t('benefits.cta.subtitle')}
                                                </p>
                                                <button
                                                    onClick={onApplyClick}
                                                    className="bg-primary hover:bg-pink-400 text-white font-bold py-3 px-8 rounded-full transition-all duration-300 transform hover:scale-105 self-center"
                                                >
                                                    {t('benefits.cta.button')}
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Mobile view */}
                <div className="space-y-8 md:hidden">
                    {benefitCards.map(card => (
                         <div key={card.id} className="p-6 rounded-3xl bg-card border border-border-color shadow-lg">
                            <div className="flex flex-col sm:flex-row items-start space-y-4 sm:space-y-0 sm:space-x-6">
                                <div className="flex-shrink-0 w-14 h-14 bg-secondary border border-border-color rounded-xl flex items-center justify-center">
                                    {card.icon}
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-text-main mb-2">{card.title}</h3>
                                    <p className="text-text-secondary leading-relaxed text-sm">{card.description}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                    <div className="text-center p-8 py-12 rounded-3xl bg-secondary border border-border-color shadow-lg">
                        <h3 className="text-2xl font-bold text-text-main mb-4">
                          {t('benefits.cta.title_part1')}
                          <span className="text-primary">{t('benefits.cta.title_highlight')}</span>
                          {t('benefits.cta.title_part2')}
                        </h3>
                        <p className="text-md text-text-secondary mb-6 max-w-lg mx-auto">
                            {t('benefits.cta.subtitle')}
                        </p>
                        <button
                            onClick={onApplyClick}
                            className="bg-primary hover:bg-pink-400 text-white font-bold py-3 px-8 rounded-full transition-all duration-300 transform hover:scale-105 self-center"
                        >
                            {t('benefits.cta.button')}
                        </button>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default Benefits;