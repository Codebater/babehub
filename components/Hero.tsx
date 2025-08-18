
import React, { useState, useEffect } from 'react';
import { TwitterIcon, MoreHorizontalIcon, StarIcon, TrendingUpIcon, CheckIcon } from './IconComponents';
import LogoCloudMarquee from './LogoCloudMarquee';
import { useLanguage } from '../hooks/useLanguage';
import TextReveal from './TextReveal';

interface HeroProps {
    onApplyClick: () => void;
}

const Card: React.FC<{children: React.ReactNode, delay?: string}> = ({children, delay = '0ms'}) => {
    const [style, setStyle] = useState<React.CSSProperties>({
        transform: 'perspective(1000px) rotateX(5deg) scale3d(1, 1, 1)'
    });

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        const card = e.currentTarget;
        const { left, top, width, height } = card.getBoundingClientRect();
        const x = e.clientX - left;
        const y = e.clientY - top;

        const rotateX = -1 * ((y - height / 2) / (height / 2)) * 8; // Max 8deg rotation
        const rotateY = ((x - width / 2) / (width / 2)) * 8; // Max 8deg rotation
        
        setStyle({
            transform: `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.05, 1.05, 1.05)`,
            transition: 'transform 0.1s ease-out'
        });
    };

    const handleMouseLeave = () => {
        setStyle({
            transform: 'perspective(1000px) rotateX(5deg) scale3d(1, 1, 1)',
            transition: 'transform 0.5s cubic-bezier(0.23, 1, 0.32, 1)'
        });
    };

    // The outer div handles positioning, static transforms, and mouse events.
    return (
        <div
            className="w-full h-full animate-fade-in-up"
            style={{ animationDelay: delay }}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
        >
            {/* The inner div handles the interactive tilt and the card styling. */}
            <div
                style={{ ...style, willChange: 'transform' }}
                className="w-full h-full bg-card/30 lg:bg-card/80 border border-border-color/20 lg:border-border-color/50 rounded-2xl shadow-xl backdrop-blur-sm p-3 sm:p-4 transition-colors duration-700"
            >
                {children}
            </div>
        </div>
    );
};

