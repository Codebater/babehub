
import React, { useState, useEffect, useRef, forwardRef, useMemo } from 'react';
import { useLanguage } from '../hooks/useLanguage';
import TextReveal from './TextReveal';

interface StepProps {
    number: string;
    title: string;
    description: string;
    isActive: boolean;
}

const Step = forwardRef<HTMLDivElement, StepProps>(({ number, title, description, isActive }, ref) => (
    <div ref={ref} className="relative pb-16 last:pb-0">
        <div className={`absolute -left-5 top-0 flex items-center justify-center w-10 h-10 rounded-full transition-all duration-500
            ${isActive ? 'bg-primary border-2 border-primary text-white shadow-lg shadow-primary/40 scale-110' : 'bg-secondary border-2 border-border-color text-primary scale-100'}`}>
            <span className="font-bold">{number}</span>
        </div>
        <div className={`pl-12 transition-all duration-700 ${isActive ? 'opacity-100 translate-y-0' : 'opacity-50 translate-y-2'}`}>
            <h3 className="text-2xl font-bold text-text-main mb-2">{title}</h3>
            <p className="text-text-secondary">{description}</p>
        </div>
    </div>
));


const HowItWorks: React.FC = () => {
    const { t } = useLanguage();

    const steps = useMemo(() => [
        { number: "01", title: t('howItWorks.step1.title'), description: t('howItWorks.step1.description') },
        { number: "02", title: t('howItWorks.step2.title'), description: t('howItWorks.step2.description') },
        { number: "03", title: t('howItWorks.step3.title'), description: t('howItWorks.step3.description') },
        { number: "04", title: t('howItWorks.step4.title'), description: t('howItWorks.step4.description') }
    ], [t]);

    const [activeStepIndex, setActiveStepIndex] = useState(-1);
    const stepRefs = useRef<(HTMLDivElement | null)[]>([]);
    const pathRef = useRef<SVGPathElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        stepRefs.current = stepRefs.current.slice(0, steps.length);
    }, [steps]);

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        const index = stepRefs.current.indexOf(entry.target as HTMLDivElement);
                        if (index !== -1) {
                            setActiveStepIndex(prev => Math.max(prev, index));
                        }
                    }
                });
            },
            { rootMargin: '0px 0px -40% 0px', threshold: 0 }
        );

        stepRefs.current.forEach((ref) => {
            if (ref) observer.observe(ref);
        });

        return () => {
            stepRefs.current.forEach((ref) => {
                if (ref) observer.unobserve(ref);
            });
        };
    }, [steps]);

    useEffect(() => {
        const path = pathRef.current;
        if (!path) return;

        let pathLength: number;

        const updatePath = () => {
            if (!pathLength) {
                pathLength = path.getTotalLength();
                path.style.strokeDasharray = `${pathLength} ${pathLength}`;
                path.style.strokeDashoffset = `${pathLength}`;
            }

            const container = containerRef.current;
            if (!container) return;

            const { top, height } = container.getBoundingClientRect();
            const scrollY = window.scrollY;
            const viewportHeight = window.innerHeight;

            const scrollPercent = (scrollY - (container.offsetTop - viewportHeight * 0.8)) / (height - viewportHeight * 0.2);
            
            const drawLength = pathLength * Math.max(0, Math.min(1, scrollPercent));
            path.style.strokeDashoffset = (pathLength - drawLength).toString();
        };

        window.addEventListener('scroll', updatePath);
        
        const timeoutId = setTimeout(updatePath, 100); 

        return () => {
            window.removeEventListener('scroll', updatePath);
            clearTimeout(timeoutId);
        };
    }, []);


    return (
        <section id="how-it-works" className="py-20 bg-secondary transition-colors duration-700">
            <div className="container mx-auto px-6">
                <div className="text-center mb-16">
                    <TextReveal as="h2" className="text-4xl font-bold text-text-main mb-4">{t('howItWorks.title')}</TextReveal>
                    <TextReveal as="p" className="max-w-2xl mx-auto text-lg text-text-secondary">
                        {t('howItWorks.subtitle')}
                    </TextReveal>
                </div>
                <div ref={containerRef} className="max-w-2xl mx-auto relative">
                    <div className="absolute top-0 left-[19px] h-full w-px z-0">
                         <svg className="h-full" width="2" preserveAspectRatio="none">
                            <path d="M 1 0 V 9999" stroke="#374151" strokeWidth="2" />
                            <path ref={pathRef} d="M 1 0 V 9999" stroke="#F472B6" strokeWidth="3" />
                        </svg>
                    </div>

                    <div className="relative z-10">
                        {steps.map((step, index) => (
                             <Step
                                key={index}
                                ref={(el: HTMLDivElement | null) => { stepRefs.current[index] = el; }}
                                number={step.number}
                                title={step.title}
                                description={step.description}
                                isActive={index <= activeStepIndex}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
};

export default HowItWorks;