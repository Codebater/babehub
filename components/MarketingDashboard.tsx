
import React from 'react';
import { motion } from 'motion/react';
import { CheckCircle2, Sparkles, Bell, Megaphone, ChevronDown } from 'lucide-react';
import { useLanguage } from '../hooks/useLanguage';

interface MarketingDashboardProps {
  onApplyClick?: () => void;
}

const MarketingDashboard: React.FC<MarketingDashboardProps> = ({ onApplyClick }) => {
  const { t } = useLanguage();

  return (
    <section className="py-20 bg-secondary transition-colors duration-700 overflow-hidden">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          
          {/* Left Side: Content */}
          <div className="flex flex-col justify-center text-left lg:pr-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h3 className="sr-only">OnlyFans Marketing and Account Scaling Strategies</h3>
              <h2 className="text-5xl md:text-6xl font-bold text-text-main tracking-tight leading-tight mb-6">
                {t('marketing.title_part1')}<span className="text-primary">{t('marketing.title_highlight')}</span>
              </h2>
              <p className="text-lg text-text-secondary mb-8 max-w-lg">
                {t('marketing.subtitle')}
              </p>
              
              <div className="flex flex-wrap gap-4">
                <button 
                  onClick={onApplyClick}
                  className="bg-primary hover:bg-primary/90 text-white px-8 py-4 rounded-2xl font-bold text-lg shadow-lg shadow-primary/20 transition-all hover:scale-105"
                >
                  {t('marketing.applyNow')}
                </button>
              </div>

              <div className="mt-12 flex items-center space-x-4">
                <div className="flex -space-x-3">
                  {[1, 2, 3, 4].map((i) => (
                    <img 
                      key={i}
                      src={`https://api.dicebear.com/8.x/avataaars/svg?seed=${i}`}
                      className="w-10 h-10 rounded-full border-2 border-white shadow-sm"
                      alt={`OnlyFans Model ${i}`}
                    />
                  ))}
                </div>
                <p className="text-sm text-text-secondary font-medium">
                  {t('marketing.joinedBy')} <span className="text-text-main font-bold">{t('marketing.creatorsPlus')}</span>
                </p>
              </div>
            </motion.div>
          </div>

          {/* Right Side: Visual Focus */}
          <div className="relative flex justify-center items-center h-[264px] md:h-[320px]">
            {/* Main Image (Model) */}
            <div className="relative z-10 w-full max-w-[208px] h-full flex items-end justify-center">
              <img 
                src="https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&q=80&w=1000" 
                alt="Professional OnlyFans Model Management & Growth Agency" 
                className="w-full h-full object-cover rounded-xl shadow-xl"
                referrerPolicy="no-referrer"
              />
              
              {/* Floating UI Elements around the model - Now Static and further out */}
              
              {/* Card: +10% from last week */}
              <div className="absolute -top-6 -left-8 md:-left-20 bg-white/90 backdrop-blur-sm p-2.5 rounded-xl shadow-lg z-20">
                <div className="bg-green-100 text-green-600 px-2.5 py-1 rounded-full text-[10px] font-bold">
                  {t('marketing.stats.lastWeek')}
                </div>
              </div>

              {/* Main Stat Card: Following */}
              <div className="absolute top-12 -left-12 md:-left-28 bg-blue-50/90 backdrop-blur-sm p-3 rounded-2xl shadow-xl z-20 w-[102px] border border-blue-100">
                <p className="text-blue-600 text-[10px] font-semibold mb-0.5">{t('marketing.stats.following')}</p>
                <h3 className="text-xl font-bold text-blue-900">2,534</h3>
              </div>

              {/* Growth Card: Estimated growth */}
              <div className="absolute top-4 -right-8 md:-right-20 bg-primary p-3 rounded-2xl shadow-xl z-20 text-white">
                <p className="text-pink-100 text-[8px] font-medium mb-0.5">{t('marketing.stats.estimatedGrowth')}</p>
                <h3 className="text-xl font-bold">+37%</h3>
              </div>

              {/* Engagement Badge */}
              <div className="absolute bottom-24 -left-10 md:-left-24 bg-green-50/90 backdrop-blur-sm px-2.5 py-1 rounded-full shadow-md z-20 flex items-center space-x-1.5 border border-green-100">
                <CheckCircle2 className="w-3 h-3 text-green-600" />
                <span className="text-green-800 font-bold text-[8px]">{t('marketing.stats.engagementBoosted')}</span>
              </div>

              {/* Toggle Card: AI Targeting */}
              <div className="absolute bottom-12 -right-12 md:-right-28 bg-white p-2.5 rounded-xl shadow-xl z-20 w-32">
                <div className="flex justify-between items-start mb-1.5">
                  <div className="bg-pink-50 p-1 rounded-md">
                    <Sparkles className="w-3 h-3 text-primary" />
                  </div>
                  <ChevronDown className="w-2.5 h-2.5 text-gray-400" />
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-bold text-gray-800 text-[10px]">{t('marketing.stats.aiTargeting')}</span>
                  <div className="w-8 h-4 bg-primary rounded-full relative p-0.5">
                    <div className="absolute right-0.5 top-0.5 w-3 h-3 bg-white rounded-full shadow-sm" />
                  </div>
                </div>
              </div>

              {/* Bottom Badge: Engaged */}
              <div className="absolute -bottom-6 left-1/4 bg-primary px-3 py-1 rounded-full shadow-md z-20">
                <span className="text-white font-bold text-sm">{t('marketing.stats.engaged')}</span>
              </div>

              {/* Small Icons */}
              <div className="absolute bottom-6 -left-12 md:-left-24 flex space-x-1.5 z-20">
                <div className="bg-blue-400 p-1.5 rounded-full shadow-md">
                  <Bell className="w-3 h-3 text-white" />
                </div>
                <div className="bg-white p-1.5 rounded-full shadow-md">
                  <Megaphone className="w-3 h-3 text-gray-800" />
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};

export default MarketingDashboard;
