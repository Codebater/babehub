
import React, { useEffect, useRef, useState } from 'react';
import { Testimonial } from '../types';
import { useLanguage } from '../hooks/useLanguage';
import TextReveal from './TextReveal';

const TestimonialCard: React.FC<{ testimonial: Testimonial; isVisible: boolean; delay: number }> = ({ testimonial, isVisible, delay }) => (
    <div
        className={`bg-card p-6 sm:p-8 rounded-lg border border-border-color flex flex-col transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:shadow-primary/20 break-inside-avoid ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
        style={{ transitionDelay: `${delay}ms` }}
    >
        <p className="text-text-secondary mb-6 flex-grow">"{testimonial.quote}"</p>
        <div className="flex items-center">
            <img src={testimonial.image} alt={testimonial.name} className="w-12 h-12 rounded-full object-cover mr-4" />
            <div>
                <h4 className="font-bold text-text-main">{testimonial.name}</h4>
                <p className="text-sm text-primary">{testimonial.handle}</p>
            </div>
        </div>
    </div>
);

interface TestimonialsProps {
    testimonials: Testimonial[];
}

const Testimonials: React.FC<TestimonialsProps> = ({ testimonials }) => {
    const { t } = useLanguage();
    const sectionRef = useRef<HTMLDivElement>(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                    observer.unobserve(entry.target);
                }
            },
            {
                rootMargin: '0px 0px -150px 0px',
            }
        );

        const currentRef = sectionRef.current;
        if (currentRef) {
            observer.observe(currentRef);
        }

        return () => {
            if (currentRef) {
                observer.unobserve(currentRef);
            }
        };
    }, []);
    
    return (
        <section ref={sectionRef} id="testimonials" className="py-20 bg-background transition-colors duration-700">
            <div className="container mx-auto px-6">
                <div className="text-center mb-12">
                    <TextReveal as="h2" className="text-4xl font-bold text-text-main mb-4">{t('testimonials.title')}</TextReveal>
                    <TextReveal as="p" className="max-w-2xl mx-auto text-lg text-text-secondary">
                        {t('testimonials.subtitle')}
                    </TextReveal>
                </div>
                <div className="columns-1 md:columns-2 lg:columns-3 gap-8 space-y-8">
                    {testimonials.map((testimonial, index) => (
                        <TestimonialCard key={index} testimonial={testimonial} isVisible={isVisible} delay={index * 100} />
                    ))}
                </div>
            </div>
        </section>
    );
};

export default Testimonials;