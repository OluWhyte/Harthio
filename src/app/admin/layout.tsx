'use client';

import { usePathname } from 'next/navigation';
import { AdminNav } from '@/components/admin/admin-nav';
import { AdminAnalytics } from '@/components/admin/admin-analytics';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  
  // Don't show navigation on login page
  const isLoginPage = pathname === '/admin/login';

  return (
    <div className="min-h-screen bg-gray-50">
      {!isLoginPage && <AdminNav />}
      <div className="w-full overflow-x-hidden">
        {children}
      </div>
      {!isLoginPage && <AdminAnalytics />}
    </div>
  );
}
