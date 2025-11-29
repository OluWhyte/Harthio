'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Sparkles, Brain, TrendingUp, ChevronLeft, ChevronRight } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { MagneticButton } from './MagneticButton';
import { FloatingBadge } from './FloatingBadge';
import { AntigravityAI } from './AntigravityAI';
import { TrackerHeroCard } from './TrackerHeroCard';

const slides = [
  {
    id: 1,
    badge: '✨ Never feel alone with your struggle again',
    title: 'Find Someone Who Truly Gets It',
    description: (
      <>
        <strong>Finally, someone who speaks your language.</strong> Schedule judgment-free conversations about business stress, life changes, or passion projects—with perfect matches who've walked your path, not random strangers.
      </>
    ),
    image: 'https://images.unsplash.com/photo-1759593047536-5258c3c6a527?q=80&w=1200&auto=format&fit=crop',
    imageAlt: 'Two people having a meaningful conversation',
    ctaText: 'Join Free',
    ctaLink: '/signup',
    gradient: 'from-primary via-accent to-primary',
  },
  {
    id: 2,
    badge: '🤖 AI-Powered Support',
    title: 'Your 24/7 AI Companion',
    description: (
      <>
        <strong>Never alone, even at 3 AM.</strong> Get instant support from Harthio AI with evidence-based CBT tools, crisis detection, and personalized guidance whenever you need it most.
      </>
    ),
    image: 'antigravity', // Special flag for AntigravityAI component
    imageAlt: 'AI assistant providing support',
    ctaText: 'Try AI Chat',
    ctaLink: '/signup',
    gradient: 'from-primary via-accent to-primary',
    floatingBadge: (
      <Badge className="bg-gradient-to-r from-primary to-accent text-white px-4 py-2 shadow-lg">
        <Sparkles className="h-4 w-4 mr-2" />
        Always Available
      </Badge>
    ),
  },
  {
    id: 3,
    badge: '📊 Track Your Progress',
    title: 'Recovery Tracking That Motivates',
    description: (
      <>
        <strong>See your progress in real-time.</strong> Track your sobriety journey with live counters, daily check-ins, and milestone celebrations. Watch your recovery unfold day by day.
      </>
    ),
    image: 'tracker', // Special flag for TrackerHeroCard component
    imageAlt: 'Recovery tracker dashboard showing progress',
    ctaText: 'Start Tracking',
    ctaLink: '/signup',
    gradient: 'from-accent via-primary to-accent',
    floatingBadge: (
      <Badge className="bg-gradient-to-r from-accent to-primary text-white px-4 py-2 shadow-lg">
        <TrendingUp className="h-4 w-4 mr-2" />
        Real-Time Counter
      </Badge>
    ),
  },
];

export function HeroCarousel() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  // Auto-advance slides every 5 seconds
  useEffect(() => {
    if (!isAutoPlaying) return;

    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [isAutoPlaying]);

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
    setIsAutoPlaying(false);
    // Resume auto-play after 10 seconds
    setTimeout(() => setIsAutoPlaying(true), 10000);
  };

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 10000);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 10000);
  };

  const slide = slides[currentSlide];

  return (
    <div className="relative">
      <AnimatePresence mode="wait">
        <motion.div
          key={slide.id}
          initial={{ opacity: 0, x: 100 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -100 }}
          transition={{ duration: 0.5, ease: 'easeInOut' }}
          className="grid gap-6 sm:gap-8 lg:grid-cols-2 lg:gap-12 xl:gap-16 items-center"
        >
          {/* Content */}
          <div className="flex flex-col justify-center space-y-4 sm:space-y-6 order-2 lg:order-1">
            <div className="space-y-3 sm:space-y-4">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="inline-block px-3 py-1 text-xs sm:text-sm bg-primary/10 text-primary rounded-full font-medium"
              >
                {slide.badge}
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className={`text-3xl xs:text-4xl sm:text-4xl md:text-5xl lg:text-5xl xl:text-6xl 2xl:text-7xl font-bold tracking-tight bg-gradient-to-r ${slide.gradient} bg-clip-text text-transparent leading-tight`}
              >
                {slide.title}
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-base sm:text-lg md:text-xl text-gray-600 leading-relaxed max-w-[600px]"
              >
                {slide.description}
              </motion.p>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="flex flex-col sm:flex-row gap-3 sm:gap-4"
            >
              <MagneticButton>
                <Button
                  size="lg"
                  className="w-full sm:w-auto shadow-lg hover:shadow-xl transition-shadow"
                  asChild
                >
                  <Link href={slide.ctaLink} className="flex items-center justify-center">
                    {slide.ctaText}
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
              </MagneticButton>
            </motion.div>
          </div>

          {/* Image */}
          <div className="relative order-1 lg:order-2">
            {/* Floating Badge */}
            {slide.floatingBadge && (
              <div className="absolute -top-4 -right-4 z-20 hidden lg:block">
                <FloatingBadge>{slide.floatingBadge}</FloatingBadge>
              </div>
            )}

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="relative"
            >
              {slide.image === 'antigravity' ? (
                // Use AntigravityAI component for AI slide
                <AntigravityAI />
              ) : slide.image === 'tracker' ? (
                // Use TrackerHeroCard component for tracker slide
                <TrackerHeroCard />
              ) : (
                // Use regular image for other slides
                <div className="relative rounded-xl sm:rounded-2xl overflow-hidden shadow-xl sm:shadow-2xl h-[320px] sm:h-[380px] md:h-[420px] lg:h-[480px]">
                  <Image
                    src={slide.image}
                    fill
                    alt={slide.imageAlt}
                    className="object-cover object-[center_30%]"
                    priority={slide.id === 1}
                    quality={85}
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 600px"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                </div>
              )}
            </motion.div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Navigation Arrows */}
      <div className="absolute top-1/2 -translate-y-1/2 left-0 right-0 flex justify-between px-2 sm:px-4 pointer-events-none z-30">
        <button
          onClick={prevSlide}
          className="pointer-events-auto w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/90 backdrop-blur-sm shadow-lg flex items-center justify-center hover:bg-white transition-colors"
          aria-label="Previous slide"
        >
          <ChevronLeft className="h-5 w-5 sm:h-6 sm:w-6" />
        </button>
        <button
          onClick={nextSlide}
          className="pointer-events-auto w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/90 backdrop-blur-sm shadow-lg flex items-center justify-center hover:bg-white transition-colors"
          aria-label="Next slide"
        >
          <ChevronRight className="h-5 w-5 sm:h-6 sm:w-6" />
        </button>
      </div>

      {/* Dots Indicator */}
      <div className="flex justify-center gap-2 mt-6 sm:mt-8">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`h-2 rounded-full transition-all ${
              index === currentSlide
                ? 'w-8 bg-primary'
                : 'w-2 bg-gray-300 hover:bg-gray-400'
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
