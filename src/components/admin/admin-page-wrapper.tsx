/**
 * Admin Page Wrapper Component
 * Provides consistent layout, spacing, and responsive design for all admin pages
 */

import { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

interface AdminPageWrapperProps {
  title: string;
  description?: string;
  actions?: ReactNode;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  children: ReactNode;
}

export function AdminPageWrapper({
  title,
  description,
  actions,
  onRefresh,
  isRefreshing = false,
  children,
}: AdminPageWrapperProps) {
  return (
    <div className="w-full h-full">
      {/* Consistent page container with proper padding */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 max-w-7xl">
        {/* Page Header - Consistent across all pages */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            {/* Title and Description */}
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 truncate">
                {title}
              </h1>
              {description && (
                <p className="mt-1 text-sm text-gray-600">
                  {description}
                </p>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 flex-shrink-0">
              {onRefresh && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onRefresh}
                  disabled={isRefreshing}
                  className="gap-2"
                >
                  <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                  <span className="hidden sm:inline">Refresh</span>
                </Button>
              )}
              {actions}
            </div>
          </div>
        </div>

        {/* Page Content */}
        <div className="space-y-6">
          {children}
        </div>
      </div>
    </div>
  );
}

/**
 * Admin Section Component
 * For grouping related content within a page
 */
interface AdminSectionProps {
  title?: string;
  description?: string;
  children: ReactNode;
  className?: string;
}

export function AdminSection({
  title,
  description,
  children,
  className = '',
}: AdminSectionProps) {
  return (
    <div className={`space-y-4 ${className}`}>
      {(title || description) && (
        <div>
          {title && (
            <h2 className="text-lg font-semibold text-gray-900">
              {title}
            </h2>
          )}
          {description && (
            <p className="mt-1 text-sm text-gray-600">
              {description}
            </p>
          )}
        </div>
      )}
      {children}
    </div>
  );
}

/**
 * Admin Stats Grid Component
 * Responsive grid for stat cards
 */
interface AdminStatsGridProps {
  children: ReactNode;
  columns?: 2 | 3 | 4;
}

export function AdminStatsGrid({
  children,
  columns = 4,
}: AdminStatsGridProps) {
  const gridCols = {
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
  };

  return (
    <div className={`grid ${gridCols[columns]} gap-4`}>
      {children}
    </div>
  );
}
