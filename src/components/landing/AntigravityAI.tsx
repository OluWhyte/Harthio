'use client';

import { motion } from 'framer-motion';
import { 
  Sparkles, Brain, MessageCircle, Heart, Zap, Shield, TrendingUp,
  Star, Lightbulb, Target, Users, Clock, CheckCircle
} from 'lucide-react';

// Enhanced floating icon with more chaotic, organic movement
function FloatingIcon({ 
  icon: Icon, 
  delay = 0, 
  duration = 4,
  x = [0, 30, 0],
  y = [0, -40, 0],
  rotate = [0, 10, 0],
  scale = [1, 1.1, 1],
  className = '',
  color = 'text-purple-500'
}: any) {
  return (
    <motion.div
      animate={{
        x,
        y,
        rotate,
        scale,
      }}
      transition={{
        duration,
        repeat: Infinity,
        ease: 'easeInOut',
        delay,
      }}
      className={`absolute ${className}`}
    >
      <motion.div 
        className={`p-3 sm:p-4 rounded-2xl bg-white/90 backdrop-blur-sm shadow-lg ${color}`}
        whileHover={{ scale: 1.2, rotate: 360 }}
        transition={{ duration: 0.3 }}
      >
        <Icon className="h-6 w-6 sm:h-8 sm:w-8" />
      </motion.div>
    </motion.div>
  );
}

// Floating particle effect
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
      className="absolute w-2 h-2 rounded-full bg-white/60"
      style={{ left: `${x}%`, top: `${y}%` }}
    />
  );
}

