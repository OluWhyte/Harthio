'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { AdminSidebar } from '@/components/admin/admin-sidebar';
import { AdminAnalytics } from '@/components/admin/admin-analytics';
import { Button } from '@/components/ui/button';
import { Menu, X } from 'lucide-react';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  
  // Don't show navigation on login page
  const isLoginPage = pathname === '/admin/login';

  if (isLoginPage) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <h1 className="text-lg font-semibold text-gray-900">Harthio Admin</h1>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          className="p-2"
        >
          {isMobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {/* Mobile spacer */}
      <div className="lg:hidden h-[57px]" />

      <div className="flex">
        <AdminSidebar isOpen={isMobileOpen} onClose={() => setIsMobileOpen(false)} />
        <div className="flex-1 flex flex-col min-w-0">
          <main className="flex-1 overflow-auto">
            {children}
          </main>
          <AdminAnalytics />
        </div>
      </div>
    </div>
  );
}
