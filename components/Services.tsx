
import React, { useState } from 'react';
import { Service } from '../types';
import { ChevronDownIcon } from './IconComponents';
import { useLanguage } from '../hooks/useLanguage';
import TextReveal from './TextReveal';

const ServiceCard: React.FC<{ service: Service }> = ({ service }) => (
    <div className="bg-card p-6 rounded-lg border border-border-color transition-all duration-300 hover:border-primary hover:-translate-y-2 h-full">
        <div className="text-primary mb-4 w-12 h-12">
            {service.icon}
        </div>
        <h3 className="text-xl font-bold text-text-main mb-2">{service.title}</h3>
        <p className="text-text-secondary text-sm">{service.description}</p>
    </div>
);

const ServiceAccordionItem: React.FC<{ service: Service; isOpen: boolean; onClick: () => void; }> = ({ service, isOpen, onClick }) => {
    return (
        <div className="border-b border-border-color/50">
            <button
                onClick={onClick}
                className="w-full flex justify-between items-center text-left py-5"
            >
                <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0 w-8 h-8 text-primary">
                        {service.icon}
                    </div>
                    <span className="text-lg font-medium text-text-main">{service.title}</span>
                </div>
                <ChevronDownIcon className={`w-5 h-5 text-primary flex-shrink-0 transform transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            <div className={`overflow-hidden transition-all duration-500 ease-in-out ${isOpen ? 'max-h-96' : 'max-h-0'}`}>
                 <div className="pb-5 pl-12 text-text-secondary text-left text-sm">
                    {service.description}
                 </div>
            </div>
        </div>
    );
};


interface ServicesProps {
    services: Service[];
}

const Services: React.FC<ServicesProps> = ({ services }) => {
    const { t } = useLanguage();
    const [openAccordionIndex, setOpenAccordionIndex] = useState<number | null>(0);

    const handleAccordionClick = (index: number) => {
        setOpenAccordionIndex(openAccordionIndex === index ? null : index);
    };

    return (
        <section id="services" className="py-20 bg-secondary transition-colors duration-700">
            <div className="container mx-auto px-6">
                <div className="text-center">
                    <TextReveal as="h2" className="text-4xl font-bold text-text-main mb-4">{t('services.title')}</TextReveal>
                    <TextReveal as="p" className="max-w-2xl mx-auto text-lg text-text-secondary mb-12">
                        {t('services.subtitle')}
                    </TextReveal>
                </div>
                
                {/* Desktop Grid View */}
                <div className="hidden md:grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {services.map((service, index) => (
                        <ServiceCard key={index} service={service} />
                    ))}
                </div>

                {/* Mobile Accordion View */}
                <div className="md:hidden max-w-2xl mx-auto">
                    {services.map((service, index) => (
                        <ServiceAccordionItem
                            key={index}
                            service={service}
                            isOpen={openAccordionIndex === index}
                            onClick={() => handleAccordionClick(index)}
                        />
                    ))}
                </div>
            </div>
        </section>
    );
};

export default Services;