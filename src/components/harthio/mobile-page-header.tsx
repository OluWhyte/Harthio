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
  title: string;
  actions?: HeaderAction[];
  className?: string;
}

export function MobilePageHeader({ title, actions = [], className }: MobilePageHeaderProps) {
  return (
    <header className={cn(
      "md:hidden sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60",
      className
    )}>
      <div className="flex h-14 items-center justify-between px-4">
        {/* Left: Logo + Branding (reuses desktop logo, smaller size) */}
        <Logo size="sm" showBeta={true} />

        {/* Center: Page Title */}
        <h1 className="text-sm font-semibold text-muted-foreground">
          {title}
        </h1>

        {/* Right: Actions */}
        <div className="flex items-center gap-1">
          {actions.map((action, index) => {
            const Icon = action.icon;
            return (
              <Button
                key={index}
                variant={action.variant || 'ghost'}
                size="icon"
                className="h-10 w-10 relative"
                onClick={action.onClick}
                aria-label={action.label}
              >
                <Icon className="h-5 w-5" />
                {action.badge !== undefined && action.badge > 0 && (
                  <Badge 
                    variant="destructive" 
                    className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-[10px]"
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
  );
}
