
import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { seoPages } from '../content/seoData';
import { Helmet } from 'react-helmet-async';
import { motion } from 'motion/react';
import { ArrowLeft, CheckCircle2, TrendingUp, Shield, Zap } from 'lucide-react';

const DynamicSEOPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const page = seoPages.find(p => p.slug === slug);

  if (!page) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center text-text-main p-6">
        <h1 className="text-4xl font-bold mb-4">404 - Page Not Found</h1>
        <p className="text-text-secondary mb-8 text-center max-w-md">
          The guide or location you are looking for doesn't exist or has been moved.
        </p>
        <Link to="/" className="bg-primary text-white px-8 py-3 rounded-full font-bold hover:scale-105 transition-transform">
          Back to Home
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-text-main">
      <Helmet>
        <title>{page.title}</title>
        <meta name="description" content={page.description} />
        <meta name="keywords" content={page.keywords} />
      </Helmet>

      {/* Navigation */}
      <nav className="p-6 border-b border-border-color/20 flex justify-between items-center">
        <Link to="/" className="flex items-center space-x-2 text-primary font-bold text-xl">
          <ArrowLeft className="w-5 h-5" />
          <span>Babe Hub</span>
        </Link>
        <Link to="/" className="bg-primary/10 text-primary px-4 py-2 rounded-xl text-sm font-bold hover:bg-primary/20 transition-colors">
          Apply Now
        </Link>
      </nav>

      <main className="container mx-auto px-6 py-16 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider mb-6">
            {page.category}
          </div>
          <h1 className="text-4xl md:text-6xl font-black mb-8 tracking-tighter leading-tight">
            {page.h1}
          </h1>
          
          <div className="prose prose-invert prose-pink max-w-none mb-12">
            <p className="text-xl text-text-secondary leading-relaxed mb-8">
              {page.content}
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 my-12">
              <div className="bg-secondary/50 p-6 rounded-2xl border border-border-color/30">
                <TrendingUp className="w-8 h-8 text-primary mb-4" />
                <h3 className="text-xl font-bold mb-2">Market Dominance</h3>
                <p className="text-text-secondary text-sm">
                  Our strategies are tailored to the specific nuances of {page.category === 'location' ? 'this region' : 'this platform'}, ensuring you stay ahead of the competition.
                </p>
              </div>
              <div className="bg-secondary/50 p-6 rounded-2xl border border-border-color/30">
                <Shield className="w-8 h-8 text-primary mb-4" />
                <h3 className="text-xl font-bold mb-2">Secure Growth</h3>
                <p className="text-text-secondary text-sm">
                  We prioritize your privacy and security while scaling your presence to the top 0.1%.
                </p>
              </div>
            </div>

            <h2 className="text-3xl font-bold mb-6">Why Choose Babe Hub?</h2>
            <ul className="space-y-4 mb-12">
              {[
                '24/7 Professional Account Management',
                'Data-Driven Marketing Strategies',
                'High-Conversion Chatting Teams',
                'Complete Anonymity & Content Protection'
              ].map((item, i) => (
                <li key={i} className="flex items-center space-x-3">
                  <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
                  <span className="text-text-main font-medium">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-gradient-to-br from-primary to-pink-600 p-8 md:p-12 rounded-3xl text-center text-white shadow-2xl shadow-primary/20">
            <Zap className="w-12 h-12 mx-auto mb-6 text-yellow-300 fill-yellow-300" />
            <h2 className="text-3xl md:text-4xl font-black mb-4">Ready to Scale?</h2>
            <p className="text-pink-100 mb-8 max-w-md mx-auto">
              Join the elite creators who trust Babe Hub to manage their growth and maximize their revenue.
            </p>
            <Link to="/" className="inline-block bg-white text-primary px-10 py-4 rounded-full font-black text-lg hover:scale-105 transition-transform shadow-xl">
              APPLY TO JOIN
            </Link>
          </div>
        </motion.div>
      </main>

      {/* Footer Links for SEO Internal Linking */}
      <footer className="bg-secondary/30 py-12 border-t border-border-color/20">
        <div className="container mx-auto px-6">
          <h3 className="text-sm font-bold text-text-secondary uppercase tracking-widest mb-6">Explore More Guides</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {seoPages.filter(p => p.slug !== slug).map(p => (
              <Link key={p.slug} to={`/${p.slug}`} className="text-sm text-text-secondary hover:text-primary transition-colors">
                {p.h1}
              </Link>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
};

export default DynamicSEOPage;
