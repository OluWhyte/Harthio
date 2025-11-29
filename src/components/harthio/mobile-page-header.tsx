'use client';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Logo } from '@/components/common/logo';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface HeaderAction {
  icon: LucideIcon;
  onClick: () => void;
  label: string;
  badge?: number;
  variant?: 'default' | 'ghost' | 'outline';
}

interface MobilePageHeaderProps {
  actions?: HeaderAction[];
  className?: string;
  showSearch?: boolean;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
}

export function MobilePageHeader({ 
  actions = [], 
  className,
  showSearch = false,
  onSearchChange,
  searchPlaceholder = "Search..."
}: MobilePageHeaderProps) {
  return (
    <>
      <header className={cn(
        "md:hidden sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60",
        className
      )}>
        <div className="flex h-14 items-center justify-between px-4">
          {/* Left: Logo + Branding */}
          <Logo size="sm" showBeta={true} />

          {/* Right: Actions */}
          <div className="flex items-center gap-1">
            {actions.map((action, index) => {
              const Icon = action.icon;
              return (
                <Button
                  key={index}
                  variant={action.variant || 'ghost'}
                  size="icon"
                  className="h-11 w-11 relative active:scale-110 transition-all duration-apple ease-apple hover:bg-gray-100 focus-visible:ring-0 focus-visible:ring-offset-0 focus:outline-none [-webkit-tap-highlight-color:transparent]"
                  onClick={action.onClick}
                  aria-label={action.label}
                  style={{ WebkitTapHighlightColor: 'transparent' }}
                >
                  <Icon className="h-7 w-7 text-foreground" strokeWidth={2.5} />
                  {action.badge !== undefined && action.badge > 0 && (
                    <Badge 
                      variant="destructive" 
                      className="absolute -top-0.5 -right-0.5 h-5 min-w-[20px] flex items-center justify-center p-0 px-1.5 text-[10px] font-bold rounded-full shadow-apple"
                    >
                      {action.badge > 9 ? '9+' : action.badge}
                    </Badge>
                  )}
                </Button>
              );
            })}
          </div>
        </div>
      </header>

      {/* Optional Search Bar Below Header */}
      {showSearch && (
        <div className="md:hidden bg-background px-4 py-2.5">
          <div className="relative max-w-md">
            <input
              type="text"
              placeholder={searchPlaceholder}
              onChange={(e) => onSearchChange?.(e.target.value)}
              className="w-full h-9 pl-9 pr-4 rounded-full border bg-muted/30 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:bg-background transition-colors"
            />
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
        </div>
      )}
    </>
  );
}
