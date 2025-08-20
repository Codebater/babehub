import React, { useState } from 'react';
import { useLanguage } from '../hooks/useLanguage';
import { WhatsAppIcon, UsersIcon, ShieldCheckIcon } from './IconComponents';

const Card: React.FC<{children: React.ReactNode, delay?: string}> = ({children, delay = '0ms'}) => {
    const [style, setStyle] = useState<React.CSSProperties>({
        transform: 'perspective(1000px) rotateX(0deg) scale3d(1, 1, 1)'
    });

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        const card = e.currentTarget;
        const { left, top, width, height } = card.getBoundingClientRect();
        const x = e.clientX - left;
        const y = e.clientY - top;
        const rotateX = -1 * ((y - height / 2) / (height / 2)) * 6;
        const rotateY = ((x - width / 2) / (width / 2)) * 6;
        
        setStyle({
            transform: `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.03, 1.03, 1.03)`,
            transition: 'transform 0.1s ease-out'
        });
    };

    const handleMouseLeave = () => {
        setStyle({
            transform: 'perspective(1000px) rotateX(0deg) scale3d(1, 1, 1)',
            transition: 'transform 0.5s cubic-bezier(0.23, 1, 0.32, 1)'
        });
    };

    return (
        <div className="w-full h-full animate-fade-in-up" style={{ animationDelay: delay }} onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave}>
            <div style={{ ...style, willChange: 'transform' }} className="w-full h-full bg-card/60 lg:bg-card/80 border border-border-color/30 lg:border-border-color/50 rounded-2xl shadow-xl backdrop-blur-sm p-3 sm:p-4 transition-colors duration-700">
                {children}
            </div>
        </div>
    );
};

const DataGridVisualization = () => (
    <div className="absolute inset-0 z-0 overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,theme(colors.border.color/0.1)_1px,transparent_1px),linear-gradient(to_bottom,theme(colors.border.color/0.1)_1px,transparent_1px)] bg-[size:3rem_3rem]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,theme(colors.primary/0.1),transparent_40%)]"></div>
        <style>
            {`
                @keyframes move-packet {
                    0% { transform: translate(0, 0); opacity: 0; }
                    10%, 90% { opacity: 1; }
                    100% { transform: translate(var(--tx), var(--ty)); opacity: 0; }
                }
                .data-packet {
                    position: absolute;
                    width: 4px;
                    height: 4px;
                    border-radius: 50%;
                    background-color: var(--color-primary);
                    box-shadow: 0 0 8px var(--color-primary);
                    animation: move-packet 8s linear infinite;
                }
            `}
        </style>
        <div className="data-packet" style={{ top: '20%', left: '10%', animationDelay: '0s', '--tx': '20vw', '--ty': '50vh' } as React.CSSProperties}></div>
        <div className="data-packet" style={{ top: '80%', left: '90%', animationDelay: '2s', '--tx': '-30vw', '--ty': '-60vh' } as React.CSSProperties}></div>
        <div className="data-packet" style={{ top: '50%', left: '5%', animationDelay: '4s', '--tx': '60vw', '--ty': '10vh' } as React.CSSProperties}></div>
        <div className="data-packet" style={{ top: '10%', left: '80%', animationDelay: '6s', '--tx': '-40vw', '--ty': '30vh' } as React.CSSProperties}></div>
    </div>
);


