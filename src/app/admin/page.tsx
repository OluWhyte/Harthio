'use client';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

import dynamicImport from 'next/dynamic';

// Dynamically import the entire admin dashboard with no SSR
const AdminDashboardContent = dynamicImport(() => import('./admin-dashboard-content'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
    </div>
  )
});

export default function AdminDashboard() {
  return <AdminDashboardContent />;
}

