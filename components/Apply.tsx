
import React from 'react';
import { useLanguage } from '../hooks/useLanguage';
import TextReveal from './TextReveal';

interface ApplyProps {
    onApplyClick: () => void;
}

const Apply: React.FC<ApplyProps> = ({ onApplyClick }) => {
    const { t } = useLanguage();
    return (
        <section id="apply" className="py-20 bg-background transition-colors duration-700">
            <div className="container mx-auto px-6 text-center">
                 <div className="max-w-3xl mx-auto bg-card border border-border-color rounded-lg p-10 shadow-lg transition-colors duration-700">
                    <h2 className="text-4xl font-bold text-text-main mb-4">
                        {t('apply.title_part1')}
                        <span className="text-primary">{t('apply.title_highlight')}</span>
                        {t('apply.title_part2')}
                    </h2>
                    <TextReveal as="p" className="text-lg text-text-secondary mb-8">
                        {t('apply.subtitle')}
                    </TextReveal>
                    <button
                        onClick={onApplyClick}
                        className="bg-primary hover:bg-pink-400 text-white font-bold py-4 px-10 rounded-full text-lg transition-all duration-300 transform hover:scale-105 shadow-lg shadow-primary/30"
                    >
                        {t('apply.button')}
                    </button>
                 </div>
            </div>
        </section>
    );
};

export default Apply;