// Central admin authentication service
// All admin checks should go through this service

export class AdminAuthService {
  /**
   * Check if a user has admin access
   */
  static async isUserAdmin(userId: string): Promise<boolean> {
    try {
      const response = await fetch(`/api/admin/check?userId=${userId}`);
      const data = await response.json();
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
      const response = await fetch(`/api/admin/details?userId=${userId}`);
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
