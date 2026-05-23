'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { ChevronDownIcon } from './IconComponents';
import TextReveal from './TextReveal';

export interface FAQItem {
  question: string;
  answer: string;
}

function FaqItemComponent({ item, isOpen, onClick }: { item: FAQItem; isOpen: boolean; onClick: () => void }) {
  return (
    <div className="border-b border-border-color">
      <button onClick={onClick} className="w-full flex justify-between items-center text-left py-6">
        <span className="text-lg font-medium text-text-main">{item.question}</span>
        <ChevronDownIcon className={`w-6 h-6 text-primary transform transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      <div className={`overflow-hidden transition-all duration-500 ease-in-out ${isOpen ? 'max-h-96' : 'max-h-0'}`}>
        <div className="pb-6 text-text-secondary">{item.answer}</div>
      </div>
    </div>
  );
}

export default function FAQ() {
  const t = useTranslations();
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const faqItems: FAQItem[] = [
    { question: t('faq.cost.question'), answer: t('faq.cost.answer') },
    { question: t('faq.control.question'), answer: t('faq.control.answer') },
    { question: t('faq.privacy.question'), answer: t('faq.privacy.answer') },
    { question: t('faq.time.question'), answer: t('faq.time.answer') },
    { question: t('faq.new.question'), answer: t('faq.new.answer') },
  ];

  return (
    <section id="faq" className="py-20 bg-secondary transition-colors duration-700">
      <div className="container mx-auto px-6">
        <div className="text-center mb-12">
          <TextReveal as="h2" className="text-4xl font-bold text-text-main mb-4">
            {t('faq.title')}
          </TextReveal>
          <TextReveal as="p" className="max-w-2xl mx-auto text-lg text-text-secondary">
            {t('faq.subtitle')}
          </TextReveal>
        </div>
        <div className="max-w-3xl mx-auto">
          {faqItems.map((item, i) => (
            <FaqItemComponent
              key={i}
              item={item}
              isOpen={openIndex === i}
              onClick={() => setOpenIndex(openIndex === i ? null : i)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
