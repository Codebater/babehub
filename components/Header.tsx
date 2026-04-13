
import React, { useState, useEffect, useRef } from 'react';
import { GridOfDotsIcon, XIcon, BabeHubLogo } from './IconComponents';
import { useLanguage } from '../hooks/useLanguage';
import LanguageSwitcher from './LanguageSwitcher';

interface HeaderProps {
    onApplyClick: () => void;
}

const NavLink: React.FC<{ href: string; children: React.ReactNode; onClick: (e: React.MouseEvent<HTMLAnchorElement>) => void; }> = ({ href, children, onClick }) => (
    <a href={href} onClick={onClick} className="text-text-secondary hover:text-primary transition-colors duration-300 text-sm font-medium">
        {children}
    </a>
);

const Header: React.FC<HeaderProps> = ({ onApplyClick }) => {
    const { t } = useLanguage();
    const [isOpen, setIsOpen] = useState(false);
    const menuButtonRef = useRef<HTMLButtonElement>(null);
    
    const navItems = [
        { label: t('header.services'), href: '#services' },
        { label: t('header.benefits'), href: '#benefits' },
        { label: t('header.testimonials'), href: '#testimonials' },
        { label: t('header.faq'), href: '#faq' },
        { label: t('header.partners'), href: '#sponsors' },
    ];

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen]);
    
    const scrollToSection = (e: React.MouseEvent<HTMLAnchorElement>, sectionId: string) => {
        e.preventDefault();
        document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' });
        setIsOpen(false);
    }

    return (
        <>
            <header className="relative w-full z-50 bg-background transition-colors duration-700">
                <div className="container mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <a href="#hero" onClick={(e) => scrollToSection(e, 'hero')} className="flex items-center">
                             <BabeHubLogo className="h-8 w-auto text-text-main" />
                        </a>
                        <nav className="hidden md:flex items-center space-x-8">
                            {navItems.map(item => (
                                <NavLink key={item.href} href={item.href} onClick={(e) => scrollToSection(e, item.href.substring(1))}>{item.label}</NavLink>
                            ))}
                        </nav>
                        <div className="flex items-center space-x-4">
                             <LanguageSwitcher />
                             <button
                                onClick={onApplyClick}
                                className="hidden md:block border border-primary text-primary hover:bg-primary hover:text-white font-bold py-2 px-6 rounded-full transition-colors duration-300 text-sm"
                            >
                                {t('header.applyNow')}
                            </button>
                            <button
                                ref={menuButtonRef}
                                onClick={() => setIsOpen(!isOpen)}
                                className="md:hidden text-text-main p-2"
                                aria-label={isOpen ? t('header.closeMenu') : t('header.openMenu')}
                                aria-expanded={isOpen}
                            >
                                <div className="relative w-6 h-6 flex items-center justify-center">
                                    <GridOfDotsIcon className={`absolute w-full h-full transition-all duration-300 ease-in-out ${isOpen ? 'opacity-0 rotate-90 scale-50' : 'opacity-100 rotate-0 scale-100'}`} />
                                    <XIcon className={`absolute w-full h-full transition-all duration-300 ease-in-out ${isOpen ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-90 scale-50'}`} />
                                </div>
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Fullscreen Menu */}
            <div
                className={`fixed inset-0 z-40 md:hidden ${isOpen ? 'pointer-events-auto' : 'pointer-events-none'}`}
            >
                {/* Panels */}
                <div 
                    className="absolute top-0 left-0 w-full h-1/2 bg-background transform"
                    style={{ 
                        transition: 'transform 0.7s cubic-bezier(0.7, 0, 0.2, 1)', 
                        transform: isOpen ? 'translateY(0)' : 'translateY(-100%)', 
                        transitionDelay: isOpen ? '0s' : '0.4s' 
                    }}
                    onClick={() => setIsOpen(false)}
                ></div>
                <div 
                    className="absolute bottom-0 left-0 w-full h-1/2 bg-background transform"
                    style={{ 
                        transition: 'transform 0.7s cubic-bezier(0.7, 0, 0.2, 1)', 
                        transform: isOpen ? 'translateY(0)' : 'translateY(100%)', 
                        transitionDelay: isOpen ? '0s' : '0.4s' 
                    }}
                    onClick={() => setIsOpen(false)}
                ></div>

                {/* Content */}
                <div 
                    className="absolute inset-0 flex flex-col items-center justify-center transition-opacity duration-300"
                    style={{ opacity: isOpen ? 1 : 0, transitionDelay: isOpen ? '0.5s' : '0s' }}
                    onClick={() => setIsOpen(false)}
                >
                    <nav className="text-center" onClick={e => e.stopPropagation()}>
                        <ul className="flex flex-col space-y-6">
                            {navItems.map((item, index) => (
                                <li
                                    key={item.label}
                                    className="overflow-hidden"
                                >
                                    <a
                                        href={item.href}
                                        onClick={(e) => scrollToSection(e, item.href.substring(1))}
                                        className="inline-block text-4xl font-bold text-text-secondary hover:text-primary"
                                        style={{
                                            transform: isOpen ? 'translateY(0)' : 'translateY(100%)',
                                            transition: `transform 0.6s cubic-bezier(0.23, 1, 0.32, 1)`,
                                            transitionDelay: isOpen ? `${500 + index * 75}ms` : '0s'
                                        }}
                                    >
                                        {item.label}
                                    </a>
                                </li>
                            ))}
                        </ul>
                        <div className="overflow-hidden mt-12">
                            <button
                                onClick={() => { onApplyClick(); setIsOpen(false); }}
                                className="bg-primary hover:bg-pink-400 text-white font-bold py-3 px-12 rounded-full text-lg mb-8"
                                style={{
                                    transform: isOpen ? 'translateY(0)' : 'translateY(100%)',
                                    transition: `transform 0.6s cubic-bezier(0.23, 1, 0.32, 1)`,
                                    transitionDelay: isOpen ? `${500 + navItems.length * 75}ms` : `0s`
                                }}
                            >
                                {t('header.applyNow')}
                            </button>
                        </div>
                        <div className="overflow-hidden">
                            <p 
                                className="text-gray-500 text-xs tracking-widest uppercase font-medium"
                                style={{
                                    transform: isOpen ? 'translateY(0)' : 'translateY(100%)',
                                    transition: `transform 0.6s cubic-bezier(0.23, 1, 0.32, 1)`,
                                    transitionDelay: isOpen ? `${600 + navItems.length * 75}ms` : `0s`
                                }}
                            >
                                Operated by OFX LLC
                            </p>
                        </div>
                    </nav>
                </div>
            </div>
        </>
    );
};

export default Header;
