'use client';

import { Fragment } from 'react';
import { useTranslations } from 'next-intl';
import { WhatsAppIcon, InstagramIcon, BabeHubLogo } from './IconComponents';

export default function Footer() {
  const t = useTranslations();

  const scrollToSection = (e: React.MouseEvent<HTMLAnchorElement>, sectionId: string) => {
    e.preventDefault();
    document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' });
  };

  const socialLinks = [
    { href: 'https://wa.me/420795477701', icon: <WhatsAppIcon className="w-6 h-6" />, name: 'WhatsApp' },
    { href: 'https://www.instagram.com/bab3hub/', icon: <InstagramIcon className="w-6 h-6" />, name: 'Instagram' },
  ];

  const navLinks = [
    { label: t('footer.howWeWork'), href: '#how-it-works' },
    { label: t('footer.contactUs'), href: '#apply' },
    { label: t('header.faq'), href: '#faq' },
  ];

  return (
    <footer className="bg-black text-gray-300 border-t border-gray-800">
      <div className="container mx-auto px-6 py-12">
        <div className="flex flex-col items-center mb-12">
          <a href="#hero" onClick={(e) => scrollToSection(e, 'hero')} className="inline-flex items-center mb-8">
            <BabeHubLogo className="h-10 w-auto text-gray-200" />
          </a>

          <nav className="flex justify-center items-center space-x-2 sm:space-x-4 mb-8">
            {navLinks.map((link) => (
              <Fragment key={link.label}>
                <a
                  href={link.href}
                  onClick={(e) => scrollToSection(e, link.href.substring(1))}
                  className="text-gray-300 hover:text-primary transition-colors text-sm font-semibold cursor-pointer"
                >
                  {link.label}
                </a>
                <span className="text-gray-600">|</span>
              </Fragment>
            ))}
          </nav>

          <div className="flex justify-center items-center space-x-6">
            {socialLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                aria-label={link.name}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-300 hover:text-primary transition-colors"
              >
                {link.icon}
              </a>
            ))}
          </div>
        </div>

        {/* Programmatic-SEO link block removed in the Sprint-2 cleanup
            pass — those slug pages were retired along with seoData.ts. */}

        <div className="text-center text-gray-500 text-sm mt-12 pt-8 border-t border-gray-900">
          <p className="mb-2 text-gray-600 italic">The world&apos;s leading OnlyFans management agency for elite models and creators.</p>
          <p className="mb-4 text-gray-400 font-medium tracking-widest uppercase text-[10px]">Operated by OFX LLC</p>
          &copy; {new Date().getFullYear()} Babe Hub. {t('footer.rights')}
        </div>
      </div>
    </footer>
  );
}