const Hero: React.FC<HeroProps> = ({ onApplyClick }) => {
    const { t } = useLanguage();
    const words = [t('hero.word.fans'), t('hero.word.time'), t('hero.word.money')];
    const [currentWordIndex, setCurrentWordIndex] = useState(0);

    useEffect(() => {
        const intervalId = setInterval(() => {
            setCurrentWordIndex(prevIndex => (prevIndex + 1) % words.length);
        }, 2500);

        return () => clearInterval(intervalId);
    }, [words]);

    return (
        <section id="hero" className="relative flex items-center bg-background text-white overflow-hidden pt-0 pb-48 lg:pb-32 transition-colors duration-700">
            <div className="container mx-auto px-6 relative z-10 flex flex-col items-center">
                
                {/* Combined container for text and UI elements */}
                <div className="relative w-full h-[700px] md:h-[650px] lg:h-[600px] flex items-center justify-center scale-90 sm:scale-100">

                    {/* Connecting Lines SVG - Repositioned */}
                    <svg className="absolute w-full h-full text-primary/40 z-0 hidden lg:block" fill="none" viewBox="0 0 600 600" xmlns="http://www.w3.org/2000/svg">
                        <defs>
                            <marker id="arrowhead" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="4" markerHeight="4" orient="auto-start-reverse">
                                <path d="M 0 0 L 10 5 L 0 10 z" fill="currentColor" />
                            </marker>
                        </defs>
                        {/* Tweet Impressions -> Messages */}
                        <path d="M480 130 Q 300 150 170 200" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4 4" markerEnd="url(#arrowhead)"/>
                        {/* Messages -> Ranking */}
                        <path d="M150 250 Q 150 350 180 480" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4 4" markerEnd="url(#arrowhead)"/>
                        {/* Ranking -> Payout */}
                        <path d="M220 520 Q 350 530 450 510" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4 4" markerEnd="url(#arrowhead)"/>
                    </svg>

                    {/* Tweet Impressions Card - Repositioned */}
                    <div className="absolute top-16 -right-2 w-44 transform rotate-3 lg:top-8 lg:right-12 lg:w-56">
                        <Card delay="0.4s">
                            <div className="flex justify-between items-center mb-1 sm:mb-2">
                                <div className="flex items-center space-x-2">
                                    <div className="w-7 h-7 flex items-center justify-center rounded-full bg-blue-400/20"><TwitterIcon className="w-4 h-4 text-blue-400" fill="currentColor" /></div>
                                    <span className="text-xs sm:text-sm font-medium text-text-secondary">{t('hero.card.impressions')}</span>
                                </div>
                                <MoreHorizontalIcon className="w-4 h-4 sm:w-5 sm:h-5 text-text-secondary" />
                            </div>
                            <svg className="w-full h-10 sm:h-12 lg:h-16" viewBox="0 0 100 40" preserveAspectRatio="none"><path d="M0 30 C 20 10, 40 10, 60 25 S 80 30, 100 20" stroke="#F472B6" strokeWidth="2" fill="none" strokeLinecap="round" /></svg>
                            <div className="flex items-baseline space-x-2 mt-1"><p className="text-xl sm:text-2xl lg:text-3xl font-bold text-text-main">58.5M</p><p className="text-xs font-semibold text-green-400">+127.9%</p></div>
                        </Card>
                    </div>

                    {/* Messages Card - Repositioned */}
                    <div className="absolute top-48 -left-4 w-48 transform -rotate-2 lg:top-36 lg:left-4 lg:w-52">
                        <Card delay="0.6s">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-xs sm:text-sm font-medium text-text-secondary">{t('hero.card.messages')}</p>
                                    <p className="text-lg sm:text-xl lg:text-2xl font-bold text-text-main mt-1">$87,637</p>
                                </div>
                                <p className="text-[10px] sm:text-xs font-bold text-green-400 bg-green-500/10 px-1.5 sm:px-2 py-1 rounded-full">7333%</p>
                            </div>
                            <svg className="w-full h-5 sm:h-6 lg:h-8 mt-1 sm:mt-2" viewBox="0 0 100 20" preserveAspectRatio="none"><path d="M0 15 L 10 5 L 20 10 L 30 2 L 40 12 L 50 8 L 60 18 L 70 10 L 80 15 L 90 5 L 100 10" stroke="#4ADE80" strokeWidth="1.5" fill="none" strokeLinecap="round" /></svg>
                        </Card>
                    </div>
                    
                    {/* Hero Text - Centered */}
                    <div className="relative text-center animate-fade-in-down z-30 max-w-xl">
                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-text-main mb-6 tracking-tighter leading-tight">
                            {t('hero.title.more')}{' '}
                            <span className="inline-grid h-[1.25em] align-middle overflow-hidden">
                                <span className="col-start-1 row-start-1 invisible">
                                    {t('hero.word.money')}
                                </span>
                                <span
                                    className="col-start-1 row-start-1 transition-transform duration-700 ease-in-out text-primary"
                                    style={{ transform: `translateY(-${currentWordIndex * 1.25}em)` }}
                                >
                                    {words.map((word) => (
                                        <span key={word} className="block h-[1.25em]">
                                            {word}
                                        </span>
                                    ))}
                                </span>
                            </span>
                            <br />
                            {t('hero.title.withBest')}
                            <br />
                            <span className="relative inline-block whitespace-nowrap">
                                <span className="relative z-10">{t('hero.title.modelAgency')}</span>
                                <svg className="absolute -bottom-2.5 left-0 w-full h-auto text-primary z-0" viewBox="0 0 180 12" fill="none" preserveAspectRatio="none">
                                    <path d="M1 8C40 2, 140 2, 179 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"></path>
                                    <path d="M1 11C40 5, 140 5, 179 11" stroke="currentColor" strokeWidth="2" strokeLinecap="round"></path>
                                </svg>
                            </span>
                        </h1>
                        <TextReveal as="p" className="max-w-md mx-auto text-base md:text-lg text-text-secondary mb-8">
                            {t('hero.subtitle')}
                        </TextReveal>
                        <button 
                            onClick={onApplyClick}
                            className="bg-gradient-to-r from-primary to-red-500 hover:from-pink-500 hover:to-red-600 text-white font-bold py-4 px-10 rounded-full text-lg transition-all duration-300 transform hover:scale-105 shadow-lg shadow-primary/40">
                            {t('hero.cta')}
                        </button>
                    </div>

                    {/* Ranking/Balance Card - Repositioned */}
                    <div className="absolute bottom-12 -left-2 w-52 transform -rotate-3 lg:bottom-12 lg:left-20 lg:w-60">
                        <Card delay="0.8s">
                            <div className="flex items-center space-x-2 mb-2 sm:mb-3">
                                <StarIcon className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-400" />
                                <p className="text-[10px] sm:text-xs font-bold text-text-main tracking-wider">
                                    {t('hero.card.ranking_part1')}
                                    <span className="text-primary">{t('hero.card.ranking_highlight')}</span>
                                    {t('hero.card.ranking_part2')}
                                </p>
                            </div>
                            <p className="text-xs sm:text-sm text-text-secondary">{t('hero.card.balance')}</p>
                            <div className="flex justify-between items-end mt-1">
                                <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-text-main">$13,400</p>
                                <button className="bg-secondary p-1.5 sm:p-2 rounded-lg border border-border-color hover:border-primary transition-colors"><TrendingUpIcon className="w-4 h-4 sm:w-5 sm:h-5 text-text-secondary" /></button>
                            </div>
                        </Card>
                    </div>

                    {/* Payout Cleared Card - Repositioned */}
                    <div className="absolute bottom-12 -right-2 w-32 h-20 bg-primary rounded-2xl shadow-xl flex flex-col items-center justify-center space-y-1 transform rotate-6 lg:bottom-24 lg:right-16 lg:w-40 lg:h-24 animate-fade-in-up transition-colors duration-700" style={{animationDelay: '1s'}}>
                        <div className="w-6 h-6 lg:w-8 lg:h-8 bg-white/20 rounded-full flex items-center justify-center"><CheckIcon className="w-3 h-3 lg:w-5 lg:h-5 text-white" /></div>
                        <p className="font-bold text-white text-sm lg:text-lg">{t('hero.card.payout')}</p>
                    </div>
                </div>
            </div>
            
            <div className="absolute bottom-0 left-0 right-0 w-full z-20">
                <LogoCloudMarquee />
            </div>
        </section>
    );
};

export default Hero;
