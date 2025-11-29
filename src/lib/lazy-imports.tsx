/**
 * Lazy Import Utilities for Code Splitting
 * Phase 2 Performance Optimization - Reduce Bundle Size
 */

import dynamic from 'next/dynamic';

/**
 * Lazy load heavy chart components
 */
export const LazyRecharts = {
  LineChart: dynamic(() => import('recharts').then(mod => mod.LineChart), {
    ssr: false,
    loading: () => <div className="h-64 animate-pulse bg-gray-100 rounded"></div>,
  }),
  BarChart: dynamic(() => import('recharts').then(mod => mod.BarChart), {
    ssr: false,
    loading: () => <div className="h-64 animate-pulse bg-gray-100 rounded"></div>,
  }),
};

/**
 * Lazy load PDF generation (only when needed)
 */
export const LazyPDF = {
  jsPDF: () => import('jspdf').then(mod => mod.default),
  autoTable: () => import('jspdf-autotable').then(mod => mod.default),
};

/**
 * Lazy load Framer Motion components (for below-fold animations)
 */
export const LazyMotion = {
  motion: dynamic(() => import('framer-motion').then(mod => ({ default: mod.motion.div })), {
    ssr: false,
  }),
};

/**
 * Lazy load heavy UI components
 */
export const LazyComponents = {
  // Calendar picker (heavy date-fns dependency)
  Calendar: dynamic(() => import('@/components/ui/calendar').then(mod => ({ default: mod.Calendar })), {
    ssr: false,
    loading: () => <div className="h-80 animate-pulse bg-gray-100 rounded"></div>,
  }),
};

/**
 * Preload critical resources
 */
export function preloadCriticalResources() {
  if (typeof window === 'undefined') return;
  
  // Preconnect to external services
  const preconnectSupabase = document.createElement('link');
  preconnectSupabase.rel = 'preconnect';
  preconnectSupabase.href = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  
  const preconnectImages = document.createElement('link');
  preconnectImages.rel = 'preconnect';
  preconnectImages.href = 'https://images.unsplash.com';
  
  document.head.appendChild(preconnectSupabase);
  document.head.appendChild(preconnectImages);
}
