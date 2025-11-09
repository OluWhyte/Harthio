/**
 * TURN Service - Secure Dynamic Credential Management
 * 
 * SECURITY BEST PRACTICE:
 * This service fetches time-limited TURN credentials from your backend API,
 * NOT directly from TURN providers. This keeps secret keys secure on the server.
 * 
 * Workflow:
 * 1. Client calls this service before establishing WebRTC connection
 * 2. Service requests credentials from /api/turn/credentials endpoint
 * 3. Backend generates fresh, time-limited credentials using secret keys
 * 4. Client receives credentials and uses them for RTCPeerConnection
 * 5. Credentials expire after a set time (typically 12-24 hours)
 */

export interface TURNCredentials {
  urls: string | string[];
  username: string;
  credential: string;
}

export interface TURNResponse {
  iceServers: TURNCredentials[];
  expiresAt: number;
}

class MeteredTURNService {
  private cachedCredentials: TURNCredentials[] | null = null;
  private cacheExpiry: number = 0;

  /**
   * Get TURN credentials from backend API
   * Uses cached credentials if still valid, otherwise fetches new ones
   */
  async getTURNCredentials(): Promise<RTCIceServer[]> {
    // Check cache first
    if (this.cachedCredentials && Date.now() < this.cacheExpiry) {
      console.log('📦 Using cached TURN credentials');
      return this.cachedCredentials;
    }

    try {
      // Fetch dynamic credentials from backend API
      console.log('🔄 Fetching fresh TURN credentials from backend...');
      
      const response = await fetch('/api/turn/credentials', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Backend API error: ${response.status} ${response.statusText}`);
      }

      const data: TURNResponse = await response.json();
      
      if (!data.iceServers || data.iceServers.length === 0) {
        throw new Error('No TURN servers returned from backend');
      }

      // Cache credentials
      this.cachedCredentials = data.iceServers;
      this.cacheExpiry = data.expiresAt;
      
      console.log(`✅ Fetched ${data.iceServers.length} TURN servers from backend`);
      console.log(`⏰ Credentials expire at: ${new Date(data.expiresAt).toLocaleString()}`);
      
      return data.iceServers;
      
    } catch (error) {
      console.error('❌ Failed to fetch TURN credentials from backend:', error);
      
      // Fallback to public TURN servers (no authentication required)
      console.warn('⚠️ Using public TURN servers as fallback');
      return this.getPublicFallbackServers();
    }
  }

  /**
   * Get public TURN servers as emergency fallback
   * These don't require authentication but may have rate limits
   */
  private getPublicFallbackServers(): RTCIceServer[] {
    return [
      {
        urls: 'turn:openrelay.metered.ca:80',
        username: 'openrelayproject',
        credential: 'openrelayproject'
      },
      {
        urls: 'turn:openrelay.metered.ca:443?transport=tcp',
        username: 'openrelayproject',
        credential: 'openrelayproject'
      }
    ];
  }

  /**
   * Get all ICE servers (STUN + TURN)
   * Call this before creating RTCPeerConnection
   */
  async getAllICEServers(): Promise<RTCIceServer[]> {
    const servers: RTCIceServer[] = [];

    // 1. STUN servers (public, no authentication needed)
    servers.push(
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' }
    );

    // 2. TURN servers (dynamic credentials from backend)
    try {
      const turnServers = await this.getTURNCredentials();
      servers.push(...turnServers);
    } catch (error) {
      console.error('❌ Failed to get TURN credentials:', error);
    }

    console.log(`📡 Total ICE servers configured: ${servers.length}`);
    return servers;
  }

  /**
   * Clear cached credentials (force refresh on next request)
   */
  clearCache(): void {
    this.cachedCredentials = null;
    this.cacheExpiry = 0;
    console.log('🗑️ Cleared TURN credentials cache');
  }
}

// Export singleton instance
export const meteredTURNService = new MeteredTURNService();