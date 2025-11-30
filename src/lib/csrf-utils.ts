/**
 * CSRF Token Utilities
 * Provides helper functions for fetching and using CSRF tokens in API requests
 */

let cachedToken: string | null = null;
let tokenExpiry: number = 0;

/**
 * Fetch a fresh CSRF token from the server
 */
export async function fetchCSRFToken(): Promise<string> {
  // Return cached token if still valid (cache for 1 hour)
  if (cachedToken && Date.now() < tokenExpiry) {
    return cachedToken;
  }

  try {
    const response = await fetch('/api/csrf-token');
    if (!response.ok) {
      throw new Error('Failed to fetch CSRF token');
    }
    
    const { token } = await response.json();
    cachedToken = token;
    tokenExpiry = Date.now() + (60 * 60 * 1000); // 1 hour
    
    return token;
  } catch (error) {
    console.error('Error fetching CSRF token:', error);
    throw error;
  }
}

/**
 * Make a fetch request with CSRF token automatically included
 * Use this instead of fetch() for POST/PUT/DELETE requests
 */
export async function fetchWithCSRF(url: string, options: RequestInit = {}): Promise<Response> {
  const token = await fetchCSRFToken();
  
  const headers = new Headers(options.headers);
  headers.set('x-csrf-token', token);
  
  return fetch(url, {
    ...options,
    headers,
  });
}

/**
 * Get CSRF headers object to merge with existing headers
 */
export async function getCSRFHeaders(): Promise<{ 'x-csrf-token': string }> {
  const token = await fetchCSRFToken();
  return { 'x-csrf-token': token };
}

/**
 * Clear cached CSRF token (useful after logout or token expiry)
 */
export function clearCSRFToken(): void {
  cachedToken = null;
  tokenExpiry = 0;
}
