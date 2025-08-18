import React, { useState, useRef, useEffect } from 'react';
import { Service, Testimonial, FAQItem } from './types';
import Header from './components/Header';
import Hero from './components/Hero';
import Services from './components/Services';
import Benefits from './components/Benefits';
import HowItWorks from './components/HowItWorks';
import BoldLogoMarquee from './components/BoldLogoMarquee';
import Testimonials from './components/Testimonials';
import FAQ from './components/FAQ';
import Apply from './components/Apply';
import Footer from './components/Footer';
import SurveyModal from './components/SurveyModal';
import { useLanguage } from './hooks/useLanguage';
import Preloader from './components/Preloader';

// Icons for services
const AccountManagementIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-full h-full"><path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0 0 12 15.75a7.488 7.488 0 0 0-5.982 2.975m11.963 0a9 9 0 1 0-11.963 0m11.963 0A8.966 8.966 0 0 1 12 21a8.966 8.966 0 0 1-5.982-2.275M15 9.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" /></svg>;
const MarketingIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-full h-full"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6a7.5 7.5 0 1 0 7.5 7.5h-7.5V6Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5H21A7.5 7.5 0 0 0 13.5 3v7.5Z" /></svg>;
const ChattingIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-full h-full"><path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z" /></svg>;
const ContentStrategyIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-full h-full"><path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" /></svg>;
const SecurityIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-full h-full"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.286Z" /></svg>;
const AnalyticsIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-full h-full"><path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" /></svg>;
import { LinkIcon } from './components/IconComponents';

const getServicesData = (t: (key: string) => string): Service[] => [
    { icon: <AccountManagementIcon/>, title: t('services.management.title'), description: t('services.management.description') },
    { icon: <MarketingIcon/>, title: t('services.marketing.title'), description: t('services.marketing.description') },
    { icon: <ChattingIcon/>, title: t('services.chatting.title'), description: t('services.chatting.description') },
    { icon: <ContentStrategyIcon/>, title: t('services.strategy.title'), description: t('services.strategy.description') },
    { icon: <SecurityIcon/>, title: t('services.security.title'), description: t('services.security.description') },
    { icon: <AnalyticsIcon/>, title: t('services.analytics.title'), description: t('services.analytics.description') },
    { icon: <LinkIcon/>, title: t('services.sponsors.title'), description: t('services.sponsors.description') },
];

const getTestimonialsData = (t: (key: string) => string): Testimonial[] => [
    { image: "https://api.dicebear.com/8.x/lorelei/svg?seed=Luna&backgroundColor=fce7f3,f472b6&backgroundType=gradientLinear", name: "Luna", handle: "@luna_dreams", quote: t('testimonials.luna.quote') },
    { image: "https://api.dicebear.com/8.x/lorelei/svg?seed=Scarlett&backgroundColor=fce7f3,f472b6&backgroundType=gradientLinear", name: "Scarlett", handle: "@scarlett_velvet", quote: t('testimonials.scarlett.quote') },
    { image: "https://api.dicebear.com/8.x/lorelei/svg?seed=Ava&backgroundColor=fce7f3,f472b6&backgroundType=gradientLinear", name: "Ava", handle: "@ava_celeste", quote: t('testimonials.ava.quote') },
];

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
    
    const servicesData = getServicesData(t);
    const testimonialsData = getTestimonialsData(t);
    const faqData = getFaqData(t);
    
    return (
        <div className="bg-background font-sans transition-colors duration-700">
            <Preloader isLoading={isLoading} />

            <div className={`transition-opacity duration-1000 ${isLoading ? 'opacity-0' : 'opacity-100'}`}>
                <Header onApplyClick={handleApplyClick} />
                <main>
                    <Hero onApplyClick={handleApplyClick}/>
                    <Services services={servicesData} />
                    <Benefits onApplyClick={handleApplyClick} sectionRef={benefitsRef} />
                    <HowItWorks />
                    <BoldLogoMarquee />
                    <Testimonials testimonials={testimonialsData} />
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
