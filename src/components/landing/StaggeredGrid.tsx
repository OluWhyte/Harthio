'use client';

import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface StaggeredGridProps {
  children: ReactNode[];
  className?: string;
}

export function StaggeredGrid({ children, className = '' }: StaggeredGridProps) {
  // Respect user's motion preferences
  const prefersReducedMotion = typeof window !== 'undefined'
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: prefersReducedMotion ? 0 : 0.1,
      },
    },
  };

  const item = prefersReducedMotion
    ? {
        hidden: { opacity: 0 },
        show: { opacity: 1 },
      }
    : {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0 },
      };

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className={className}
    >
      {children.map((child, i) => (
        <motion.div key={i} variants={item}>
          {child}
        </motion.div>
      ))}
    </motion.div>
  );
}
