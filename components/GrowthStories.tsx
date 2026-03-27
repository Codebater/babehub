import React from 'react';
import { useLanguage } from '../hooks/useLanguage';
import { motion } from 'motion/react';

const GrowthStories: React.FC = () => {
  const { t } = useLanguage();

  // We'll use a data structure that matches the locale keys
  // Since we can't easily iterate over locale objects in the current setup, 
  // we'll define the structure here and use the translation keys.
  const stories = [0, 1]; // Indices for the stories in the locale file

  return (
    <section id="growth" className="py-24 bg-black text-white overflow-hidden">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl md:text-5xl font-bold mb-4"
          >
            {t('growth.title')}
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-xl text-gray-400 max-w-2xl mx-auto"
          >
            {t('growth.subtitle')}
          </motion.p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {stories.map((index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.2 }}
              className="group relative bg-zinc-900/50 border border-zinc-800 rounded-3xl overflow-hidden hover:border-primary/50 transition-colors duration-500"
            >
              <div className="aspect-video relative overflow-hidden">
                <img 
                  src={t(`growth.stories.${index}.image`)}
                  alt={t(`growth.stories.${index}.title`)}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-transparent to-transparent"></div>
                
                {/* Overlaying "Technical" Grid */}
                <div className="absolute inset-0 opacity-20 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
              </div>

              <div className="p-8">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-xs font-mono text-primary uppercase tracking-widest">Case Study 0{index + 1}</span>
                  <div className="h-px flex-1 bg-zinc-800"></div>
                </div>
                
                <h3 className="text-2xl font-bold mb-4 group-hover:text-primary transition-colors">
                  {t(`growth.stories.${index}.title`)}
                </h3>
                
                <p className="text-gray-400 mb-8 leading-relaxed">
                  {t(`growth.stories.${index}.description`)}
                </p>

                <div className="grid grid-cols-3 gap-4 pt-6 border-t border-zinc-800">
                  {[0, 1, 2].map((mIndex) => (
                    <div key={mIndex}>
                      <p className="text-[10px] font-mono text-gray-500 uppercase mb-1">
                        {t(`growth.stories.${index}.metrics.${mIndex}.label`)}
                      </p>
                      <p className="text-lg font-bold text-white">
                        {t(`growth.stories.${index}.metrics.${mIndex}.value`)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default GrowthStories;
