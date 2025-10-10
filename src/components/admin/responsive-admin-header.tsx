'use client';

import Link from 'next/link';
import { Logo } from '@/components/common/logo';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface ActionButton {
  label: string;
  icon?: React.ReactNode;
  onClick?: () => void;
  variant?: 'default' | 'outline' | 'ghost';
  disabled?: boolean;
  className?: string;
}

interface ResponsiveAdminHeaderProps {
  title: string;
  breadcrumbs?: BreadcrumbItem[];
  actions?: ActionButton[];
  backHref?: string;
  backLabel?: string;
  className?: string;
}

export function ResponsiveAdminHeader({
  title,
  breadcrumbs = [],
  actions = [],
  backHref = '/admin',
  backLabel = 'Dashboard',
  className
}: ResponsiveAdminHeaderProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <header className={cn("bg-white border-b border-gray-200 sticky top-0 z-50", className)}>
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6">
        {/* Main Header Row */}
        <div className="flex justify-between items-center h-14 sm:h-16">
          {/* Left Section - Logo and Navigation */}
          <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
            {/* Logo - Always visible */}
            <div className="flex-shrink-0">
              <Logo />
            </div>
            
            {/* Desktop Navigation */}
            <div className="hidden sm:flex items-center gap-2 min-w-0">
              <Button variant="ghost" size="sm" asChild className="flex-shrink-0">
                <Link href={backHref}>
                  <ArrowLeft className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                  <span className="hidden md:inline">{backLabel}</span>
                  <span className="md:hidden">Back</span>
                </Link>
              </Button>
              
              {/* Breadcrumbs */}
              {breadcrumbs.length > 0 && (
                <div className="flex items-center gap-2 min-w-0">
                  {breadcrumbs.map((crumb, index) => (
                    <div key={index} className="flex items-center gap-2 min-w-0">
                      <span className="text-gray-400 text-sm">/</span>
                      {crumb.href ? (
                        <Link 
                          href={crumb.href} 
                          className="text-sm text-gray-600 hover:text-gray-900 truncate"
                        >
                          {crumb.label}
                        </Link>
                      ) : (
                        <span className="text-sm text-gray-600 truncate">{crumb.label}</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
              
              <span className="text-gray-400 text-sm">/</span>
              <h1 className="text-lg sm:text-xl font-semibold text-gray-900 truncate">
                {title}
              </h1>
            </div>

            {/* Mobile Title */}
            <div className="sm:hidden min-w-0 flex-1">
              <h1 className="text-base font-semibold text-gray-900 truncate">
                {title}
              </h1>
            </div>
          </div>

          {/* Right Section - Actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Desktop Actions */}
            <div className="hidden sm:flex items-center gap-2 lg:gap-3">
              {actions.map((action, index) => (
                <Button
                  key={index}
                  variant={action.variant || 'outline'}
                  size="sm"
                  onClick={action.onClick}
                  disabled={action.disabled}
                  className={cn("flex-shrink-0", action.className)}
                >
                  {action.icon}
                  <span className={cn(
                    action.icon && "ml-1 sm:ml-2",
                    "hidden lg:inline"
                  )}>
                    {action.label}
                  </span>
                  <span className={cn(
                    action.icon && "ml-1",
                    "lg:hidden"
                  )}>
                    {action.label.split(' ')[0]}
                  </span>
                </Button>
              ))}
            </div>

            {/* Mobile Menu Button */}
            <div className="sm:hidden">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2"
              >
                {isMobileMenuOpen ? (
                  <X className="h-4 w-4" />
                ) : (
                  <Menu className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {isMobileMenuOpen && (
          <div className="sm:hidden border-t border-gray-200 py-3 space-y-3">
            {/* Mobile Back Button */}
            <Button variant="ghost" size="sm" asChild className="w-full justify-start">
              <Link href={backHref} onClick={() => setIsMobileMenuOpen(false)}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                {backLabel}
              </Link>
            </Button>

            {/* Mobile Breadcrumbs */}
            {breadcrumbs.length > 0 && (
              <div className="space-y-1">
                {breadcrumbs.map((crumb, index) => (
                  <div key={index} className="pl-4">
                    {crumb.href ? (
                      <Link 
                        href={crumb.href} 
                        className="text-sm text-gray-600 hover:text-gray-900 block py-1"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        {crumb.label}
                      </Link>
                    ) : (
                      <span className="text-sm text-gray-600 block py-1">{crumb.label}</span>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Mobile Actions */}
            {actions.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-gray-100">
                {actions.map((action, index) => (
                  <Button
                    key={index}
                    variant={action.variant || 'outline'}
                    size="sm"
                    onClick={() => {
                      action.onClick?.();
                      setIsMobileMenuOpen(false);
                    }}
                    disabled={action.disabled}
                    className={cn("w-full justify-start", action.className)}
                  >
                    {action.icon}
                    <span className={action.icon ? "ml-2" : ""}>
                      {action.label}
                    </span>
                  </Button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}