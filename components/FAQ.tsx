
import React, { useState } from 'react';
import { FAQItem } from '../types';
import { ChevronDownIcon } from './IconComponents';
import { useLanguage } from '../hooks/useLanguage';
import TextReveal from './TextReveal';

const FaqItemComponent: React.FC<{ item: FAQItem; isOpen: boolean; onClick: () => void; }> = ({ item, isOpen, onClick }) => {
    return (
        <div className="border-b border-border-color">
            <button
                onClick={onClick}
                className="w-full flex justify-between items-center text-left py-6"
            >
                <span className="text-lg font-medium text-text-main">{item.question}</span>
                <ChevronDownIcon className={`w-6 h-6 text-primary transform transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            <div className={`overflow-hidden transition-all duration-500 ease-in-out ${isOpen ? 'max-h-96' : 'max-h-0'}`}>
                 <div className="pb-6 text-text-secondary">
                    {item.answer}
                 </div>
            </div>
        </div>
    );
};


interface FAQProps {
    faqItems: FAQItem[];
}

const FAQ: React.FC<FAQProps> = ({ faqItems }) => {
    const { t } = useLanguage();
    const [openIndex, setOpenIndex] = useState<number | null>(null);

    const handleClick = (index: number) => {
        setOpenIndex(openIndex === index ? null : index);
    };

    return (
        <section id="faq" className="py-20 bg-secondary transition-colors duration-700">
            <div className="container mx-auto px-6">
                <div className="text-center mb-12">
                    <TextReveal as="h2" className="text-4xl font-bold text-text-main mb-4">{t('faq.title')}</TextReveal>
                    <TextReveal as="p" className="max-w-2xl mx-auto text-lg text-text-secondary">
                        {t('faq.subtitle')}
                    </TextReveal>
                </div>
                <div className="max-w-3xl mx-auto">
                    {faqItems.map((item, index) => (
                        <FaqItemComponent
                            key={index}
                            item={item}
                            isOpen={openIndex === index}
                            onClick={() => handleClick(index)}
                        />
                    ))}
                </div>
            </div>
        </section>
    );
};

export default FAQ;