export function AntigravityAI() {
  return (
    <div className="relative w-full h-[320px] sm:h-[380px] md:h-[420px] lg:h-[480px] rounded-xl sm:rounded-2xl overflow-hidden bg-transparent">
      {/* Transparent background - no card visible, just floating elements */}
      
      {/* Subtle animated glow effects - very light */}
      <motion.div 
        animate={{
          x: [0, 50, 0],
          y: [0, -30, 0],
          scale: [1, 1.2, 1],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className="absolute top-1/4 left-1/4 w-64 h-64 bg-gray-100/40 rounded-full blur-3xl" 
      />
      <motion.div 
        animate={{
          x: [0, -40, 0],
          y: [0, 40, 0],
          scale: [1, 1.3, 1],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: 1,
        }}
        className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-gray-100/40 rounded-full blur-3xl" 
      />
      <motion.div 
        animate={{
          x: [0, 30, 0],
          y: [0, -50, 0],
          scale: [1, 1.15, 1],
        }}
        transition={{
          duration: 7,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: 2,
        }}
        className="absolute top-1/2 right-1/3 w-48 h-48 bg-gray-50/40 rounded-full blur-3xl" 
      />
      
      {/* Floating particles */}
      {[...Array(12)].map((_, i) => (
        <FloatingParticle 
          key={i} 
          delay={i * 0.5} 
          x={10 + (i * 7)} 
          y={20 + (i * 5)} 
        />
      ))}
      
      {/* Central AI Icon - Enhanced */}
      <div className="absolute inset-0 flex items-center justify-center">
        <motion.div
          animate={{
            scale: [1, 1.08, 1.05, 1.1, 1],
            rotate: [0, 3, -2, 5, 0, -3, 0],
            y: [0, -8, 0, -5, 0],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="relative"
        >
          <motion.div 
            className="w-24 h-24 sm:w-32 sm:h-32 md:w-40 md:h-40 rounded-3xl bg-white/95 backdrop-blur-sm shadow-2xl flex items-center justify-center"
            whileHover={{ scale: 1.15, rotate: 10 }}
            transition={{ duration: 0.3 }}
          >
            <motion.div
              animate={{
                rotate: [0, 360],
              }}
              transition={{
                duration: 20,
                repeat: Infinity,
                ease: 'linear',
              }}
            >
              <Brain className="h-12 w-12 sm:h-16 sm:w-16 md:h-20 md:w-20 text-purple-600" />
            </motion.div>
          </motion.div>
          
          {/* Multiple pulse rings */}
          {[0, 0.3, 0.6, 0.9].map((delay, i) => (
            <motion.div
              key={i}
              animate={{
                scale: [1, 2 + (i * 0.2), 1],
                opacity: [0.5, 0, 0.5],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: 'easeOut',
                delay,
              }}
              className="absolute inset-0 rounded-3xl border-4 border-white/40"
            />
          ))}
        </motion.div>
      </div>
      
      {/* Floating Icons - Enhanced Antigravity Chaos */}
      <FloatingIcon
        icon={Sparkles}
        delay={0}
        duration={5}
        x={[0, 45, -20, 40, 0]}
        y={[0, -50, -30, -60, 0]}
        rotate={[0, 180, 90, 270, 360]}
        scale={[1, 1.2, 0.9, 1.15, 1]}
        className="top-[15%] left-[10%]"
        color="text-yellow-400"
      />
      
      <FloatingIcon
        icon={MessageCircle}
        delay={0.5}
        duration={4.5}
        x={[0, -35, 20, -30, 0]}
        y={[0, -40, -20, -50, 0]}
        rotate={[0, -120, -60, -180, 0]}
        scale={[1, 0.9, 1.2, 1.1, 1]}
        className="top-[20%] right-[15%]"
        color="text-blue-500"
      />
      
      <FloatingIcon
        icon={Heart}
        delay={1}
        duration={5.5}
        x={[0, 40, 20, 35, 0]}
        y={[0, 50, 30, 45, 0]}
        rotate={[0, 90, 180, 270, 360]}
        scale={[1, 1.15, 1, 1.2, 1]}
        className="bottom-[25%] left-[15%]"
        color="text-pink-500"
      />
      
      <FloatingIcon
        icon={Zap}
        delay={1.5}
        duration={4}
        x={[0, -45, -20, -40, 0]}
        y={[0, -40, -20, -35, 0]}
        rotate={[0, -90, -180, -270, -360]}
        scale={[1, 1.1, 1.2, 0.95, 1]}
        className="bottom-[20%] right-[10%]"
        color="text-yellow-500"
      />
      
      <FloatingIcon
        icon={Shield}
        delay={0.8}
        duration={4.8}
        x={[0, 30, -15, 25, 0]}
        y={[0, -50, -25, -45, 0]}
        rotate={[0, 45, 90, 135, 180]}
        scale={[1, 1.2, 1.05, 1.15, 1]}
        className="top-[45%] left-[5%]"
        color="text-green-500"
      />
      
      <FloatingIcon
        icon={TrendingUp}
        delay={1.2}
        duration={5.2}
        x={[0, -40, -15, -35, 0]}
        y={[0, 45, 25, 40, 0]}
        rotate={[0, -60, -120, -180, -240]}
        scale={[1, 0.95, 1.15, 1.05, 1]}
        className="top-[50%] right-[8%]"
        color="text-emerald-500"
      />
      
      {/* Additional floating icons for more chaos */}
      <FloatingIcon
        icon={Star}
        delay={0.3}
        duration={6}
        x={[0, 50, 25, 45, 0]}
        y={[0, -35, -60, -40, 0]}
        rotate={[0, 360, 180, 270, 0]}
        scale={[1, 1.3, 0.9, 1.1, 1]}
        className="top-[35%] left-[20%] hidden md:block"
        color="text-amber-400"
      />
      
      <FloatingIcon
        icon={Lightbulb}
        delay={1.8}
        duration={5.5}
        x={[0, -30, -50, -25, 0]}
        y={[0, 40, 20, 50, 0]}
        rotate={[0, -45, -90, -135, -180]}
        scale={[1, 1.1, 1.25, 0.95, 1]}
        className="bottom-[35%] right-[20%] hidden md:block"
        color="text-orange-400"
      />
      
      <FloatingIcon
        icon={Target}
        delay={2.2}
        duration={4.2}
        x={[0, 35, -20, 30, 0]}
        y={[0, -45, -25, -55, 0]}
        rotate={[0, 120, 240, 360, 480]}
        scale={[1, 1.15, 1.05, 1.2, 1]}
        className="top-[60%] left-[25%] hidden lg:block"
        color="text-red-500"
      />
      
      <FloatingIcon
        icon={Users}
        delay={0.6}
        duration={5.8}
        x={[0, -40, -20, -45, 0]}
        y={[0, -30, -50, -35, 0]}
        rotate={[0, -150, -300, -450, -600]}
        scale={[1, 1.2, 0.9, 1.15, 1]}
        className="top-[25%] right-[25%] hidden lg:block"
        color="text-indigo-500"
      />
      
      <FloatingIcon
        icon={Clock}
        delay={1.4}
        duration={4.6}
        x={[0, 40, 20, 35, 0]}
        y={[0, 35, 55, 40, 0]}
        rotate={[0, 90, 180, 270, 360]}
        scale={[1, 0.95, 1.2, 1.05, 1]}
        className="bottom-[40%] left-[8%] hidden lg:block"
        color="text-cyan-500"
      />
      
      <FloatingIcon
        icon={CheckCircle}
        delay={2.5}
        duration={5.3}
        x={[0, -35, -15, -40, 0]}
        y={[0, 45, 25, 50, 0]}
        rotate={[0, -180, -360, -540, -720]}
        scale={[1, 1.1, 1.15, 0.95, 1]}
        className="bottom-[15%] right-[22%] hidden lg:block"
        color="text-teal-500"
      />
      
      {/* Enhanced floating text labels with more movement */}
      <motion.div
        animate={{
          y: [0, -25, -10, -20, 0],
          x: [0, 10, -5, 8, 0],
          opacity: [0.7, 1, 0.8, 1, 0.7],
          rotate: [0, 2, -1, 1, 0],
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className="absolute top-[10%] left-[20%] hidden lg:block"
      >
        <div className="px-4 py-2 rounded-full bg-white/90 backdrop-blur-sm shadow-lg text-sm font-medium text-purple-600">
          24/7 Available
        </div>
      </motion.div>
      
      <motion.div
        animate={{
          y: [0, 25, 10, 20, 0],
          x: [0, -12, 6, -10, 0],
          opacity: [0.7, 1, 0.8, 1, 0.7],
          rotate: [0, -2, 1, -1, 0],
        }}
        transition={{
          duration: 7,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: 1,
        }}
        className="absolute bottom-[15%] right-[20%] hidden lg:block"
      >
        <div className="px-4 py-2 rounded-full bg-white/90 backdrop-blur-sm shadow-lg text-sm font-medium text-pink-600">
          Evidence-Based
        </div>
      </motion.div>
      
      <motion.div
        animate={{
          y: [0, -18, -8, -15, 0],
          x: [0, 8, -10, 5, 0],
          opacity: [0.7, 1, 0.8, 1, 0.7],
          rotate: [0, 1, -2, 1, 0],
        }}
        transition={{
          duration: 5.5,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: 0.5,
        }}
        className="absolute top-[60%] left-[12%] hidden md:block"
      >
        <div className="px-4 py-2 rounded-full bg-white/90 backdrop-blur-sm shadow-lg text-sm font-medium text-blue-600">
          Crisis Detection
        </div>
      </motion.div>
      
      <motion.div
        animate={{
          y: [0, 20, 8, 18, 0],
          x: [0, -15, 7, -12, 0],
          opacity: [0.7, 1, 0.8, 1, 0.7],
          rotate: [0, -1, 2, -1, 0],
        }}
        transition={{
          duration: 6.5,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: 1.5,
        }}
        className="absolute top-[30%] right-[12%] hidden xl:block"
      >
        <div className="px-4 py-2 rounded-full bg-white/90 backdrop-blur-sm shadow-lg text-sm font-medium text-emerald-600">
          Smart Matching
        </div>
      </motion.div>
      
      <motion.div
        animate={{
          y: [0, -22, -12, -20, 0],
          x: [0, 12, -8, 10, 0],
          opacity: [0.7, 1, 0.8, 1, 0.7],
          rotate: [0, 2, -1, 2, 0],
        }}
        transition={{
          duration: 5.8,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: 2,
        }}
        className="absolute bottom-[35%] left-[18%] hidden xl:block"
      >
        <div className="px-4 py-2 rounded-full bg-white/90 backdrop-blur-sm shadow-lg text-sm font-medium text-orange-600">
          Personalized
        </div>
      </motion.div>
    </div>
  );
}
