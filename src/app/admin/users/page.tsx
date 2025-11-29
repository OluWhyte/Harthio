'use client';

import { UserManagement } from '@/components/admin/user-management';
import { ErrorBoundary } from '@/components/common/error-boundary';

export default function UserManagementPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-8">
        <ErrorBoundary
          fallback={
            <div className="p-6 border border-red-200 rounded-lg bg-red-50">
              <h2 className="text-red-800 font-semibold mb-2">Unable to load user management</h2>
              <p className="text-red-700 text-sm">
                There was an error loading the user management interface. Please try refreshing the page.
              </p>
            </div>
          }
        >
          <UserManagement />
        </ErrorBoundary>
      </main>
    </div>
  );
}
