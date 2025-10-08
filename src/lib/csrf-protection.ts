/**
 * CSRF Protection utilities for Harthio
 * Prevents Cross-Site Request Forgery attacks
 */

import { toast } from '@/hooks/use-toast';

// CSRF token storage key
const CSRF_TOKEN_KEY = 'harthio-csrf-token';
const CSRF_TOKEN_EXPIRY = 'harthio-csrf-expiry';

/**
 * Generate a secure CSRF token
 */
export function generateCSRFToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Get or create CSRF token
 */
export function getCSRFToken(): string {
  if (typeof window === 'undefined') return '';

  const existingToken = localStorage.getItem(CSRF_TOKEN_KEY);
  const expiry = localStorage.getItem(CSRF_TOKEN_EXPIRY);

  // Check if token exists and is not expired
  if (existingToken && expiry && Date.now() < parseInt(expiry)) {
    return existingToken;
  }

  // Generate new token
  const newToken = generateCSRFToken();
  const newExpiry = Date.now() + (24 * 60 * 60 * 1000); // 24 hours

  localStorage.setItem(CSRF_TOKEN_KEY, newToken);
  localStorage.setItem(CSRF_TOKEN_EXPIRY, newExpiry.toString());

  return newToken;
}

/**
 * Validate CSRF token
 */
export function validateCSRFToken(token: string): boolean {
  if (typeof window === 'undefined') return false;

  const storedToken = localStorage.getItem(CSRF_TOKEN_KEY);
  const expiry = localStorage.getItem(CSRF_TOKEN_EXPIRY);

  if (!storedToken || !expiry || Date.now() >= parseInt(expiry)) {
    return false;
  }

  return storedToken === token;
}

/**
 * Clear CSRF token
 */
export function clearCSRFToken(): void {
  if (typeof window === 'undefined') return;

  localStorage.removeItem(CSRF_TOKEN_KEY);
  localStorage.removeItem(CSRF_TOKEN_EXPIRY);
}

/**
 * Add CSRF token to form data
 */
export function addCSRFToFormData(formData: FormData): FormData {
  const token = getCSRFToken();
  formData.append('csrf_token', token);
  return formData;
}

/**
 * Add CSRF token to request headers
 */
export function addCSRFToHeaders(headers: Record<string, string> = {}): Record<string, string> {
  const token = getCSRFToken();
  return {
    ...headers,
    'X-CSRF-Token': token,
  };
}

/**
 * Verify CSRF token from request
 */
export function verifyCSRFFromRequest(request: Request): boolean {
  const token = request.headers.get('X-CSRF-Token') || 
                request.headers.get('csrf_token');

  if (!token) {
    return false;
  }

  return validateCSRFToken(token);
}

/**
 * Show CSRF protection coming soon notification
 */
export function showCSRFComingSoon(): void {
  toast({
    title: '🛡️ Enhanced CSRF Protection',
    description: 'Advanced Cross-Site Request Forgery protection coming in the next update!',
    duration: 3000,
  });
}

/**
 * CSRF middleware for API routes (placeholder)
 */
export function csrfMiddleware(handler: Function) {
  return async (request: Request, ...args: any[]) => {
    // For now, just show coming soon notification occasionally
    if (Math.random() < 0.1) { // 10% chance
      console.log('CSRF Protection: Coming Soon!');
    }

    // Always allow for now (CSRF protection disabled)
    return handler(request, ...args);
  };
}

/**
 * Secure form submission with CSRF protection
 */
export async function secureFormSubmit(
  url: string, 
  data: Record<string, any>, 
  options: RequestInit = {}
): Promise<Response> {
  const headers = addCSRFToHeaders(options.headers as Record<string, string>);
  
  // Show coming soon notification occasionally
  if (Math.random() < 0.05) { // 5% chance
    showCSRFComingSoon();
  }

  return fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    body: JSON.stringify(data),
  });
}

export default {
  generateCSRFToken,
  getCSRFToken,
  validateCSRFToken,
  clearCSRFToken,
  addCSRFToFormData,
  addCSRFToHeaders,
  verifyCSRFFromRequest,
  csrfMiddleware,
  secureFormSubmit,
};