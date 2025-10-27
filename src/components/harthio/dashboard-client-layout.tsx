'use client';

import { useEffect, ReactNode, useState, Suspense } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import Link from 'next/link';
import { Logo } from '@/components/common/logo';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Search, Home, User, Bell, Users, History as HistoryIcon, LogOut, UsersRound, Menu, MessageSquare, Loader2, BellRing } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Badge } from '@/components/ui/badge';
import { ContactUsDialog } from '@/components/harthio/contact-us-dialog';
import { OngoingSessionIndicator } from './ongoing-session-indicator';
import { useToast } from '@/hooks/use-toast';

function getInitials(name: string = '') {
  const names = name.split(' ');
  const initials = names.map((n) => n[0]).join('');
  return initials.toUpperCase() || 'U';
}

const navItems = [
    { href: '/dashboard', label: 'Home', icon: Home },
    { href: '/requests', label: 'Requests', icon: BellRing },
    { href: '/profile', label: 'Profile', icon: User },
    { href: '/notifications', label: 'Notifications', icon: Bell },
    { href: '/following', label: 'Following', icon: Users, isComingSoon: true },
    { href: '/followers', label: 'Followers', icon: UsersRound, isComingSoon: true },
    { href: '/history', label: 'History', icon: HistoryIcon },
]

export function DashboardClientLayout({ children }: { children: ReactNode }) {
  const { user, userProfile, loading, logOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

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
          <p className="mb-4 text-muted-foreground">Could not load user profile. Please try logging out and back in.</p>
          <Button onClick={handleLogout}>Log Out</Button>
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
    <div className="flex h-full max-h-screen flex-col gap-2">
      <div className="flex h-14 sm:h-16 items-center border-b px-3 sm:px-4 lg:px-6">
          <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
            <Logo />
        </Link>
      </div>
      <div className="flex-1">
        <nav className="grid items-start px-2 text-base font-medium lg:px-4">
          {navItems.map(item => {
            const Icon = item.icon;
            if (item.isComingSoon) {
              return (
                 <button
                    key={item.label}
                    onClick={() => handleComingSoonClick(item.label)}
                    className="flex items-center gap-2 sm:gap-3 rounded-lg px-2 sm:px-3 py-2 text-muted-foreground transition-all hover:text-primary text-sm sm:text-base"
                 >
                    <Icon className="h-4 w-4 flex-shrink-0" />
                    <span className="flex-1 text-left truncate">{item.label}</span>
                    <Badge variant="outline" className="text-sm">Soon</Badge>
                 </button>
              );
            }
            return (
                <Link
                    key={item.label}
                    href={item.href}
                    className={cn(
                        "flex items-center gap-2 sm:gap-3 rounded-lg px-2 sm:px-3 py-2 text-muted-foreground transition-all hover:text-primary text-sm sm:text-base",
                        pathname.startsWith(item.href) && item.href !== '/dashboard' && "bg-muted text-primary",
                        pathname === '/dashboard' && item.href === '/dashboard' && "bg-muted text-primary"
                    )}
                >
                    <Icon className="h-4 w-4 flex-shrink-0" />
                    <span className="flex-1 truncate">{item.label}</span>
                </Link>
            )
          })}
            <ContactUsDialog>
                 <Button
                    variant="ghost"
                    className="flex items-center gap-2 sm:gap-3 rounded-lg px-2 sm:px-3 py-2 text-muted-foreground transition-all hover:text-primary justify-start w-full text-sm sm:text-base"
                >
                    <MessageSquare className="h-4 w-4 flex-shrink-0" />
                    <span className="flex-1 text-left truncate">Contact Us</span>
                </Button>
            </ContactUsDialog>
        </nav>
      </div>
        <div className="mt-auto p-3 sm:p-4">
            <Button size="sm" className="w-full text-sm" onClick={handleLogout}>
                <LogOut className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4"/>
                <span className="truncate">Log Out</span>
            </Button>
        </div>
    </div>
  );


  return (
    <TooltipProvider>
    <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
      <div className="hidden border-r bg-card md:block">
        {sidebarContent}
      </div>
      <div className="flex flex-col">
          <header className="flex h-14 sm:h-16 items-center gap-2 sm:gap-4 border-b bg-card px-3 sm:px-4 lg:px-6">
                <Sheet open={isSheetOpen} onOpenChange={setSheetOpen}>
                    <SheetTrigger asChild>
                         <Button
                            variant="outline"
                            size="icon"
                            className="shrink-0 md:hidden h-8 w-8 sm:h-10 sm:w-10"
                            >
                            <Menu className="h-4 w-4 sm:h-5 sm:w-5" />
                            <span className="sr-only">Toggle navigation menu</span>
                        </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="flex flex-col p-0 w-[280px] sm:w-[320px]">
                       {sidebarContent}
                    </SheetContent>
                </Sheet>
                <div className="flex-1 min-w-0">
                    <div className="relative w-full max-w-xs sm:max-w-md">
                        <Search className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
                        <Input 
                            id="dashboard-search"
                            name="search"
                            placeholder="Search..." 
                            className="pl-8 sm:pl-10 text-sm sm:text-base h-8 sm:h-10" 
                        />
                    </div>
                </div>
                <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
                    <OngoingSessionIndicator />
                    <Tooltip>
                        <TooltipTrigger asChild>
                             <Avatar className="h-8 w-8 sm:h-10 sm:w-10">
                                <AvatarImage src={userProfile.avatar_url ?? ''} alt={userProfile.display_name ?? 'User'} />
                                <AvatarFallback className="text-xs sm:text-sm">{getInitials(userProfile.display_name ?? '')}</AvatarFallback>
                            </Avatar>
                        </TooltipTrigger>
                        <TooltipContent>
                           <p className="text-base break-words">{userProfile.display_name}</p>
                           <p className="text-sm text-muted-foreground break-words">{userProfile.email}</p>
                        </TooltipContent>
                    </Tooltip>
                </div>
            </header>
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
    </TooltipProvider>
  );
}
