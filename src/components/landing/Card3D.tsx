'use client';

import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface Card3DProps {
  children: ReactNode;
  className?: string;
}

export function Card3D({ children, className = '' }: Card3DProps) {
  // Respect user's motion preferences
  const prefersReducedMotion = typeof window !== 'undefined'
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;

  const hoverEffect = prefersReducedMotion
    ? { scale: 1.02 }
    : {
        rotateX: 5,
        rotateY: 5,
        scale: 1.05,
      };

  return (
    <motion.div
      whileHover={hoverEffect}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      style={{
        transformStyle: 'preserve-3d',
        perspective: 1000,
      }}
      className={`relative ${className}`}
    >
      {children}
    </motion.div>
  );
}
