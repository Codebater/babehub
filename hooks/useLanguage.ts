import React, { createContext, useState, useContext, useEffect, useMemo } from 'react';
import en from '../locales/en';
import de from '../locales/de';
import es from '../locales/es';
import fr from '../locales/fr';
import th from '../locales/th';
import ja from '../locales/ja';
import pt from '../locales/pt';

const translations = { en, de, es, fr, th, ja, pt };

type Language = 'en' | 'de' | 'es' | 'fr' | 'th' | 'ja' | 'pt';

interface LanguageContextType {
    language: Language;
    setLanguage: (lang: Language) => void;
    t: (key: string, replacements?: { [key: string]: string }) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// A simple utility to get nested properties from an object
const getNested = (obj: any, path: string): any => {
    return path.split('.').reduce((acc, part) => acc && acc[part], obj);
};

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [language, setLanguage] = useState<Language>('en');

    useEffect(() => {
        const browserLang = navigator.language.split(/[-_]/)[0];
        if (browserLang in translations) {
            setLanguage(browserLang as Language);
        }
    }, []);

    const t = useMemo(() => (key: string, replacements?: { [key: string]: string }): string => {
        const currentTranslations = translations[language] || translations.en;
        let text = getNested(currentTranslations, key);

        if (typeof text !== 'string') {
            console.warn(`Translation key '${key}' not found for language '${language}'.`);
            return key; // Return key if not found or not a string
        }

        if (replacements) {
            Object.keys(replacements).forEach(rKey => {
                text = text.replace(new RegExp(`{{${rKey}}}`, 'g'), replacements[rKey]);
            });
        }

        return text;
    }, [language]);

    const value = { language, setLanguage, t };

    return React.createElement(LanguageContext.Provider, { value }, children);
};

export const useLanguage = () => {
    const context = useContext(LanguageContext);
    if (context === undefined) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
};