'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { AdminSidebar } from '@/components/admin/admin-sidebar';
import { NotificationBell } from '@/components/admin/notification-center';
import { NavigationLoader } from '@/components/common/navigation-loader';
import { Logo } from '@/components/common/logo';
import { Button } from '@/components/ui/button';
import { AdminProvider, useAdmin } from '@/contexts/admin-context';
import { Menu, X } from 'lucide-react';
import { LoadingSpinner } from '@/components/common/loading-spinner';

function AdminLayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const { adminUser, isLoading } = useAdmin();
  
  // Don't show navigation on login page
  const isLoginPage = pathname === '/admin-v2/login';

  if (isLoginPage) {
    return <>{children}</>;
  }

  // Show loading state while checking admin status
  if (isLoading) {
    return <LoadingSpinner size="lg" text="Verifying admin access..." />;
  }

  // Redirect non-admins to login (but only after loading is complete)
  if (!adminUser && !isLoading) {
    console.log('[Admin Layout] No admin user found, redirecting to login');
    window.location.href = '/admin-v2/login';
    return <LoadingSpinner size="lg" text="Redirecting..." />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Loading Indicator */}
      <NavigationLoader />
      
      {/* Universal Header - attached to sidebar */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200">
        <div className="flex h-16 items-center px-6">
          {/* Mobile menu button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsMobileOpen(!isMobileOpen)}
            className="lg:hidden mr-3 p-2"
          >
            {isMobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>

          {/* Logo */}
          <Logo size="sm" />
          
          {/* Admin badge with user info */}
          {adminUser && (
            <div className="ml-3 px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded max-w-xs">
              {/* Desktop: Single line with role and name */}
              <span className="hidden sm:inline">
                {adminUser.role === 'admin' ? 'Admin' : 'Editor'} • {adminUser.display_name || adminUser.email}
              </span>
              
              {/* Mobile: Stacked layout with role and name */}
              <div className="sm:hidden flex flex-col leading-tight">
                <div className="font-semibold">
                  {adminUser.role === 'admin' ? 'Admin' : 'Editor'}
                </div>
                <div className="text-blue-600 truncate">
                  {adminUser.display_name || adminUser.email}
                </div>
              </div>
            </div>
          )}
          
          {/* Spacer */}
          <div className="flex-1" />
          
          {/* Notification Bell */}
          <NotificationBell />
        </div>
      </header>

      {/* Header spacer */}
      <div className="h-16" />

      {/* Sidebar */}
      <AdminSidebar isOpen={isMobileOpen} onClose={() => setIsMobileOpen(false)} />
      
      {/* Main content with left padding for sidebar on desktop */}
      <div className="lg:pl-64">
        <main className="w-full">
          {children}
        </main>
      </div>
    </div>
  );
}

export default function AdminV2Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminProvider>
      <AdminLayoutContent>{children}</AdminLayoutContent>
    </AdminProvider>
  );
}
