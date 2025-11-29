'use client';

import { useEffect, ReactNode, useState, Suspense } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import Link from 'next/link';
import { Logo } from '@/components/common/logo';
import { NavigationLoader } from '@/components/common/navigation-loader';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Search, Home, User, Bell, Users, History as HistoryIcon, LogOut, UsersRound, Menu, Loader2, BellRing, MessageCircle, TrendingUp, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Badge } from '@/components/ui/badge';
import { OngoingSessionIndicator } from './ongoing-session-indicator';
import { useToast } from '@/hooks/use-toast';
import { MobileNavigation } from '@/components/harthio/mobile-navigation';
import { useOptimizedRequests } from '@/hooks/use-optimized-requests';
import { usePageTracking, useNoCheckinsDetection } from '@/hooks/useProactiveAI';
import { ContactUsDialog } from '@/components/harthio/contact-us-dialog';

function getInitials(name: string = '') {
  const names = name.split(' ');
  const initials = names.map((n) => n[0]).join('');
  return initials.toUpperCase() || 'U';
}

const navItems = [
    { href: '/home', label: 'Home', icon: Home, showBadge: false },
    { href: '/harthio', label: 'Harthio', icon: MessageCircle, showBadge: false },
    { href: '/sessions', label: 'Sessions', icon: Calendar, showBadge: false },
    { href: '/progress', label: 'Progress', icon: TrendingUp, showBadge: false },
    { href: '/notifications', label: 'Notifications', icon: BellRing, showBadge: true },
    { href: '/me', label: 'Profile', icon: User, showBadge: false },
]

