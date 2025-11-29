'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  BarChart3, 
  FileText, 
  Users, 
  Settings as SettingsIcon, 
  MessageSquare,
  LogOut,
  TestTube,
  Search,
  Mail,
  Brain,
  Shield,
  Heart,
  ShieldCheck,
  Bell,
  Sparkles,
  DollarSign
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';

const adminNavItems = [
  {
    name: 'Dashboard',
    href: '/admin-v2',
    icon: BarChart3
  },
  {
    name: 'Users',
    href: '/admin-v2/users',
    icon: Users
  },
  {
    name: 'Admins',
    href: '/admin-v2/admins',
    icon: ShieldCheck
  },
  {
    name: 'Sessions',
    href: '/admin-v2/sessions',
    icon: MessageSquare
  },
  {
    name: 'AI Management',
    href: '/admin-v2/ai',
    icon: Brain
  },
  {
    name: 'Finance',
    href: '/admin-v2/finance',
    icon: DollarSign
  },
  {
    name: 'Monetization',
    href: '/admin-v2/monetization',
    icon: Sparkles
  },
  {
    name: 'Recovery',
    href: '/admin-v2/recovery',
    icon: Heart
  },
  {
    name: 'Campaigns',
    href: '/admin-v2/campaigns',
    icon: Mail
  },
  {
    name: 'Analytics',
    href: '/admin-v2/analytics',
    icon: BarChart3
  },
  {
    name: 'SEO',
    href: '/admin-v2/seo',
    icon: Search
  },
  {
    name: 'Blog',
    href: '/admin-v2/blog',
    icon: FileText
  },
  {
    name: 'Testing',
    href: '/admin-v2/testing',
    icon: TestTube
  },
  {
    name: 'Notifications',
    href: '/admin-v2/notifications',
    icon: Bell
  },
  {
    name: 'Settings',
    href: '/admin-v2/settings',
    icon: SettingsIcon
  }
];

interface AdminSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AdminSidebar({ isOpen, onClose }: AdminSidebarProps) {
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
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-gray-200 transform transition-transform duration-200 ease-in-out flex flex-col',
          'lg:translate-x-0 lg:top-16 lg:h-[calc(100vh-4rem)]',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Logo/Header - Only show on mobile */}
        <div className="p-6 border-b border-gray-200 lg:hidden">
          <h1 className="text-xl font-bold text-gray-900">Harthio Admin</h1>
          {user?.email && (
            <p className="text-xs text-gray-500 mt-1 truncate">{user.email}</p>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-1 scrollbar-hide">
          {adminNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href));
            
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={onClose}
                className={cn(
                  'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-gray-700 hover:bg-gray-100'
                )}
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Logout button */}
        <div className="p-4 border-t border-gray-200">
          <Button
            variant="ghost"
            onClick={handleLogout}
            className="w-full justify-start gap-3 text-gray-700 hover:bg-gray-100"
          >
            <LogOut className="h-5 w-5" />
            <span>Logout</span>
          </Button>
        </div>
      </aside>
    </>
  );
}
