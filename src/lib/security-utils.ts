/**
 * Production-safe error handling and security utilities
 */

export interface SanitizedError {
  message: string;
  code?: string;
  details?: any;
}

export interface SecurityEvent {
  type: 'auth_failure' | 'access_denied' | 'rate_limit' | 'suspicious_activity' | 'validation_error' | 'api_error' | 'security_scan';
  userId?: string;
  ip?: string;
  userAgent?: string;
  endpoint?: string;
  details?: any;
  timestamp?: string;
}

/**
 * Sanitize errors for production use
 */
export function sanitizeError(error: unknown, includeDetails = false): SanitizedError {
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  if (error instanceof Error) {
    // In production, only return safe error messages
    if (!isDevelopment) {
      // Map of safe error messages for known database/system errors
      const safeErrors: Record<string, string> = {
        'PGRST116': 'Resource not found',
        'PGRST301': 'Connection error',
        '42501': 'Access denied',
        '23505': 'This item already exists',
        '23503': 'Invalid reference',
        '23514': 'Invalid data provided',
        'auth/user-not-found': 'Invalid credentials',
        'auth/wrong-password': 'Invalid credentials',
        'auth/too-many-requests': 'Too many attempts. Please try again later.',
        'auth/network-request-failed': 'Network error. Please check your connection.'
      };
      
      // Check if it's a database error with a known code
      const dbErrorMatch = error.message.match(/code:\s*(\w+)/);
      if (dbErrorMatch && safeErrors[dbErrorMatch[1]]) {
        return {
          message: safeErrors[dbErrorMatch[1]],
          code: dbErrorMatch[1]
        };
      }
      
      // Check for auth errors
      const authErrorMatch = error.message.match(/(auth\/[\w-]+)/);
      if (authErrorMatch && safeErrors[authErrorMatch[1]]) {
        return {
          message: safeErrors[authErrorMatch[1]],
          code: authErrorMatch[1]
        };
      }
      
      // Check for common user-friendly error patterns
      const userFriendlyPatterns = [
        /already exists/i,
        /not found/i,
        /access denied/i,
        /invalid/i,
        /required/i,
        /too long/i,
        /too short/i
      ];
      
      const isUserFriendly = userFriendlyPatterns.some(pattern => 
        pattern.test(error.message)
      );
      
      if (isUserFriendly && error.message.length < 100) {
        return {
          message: error.message,
          code: 'USER_ERROR'
        };
      }
      
      // Generic safe message for production
      return {
        message: 'An error occurred. Please try again.',
        code: 'GENERIC_ERROR'
      };
    }
    
    // Development: return full error details
    return {
      message: error.message,
      code: error.name,
      details: includeDetails ? {
        stack: error.stack,
        name: error.name
      } : undefined
    };
  }
  
  return {
    message: 'Unknown error occurred',
    code: 'UNKNOWN_ERROR'
  };
}

/**
 * Log security events for monitoring
 */
export function logSecurityEvent(event: SecurityEvent) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    level: 'SECURITY',
    ...event
  };
  
  // In production, this should integrate with your security monitoring service
  if (process.env.NODE_ENV === 'production') {
    // TODO: Integrate with security monitoring service (e.g., Sentry, DataDog)
    console.error('[SECURITY]', JSON.stringify(logEntry));
  } else {
    console.warn('[SECURITY]', logEntry);
  }
  
  // Store critical security events for analysis
  if (event.type === 'suspicious_activity' || event.type === 'auth_failure') {
    // TODO: Store in database or send to security service
  }

  // Send to security monitor if available
  if (typeof window === 'undefined') { // Server-side only
    try {
      // Dynamic import to avoid circular dependencies
      import('./security-monitor').then(({ securityMonitor }) => {
        securityMonitor.recordEvent(event);
      }).catch(() => {
        // Ignore import errors to prevent circular dependency issues
      });
    } catch (error) {
      // Ignore errors to prevent breaking the application
    }
  }
}

