/**
 * Geolocation Service
 * Detects user country from IP address
 * Works for both web and mobile apps
 */

export interface GeolocationData {
  country: string;
  countryCode: string;
  city?: string;
  region?: string;
  timezone?: string;
  ip?: string;
}

export const geolocationService = {
  /**
   * Detect country from IP address
   * Uses ipapi.co free tier (1000 requests/day)
   * Falls back to ip-api.com if needed
   */
  async detectCountry(): Promise<GeolocationData | null> {
    try {
      // Try ipapi.co first (more reliable)
      const response = await fetch('https://ipapi.co/json/', {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        
        return {
          country: data.country_name || 'Unknown',
          countryCode: data.country_code || 'XX',
          city: data.city,
          region: data.region,
          timezone: data.timezone,
          ip: data.ip,
        };
      }

      // Fallback to ip-api.com (free, no key needed)
      const fallbackResponse = await fetch('http://ip-api.com/json/', {
        method: 'GET',
      });

      if (fallbackResponse.ok) {
        const data = await fallbackResponse.json();
        
        if (data.status === 'success') {
          return {
            country: data.country || 'Unknown',
            countryCode: data.countryCode || 'XX',
            city: data.city,
            region: data.regionName,
            timezone: data.timezone,
            ip: data.query,
          };
        }
      }

      console.warn('Failed to detect country from IP');
      return null;
    } catch (error) {
      console.error('Error detecting country:', error);
      return null;
    }
  },

  /**
   * Detect country on server-side (from request headers)
   * For API routes and server components
   */
  async detectCountryFromIP(ip: string): Promise<GeolocationData | null> {
    try {
      const response = await fetch(`https://ipapi.co/${ip}/json/`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        
        return {
          country: data.country_name || 'Unknown',
          countryCode: data.country_code || 'XX',
          city: data.city,
          region: data.region,
          timezone: data.timezone,
          ip: data.ip,
        };
      }

      return null;
    } catch (error) {
      console.error('Error detecting country from IP:', error);
      return null;
    }
  },

  /**
   * Get country from browser timezone (fallback method)
   * Less accurate but works offline
   */
  getCountryFromTimezone(): string {
    try {
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      
      // Map common timezones to countries
      const timezoneMap: Record<string, string> = {
        'Africa/Lagos': 'Nigeria',
        'Africa/Nairobi': 'Kenya',
        'Africa/Johannesburg': 'South Africa',
        'Africa/Cairo': 'Egypt',
        'Africa/Accra': 'Ghana',
        'America/New_York': 'United States',
        'America/Los_Angeles': 'United States',
        'America/Chicago': 'United States',
        'Europe/London': 'United Kingdom',
        'Europe/Paris': 'France',
        'Europe/Berlin': 'Germany',
        'Asia/Dubai': 'United Arab Emirates',
        'Asia/Singapore': 'Singapore',
        'Asia/Tokyo': 'Japan',
        'Asia/Shanghai': 'China',
        'Asia/Kolkata': 'India',
        'Australia/Sydney': 'Australia',
      };

      return timezoneMap[timezone] || 'Unknown';
    } catch (error) {
      console.error('Error getting country from timezone:', error);
      return 'Unknown';
    }
  },

  /**
   * Comprehensive country detection with fallbacks
   * 1. Try IP geolocation
   * 2. Fall back to timezone
   */
  async detectCountryWithFallback(): Promise<string> {
    // Try IP geolocation first
    const geoData = await this.detectCountry();
    if (geoData && geoData.country !== 'Unknown') {
      return geoData.country;
    }

    // Fall back to timezone
    return this.getCountryFromTimezone();
  },
};
