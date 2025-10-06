/**
 * Security configuration and constants
 */

export const SECURITY_CONFIG = {
  // Rate limiting configurations
  RATE_LIMITS: {
    AUTH: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxRequests: 5,
      message: 'Too many authentication attempts. Please try again in 15 minutes.'
    },
    EMAIL: {
      windowMs: 60 * 60 * 1000, // 1 hour
      maxRequests: 3,
      message: 'Too many emails sent. Please try again in an hour.'
    },
    API: {
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 30,
      message: 'Too many API requests. Please slow down.'
    },
    MESSAGE: {
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 20,
      message: 'Too many messages. Please slow down.'
    }
  },

  // Input validation limits
  INPUT_LIMITS: {
    TOPIC_TITLE: { min: 3, max: 100 },
    TOPIC_DESCRIPTION: { min: 10, max: 500 },
    MESSAGE: { min: 1, max: 1000 },
    DISPLAY_NAME: { min: 2, max: 50 },
    EMAIL: { max: 254 },
    JOIN_REQUEST_MESSAGE: { max: 200 }
  },

  // Session configuration
  SESSION: {
    MAX_DURATION_HOURS: 4,
    EARLY_JOIN_MINUTES: 15,
    MAX_FUTURE_DAYS: 30
  },

  // Security headers
  HEADERS: {
    CSP: {
      'default-src': "'self'",
      'script-src': "'self' 'unsafe-inline' 'unsafe-eval' https://js.supabase.co",
      'style-src': "'self' 'unsafe-inline' https://fonts.googleapis.com",
      'img-src': "'self' data: https: blob:",
      'font-src': "'self' https://fonts.gstatic.com",
      'connect-src': "'self' wss: https: ws:",
      'media-src': "'self' blob:",
      'frame-src': "'none'",
      'object-src': "'none'",
      'base-uri': "'self'",
      'form-action': "'self'"
    },
    SECURITY: {
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains'
    }
  },

  // Suspicious activity patterns
  SUSPICIOUS_PATTERNS: {
    USER_AGENTS: [
      /bot/i,
      /crawler/i,
      /spider/i,
      /scraper/i,
      /curl/i,
      /wget/i,
      /python/i,
      /php/i
    ],
    SQL_INJECTION: [
      /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION)\b)/i,
      /(\b(OR|AND)\s+\d+\s*=\s*\d+)/i,
      /(--|\/\*|\*\/)/,
      /(\b(SCRIPT|JAVASCRIPT|VBSCRIPT|ONLOAD|ONERROR)\b)/i
    ],
    XSS: [
      /<script/i,
      /javascript:/i,
      /on\w+=/i,
      /<iframe/i,
      /<object/i,
      /<embed/i
    ]
  },

  // Error messages (production-safe)
  ERROR_MESSAGES: {
    GENERIC: 'An error occurred. Please try again.',
    AUTH_REQUIRED: 'Authentication required. Please log in.',
    ACCESS_DENIED: 'Access denied. You don\'t have permission to perform this action.',
    NOT_FOUND: 'The requested resource was not found.',
    RATE_LIMITED: 'Too many requests. Please try again later.',
    VALIDATION_FAILED: 'Invalid input provided. Please check your data.',
    SESSION_EXPIRED: 'Your session has expired. Please refresh the page.',
    NETWORK_ERROR: 'Network error. Please check your connection and try again.'
  }
} as const;

// Environment-specific configurations
export const getSecurityConfig = () => {
  const isDevelopment = process.env.NODE_ENV === 'development';
  const isProduction = process.env.NODE_ENV === 'production';

  return {
    ...SECURITY_CONFIG,
    
    // Adjust rate limits for development
    RATE_LIMITS: isDevelopment ? {
      ...SECURITY_CONFIG.RATE_LIMITS,
      AUTH: { ...SECURITY_CONFIG.RATE_LIMITS.AUTH, maxRequests: 50 },
      EMAIL: { ...SECURITY_CONFIG.RATE_LIMITS.EMAIL, maxRequests: 10 },
      API: { ...SECURITY_CONFIG.RATE_LIMITS.API, maxRequests: 100 }
    } : SECURITY_CONFIG.RATE_LIMITS,

    // Enable/disable features based on environment
    FEATURES: {
      DETAILED_ERRORS: isDevelopment,
      SECURITY_LOGGING: isProduction,
      RATE_LIMITING: true,
      SUSPICIOUS_ACTIVITY_DETECTION: isProduction,
      CSP_ENFORCEMENT: isProduction
    }
  };
};

export type SecurityConfig = ReturnType<typeof getSecurityConfig>;