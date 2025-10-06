import { NextRequest, NextResponse } from 'next/server';

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

const store: RateLimitStore = {};

export interface RateLimitOptions {
  windowMs: number;
  maxRequests: number;
  message?: string;
  skipSuccessfulRequests?: boolean;
}

export function rateLimit(options: RateLimitOptions) {
  return (req: NextRequest): NextResponse | null => {
    const ip = req.ip || req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    const now = Date.now();
    const windowStart = now - options.windowMs;
    
    // Clean old entries
    Object.keys(store).forEach(key => {
      if (store[key].resetTime < windowStart) {
        delete store[key];
      }
    });
    
    // Check current IP
    if (!store[ip]) {
      store[ip] = { count: 1, resetTime: now + options.windowMs };
      return null; // Allow request
    }
    
    if (store[ip].count >= options.maxRequests) {
      return NextResponse.json(
        { 
          error: options.message || 'Too many requests. Please try again later.',
          retryAfter: Math.ceil((store[ip].resetTime - now) / 1000)
        },
        { 
          status: 429,
          headers: {
            'Retry-After': Math.ceil((store[ip].resetTime - now) / 1000).toString(),
            'X-RateLimit-Limit': options.maxRequests.toString(),
            'X-RateLimit-Remaining': Math.max(0, options.maxRequests - store[ip].count).toString(),
            'X-RateLimit-Reset': new Date(store[ip].resetTime).toISOString()
          }
        }
      );
    }
    
    store[ip].count++;
    return null; // Allow request
  };
}

// Predefined rate limiters for different use cases
export const strictRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 5,
  message: 'Too many requests from this IP. Please try again in 15 minutes.'
});

export const moderateRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 10,
  message: 'Too many requests. Please wait a minute before trying again.'
});

export const lenientRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 30,
  message: 'Rate limit exceeded. Please slow down your requests.'
});

// API-specific rate limiters
export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 5,
  message: 'Too many authentication attempts. Please try again in 15 minutes.'
});

export const emailRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  maxRequests: 3,
  message: 'Too many emails sent. Please try again in an hour.'
});

export const messageRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 20,
  message: 'Too many messages. Please slow down.'
});