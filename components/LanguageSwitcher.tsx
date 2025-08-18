
import React from 'react';
import { useLanguage } from '../hooks/useLanguage';
import { ChevronDownIcon } from './IconComponents';

const languages: Record<'en' | 'de' | 'es' | 'fr' | 'th' | 'ja' | 'pt', string> = {
    en: 'English',
    de: 'Deutsch',
    es: 'Español',
    fr: 'Français',
    th: 'ภาษาไทย',
    ja: '日本語',
    pt: 'Português',
};

const LanguageSwitcher: React.FC = () => {
    const { language, setLanguage } = useLanguage();

    const handleLanguageChange = (lang: 'en' | 'de' | 'es' | 'fr' | 'th' | 'ja' | 'pt') => {
        setLanguage(lang);
    };

    return (
        <div className="relative group">
            <button className="flex items-center space-x-1 text-text-main hover:text-primary transition-colors duration-300 text-sm font-medium">
                <span className="hidden sm:inline">{languages[language]}</span>
                <span className="inline sm:hidden uppercase">{language}</span>
                <ChevronDownIcon className="w-4 h-4" />
            </button>
            <div className="absolute top-full right-0 mt-2 w-32 bg-card border border-border-color rounded-md shadow-lg overflow-hidden opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-[101]">
                {Object.entries(languages).map(([key, name]) => (
                    <a
                        key={key}
                        href="#"
                        onClick={(e) => {
                            e.preventDefault();
                            const langKey = key as 'en' | 'de' | 'es' | 'fr' | 'th' | 'ja' | 'pt';
                            if (langKey !== language) {
                                handleLanguageChange(langKey);
                            }
                        }}
                        className={`block px-4 py-2 text-sm ${
                            language === key
                                ? 'bg-primary/20 text-text-main font-semibold'
                                : 'text-text-secondary hover:bg-secondary hover:text-text-main'
                        }`}
                    >
                        {name}
                    </a>
                ))}
            </div>
        </div>
    );
};

export default LanguageSwitcher;