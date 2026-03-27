import React, { useState, useRef, useEffect } from 'react';
import { FAQItem } from './types';
import Header from './components/Header';
import Hero from './components/Hero';
import LogoCloudMarquee from './components/LogoCloudMarquee';
import MarketingDashboard from './components/MarketingDashboard';
import Benefits from './components/Benefits';
import HowItWorks from './components/HowItWorks';
import FAQ from './components/FAQ';
import Apply from './components/Apply';
import Footer from './components/Footer';
import SurveyModal from './components/SurveyModal';
import { useLanguage } from './hooks/useLanguage';
import Preloader from './components/Preloader';

const getFaqData = (t: (key: string) => string): FAQItem[] => [
    { question: t('faq.cost.question'), answer: t('faq.cost.answer') },
    { question: t('faq.control.question'), answer: t('faq.control.answer') },
    { question: t('faq.privacy.question'), answer: t('faq.privacy.answer') },
    { question: t('faq.time.question'), answer: t('faq.time.answer') },
    { question: t('faq.new.question'), answer: t('faq.new.answer') },
];


const App: React.FC = () => {
    const [isLoading, setIsLoading] = useState(true);
    const [isSurveyModalOpen, setIsSurveyModalOpen] = useState(false);
    const { t } = useLanguage();
    const benefitsRef = useRef<HTMLElement>(null);
    
    useEffect(() => {
        // Simulate loading time to show the preloader animation
        const timer = setTimeout(() => {
            setIsLoading(false);
        }, 2000);

        return () => clearTimeout(timer);
    }, []);
    
    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    document.documentElement.classList.add('theme-pink');
                } else {
                    document.documentElement.classList.remove('theme-pink');
                }
            },
            {
                rootMargin: '-50% 0px -50% 0px',
                threshold: 0
            }
        );

        const currentRef = benefitsRef.current;
        if (currentRef) {
            observer.observe(currentRef);
        }

        return () => {
            if (currentRef) {
                observer.unobserve(currentRef);
            }
        };
    }, []);

    const handleApplyClick = () => {
        setIsSurveyModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsSurveyModalOpen(false);
    }
    
    const faqData = getFaqData(t);
    
    return (
        <div className="bg-background font-sans transition-colors duration-700">
            <Preloader isLoading={isLoading} />

            <div className={`transition-opacity duration-1000 ${isLoading ? 'opacity-0' : 'opacity-100'}`}>
                <Header onApplyClick={handleApplyClick} />
                <main>
                    <Hero onApplyClick={handleApplyClick}/>
                    <Benefits onApplyClick={handleApplyClick} sectionRef={benefitsRef} />
                    <MarketingDashboard onApplyClick={handleApplyClick} />
                    <LogoCloudMarquee />
                    <HowItWorks />
                    <FAQ faqItems={faqData} />
                    <Apply onApplyClick={handleApplyClick} />
                </main>
                <Footer />
            </div>
            
            <SurveyModal isOpen={isSurveyModalOpen} onClose={handleCloseModal} />
        </div>
    );
};

export default App;