export function DashboardClientLayout({ children }: { children: ReactNode }) {
  const { user, userProfile, loading, logOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  
  // Proactive AI hooks
  usePageTracking(); // Track page views
  useNoCheckinsDetection(); // Check for no check-ins (once on load)
  
  // Get pending requests count for badge
  const { receivedRequests, refresh } = useOptimizedRequests({
    enableCache: true,
    enableRealtime: true,
  });
  
  const notificationCount = receivedRequests.length;
  
  // Refresh requests when pathname changes (user navigates)
  useEffect(() => {
    refresh?.(false);
  }, [pathname, refresh]);

  const handleLogout = async () => {
    try {
      await logOut();
      router.push('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };
  const [isSheetOpen, setSheetOpen] = useState(false);
  const [hasRedirected, setHasRedirected] = useState(false);
  const [profileLoadDelay, setProfileLoadDelay] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    // Only redirect if loading is complete and we definitely don't have a user
    if (!loading && !user && !hasRedirected) {
      console.log('No user found in dashboard layout, redirecting to login...');
      setHasRedirected(true);
      router.push('/login');
    }
  }, [user, loading, router, hasRedirected]);
  
  useEffect(() => {
    setSheetOpen(false);
  }, [pathname]);

  // Handle profile loading delay to prevent premature error display
  useEffect(() => {
    if (!loading && user && !userProfile) {
      const timer = setTimeout(() => {
        setProfileLoadDelay(false);
      }, 3000); // Wait 3 seconds for profile to load
      
      return () => clearTimeout(timer);
    } else if (userProfile) {
      // Profile loaded successfully, reset delay
      setProfileLoadDelay(true);
    }
  }, [loading, user, userProfile]);

  // Show loading while auth is being determined or during redirect
  if (loading || (!user && !hasRedirected)) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Show redirect message only after we've initiated the redirect
  if (!user && hasRedirected) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Redirecting to login...</p>
        </div>
      </div>
    );
  }
  
  if (!userProfile) {
    // Show loading spinner while profile is being fetched or auth is still loading
    if (loading || profileLoadDelay) {
      return (
        <div className="flex items-center justify-center min-h-screen bg-background">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Loading your profile...</p>
          </div>
        </div>
      );
    }
    
    // Only show error after loading is complete and reasonable delay has passed
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background">
        <div className="text-center max-w-md">
          <p className="mb-2 text-lg font-semibold">Having trouble loading your profile</p>
          <p className="mb-4 text-muted-foreground">
            This usually fixes itself by logging out and back in. Your data is safe.
          </p>
          <Button onClick={handleLogout}>Log Out & Sign Back In</Button>
        </div>
      </div>
    );
  }
  
  const handleComingSoonClick = (label: string) => {
    toast({
      title: 'Coming Soon!',
      description: `The "${label}" feature is currently under development.`,
    });
  };

  const sidebarContent = (
    <div className="flex h-full max-h-screen flex-col gap-2 overflow-hidden">
      <div className="flex h-16 items-center border-b px-4 lg:px-6 flex-shrink-0">
          <Link href="/home" className="flex items-center gap-2 font-semibold">
            <Logo />
        </Link>
      </div>
      <div className="flex-1 overflow-y-auto py-4">
        <nav className="grid items-start px-2 text-sm font-medium lg:px-4 gap-1">
          {navItems.map(item => {
            const Icon = item.icon;
            if (item.isComingSoon) {
              return (
                 <button
                    key={item.label}
                    onClick={() => handleComingSoonClick(item.label)}
                    className="flex items-center gap-4 rounded-lg px-4 py-3 text-muted-foreground transition-all hover:text-primary hover:bg-muted/50"
                 >
                    <Icon className="h-6 w-6 flex-shrink-0" strokeWidth={2.5} />
                    <span className="flex-1 text-left text-[15px]">{item.label}</span>
                    <Badge variant="outline" className="text-[10px]">Soon</Badge>
                 </button>
              );
            }
            return (
                <Link
                    key={item.label}
                    href={item.href}
                    className={cn(
                        "flex items-center gap-4 rounded-lg px-4 py-3 text-muted-foreground transition-all hover:text-primary hover:bg-muted/50 relative",
                        pathname.startsWith(item.href) && "bg-muted text-primary"
                    )}
                >
                    <div className="relative flex-shrink-0">
                        <Icon className="h-6 w-6" strokeWidth={2.5} />
                        {item.showBadge && notificationCount > 0 && (
                          <Badge 
                            variant="destructive" 
                            className="absolute -top-1 -right-1 h-4 min-w-[16px] flex items-center justify-center p-0 px-1 text-[9px] font-bold rounded-full"
                          >
                            {notificationCount > 9 ? '9+' : notificationCount}
                          </Badge>
                        )}
                    </div>
                    <span className="flex-1 text-[15px]">{item.label}</span>
                </Link>
            )
          })}
          <div className="px-2 mt-2">
            <ContactUsDialog>
              <Button variant="ghost" className="w-full justify-start px-4 py-3 h-auto">
                <MessageCircle className="h-6 w-6 mr-4 flex-shrink-0" strokeWidth={2.5} />
                <span className="flex-1 text-left text-[15px]">Contact Us</span>
              </Button>
            </ContactUsDialog>
          </div>
        </nav>
      </div>
        <div className="p-4 border-t flex-shrink-0">
            <Button size="sm" className="w-full" onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4"/>
                Log Out
            </Button>
        </div>
    </div>
  );


  return (
    <TooltipProvider>
    <div className="flex h-screen w-full overflow-hidden">
      {/* Navigation Loading Indicator */}
      <NavigationLoader />
      
      {/* Fixed Sidebar - Desktop Only */}
      <div className="hidden border-r bg-card md:flex md:w-[220px] lg:w-[280px] flex-shrink-0">
        {sidebarContent}
      </div>
      
      {/* Main Content Area */}
      <div className="flex flex-col flex-1 min-w-0">
          {/* Fixed Desktop Header */}
          <header className="hidden md:flex h-16 items-center gap-4 border-b bg-card px-4 lg:px-6 flex-shrink-0">
                <div className="flex-1">
                    <div className="relative w-full max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        <Input 
                            id="dashboard-search"
                            name="search"
                            placeholder="Search Harthio..." 
                            className="pl-10" 
                        />
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <OngoingSessionIndicator />
                    <Tooltip>
                        <TooltipTrigger asChild>
                             <Avatar className="cursor-pointer bg-background border border-border">
                                <AvatarImage src={userProfile.avatar_url ?? ''} alt={userProfile.display_name ?? 'User'} />
                                <AvatarFallback className="bg-background">
                                  <User className="h-5 w-5 text-accent" />
                                </AvatarFallback>
                            </Avatar>
                        </TooltipTrigger>
                        <TooltipContent>
                           <p>{userProfile.display_name}</p>
                           <p className="text-xs text-muted-foreground">{userProfile.email}</p>
                        </TooltipContent>
                    </Tooltip>
                </div>
            </header>
        
        {/* Scrollable Main Content - Full height for Harthio page */}
        <main className={`flex-1 pb-16 md:pb-0 ${pathname === '/harthio' ? 'flex flex-col overflow-hidden' : 'overflow-y-auto'}`}>
          {children}
        </main>
        
        {/* Mobile Session Indicator - Floating above bottom nav, left side */}
        {pathname === '/sessions' && (
          <div className="md:hidden fixed bottom-20 left-4 z-50">
            <OngoingSessionIndicator />
          </div>
        )}
        
        <MobileNavigation />
      </div>
    </div>
    </TooltipProvider>
  );
}
