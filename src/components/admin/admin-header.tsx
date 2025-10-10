'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/common/logo';
import { ArrowLeft, Eye } from 'lucide-react';

interface AdminHeaderProps {
  title: string;
  breadcrumb?: {
    href: string;
    label: string;
  };
  actions?: React.ReactNode;
}

export function AdminHeader({ title, breadcrumb, actions }: AdminHeaderProps) {
  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 py-4 sm:h-16 sm:py-0">
          <div className="flex items-center gap-4 min-w-0 flex-1">
            <Logo className="hidden sm:block" />
            <div className="flex items-center gap-2 min-w-0 flex-1">
              {breadcrumb && (
                <>
                  <Button variant="ghost" size="sm" asChild className="shrink-0">
                    <Link href={breadcrumb.href}>
                      <ArrowLeft className="h-4 w-4 mr-1" />
                      <span className="hidden sm:inline">{breadcrumb.label}</span>
                    </Link>
                  </Button>
                  <span className="text-gray-400 hidden sm:inline">/</span>
                </>
              )}
              <h1 className="text-lg sm:text-xl font-semibold text-gray-900 truncate">{title}</h1>
            </div>
          </div>
          
          {actions && (
            <div className="flex items-center gap-2 sm:gap-4 shrink-0">
              {actions}
              <Button variant="outline" size="sm" asChild className="hidden sm:flex">
                <Link href="/" target="_blank">
                  <Eye className="h-4 w-4 mr-2" />
                  View Site
                </Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}