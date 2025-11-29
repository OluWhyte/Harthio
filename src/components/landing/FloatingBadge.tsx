'use client';

import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface FloatingBadgeProps {
  children: ReactNode;
  delay?: number;
}

export function FloatingBadge({ children, delay = 0 }: FloatingBadgeProps) {
  // Respect user's motion preferences
  const prefersReducedMotion = typeof window !== 'undefined'
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;

  if (prefersReducedMotion) {
    return <div>{children}</div>;
  }

  return (
    <motion.div
      animate={{
        y: [0, -10, 0],
        rotate: [0, 2, 0, -2, 0],
      }}
      transition={{
        duration: 4,
        repeat: Infinity,
        ease: 'easeInOut',
        delay,
      }}
    >
      {children}
    </motion.div>
  );
}
