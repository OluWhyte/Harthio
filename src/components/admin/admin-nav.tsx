'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  BarChart3, 
  FileText, 
  Users, 
  Settings as SettingsIcon, 
  MessageSquare,
  Shield,
  LogOut,
  TestTube,
  Search,
  Mail
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';

const adminNavItems = [
  {
    name: 'Dashboard',
    href: '/admin',
    icon: BarChart3
  },
  {
    name: 'Users',
    href: '/admin/users',
    icon: Users
  },
  {
    name: 'Sessions',
    href: '/admin/sessions',
    icon: MessageSquare
  },
  {
    name: 'Campaigns',
    href: '/admin/campaigns',
    icon: Mail
  },
  {
    name: 'Analytics',
    href: '/admin/analytics',
    icon: BarChart3
  },
  {
    name: 'SEO',
    href: '/admin/seo',
    icon: Search
  },
  {
    name: 'Blog',
    href: '/admin/blog',
    icon: FileText
  },
  {
    name: 'Testing',
    href: '/admin/testing',
    icon: TestTube
  },
  {
    name: 'Settings',
    href: '/admin/settings',
    icon: SettingsIcon
  }
];

export function AdminNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logOut } = useAuth();
  const { toast } = useToast();

  const handleLogout = async () => {
    try {
      await logOut();
      toast({
        title: 'Logged out',
        description: 'You have been successfully logged out.',
      });
      router.push('/');
    } catch (error) {
      console.error('Logout error:', error);
      toast({
        title: 'Error',
        description: 'Failed to log out. Please try again.',
        variant: 'destructive',
      });
    }
  };

  return (
    <nav className="bg-white border-b border-gray-200 overflow-x-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center">
          {/* Navigation Items */}
          <div className="flex space-x-4 sm:space-x-8 min-w-max sm:min-w-0">
            {adminNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href));
              
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-1 sm:gap-2 py-4 px-2 sm:px-1 border-b-2 text-xs sm:text-sm font-medium transition-colors whitespace-nowrap',
                    isActive
                      ? 'border-primary text-primary'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  )}
                >
                  <Icon className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden xs:inline sm:inline">{item.name}</span>
                </Link>
              );
            })}
          </div>

          {/* User Info and Logout */}
          <div className="flex items-center gap-2 py-4 ml-4 flex-shrink-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="flex items-center gap-1 sm:gap-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100"
              title={user?.email ? `Logged in as ${user.email}` : "Logout"}
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
}