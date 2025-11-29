/**
 * Advanced Performance Metrics Collection
 * Phase 3 Performance Optimization
 */

export interface PerformanceMetrics {
  // Core Web Vitals
  FCP?: number; // First Contentful Paint
  LCP?: number; // Largest Contentful Paint
  FID?: number; // First Input Delay
  CLS?: number; // Cumulative Layout Shift
  TTFB?: number; // Time to First Byte
  
  // Custom metrics
  TTI?: number; // Time to Interactive
  TBT?: number; // Total Blocking Time
  
  // Navigation timing
  dns?: number;
  tcp?: number;
  request?: number;
  response?: number;
  dom?: number;
  load?: number;
  total?: number;
  
  // Resource timing
  resourceCount?: number;
  resourceSize?: number;
  
  // Page info
  url?: string;
  userAgent?: string;
  timestamp?: number;
}

class PerformanceMonitor {
  private metrics: PerformanceMetrics = {};
  private observers: PerformanceObserver[] = [];

  constructor() {
    if (typeof window === 'undefined') return;
    this.initializeObservers();
  }

  private initializeObservers() {
    // Observe paint timing (FCP, LCP)
    if ('PerformanceObserver' in window) {
      try {
        // LCP Observer
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1] as any;
          this.metrics.LCP = lastEntry.renderTime || lastEntry.loadTime;
        });
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
        this.observers.push(lcpObserver);

        // FID Observer
        const fidObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry: any) => {
            this.metrics.FID = entry.processingStart - entry.startTime;
          });
        });
        fidObserver.observe({ entryTypes: ['first-input'] });
        this.observers.push(fidObserver);

        // CLS Observer
        let clsValue = 0;
        const clsObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry: any) => {
            if (!entry.hadRecentInput) {
              clsValue += entry.value;
              this.metrics.CLS = clsValue;
            }
          });
        });
        clsObserver.observe({ entryTypes: ['layout-shift'] });
        this.observers.push(clsObserver);
      } catch (error) {
        console.error('[Performance] Observer error:', error);
      }
    }

    // Collect navigation timing on load
    window.addEventListener('load', () => {
      setTimeout(() => this.collectNavigationTiming(), 0);
    });
  }

  private collectNavigationTiming() {
    const perfData = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    
    if (perfData) {
      this.metrics.dns = perfData.domainLookupEnd - perfData.domainLookupStart;
      this.metrics.tcp = perfData.connectEnd - perfData.connectStart;
      this.metrics.request = perfData.responseStart - perfData.requestStart;
      this.metrics.response = perfData.responseEnd - perfData.responseStart;
      this.metrics.dom = perfData.domContentLoadedEventEnd - perfData.domContentLoadedEventStart;
      this.metrics.load = perfData.loadEventEnd - perfData.loadEventStart;
      this.metrics.total = perfData.loadEventEnd - perfData.fetchStart;
      this.metrics.TTFB = perfData.responseStart - perfData.requestStart;
      this.metrics.TTI = perfData.domInteractive - perfData.fetchStart;
      
      // FCP from paint timing
      const paintEntries = performance.getEntriesByType('paint');
      const fcpEntry = paintEntries.find(entry => entry.name === 'first-contentful-paint');
      if (fcpEntry) {
        this.metrics.FCP = fcpEntry.startTime;
      }
    }

    // Collect resource timing
    const resources = performance.getEntriesByType('resource');
    this.metrics.resourceCount = resources.length;
    this.metrics.resourceSize = resources.reduce((total: number, resource: any) => {
      return total + (resource.transferSize || 0);
    }, 0);

    // Add page info
    this.metrics.url = window.location.href;
    this.metrics.userAgent = navigator.userAgent;
    this.metrics.timestamp = Date.now();
  }

  getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  getScore(): { score: number; rating: 'good' | 'needs-improvement' | 'poor' } {
    const { FCP, LCP, FID, CLS, TTFB } = this.metrics;
    
    let score = 100;
    
    // FCP scoring (< 1.8s = good, < 3s = needs improvement, > 3s = poor)
    if (FCP) {
      if (FCP > 3000) score -= 20;
      else if (FCP > 1800) score -= 10;
    }
    
    // LCP scoring (< 2.5s = good, < 4s = needs improvement, > 4s = poor)
    if (LCP) {
      if (LCP > 4000) score -= 25;
      else if (LCP > 2500) score -= 15;
    }
    
    // FID scoring (< 100ms = good, < 300ms = needs improvement, > 300ms = poor)
    if (FID) {
      if (FID > 300) score -= 20;
      else if (FID > 100) score -= 10;
    }
    
    // CLS scoring (< 0.1 = good, < 0.25 = needs improvement, > 0.25 = poor)
    if (CLS) {
      if (CLS > 0.25) score -= 20;
      else if (CLS > 0.1) score -= 10;
    }
    
    // TTFB scoring (< 800ms = good, < 1800ms = needs improvement, > 1800ms = poor)
    if (TTFB) {
      if (TTFB > 1800) score -= 15;
      else if (TTFB > 800) score -= 5;
    }
    
    let rating: 'good' | 'needs-improvement' | 'poor';
    if (score >= 90) rating = 'good';
    else if (score >= 50) rating = 'needs-improvement';
    else rating = 'poor';
    
    return { score, rating };
  }

  sendToAnalytics() {
    const metrics = this.getMetrics();
    const score = this.getScore();
    
    // Send to Google Analytics
    if (typeof window.gtag !== 'undefined') {
      window.gtag('event', 'web_vitals', {
        event_category: 'Performance',
        event_label: score.rating,
        value: Math.round(score.score),
        fcp: Math.round(metrics.FCP || 0),
        lcp: Math.round(metrics.LCP || 0),
        fid: Math.round(metrics.FID || 0),
        cls: Math.round((metrics.CLS || 0) * 1000) / 1000,
        ttfb: Math.round(metrics.TTFB || 0),
      });
    }
    
    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.group('📊 Performance Metrics');
      console.log('Score:', score.score, `(${score.rating})`);
      console.log('FCP:', metrics.FCP?.toFixed(0), 'ms');
      console.log('LCP:', metrics.LCP?.toFixed(0), 'ms');
      console.log('FID:', metrics.FID?.toFixed(0), 'ms');
      console.log('CLS:', metrics.CLS?.toFixed(3));
      console.log('TTFB:', metrics.TTFB?.toFixed(0), 'ms');
      console.log('TTI:', metrics.TTI?.toFixed(0), 'ms');
      console.log('Total Load:', metrics.total?.toFixed(0), 'ms');
      console.log('Resources:', metrics.resourceCount, `(${(metrics.resourceSize! / 1024).toFixed(0)} KB)`);
      console.groupEnd();
    }
  }

  cleanup() {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
  }
}

// Singleton instance
let performanceMonitor: PerformanceMonitor | null = null;

export function initPerformanceMonitoring() {
  if (typeof window === 'undefined') return;
  
  if (!performanceMonitor) {
    performanceMonitor = new PerformanceMonitor();
    
    // Send metrics after page load
    window.addEventListener('load', () => {
      setTimeout(() => {
        performanceMonitor?.sendToAnalytics();
      }, 3000); // Wait 3s for all metrics to be collected
    });
  }
  
  return performanceMonitor;
}

export function getPerformanceMetrics(): PerformanceMetrics {
  return performanceMonitor?.getMetrics() || {};
}

export function getPerformanceScore() {
  return performanceMonitor?.getScore() || { score: 0, rating: 'poor' as const };
}

// Extend Window interface
declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
  }
}
