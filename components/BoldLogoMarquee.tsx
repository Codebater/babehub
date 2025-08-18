import React from 'react';
import { BabeHubLogo, StarIcon } from './IconComponents';

// A single block of content to be repeated in the marquee.
const MarqueeContent: React.FC = () => {
    const logos = Array(10).fill(0); // Adjust number for density
    return (
        <div className="flex min-w-full shrink-0 items-center justify-around">
            {logos.map((_, index) => (
                <div key={index} className="flex flex-shrink-0 items-center gap-x-8 px-4">
                    <BabeHubLogo className="h-12 w-auto text-text-main opacity-80" />
                    <StarIcon className="h-6 w-6 text-primary/50" />
                </div>
            ))}
        </div>
    );
};

const BoldLogoMarquee: React.FC = () => {
    return (
        <section className="py-16 bg-secondary overflow-hidden transition-colors duration-700">
            <div className="flex flex-col gap-y-6">
                {/* Marquee 1: Scrolls Left */}
                <div className="flex animate-marquee" style={{ animationDuration: '60s' }}>
                    <MarqueeContent />
                    <MarqueeContent />
                </div>
                {/* Marquee 2: Scrolls Right */}
                <div className="flex animate-marquee-right" style={{ animationDuration: '80s' }}>
                    <MarqueeContent />
                    <MarqueeContent />
                </div>
            </div>
        </section>
    );
};

export default BoldLogoMarquee;