const Sponsors: React.FC = () => {
    const { t } = useLanguage();
    const whatsappLink = 'https://wa.me/13433532380';
    
    return (
        <section id="sponsors" className="relative bg-black py-32 text-white overflow-hidden transition-colors duration-700">
            <div className="container mx-auto px-6 relative z-10 flex flex-col items-center">
                 <div className="relative w-full h-[650px] flex items-center justify-center scale-90 sm:scale-100">
                    
                    <DataGridVisualization />

                    {/* Exclusive Network Card */}
                    <div className="absolute top-16 -left-2 w-52 transform -rotate-6 lg:top-8 lg:left-12 lg:w-56">
                        <Card delay="0.4s">
                            <div className="flex items-center space-x-2 mb-1 sm:mb-2">
                                <div className="w-7 h-7 shrink-0 flex items-center justify-center rounded-full bg-primary/20"><UsersIcon className="w-5 h-5 text-primary" /></div>
                                <span className="text-xs sm:text-sm font-medium text-text-secondary">{t('sponsors.card.network.title')}</span>
                            </div>
                            <p className="text-xl sm:text-2xl font-bold text-text-main tracking-tight mt-2">{t('sponsors.card.network.metric')}</p>
                        </Card>
                    </div>

                    {/* Central Text */}
                    <div className="relative text-center animate-fade-in-down z-30 max-w-xl">
                        <h2 className="text-4xl md:text-5xl font-bold text-text-main mb-4">{t('sponsors.title')}</h2>
                        <p className="text-lg text-text-secondary mb-8">{t('sponsors.subtitle')}</p>
                        <a
                            href={whatsappLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-x-3 bg-gradient-to-r from-primary to-red-500 hover:from-pink-500 hover:to-red-600 text-white font-bold py-4 px-10 rounded-full text-lg transition-all duration-300 transform hover:scale-105 shadow-lg shadow-primary/30"
                        >
                            <WhatsAppIcon className="w-6 h-6" />
                            {t('sponsors.button')}
                        </a>
                    </div>
                    
                    {/* Live Campaign Data Card */}
                    <div className="absolute top-24 -right-2 w-48 transform rotate-6 lg:top-20 lg:right-16 lg:w-52">
                        <Card delay="0.6s">
                             <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-xs sm:text-sm font-medium text-text-secondary">{t('sponsors.card.liveData.title')}</p>
                                    <p className="text-lg sm:text-xl lg:text-2xl font-bold text-text-main mt-1 tracking-tighter">{t('sponsors.card.liveData.metric')}</p>
                                    <p className="text-xs text-text-secondary">{t('sponsors.card.liveData.subMetric')}</p>
                                </div>
                            </div>
                            <svg className="w-full h-8 mt-1" viewBox="0 0 100 20" preserveAspectRatio="none">
                                <path d="M0 15 C 20 5, 40 5, 60 12 S 80 18, 100 10" stroke="var(--color-primary)" strokeWidth="2" fill="none" strokeLinecap="round" />
                            </svg>
                        </Card>
                    </div>

                    {/* Direct Engagement Card */}
                    <div className="absolute bottom-24 -left-2 w-56 transform -rotate-3 lg:bottom-16 lg:left-24">
                        <Card delay="0.8s">
                            <div className="flex items-center space-x-2">
                                <div className="w-8 h-8 shrink-0 flex items-center justify-center rounded-full bg-green-500/20"><WhatsAppIcon className="w-5 h-5 text-green-400" /></div>
                                <p className="text-sm font-bold text-text-main">{t('sponsors.card.engagement.title')}</p>
                            </div>
                            <div className="bg-secondary p-2 rounded-lg mt-2 text-xs text-text-secondary">
                                {t('sponsors.card.engagement.message')}
                            </div>
                        </Card>
                    </div>

                    {/* Verified Partner Card */}
                    <div className="absolute bottom-20 -right-2 w-48 transform rotate-3 lg:bottom-24 lg:right-20 lg:w-52">
                        <Card delay="1s">
                            <div className="flex items-center space-x-2">
                                <div className="w-7 h-7 shrink-0 flex items-center justify-center rounded-full bg-blue-500/20"><ShieldCheckIcon className="w-5 h-5 text-blue-400" /></div>
                                <p className="text-sm font-bold text-text-main">{t('sponsors.card.verified.title')}</p>
                            </div>
                             <p className="text-sm text-text-secondary mt-2">{t('sponsors.card.verified.description')}</p>
                        </Card>
                    </div>

                 </div>
            </div>
        </section>
    );
};

export default Sponsors;