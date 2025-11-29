'use client';

import { motion } from 'framer-motion';
import { Target, CheckCircle, Trophy } from 'lucide-react';

/**
 * Simplified tracker card for hero carousel
 * Recreates the original tracker design in a compact format
 */
export function TrackerHeroCard() {
  return (
    <div className="relative w-full h-[320px] sm:h-[380px] md:h-[420px] lg:h-[480px] rounded-xl sm:rounded-2xl overflow-hidden bg-gradient-to-br from-accent/5 via-primary/5 to-accent/5 shadow-2xl flex items-center justify-center p-6">
      {/* Pulse rings */}
      <motion.div
        animate={{
          scale: [1, 1.5, 1],
          opacity: [0.3, 0, 0.3],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: 'easeOut',
        }}
        className="absolute inset-0 rounded-2xl border-4 border-accent/50"
      />
      <motion.div
        animate={{
          scale: [1, 1.8, 1],
          opacity: [0.2, 0, 0.2],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: 'easeOut',
          delay: 0.5,
        }}
        className="absolute inset-0 rounded-2xl border-4 border-accent/30"
      />

      {/* Main content */}
      <div className="relative z-10 w-full flex flex-col items-center justify-center text-center">
        {/* Rotating icon */}
        <motion.div
          animate={{
            rotate: [0, 360],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: 'linear',
          }}
          className="mb-6"
        >
          <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-full bg-accent flex items-center justify-center shadow-lg">
            <Target className="h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 text-white" />
          </div>
        </motion.div>

        {/* Counter */}
        <div className="mb-6">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold text-accent"
          >
            45
          </motion.div>
          <p className="text-lg sm:text-xl md:text-2xl font-semibold text-gray-700 mt-2">
            Days Alcohol Free
          </p>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-3 gap-3 sm:gap-4 md:gap-6 text-center w-full max-w-md mx-auto mb-6">
          <div className="flex flex-col items-center">
            <p className="text-xl sm:text-2xl md:text-3xl font-bold text-accent">
              1,080
            </p>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">Hours</p>
          </div>
          <div className="flex flex-col items-center">
            <p className="text-xl sm:text-2xl md:text-3xl font-bold text-primary">
              64,800
            </p>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">Minutes</p>
          </div>
          <div className="flex flex-col items-center">
            <p className="text-xl sm:text-2xl md:text-3xl font-bold text-accent">
              3.8M
            </p>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">Seconds</p>
          </div>
        </div>

        {/* Streak indicator */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="flex items-center justify-center gap-2 text-green-600 bg-green-50 px-4 py-2 rounded-full"
        >
          <CheckCircle className="h-5 w-5" />
          <p className="text-sm font-medium">Streak Active!</p>
        </motion.div>

        {/* Milestone badges */}
        <div className="grid grid-cols-3 gap-4 mt-6 w-full max-w-sm">
          {[
            { days: 7, label: 'First Week' },
            { days: 30, label: 'One Month' },
            { days: 90, label: 'Three Months' },
          ].map((milestone, index) => (
            <motion.div
              key={milestone.days}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.7 + index * 0.1, type: 'spring' }}
              className="flex flex-col items-center"
            >
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-accent flex items-center justify-center shadow-md mb-1">
                <Trophy className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              </div>
              <p className="font-bold text-xs sm:text-sm">{milestone.days}d</p>
              <p className="text-[10px] sm:text-xs text-gray-500">{milestone.label}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
