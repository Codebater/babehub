import React, { useState, useEffect } from 'react';
import { BabeHubLogo } from './IconComponents';

interface PreloaderProps {
  isLoading: boolean;
}

const Preloader: React.FC<PreloaderProps> = ({ isLoading }) => {
  const [shouldRender, setShouldRender] = useState(isLoading);

  useEffect(() => {
    if (isLoading) {
      setShouldRender(true);
    } else {
      // Unmount after exit animation is complete
      const timer = setTimeout(() => setShouldRender(false), 1200); 
      return () => clearTimeout(timer);
    }
  }, [isLoading]);

  if (!shouldRender) {
    return null;
  }
  
  const easing = 'cubic-bezier(0.7, 0, 0.2, 1)';

  return (
    <div className="fixed inset-0 z-[200]">
      <div 
        className="absolute top-0 left-0 w-full h-1/2 bg-background transform"
        style={{ 
            transition: `transform 0.7s ${easing}`,
            transform: isLoading ? 'translateY(0)' : 'translateY(-100%)', 
            transitionDelay: isLoading ? '0s' : '0.4s' 
        }}
      ></div>
      <div 
        className="absolute bottom-0 left-0 w-full h-1/2 bg-background transform"
        style={{ 
            transition: `transform 0.7s ${easing}`,
            transform: isLoading ? 'translateY(0)' : 'translateY(100%)',
            transitionDelay: isLoading ? '0s' : '0.4s'
        }}
      ></div>
      <div 
        className="absolute inset-0 flex items-center justify-center"
        style={{
            transition: 'opacity 0.5s ease',
            opacity: isLoading ? 1 : 0,
            transitionDelay: isLoading ? '0.2s' : '0s'
        }}
      >
        <BabeHubLogo className="w-auto h-16 text-text-main animate-pulse" />
      </div>
    </div>
  );
};

export default Preloader;
