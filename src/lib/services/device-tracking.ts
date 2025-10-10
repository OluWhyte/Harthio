// ============================================================================
// DEVICE TRACKING SERVICE - DISABLED
// ============================================================================
// Device tracking has been disabled to prevent excessive logging and privacy concerns

import type { DeviceInfo, LocationInfo } from '@/lib/database-types';

export class DeviceTrackingService {
  
  // ============================================================================
  // DEVICE INFORMATION DETECTION
  // ============================================================================

  static getDeviceInfo(): DeviceInfo {
    const userAgent = navigator.userAgent;
    const platform = navigator.platform;
    
    return {
      browser: this.getBrowserInfo(userAgent).name,
      browser_version: this.getBrowserInfo(userAgent).version,
      os: this.getOSInfo(userAgent, platform).name,
      os_version: this.getOSInfo(userAgent, platform).version,
      device_type: this.getDeviceType(userAgent),
      device_vendor: this.getDeviceVendor(userAgent),
      device_model: this.getDeviceModel(userAgent),
      screen_resolution: `${screen.width}x${screen.height}`,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      language: navigator.language
    };
  }

  private static getBrowserInfo(userAgent: string): { name: string; version: string } {
    const browsers = [
      { name: 'Chrome', regex: /Chrome\/([0-9.]+)/ },
      { name: 'Firefox', regex: /Firefox\/([0-9.]+)/ },
      { name: 'Safari', regex: /Version\/([0-9.]+).*Safari/ },
      { name: 'Edge', regex: /Edg\/([0-9.]+)/ },
      { name: 'Opera', regex: /OPR\/([0-9.]+)/ },
      { name: 'Internet Explorer', regex: /MSIE ([0-9.]+)/ }
    ];

    for (const browser of browsers) {
      const match = userAgent.match(browser.regex);
      if (match) {
        return { name: browser.name, version: match[1] };
      }
    }

    return { name: 'Unknown', version: '0.0' };
  }

  private static getOSInfo(userAgent: string, platform: string): { name: string; version: string } {
    const osPatterns = [
      { name: 'Windows', regex: /Windows NT ([0-9.]+)/ },
      { name: 'macOS', regex: /Mac OS X ([0-9_]+)/ },
      { name: 'Linux', regex: /Linux/ },
      { name: 'iOS', regex: /OS ([0-9_]+) like Mac OS X/ },
      { name: 'Android', regex: /Android ([0-9.]+)/ }
    ];

    for (const os of osPatterns) {
      const match = userAgent.match(os.regex);
      if (match) {
        let version = match[1] || '0.0';
        if (os.name === 'macOS' || os.name === 'iOS') {
          version = version.replace(/_/g, '.');
        }
        return { name: os.name, version };
      }
    }

    // Fallback to platform
    if (platform.includes('Win')) return { name: 'Windows', version: 'Unknown' };
    if (platform.includes('Mac')) return { name: 'macOS', version: 'Unknown' };
    if (platform.includes('Linux')) return { name: 'Linux', version: 'Unknown' };

    return { name: 'Unknown', version: '0.0' };
  }

  private static getDeviceType(userAgent: string): 'desktop' | 'mobile' | 'tablet' {
    const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;
    const tabletRegex = /iPad|Android(?!.*Mobile)/i;

    if (tabletRegex.test(userAgent)) return 'tablet';
    if (mobileRegex.test(userAgent)) return 'mobile';
    return 'desktop';
  }

  private static getDeviceVendor(userAgent: string): string | undefined {
    const vendors = [
      { name: 'Apple', regex: /(iPhone|iPad|iPod|Macintosh)/ },
      { name: 'Samsung', regex: /Samsung/ },
      { name: 'Google', regex: /Pixel/ },
      { name: 'Huawei', regex: /Huawei/ },
      { name: 'Xiaomi', regex: /Mi\s/ },
      { name: 'OnePlus', regex: /OnePlus/ }
    ];

    for (const vendor of vendors) {
      if (vendor.regex.test(userAgent)) {
        return vendor.name;
      }
    }

    return undefined;
  }

  private static getDeviceModel(userAgent: string): string | undefined {
    // Extract device model for mobile devices
    const modelPatterns = [
      /iPhone OS [0-9_]+ like Mac OS X\) Version\/[0-9.]+ Mobile\/[A-Z0-9]+ Safari\/[0-9.]+$/,
      /\(([^)]+)\) AppleWebKit/,
      /Android [0-9.]+; ([^)]+)\)/
    ];

    for (const pattern of modelPatterns) {
      const match = userAgent.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }

    return undefined;
  }

  // ============================================================================
  // GEOLOCATION SERVICES - DISABLED
  // ============================================================================

  static async getLocationInfo(): Promise<LocationInfo | null> {
    // Location tracking disabled to prevent privacy concerns and excessive API calls
    return null;
  }

  private static getCurrentPosition(): Promise<{ latitude: number; longitude: number } | null> {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve(null);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
        },
        () => resolve(null),
        { timeout: 10000, enableHighAccuracy: false }
      );
    });
  }

  private static async reverseGeocode(lat: number, lng: number): Promise<LocationInfo> {
    // Using a free geocoding service (you might want to use a paid service for production)
    try {
      const response = await fetch(
        `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`
      );
      const data = await response.json();
      
      return {
        country: data.countryName || 'Unknown',
        country_code: data.countryCode || 'XX',
        region: data.principalSubdivision || undefined,
        city: data.city || data.locality || undefined,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
      };
    } catch (error) {
      console.warn('Reverse geocoding failed:', error);
      return {
        country: 'Unknown',
        country_code: 'XX'
      };
    }
  }

  private static async getIPBasedLocation(): Promise<LocationInfo | null> {
    try {
      // Get user's IP first
      const ipResponse = await fetch('/api/ip');
      const { ip } = await ipResponse.json();
      
      // Use IP geolocation service
      const response = await fetch(`https://ipapi.co/${ip}/json/`);
      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.reason || 'IP geolocation failed');
      }
      
      return {
        country: data.country_name || 'Unknown',
        country_code: data.country_code || 'XX',
        region: data.region || undefined,
        city: data.city || undefined,
        latitude: data.latitude || undefined,
        longitude: data.longitude || undefined,
        timezone: data.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
        isp: data.org || undefined
      };
    } catch (error) {
      console.warn('IP-based geolocation failed:', error);
      return null;
    }
  }

  // ============================================================================
  // SESSION TRACKING - DISABLED
  // ============================================================================

  static async trackUserSession(userId: string): Promise<string | null> {
    // Session tracking disabled to prevent excessive logging
    return null;
  }

  static async updateSessionActivity(sessionId: string): Promise<void> {
    // Activity tracking disabled
    return;
  }

  static async endSession(sessionId: string): Promise<void> {
    // Session ending disabled
    return;
  }

  // ============================================================================
  // FINGERPRINTING - DISABLED
  // ============================================================================

  static generateDeviceFingerprint(): string {
    // Device fingerprinting disabled to prevent excessive logging and privacy concerns
    return 'disabled';
  }

  private static simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  // ============================================================================
  // ANALYTICS HELPERS - DISABLED
  // ============================================================================

  static isReturningUser(deviceFingerprint: string): Promise<boolean> {
    // Analytics disabled
    return Promise.resolve(false);
  }

  static async getUserFootprint(userId: string): Promise<null> {
    // User footprint tracking disabled
    return null;
  }
}