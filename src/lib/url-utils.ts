// ============================================================================
// URL UTILITIES
// ============================================================================
// Utility functions for handling URLs across different environments

/**
 * Get the base URL for the application
 * - Production: https://harthio.com
 * - Development: http://localhost:3000
 * - Preview/Staging: Uses NEXT_PUBLIC_APP_URL if set
 */
export function getBaseUrl(): string {
  // Check if we're in browser
  if (typeof window !== 'undefined') {
    // In browser, use window.location.origin
    // This automatically handles localhost, staging, and production
    return window.location.origin;
  }

  // Server-side: Check environment variables
  // 1. First check for explicit APP_URL (for production/staging)
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL;
  }

  // 2. Check if we're in Vercel
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  // 3. Check NODE_ENV
  if (process.env.NODE_ENV === 'production') {
    return 'https://harthio.com';
  }

  // 4. Default to localhost for development
  return 'http://localhost:3000';
}

/**
 * Get the app URL for emails
 * Always returns the production URL for emails sent from production
 * Returns localhost for development/testing
 */
export function getEmailBaseUrl(): string {
  // For emails, we want to use production URL unless explicitly in development
  if (process.env.NODE_ENV === 'development') {
    return 'http://localhost:3000';
  }

  // Always use production URL for emails in production
  return process.env.NEXT_PUBLIC_APP_URL || 'https://harthio.com';
}

/**
 * Build a full URL from a path
 * @param path - The path to append (e.g., '/dashboard', '/session/123')
 * @returns Full URL
 */
export function buildUrl(path: string): string {
  const baseUrl = getBaseUrl();
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${baseUrl}${cleanPath}`;
}

/**
 * Build a full URL for emails
 * @param path - The path to append
 * @returns Full URL suitable for emails
 */
export function buildEmailUrl(path: string): string {
  const baseUrl = getEmailBaseUrl();
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${baseUrl}${cleanPath}`;
}