/**
 * Validate and sanitize user input
 */
export function sanitizeInput(input: string, maxLength = 1000): string {
  if (typeof input !== 'string') {
    return '';
  }
  
  return input
    .trim()
    .slice(0, maxLength)
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocols
    .replace(/on\w+=/gi, ''); // Remove event handlers
}

/**
 * Check if request is from a suspicious source
 */
export function detectSuspiciousActivity(req: {
  ip?: string;
  userAgent?: string;
  headers?: Record<string, string>;
}): boolean {
  const suspiciousPatterns = [
    /bot/i,
    /crawler/i,
    /spider/i,
    /scraper/i,
    /curl/i,
    /wget/i,
    /python/i,
    /php/i,
    /postman/i,
    /insomnia/i,
    /httpie/i,
    /masscan/i,
    /nmap/i,
    /sqlmap/i,
    /nikto/i,
    /burp/i,
    /zap/i
  ];
  
  const userAgent = req.userAgent || '';
  const isSuspiciousUA = suspiciousPatterns.some(pattern => pattern.test(userAgent));
  
  // Check for missing common headers that legitimate browsers send
  const hasCommonHeaders = req.headers && (
    req.headers['accept'] || 
    req.headers['accept-language'] || 
    req.headers['accept-encoding']
  );
  
  // Check for suspicious IP patterns (basic check)
  const ip = req.ip || '';
  const isSuspiciousIP = ip.startsWith('10.') || ip.startsWith('172.') || ip.startsWith('192.168.');
  
  // Check for empty or very short user agent
  const hasValidUA = userAgent.length > 10;
  
  return isSuspiciousUA || !hasCommonHeaders || !hasValidUA;
}

/**
 * Generate secure session token
 */
export function generateSecureToken(length = 32): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return result;
}

/**
 * Validate UUID format
 */
export function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 254;
}

/**
 * Check for SQL injection patterns
 */
export function containsSQLInjection(input: string): boolean {
  const sqlPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION)\b)/i,
    /(\b(OR|AND)\s+\d+\s*=\s*\d+)/i,
    /(--|\/\*|\*\/)/,
    /(\b(SCRIPT|JAVASCRIPT|VBSCRIPT|ONLOAD|ONERROR)\b)/i
  ];
  
  return sqlPatterns.some(pattern => pattern.test(input));
}

/**
 * Rate limit key generator
 */
export function generateRateLimitKey(
  ip: string, 
  endpoint?: string, 
  userId?: string
): string {
  const parts = [ip];
  
  if (endpoint) {
    parts.push(endpoint);
  }
  
  if (userId) {
    parts.push(userId);
  }
  
  return parts.join(':');
}

/**
 * Security headers for API responses
 */
export function getSecurityHeaders(): Record<string, string> {
  return {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
    'X-Robots-Tag': 'noindex, nofollow',
    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0'
  };
}

/**
 * Validate API request structure and content
 */
export function validateApiRequest(req: {
  method?: string;
  headers?: Record<string, string>;
  body?: any;
}): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Check content type for POST/PUT requests
  if (req.method && ['POST', 'PUT', 'PATCH'].includes(req.method)) {
    const contentType = req.headers?.['content-type'];
    if (!contentType || !contentType.includes('application/json')) {
      errors.push('Invalid or missing Content-Type header');
    }
  }
  
  // Check for required security headers
  const requiredHeaders = ['user-agent', 'accept'];
  requiredHeaders.forEach(header => {
    if (!req.headers?.[header]) {
      errors.push(`Missing required header: ${header}`);
    }
  });
  
  // Validate body size (prevent large payloads)
  if (req.body && typeof req.body === 'string' && req.body.length > 1024 * 1024) {
    errors.push('Request body too large');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Create a secure API response wrapper
 */
export function createSecureResponse(
  data: any, 
  status: number = 200, 
  additionalHeaders: Record<string, string> = {}
) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...getSecurityHeaders(),
      ...additionalHeaders
    }
  });
}