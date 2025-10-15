'use client';

import { ResponsiveAdminHeader } from '@/components/admin/responsive-admin-header';
import { UserManagement } from '@/components/admin/user-management';

export default function UserManagementPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <ResponsiveAdminHeader
        title="User Management"
        actions={[]}
      />

      <main className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-8">
        <UserManagement />
      </main>
    </div>
  );
}