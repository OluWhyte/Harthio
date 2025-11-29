'use client';

import { usePathname, useRouter } from 'next/navigation';
import { Home, MessageCircle, Calendar, TrendingUp, User } from 'lucide-react';
import { cn } from '@/lib/utils';

const tabs = [
  {
    name: 'Home',
    icon: Home,
    path: '/home',
  },
  {
    name: 'Sessions',
    icon: Calendar,
    path: '/sessions',
  },
  {
    name: 'Harthio',
    icon: MessageCircle,
    path: '/harthio',
  },
  {
    name: 'Progress',
    icon: TrendingUp,
    path: '/progress',
  },
  {
    name: 'Me',
    icon: User,
    path: '/me',
  },
];

export function MobileNavigation() {
  const pathname = usePathname();
  const router = useRouter();

  const isActive = (path: string) => {
    if (path === '/sessions') {
      return pathname === '/sessions' || pathname === '/dashboard' || pathname === '/';
    }
    return pathname?.startsWith(path);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/95 border-t border-border md:hidden">
      <div className="flex items-center justify-around h-16 px-1 touch-manipulation">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = isActive(tab.path);

          return (
            <button
              key={tab.path}
              onClick={() => router.push(tab.path)}
              className={cn(
                'flex flex-col items-center justify-center flex-1 h-full gap-0.5 transition-colors min-w-0 px-1',
                active
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground active:text-foreground'
              )}
            >
              <Icon className={cn('h-6 w-6 flex-shrink-0', active && 'fill-primary/20')} strokeWidth={2.5} />
              <span className="text-[10px] font-semibold truncate w-full text-center sm:hidden">{tab.name}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
