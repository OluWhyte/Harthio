/**
 * Security sanitization utilities for Harthio
 * Prevents XSS, injection attacks, and other security vulnerabilities
 */

// HTML sanitization patterns
const HTML_PATTERNS = {
  script: /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
  iframe: /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
  object: /<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi,
  embed: /<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi,
  form: /<form\b[^<]*(?:(?!<\/form>)<[^<]*)*<\/form>/gi,
  javascript: /javascript:/gi,
  vbscript: /vbscript:/gi,
  onload: /onload\s*=/gi,
  onclick: /onclick\s*=/gi,
  onerror: /onerror\s*=/gi,
  onmouseover: /onmouseover\s*=/gi,
};

// SQL injection patterns
const SQL_PATTERNS = [
  /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b)/gi,
  /(--|\/\*|\*\/|;|'|"|\||&|\$)/g,
  /(\bOR\b|\bAND\b)\s+\d+\s*=\s*\d+/gi,
  /\b(UNION|SELECT)\b.*\b(FROM|WHERE)\b/gi,
];

// XSS patterns
const XSS_PATTERNS = [
  /<script[^>]*>.*?<\/script>/gi,
  /javascript:/gi,
  /vbscript:/gi,
  /on\w+\s*=/gi,
  /<iframe[^>]*>.*?<\/iframe>/gi,
  /<object[^>]*>.*?<\/object>/gi,
  /<embed[^>]*>.*?<\/embed>/gi,
];

/**
 * Sanitize HTML content to prevent XSS attacks
 */
export function sanitizeHtml(input: string): string {
  if (!input || typeof input !== 'string') return '';

  let sanitized = input;

  // Remove dangerous HTML elements
  Object.values(HTML_PATTERNS).forEach(pattern => {
    sanitized = sanitized.replace(pattern, '');
  });

  // Remove XSS patterns
  XSS_PATTERNS.forEach(pattern => {
    sanitized = sanitized.replace(pattern, '');
  });

  return sanitized.trim();
}

/**
 * Sanitize user input to prevent SQL injection
 */
export function sanitizeInput(input: string): string {
  if (!input || typeof input !== 'string') return '';

  let sanitized = input;

  // Check for SQL injection patterns
  SQL_PATTERNS.forEach(pattern => {
    sanitized = sanitized.replace(pattern, '');
  });

  // Escape special characters
  sanitized = sanitized
    .replace(/'/g, "''")
    .replace(/"/g, '""')
    .replace(/\\/g, '\\\\');

  return sanitized.trim();
}

/**
 * Validate and sanitize email addresses
 */
export function sanitizeEmail(email: string): string {
  if (!email || typeof email !== 'string') return '';

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const sanitized = email.toLowerCase().trim();

  if (!emailRegex.test(sanitized)) {
    throw new Error('Invalid email format');
  }

  return sanitized;
}

/**
 * Sanitize URLs to prevent malicious redirects
 */
export function sanitizeUrl(url: string): string {
  if (!url || typeof url !== 'string') return '';

  // Remove javascript: and data: protocols
  if (url.match(/^(javascript|data|vbscript):/i)) {
    return '';
  }

  // Only allow http, https, and relative URLs
  if (!url.match(/^(https?:\/\/|\/)/i)) {
    return '';
  }

  return url.trim();
}

/**
 * Sanitize file names for uploads
 */
export function sanitizeFileName(fileName: string): string {
  if (!fileName || typeof fileName !== 'string') return '';

  return fileName
    .replace(/[^a-zA-Z0-9.-]/g, '_')
    .replace(/_{2,}/g, '_')
    .toLowerCase()
    .trim();
}

/**
 * Validate and sanitize blog content
 */
export function sanitizeBlogContent(content: string): string {
  if (!content || typeof content !== 'string') return '';

  // Allow basic HTML tags but sanitize dangerous content
  const allowedTags = ['p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'blockquote', 'a'];
  
  let sanitized = sanitizeHtml(content);

  // Additional blog-specific sanitization
  sanitized = sanitized
    .replace(/<(?!\/?(?:p|br|strong|em|u|h[1-6]|ul|ol|li|blockquote|a)\b)[^>]*>/gi, '')
    .replace(/href\s*=\s*["']?javascript:/gi, 'href="#"');

  return sanitized;
}

/**
 * Rate limiting key sanitization
 */
export function sanitizeRateLimitKey(key: string): string {
  if (!key || typeof key !== 'string') return 'unknown';

  return key
    .replace(/[^a-zA-Z0-9.-]/g, '_')
    .substring(0, 100)
    .toLowerCase();
}

/**
 * Comprehensive input validation
 */
export function validateAndSanitize(input: any, type: 'email' | 'url' | 'html' | 'text' | 'filename'): string {
  if (input === null || input === undefined) return '';
  
  const stringInput = String(input);

  switch (type) {
    case 'email':
      return sanitizeEmail(stringInput);
    case 'url':
      return sanitizeUrl(stringInput);
    case 'html':
      return sanitizeHtml(stringInput);
    case 'filename':
      return sanitizeFileName(stringInput);
    case 'text':
    default:
      return sanitizeInput(stringInput);
  }
}

/**
 * Security headers for API responses
 */
export const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
  'Pragma': 'no-cache',
  'Expires': '0',
};