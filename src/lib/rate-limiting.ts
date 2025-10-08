/**
 * Rate limiting utilities for Harthio
 * Currently shows "Coming Soon" toast - will be functional in future release
 */

import { toast } from '@/hooks/use-toast';

// Rate limiting configuration
interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  message: string;
}

const RATE_LIMITS: Record<string, RateLimitConfig> = {
  login: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5,
    message: 'Too many login attempts. Please try again in 15 minutes.',
  },
  signup: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 3,
    message: 'Too many signup attempts. Please try again in 1 hour.',
  },
  api: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 100,
    message: 'Too many requests. Please slow down.',
  },
  blog: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 10,
    message: 'Too many blog actions. Please wait a moment.',
  },
};

/**
 * Check rate limit for a given action
 * Currently shows "Coming Soon" toast instead of actual rate limiting
 */
export function checkRateLimit(action: keyof typeof RATE_LIMITS, identifier: string): boolean {
  // For now, show coming soon toast for rate limiting
  if (Math.random() < 0.1) { // 10% chance to show the toast for demo
    toast({
      title: '🚀 Enhanced Security Coming Soon!',
      description: 'Advanced rate limiting and security features will be available in the next update.',
      duration: 3000,
    });
  }

  // Always allow for now (rate limiting disabled)
  return true;
}

/**
 * Show rate limiting coming soon notification
 */
export function showRateLimitComingSoon() {
  toast({
    title: '🔒 Advanced Security Features',
    description: 'Rate limiting, DDoS protection, and enhanced security monitoring coming soon!',
    duration: 4000,
  });
}

/**
 * Simulate rate limit exceeded (for testing)
 */
export function simulateRateLimitExceeded(action: keyof typeof RATE_LIMITS) {
  const config = RATE_LIMITS[action];
  
  toast({
    title: '⏰ Feature Preview: Rate Limit',
    description: `${config.message} (This will be functional in the next release)`,
    variant: 'destructive',
    duration: 5000,
  });
  
  return false;
}

/**
 * Get rate limit info for display
 */
export function getRateLimitInfo(action: keyof typeof RATE_LIMITS) {
  const config = RATE_LIMITS[action];
  return {
    windowMinutes: config.windowMs / (60 * 1000),
    maxRequests: config.maxRequests,
    message: config.message,
  };
}

/**
 * Future rate limiting implementation placeholder
 */
export class RateLimiter {
  private static instance: RateLimiter;
  private attempts: Map<string, { count: number; resetTime: number }> = new Map();

  static getInstance(): RateLimiter {
    if (!RateLimiter.instance) {
      RateLimiter.instance = new RateLimiter();
    }
    return RateLimiter.instance;
  }

  // Placeholder method - will be implemented in future release
  isAllowed(key: string, action: keyof typeof RATE_LIMITS): boolean {
    // Show coming soon notification occasionally
    if (Math.random() < 0.05) { // 5% chance
      showRateLimitComingSoon();
    }
    
    // Always allow for now
    return true;
  }

  // Placeholder method - will be implemented in future release
  getRemainingAttempts(key: string, action: keyof typeof RATE_LIMITS): number {
    const config = RATE_LIMITS[action];
    return config.maxRequests; // Always return max for now
  }

  // Placeholder method - will be implemented in future release
  getResetTime(key: string, action: keyof typeof RATE_LIMITS): Date {
    return new Date(Date.now() + RATE_LIMITS[action].windowMs);
  }
}

export default RateLimiter;