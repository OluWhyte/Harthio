'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { AdminAuthService } from '@/lib/services/admin-auth-service';

interface AdminUser {
  id: string;
  email: string;
  display_name?: string;
  role: 'admin' | 'editor';
  permissions: string[];
}

interface AdminContextType {
  adminUser: AdminUser | null;
  isAdmin: boolean;
  isLoading: boolean;
  hasPermission: (permission: string) => boolean;
  refreshAdminStatus: () => Promise<void>;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

interface AdminProviderProps {
  children: ReactNode;
}

export function AdminProvider({ children }: AdminProviderProps) {
  const { user, loading: authLoading } = useAuth();
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadAdminStatus = async () => {
    // Skip admin check on login page
    if (typeof window !== 'undefined' && window.location.pathname === '/admin-v2/login') {
      setIsLoading(false);
      return;
    }

    // Wait for auth to finish loading first
    if (authLoading) {
      setIsLoading(true);
      return;
    }

    if (!user) {
      setAdminUser(null);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);

      // Check if user is admin - with error handling to prevent infinite loops
      let isAdminUser = false;
      try {
        console.log('[Admin Context] Checking admin status for user:', user.uid);
        isAdminUser = await AdminAuthService.isUserAdmin(user.uid);
        console.log('[Admin Context] Admin check result:', isAdminUser);
      } catch (error) {
        console.error('[Admin Context] Admin check failed:', error);
        setAdminUser(null);
        setIsLoading(false);
        return;
      }

      if (!isAdminUser) {
        console.log('[Admin Context] User is not an admin');
        setAdminUser(null);
        setIsLoading(false);
        return;
      }

      console.log('[Admin Context] User is an admin, loading details...');

      // Get admin details - with error handling
      let adminDetails: {
        role: string;
        permissions: string[];
        display_name?: string;
        email?: string;
      } | null = null;

      try {
        adminDetails = await AdminAuthService.getAdminDetails(user.uid);
      } catch (error) {
        console.error('Admin details fetch failed:', error);
        setAdminUser(null);
        setIsLoading(false);
        return;
      }

      if (adminDetails) {
        setAdminUser({
          id: user.uid,
          email: user.email || '',
          display_name: adminDetails.display_name || user.displayName || undefined,
          role: adminDetails.role as 'admin' | 'editor',
          permissions: adminDetails.permissions || []
        });
      } else {
        setAdminUser(null);
      }
    } catch (error) {
      console.error('Error loading admin status:', error);
      setAdminUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const hasPermission = (permission: string): boolean => {
    if (!adminUser) return false;

    // Admin role has all permissions
    if (adminUser.role === 'admin') return true;

    // Check specific permissions
    return adminUser.permissions.includes(permission);
  };

  const refreshAdminStatus = async () => {
    await loadAdminStatus();
  };

  useEffect(() => {
    loadAdminStatus();
  }, [user, authLoading]);

  const contextValue: AdminContextType = {
    adminUser,
    isAdmin: !!adminUser,
    isLoading: authLoading || isLoading,
    hasPermission,
    refreshAdminStatus
  };

  return (
    <AdminContext.Provider value={contextValue}>
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin(): AdminContextType {
  const context = useContext(AdminContext);
  if (context === undefined) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
}

// Hook for getting current admin user ID (commonly needed)
export function useAdminUserId(): string | null {
  const { adminUser } = useAdmin();
  return adminUser?.id || null;
}