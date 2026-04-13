
import React from 'react';
import { LinkedInIcon } from './IconComponents';
import { useLanguage } from '../hooks/useLanguage';

const logos = [
    { name: 'Vogue', component: <span className="font-serif text-3xl font-bold tracking-widest uppercase">Vogue</span> },
    { name: 'ELLE', component: <span className="font-sans text-4xl font-extrabold uppercase">ELLE</span> },
    { name: 'Allure', component: <span className="font-serif text-3xl italic">Allure</span> },
    { name: 'GQ', component: <span className="text-3xl font-bold font-serif">GQ</span> },
    { name: 'LinkedIn', component: <LinkedInIcon className="h-7 w-7"/> },
    { name: 'Los Angeles', component: <span className="text-2xl font-semibold tracking-tight">Los Angeles</span> },
    { name: 'Forbes', component: <span className="text-3xl font-bold">Forbes</span> },
];

const LogoCloudMarquee: React.FC = () => {
    const { t } = useLanguage();
    return (
        <div className="logo-cloud-marquee bg-background">
            <div className="pt-8 text-center">
                <h3 className="logo-cloud-marquee__label text-sm font-medium tracking-widest uppercase">
                    {t('logoCloud.inspiredBy')}
                </h3>
            </div>
            <div className="group relative w-full overflow-hidden py-8">
                <div className="absolute inset-0 z-10 before:absolute before:left-0 before:top-0 before:h-full before:w-1/4 before:bg-gradient-to-r before:from-background before:to-transparent before:content-[''] after:absolute after:right-0 after:top-0 after:h-full after:w-1/4 after:bg-gradient-to-l after:from-background after:to-transparent after:content-['']"></div>

                <div className="flex animate-marquee">
                    <div className="flex min-w-full shrink-0 items-center justify-around gap-x-16">
                        {logos.map((logo, index) => (
                            <div key={index} className="mx-4 flex-shrink-0">
                                {logo.component}
                            </div>
                        ))}
                    </div>
                    <div className="flex min-w-full shrink-0 items-center justify-around gap-x-16" aria-hidden="true">
                        {logos.map((logo, index) => (
                            <div key={`dup-${index}`} className="mx-4 flex-shrink-0">
                                {logo.component}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LogoCloudMarquee;