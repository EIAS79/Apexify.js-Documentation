'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowUpIcon } from '@heroicons/react/24/outline';
import Navbar from '@/components/Navbar';
import AmbientBackground from '@/components/home/AmbientBackground';
import HeroShowcase from '@/components/home/HeroShowcase';
import ShowcaseWall from '@/components/home/ShowcaseWall';
import {
  CapabilitiesMarquee,
  BentoGrid,
  LiveSnippetSection,
  PerformanceSection,
  RecipesDeck,
  ComparisonGrid,
  CTABanner,
  SiteFooter,
} from '@/components/home/HomeSections';

export default function Home() {
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const onScroll = () => setShowScrollTop(window.scrollY > 600);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const scrollToTop = () =>
    window.scrollTo({ top: 0, behavior: 'smooth' });

  return (
    <div className="relative min-h-screen overflow-hidden" style={{ color: 'var(--text-primary)' }}>
      <AmbientBackground />
      <Navbar />

      <main>
        <HeroShowcase />
        <CapabilitiesMarquee />
        <BentoGrid />
        <LiveSnippetSection />
        <PerformanceSection />
        <RecipesDeck />
        <ComparisonGrid />
        <ShowcaseWall />
        <CTABanner />
      </main>

      <SiteFooter />

      <AnimatePresence>
        {showScrollTop && (
          <motion.button
            type="button"
            onClick={scrollToTop}
            initial={{ opacity: 0, y: 16, scale: 0.85 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.85 }}
            transition={{ type: 'spring', stiffness: 380, damping: 26 }}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.94 }}
            className="fixed bottom-6 right-6 sm:bottom-8 sm:right-8 z-40 h-12 w-12 rounded-full inline-flex items-center justify-center text-white"
            style={{
              backgroundImage: 'var(--gradient-sunset)',
              boxShadow: 'var(--glow-magenta), var(--shadow-lg)',
            }}
            aria-label="Scroll to top"
          >
            <ArrowUpIcon className="h-5 w-5" />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
