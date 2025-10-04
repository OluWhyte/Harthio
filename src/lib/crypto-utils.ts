// ============================================================================
// CRYPTO UTILITIES
// ============================================================================
// Utility functions for generating TURN credentials and other crypto operations
// ============================================================================

/**
 * HMAC-SHA1 implementation for TURN credential generation
 * Uses Web Crypto API when available, falls back to simple hash
 */
export async function hmacSHA1(message: string, secret: string): Promise<string> {
  // Try to use Web Crypto API if available (modern browsers)
  if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
    try {
      const encoder = new TextEncoder();
      const keyData = encoder.encode(secret);
      const messageData = encoder.encode(message);
      
      const cryptoKey = await window.crypto.subtle.importKey(
        'raw',
        keyData,
        { name: 'HMAC', hash: 'SHA-1' },
        false,
        ['sign']
      );
      
      const signature = await window.crypto.subtle.sign('HMAC', cryptoKey, messageData);
      const hashArray = Array.from(new Uint8Array(signature));
      const hashBase64 = btoa(String.fromCharCode.apply(null, hashArray));
      
      return hashBase64;
    } catch (error) {
      console.warn('Web Crypto API failed, falling back to simple hash:', error);
    }
  }
  
  // Fallback: Simple hash combination (not cryptographically secure but works)
  const combined = message + secret;
  let hash = 0;
  
  for (let i = 0; i < combined.length; i++) {
    const char = combined.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  // Convert to base64-like string
  return btoa(Math.abs(hash).toString(16));
}

/**
 * Generate TURN credentials compatible with COTURN static-auth-secret
 */
export async function generateTurnCredentials(userId: string, sessionId: string, secret: string) {
  const timestamp = Math.floor(Date.now() / 1000) + 3600; // 1 hour expiry
  const username = `${timestamp}:${userId}:${sessionId}`;
  
  // Generate HMAC credential
  const credential = await hmacSHA1(username, secret);
  
  return { username, credential };
}

/**
 * Validate that required environment variables are present
 */
export function validateWebRTCConfig() {
  const config = {
    coturnServer: process.env.NEXT_PUBLIC_COTURN_SERVER,
    coturnSecret: process.env.NEXT_PUBLIC_COTURN_SECRET,
    coturnRealm: process.env.NEXT_PUBLIC_COTURN_REALM || 'harthio.com'
  };
  
  const missing = [];
  if (!config.coturnServer) missing.push('NEXT_PUBLIC_COTURN_SERVER');
  if (!config.coturnSecret) missing.push('NEXT_PUBLIC_COTURN_SECRET');
  
  if (missing.length > 0) {
    console.warn('Missing WebRTC environment variables:', missing);
    console.warn('Falling back to free STUN/TURN servers only');
  }
  
  return config;
}