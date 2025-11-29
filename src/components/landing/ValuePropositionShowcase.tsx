'use client';

import { motion } from 'framer-motion';
import { Users, Calendar, Heart } from 'lucide-react';
import { Card3D } from './Card3D';

// Floating particle for background
function FloatingParticle({ delay = 0, x = 0, y = 0 }: any) {
  return (
    <motion.div
      animate={{
        y: [y, y - 100, y],
        x: [x, x + 50, x - 30, x],
        opacity: [0, 1, 1, 0],
        scale: [0, 1, 1, 0],
      }}
      transition={{
        duration: 8,
        repeat: Infinity,
        ease: 'easeInOut',
        delay,
      }}
      className="absolute w-2 h-2 rounded-full bg-primary/40"
      style={{ left: `${x}%`, top: `${y}%` }}
    />
  );
}

export function ValuePropositionShowcase() {
  return (
    <section className="w-full py-12 sm:py-16 md:py-20 lg:py-24 relative overflow-hidden">
      {/* No background color - clean white */}

      {/* Floating particles */}
      {[...Array(12)].map((_, i) => (
        <FloatingParticle key={i} delay={i * 0.4} x={10 + (i * 7)} y={20 + (i * 5)} />
      ))}

      {/* Animated glow effects */}
      <motion.div
        animate={{
          x: [0, 50, 0],
          y: [0, -30, 0],
          scale: [1, 1.2, 1],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl"
      />
      <motion.div
        animate={{
          x: [0, -40, 0],
          y: [0, 40, 0],
          scale: [1, 1.3, 1],
        }}
        transition={{
          duration: 12,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: 1,
        }}
        className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl"
      />

      <div className="container px-4 sm:px-6 md:px-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-10 sm:mb-14 md:mb-16"
        >
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 sm:mb-5 md:mb-6 leading-tight">
            Why Harthio Heals Loneliness
          </h2>
          <p className="text-lg sm:text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto px-4 leading-relaxed">
            We understand the pain of feeling isolated in your struggles.
            Here&apos;s how we create genuine connections.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {/* Card 1 - Perfect Matches */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="sm:col-span-2 lg:col-span-1"
          >
            <Card3D>
              <div className="glass-card p-4 sm:p-6 text-center h-full border-2 border-primary/20 hover:border-primary/40 transition-colors">
                <motion.div
                  animate={{
                    rotate: [0, 5, -5, 0],
                    scale: [1, 1.05, 1],
                  }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                  className="w-12 h-12 sm:w-16 sm:h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4"
                >
                  <Users className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
                </motion.div>
                <h3 className="text-lg sm:text-xl font-semibold mb-2">
                  Perfect Matches, Not Randoms
                </h3>
                <p className="text-sm sm:text-base text-gray-600 mb-3 sm:mb-4">
                  &quot;I need advice but don&apos;t know who to ask&quot;
                </p>
                <p className="text-xs sm:text-sm font-medium text-primary">
                  → Get matched with vetted mentors who&apos;ve been there
                </p>
              </div>
            </Card3D>
          </motion.div>

          {/* Card 2 - Scheduled Talks */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <Card3D>
              <div className="glass-card p-4 sm:p-6 text-center h-full border-2 border-accent/20 hover:border-accent/40 transition-colors">
                <motion.div
                  animate={{
                    rotate: [0, -5, 5, 0],
                    scale: [1, 1.05, 1],
                  }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: 'easeInOut',
                    delay: 0.5,
                  }}
                  className="w-12 h-12 sm:w-16 sm:h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4"
                >
                  <Calendar className="h-6 w-6 sm:h-8 sm:w-8 text-accent" />
                </motion.div>
                <h3 className="text-lg sm:text-xl font-semibold mb-2">
                  Scheduled, Intentional Talks
                </h3>
                <p className="text-sm sm:text-base text-gray-600 mb-3 sm:mb-4">
                  &quot;Tired of flaky Zoom strangers&quot;
                </p>
                <p className="text-xs sm:text-sm font-medium text-accent">
                  → Scheduled, intention-based calls that actually happen
                </p>
              </div>
            </Card3D>
          </motion.div>

          {/* Card 3 - Safe Space */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <Card3D>
              <div className="glass-card p-4 sm:p-6 text-center h-full border-2 border-primary/20 hover:border-primary/40 transition-colors">
                <motion.div
                  animate={{
                    scale: [1, 1.1, 1],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: 'easeInOut',
                    delay: 1,
                  }}
                  className="w-12 h-12 sm:w-16 sm:h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4"
                >
                  <Heart className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
                </motion.div>
                <h3 className="text-lg sm:text-xl font-semibold mb-2">
                  Safe Space to Be Vulnerable
                </h3>
                <p className="text-sm sm:text-base text-gray-600 mb-3 sm:mb-4">
                  &quot;Can&apos;t afford therapy but need to vent&quot;
                </p>
                <p className="text-xs sm:text-sm font-medium text-primary">
                  → Free listener volunteers who truly care
                </p>
              </div>
            </Card3D>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
