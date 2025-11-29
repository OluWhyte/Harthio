'use client';

import { motion } from 'framer-motion';
import { TrendingUp, Calendar, Award, Target, CheckCircle, Trophy, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import CountUp from 'react-countup';
import { useInView } from 'react-intersection-observer';
import { Card3D } from './Card3D';
import { MagneticButton } from './MagneticButton';

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
      className="absolute w-2 h-2 rounded-full bg-accent/60"
      style={{ left: `${x}%`, top: `${y}%` }}
    />
  );
}

// Milestone badge component
function MilestoneBadge({ days, label, delay = 0 }: any) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ delay, type: 'spring', stiffness: 200 }}
      className="flex flex-col items-center"
    >
      <motion.div
        animate={{
          rotate: [0, 5, -5, 0],
          scale: [1, 1.05, 1],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-accent flex items-center justify-center shadow-lg mb-2"
      >
        <Trophy className="h-8 w-8 sm:h-10 sm:w-10 text-white" />
      </motion.div>
      <p className="font-bold text-sm sm:text-base">{days} Days</p>
      <p className="text-xs text-gray-500">{label}</p>
    </motion.div>
  );
}

export function RecoveryTrackerShowcase() {
  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.3,
  });

  return (
    <section className="w-full py-12 sm:py-16 md:py-20 lg:py-24 relative overflow-hidden">
      {/* No background color - clean white like testimonials */}
      
      {/* Floating particles */}
      {[...Array(15)].map((_, i) => (
        <FloatingParticle key={i} delay={i * 0.4} x={10 + (i * 6)} y={20 + (i * 4)} />
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
        className="absolute top-1/4 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl"
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
        className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl"
      />

      <div className="container px-4 sm:px-6 md:px-8 relative z-10" ref={ref}>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8 sm:mb-12"
        >
          <Badge className="mb-4 bg-accent text-white px-4 py-2">
            <TrendingUp className="h-4 w-4 mr-2" />
            Recovery Tracking
          </Badge>
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4 text-accent">
            Track Your Recovery Journey
          </h2>
          <p className="text-base sm:text-lg md:text-xl text-gray-600 max-w-3xl mx-auto">
            Watch your progress unfold in real-time with live counters, daily check-ins, and milestone celebrations.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center mb-12">
          {/* Animated Counter Display */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative"
          >
            <div className="glass-card p-6 sm:p-8 md:p-10 lg:p-12 rounded-2xl shadow-2xl relative overflow-hidden flex items-center justify-center min-h-[400px] sm:min-h-[450px]">
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

              <div className="relative z-10 w-full flex flex-col items-center justify-center text-center">
                <motion.div
                  animate={{
                    rotate: [0, 360],
                  }}
                  transition={{
                    duration: 20,
                    repeat: Infinity,
                    ease: 'linear',
                  }}
                  className="mb-4"
                >
                  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-accent flex items-center justify-center mx-auto">
                    <Target className="h-10 w-10 sm:h-12 sm:w-12 text-white" />
                  </div>
                </motion.div>

                <div className="mb-6 w-full">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={inView ? { scale: 1 } : {}}
                    transition={{ duration: 0.5, delay: 0.3 }}
                    className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold text-accent"
                  >
                    {inView && <CountUp end={45} duration={2.5} />}
                  </motion.div>
                  <p className="text-lg sm:text-xl md:text-2xl font-semibold text-gray-700 mt-2">
                    Days Alcohol Free
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-2 sm:gap-3 md:gap-4 text-center w-full max-w-md mx-auto">
                  <div className="flex flex-col items-center">
                    <p className="text-xl sm:text-2xl md:text-3xl font-bold text-accent break-words">
                      {inView && <CountUp end={1080} duration={2} />}
                    </p>
                    <p className="text-xs sm:text-sm text-gray-500 mt-1">Hours</p>
                  </div>
                  <div className="flex flex-col items-center">
                    <p className="text-xl sm:text-2xl md:text-3xl font-bold text-primary break-words">
                      {inView && <CountUp end={64800} duration={2} />}
                    </p>
                    <p className="text-xs sm:text-sm text-gray-500 mt-1">Minutes</p>
                  </div>
                  <div className="flex flex-col items-center">
                    <p className="text-xl sm:text-2xl md:text-3xl font-bold text-accent break-words">
                      {inView && <CountUp end={3888000} duration={2} separator="," />}
                    </p>
                    <p className="text-xs sm:text-sm text-gray-500 mt-1">Seconds</p>
                  </div>
                </div>

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1 }}
                  className="mt-6 flex items-center justify-center gap-2 text-green-600"
                >
                  <CheckCircle className="h-5 w-5" />
                  <p className="text-sm font-medium">Streak Active!</p>
                </motion.div>
              </div>
            </div>

            {/* Milestone badges */}
            <div className="grid grid-cols-3 gap-4 mt-6">
              <MilestoneBadge days={7} label="First Week" delay={0.5} />
              <MilestoneBadge days={30} label="One Month" delay={0.7} />
              <MilestoneBadge days={90} label="Three Months" delay={0.9} />
            </div>
          </motion.div>

          {/* Features Grid */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="grid grid-cols-2 gap-4 sm:gap-6">
              <Card3D>
                <div className="glass-card p-4 sm:p-6 h-full">
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <Zap className="h-8 w-8 sm:h-10 sm:w-10 mb-3 text-accent" />
                  </motion.div>
                  <h3 className="font-semibold mb-2 text-sm sm:text-base">Real-Time Counter</h3>
                  <p className="text-xs sm:text-sm text-gray-600">Live updates down to the second</p>
                  <div className="mt-3">
                    <CheckCircle className="h-4 w-4 text-green-500 inline mr-1" />
                    <span className="text-xs text-gray-500">Always accurate</span>
                  </div>
                </div>
              </Card3D>

              <Card3D>
                <div className="glass-card p-4 sm:p-6 h-full">
                  <motion.div
                    animate={{ rotate: [0, 10, 0] }}
                    transition={{ duration: 3, repeat: Infinity }}
                  >
                    <Target className="h-8 w-8 sm:h-10 sm:w-10 mb-3 text-accent" />
                  </motion.div>
                  <h3 className="font-semibold mb-2 text-sm sm:text-base">Multiple Trackers</h3>
                  <p className="text-xs sm:text-sm text-gray-600">Track different goals simultaneously</p>
                  <div className="mt-3">
                    <CheckCircle className="h-4 w-4 text-green-500 inline mr-1" />
                    <span className="text-xs text-gray-500">Unlimited trackers</span>
                  </div>
                </div>
              </Card3D>

              <Card3D>
                <div className="glass-card p-4 sm:p-6 h-full">
                  <motion.div
                    animate={{ y: [0, -5, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <Calendar className="h-8 w-8 sm:h-10 sm:w-10 mb-3 text-accent" />
                  </motion.div>
                  <h3 className="font-semibold mb-2 text-sm sm:text-base">Daily Check-Ins</h3>
                  <p className="text-xs sm:text-sm text-gray-600">Build consistency with daily logs</p>
                  <div className="mt-3">
                    <CheckCircle className="h-4 w-4 text-green-500 inline mr-1" />
                    <span className="text-xs text-gray-500">Streak tracking</span>
                  </div>
                </div>
              </Card3D>

              <Card3D>
                <div className="glass-card p-4 sm:p-6 h-full">
                  <motion.div
                    animate={{ rotate: [0, -10, 0] }}
                    transition={{ duration: 3, repeat: Infinity }}
                  >
                    <Award className="h-8 w-8 sm:h-10 sm:w-10 mb-3 text-accent" />
                  </motion.div>
                  <h3 className="font-semibold mb-2 text-sm sm:text-base">Milestones</h3>
                  <p className="text-xs sm:text-sm text-gray-600">Celebrate every achievement</p>
                  <div className="mt-3">
                    <CheckCircle className="h-4 w-4 text-green-500 inline mr-1" />
                    <span className="text-xs text-gray-500">Auto celebrations</span>
                  </div>
                </div>
              </Card3D>
            </div>
          </motion.div>
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="text-center"
        >
          <MagneticButton>
            <Button size="lg" className="shadow-xl hover:shadow-2xl bg-accent hover:bg-accent/90" asChild>
              <Link href="/signup">
                <TrendingUp className="mr-2 h-5 w-5" />
                Start Tracking Free
              </Link>
            </Button>
          </MagneticButton>
        </motion.div>
      </div>
    </section>
  );
}
