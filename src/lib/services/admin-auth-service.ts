// Central admin authentication service
// All admin checks should go through this service

import { supabase } from '@/lib/supabase';

export class AdminAuthService {
  /**
   * Check if a user has admin access
   */
  static async isUserAdmin(userId: string): Promise<boolean> {
    try {
      if (!supabase) {
        console.error('Supabase client not initialized');
        return false;
      }

      // Retry getting session up to 3 times with delays
      let session = null;
      let sessionError = null;
      
      for (let attempt = 0; attempt < 3; attempt++) {
        const result = await supabase.auth.getSession();
        session = result.data.session;
        sessionError = result.error;
        
        if (session?.access_token) {
          break;
        }
        
        // Wait before retrying (exponential backoff)
        if (attempt < 2) {
          await new Promise(resolve => setTimeout(resolve, 500 * (attempt + 1)));
        }
      }

      if (sessionError) {
        console.error('Session error:', sessionError);
        return false;
      }

      const token = session?.access_token;

      if (!token) {
        console.warn('Admin check skipped: No active session after retries');
        return false;
      }

      console.log('[AdminAuthService] Calling /api/admin/check for userId:', userId);
      
      const response = await fetch(`/api/admin/check?userId=${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      console.log('[AdminAuthService] API response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[AdminAuthService] Admin check failed:', response.status, errorText);
        return false;
      }

      const data = await response.json();
      console.log('[AdminAuthService] Admin check result:', data);
      return data.isAdmin || false;
    } catch (error) {
      console.error('Admin check error:', error);
      return false;
    }
  }

  /**
   * Get complete admin details including user info
   */
  static async getAdminDetails(userId: string): Promise<{
    role: string;
    permissions: string[];
    display_name?: string;
    email?: string;
  } | null> {
    try {
      if (!supabase) {
        console.error('Supabase client not initialized');
        return null;
      }

      // Retry getting session up to 3 times with delays
      let session = null;
      let sessionError = null;
      
      for (let attempt = 0; attempt < 3; attempt++) {
        const result = await supabase.auth.getSession();
        session = result.data.session;
        sessionError = result.error;
        
        if (session?.access_token) {
          break;
        }
        
        // Wait before retrying (exponential backoff)
        if (attempt < 2) {
          await new Promise(resolve => setTimeout(resolve, 500 * (attempt + 1)));
        }
      }

      if (sessionError) {
        console.error('Session error:', sessionError);
        return null;
      }

      const token = session?.access_token;

      if (!token) {
        return null;
      }

      const response = await fetch(`/api/admin/details?userId=${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        console.error('Admin details failed:', response.status, response.statusText);
        return null;
      }

      const data = await response.json();

      if (!data.isAdmin) {
        return null;
      }

      return {
        role: data.role || 'admin',
        permissions: data.permissions || [],
        display_name: data.display_name,
        email: data.email
      };
    } catch (error) {
      console.error('Admin details error:', error);
      return null;
    }
  }

  /**
   * Check if user has specific permission
   */
  static async hasPermission(userId: string, permission: string): Promise<boolean> {
    const details = await this.getAdminDetails(userId);

    if (!details) {
      return false;
    }

    // Super admins have all permissions
    if (details.permissions.includes('all')) {
      return true;
    }

    return details.permissions.includes(permission);
  }
}
