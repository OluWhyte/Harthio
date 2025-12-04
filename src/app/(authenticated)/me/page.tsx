'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { User, Loader2, CheckCircle, Edit, Settings, HelpCircle, LogOut, Bell, Calendar, MessageCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { MobilePageHeader } from '@/components/harthio/mobile-page-header';
import { useOptimizedRequests } from '@/hooks/use-optimized-requests';
import { ContactUsDialog } from '@/components/harthio/contact-us-dialog';
import { sobrietyService } from '@/lib/sobriety-service';
import { getUserTier } from '@/lib/services/tier-service';
import { creditsService, type CreditBalance } from '@/lib/services/credits-service';
import { Sparkles, Crown, Zap } from 'lucide-react';
import { platformSettingsService } from '@/lib/services/platform-settings-service';

const getInitials = (name: string = '') => {
  if (!name) return 'U';
  return name
    .split(' ')
    .map((n) => n[0] || '')
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

const getMemberSince = (createdAt: string) => {
  const date = new Date(createdAt);
  const month = date.toLocaleDateString('en-US', { month: 'long' });
  const year = date.getFullYear();
  return `Member since ${month} ${year}`;
};

export default function MePage() {
  const { user, userProfile, loading, logOut } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const { receivedRequests } = useOptimizedRequests();
  const [highestMilestone, setHighestMilestone] = useState<{ emoji: string; text: string } | null>(null);
  const [tier, setTier] = useState<'free' | 'pro'>('free');
  const [creditBalance, setCreditBalance] = useState<CreditBalance | null>(null);
  const [loadingBalance, setLoadingBalance] = useState(true);
  const [proEnabled, setProEnabled] = useState(false);
  const [creditsEnabled, setCreditsEnabled] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    const loadMilestones = async () => {
      if (!user?.uid) return;
      
      const trackers = await sobrietyService.getActiveTrackers(user.uid);
      if (trackers.length === 0) return;

      // Find the highest milestone across all trackers
      let maxDays = 0;
      trackers.forEach(tracker => {
        const breakdown = sobrietyService.calculateTimeBreakdown(tracker.start_date);
        if (breakdown.totalDays > maxDays) {
          maxDays = breakdown.totalDays;
        }
      });

      // Set the highest milestone badge
      if (maxDays >= 365) {
        setHighestMilestone({ emoji: '👑', text: '1 Year' });
      } else if (maxDays >= 90) {
        setHighestMilestone({ emoji: '🏆', text: '90 Days' });
      } else if (maxDays >= 30) {
        setHighestMilestone({ emoji: '🎉', text: '1 Month' });
      } else if (maxDays >= 7) {
        setHighestMilestone({ emoji: '🌟', text: '1 Week' });
      } else if (maxDays >= 1) {
        setHighestMilestone({ emoji: '✨', text: '1 Day' });
      }
    };

    loadMilestones();
  }, [user]);

  useEffect(() => {
    const loadTierAndBalance = async () => {
      if (!user?.uid) return;
      
      setLoadingBalance(true);
      try {
        const [userTier, balance, settings] = await Promise.all([
          getUserTier(user.uid),
          creditsService.getCreditBalance(user.uid),
          platformSettingsService.getSettings(),
        ]);
        
        setTier(userTier);
        setCreditBalance(balance);
        setProEnabled(settings.proTierEnabled);
        setCreditsEnabled(settings.creditsEnabled);
      } catch (error) {
        console.error('Error loading tier and balance:', error);
        // Set defaults on error
        setTier('free');
        setCreditBalance({ credits: 0, expiresAt: null, isExpired: false });
        setProEnabled(false);
        setCreditsEnabled(false);
      } finally {
        setLoadingBalance(false);
      }
    };

    loadTierAndBalance();
  }, [user]);

  const handleLogout = async () => {
    try {
      await logOut();
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

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || !userProfile) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Unified Mobile Header */}
      <MobilePageHeader
        actions={[
          {
            icon: Bell,
            onClick: () => router.push('/notifications'),
            label: 'Notifications',
            badge: receivedRequests.length,
          },
        ]}
      />

      {/* Main Content */}
      <div className="max-w-2xl mx-auto pb-20 md:pb-6">
        {/* Profile Header Section - X-style */}
        <div className="bg-background border-b">
          {/* Profile Info Section */}
          <div className="px-4 md:px-6 pt-6">
            {/* Avatar & Edit Button Row */}
            <div className="flex justify-between items-start mb-3">
              <Avatar className="h-24 w-24 md:h-32 md:w-32 bg-background border border-border">
                <AvatarImage src={userProfile.avatar_url || undefined} alt="Profile" />
                <AvatarFallback className="bg-background">
                  <User className="h-12 w-12 md:h-16 md:w-16 text-accent" />
                </AvatarFallback>
              </Avatar>
              
              <Link href="/me/edit" className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-full">
                <Button variant="outline" size="sm" className="rounded-full">
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Profile
                </Button>
              </Link>
            </div>

            {/* Name & Info */}
            <div className="pb-4 space-y-3">
              <div>
                <h2 className="text-xl font-bold flex items-center gap-2 flex-wrap">
                  {userProfile.display_name || 'User'}
                  <Badge variant="secondary" className="px-2 py-0.5">
                    <CheckCircle className="h-3 w-3 mr-1 text-green-500" />
                    Verified
                  </Badge>
                  {highestMilestone && (
                    <Badge variant="default" className="px-2 py-0.5 bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20">
                      <span className="mr-1">{highestMilestone.emoji}</span>
                      {highestMilestone.text}
                    </Badge>
                  )}
                </h2>
                {userProfile.headline && (
                  <p className="text-[15px] text-muted-foreground mt-1">"{userProfile.headline}"</p>
                )}
              </div>

              {/* Recovery Goals */}
              {userProfile.recovery_goals && (
                <p className="text-[15px] whitespace-pre-wrap">
                  {userProfile.recovery_goals}
                </p>
              )}

              {/* Meta Info */}
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-[15px] text-muted-foreground">
                {userProfile.country && (
                  <div className="flex items-center gap-1">
                    <span>📍</span>
                    <span>{userProfile.country}</span>
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <span>📧</span>
                  <span className="truncate max-w-[200px]">{userProfile.email}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  <span>{getMemberSince(userProfile.created_at || '')}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Subscription & Credits Status */}
        <div className="border-b bg-background">
          <div className="px-4 md:px-6 py-4">
            <h3 className="text-[17px] font-semibold mb-3">Account Status</h3>
            
            {loadingBalance ? (
              <Card className="bg-muted/30">
                <CardContent className="pt-6 text-center">
                  <Loader2 className="h-6 w-6 animate-spin text-primary mx-auto" />
                </CardContent>
              </Card>
            ) : tier === 'pro' ? (
              // Pro Subscription Active
              <Card className="bg-gradient-to-br from-primary/10 to-accent/10 border-primary/30">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Crown className="h-5 w-5 text-primary" />
                        <h4 className="font-semibold text-lg">Pro Member</h4>
                        <Badge className="bg-primary">Active</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">
                        Unlimited AI messages • Advanced tools • Priority support
                      </p>
                      <div className="flex items-center gap-2 text-sm">
                        <Zap className="h-4 w-4 text-primary" />
                        <span className="font-medium">Unlimited messages</span>
                      </div>
                      {creditBalance && creditBalance.credits > 0 && !creditBalance.isExpired && (
                        <div className="mt-3 pt-3 border-t border-primary/20">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Sparkles className="h-4 w-4" />
                            <span>
                              {creditBalance.credits} credits saved for later
                              {creditBalance.expiresAt && (
                                <span className="text-xs ml-1">
                                  (expires {new Date(creditBalance.expiresAt).toLocaleDateString()})
                                </span>
                              )}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full mt-4"
                    onClick={() => {
                      toast({
                        title: 'Subscription Management',
                        description: 'To cancel or modify your subscription, please contact support.',
                      });
                    }}
                  >
                    Manage Subscription
                  </Button>
                </CardContent>
              </Card>
            ) : creditBalance && creditBalance.credits > 0 && !creditBalance.isExpired ? (
              // Has Credits (Free tier)
              <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Sparkles className="h-5 w-5 text-primary" />
                        <h4 className="font-semibold text-lg">Credits Balance</h4>
                      </div>
                      <div className="flex items-baseline gap-2 mb-2">
                        <span className="text-3xl font-bold text-primary">{creditBalance.credits}</span>
                        <span className="text-muted-foreground">AI messages left</span>
                      </div>
                      {creditBalance.expiresAt && (
                        <p className="text-sm text-muted-foreground">
                          Expires {new Date(creditBalance.expiresAt).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="space-y-3 mt-4">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="text-center">
                        <Button 
                          variant="default" 
                          size="sm" 
                          className="w-full"
                          onClick={() => {
                            if (creditsEnabled) {
                              router.push('/credits');
                            } else {
                              toast({
                                title: 'Coming Soon',
                                description: 'Credit purchases will be available soon!',
                              });
                            }
                          }}
                        >
                          Buy More
                        </Button>
                        <p className="text-[10px] text-muted-foreground mt-1">Add credits</p>
                      </div>
                      <div className="text-center">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="w-full"
                          onClick={() => {
                            if (proEnabled) {
                              router.push('/pricing');
                            } else {
                              toast({
                                title: 'Coming Soon',
                                description: 'Pro subscription will be available soon!',
                              });
                            }
                          }}
                        >
                          Go Unlimited
                        </Button>
                        <p className="text-[10px] text-muted-foreground mt-1">Upgrade to Pro</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              // Free Tier (No credits)
              <Card className="bg-muted/30 border-muted">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <User className="h-5 w-5 text-muted-foreground" />
                        <h4 className="font-semibold text-lg">Free Plan</h4>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">
                        3 AI messages per day • Basic features
                      </p>
                      <div className="flex items-center gap-2 text-sm">
                        <span className="font-medium">3/3 messages today</span>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-3 mt-4">
                    <p className="text-xs text-center text-muted-foreground">
                      Choose your upgrade path:
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="text-center">
                        <Button 
                          variant="default" 
                          size="sm" 
                          className="w-full"
                          onClick={() => {
                            if (creditsEnabled) {
                              router.push('/credits');
                            } else {
                              toast({
                                title: 'Coming Soon',
                                description: 'Credit purchases will be available soon!',
                              });
                            }
                          }}
                        >
                          Buy Credits
                        </Button>
                        <p className="text-[10px] text-muted-foreground mt-1">Pay as you go</p>
                      </div>
                      <div className="text-center">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="w-full"
                          onClick={() => {
                            if (proEnabled) {
                              router.push('/pricing');
                            } else {
                              toast({
                                title: 'Coming Soon',
                                description: 'Pro subscription will be available soon!',
                              });
                            }
                          }}
                        >
                          Upgrade to Pro
                        </Button>
                        <p className="text-[10px] text-muted-foreground mt-1">Unlimited access</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Content Sections */}
        <div className="border-b bg-background">
          <div className="px-4 md:px-6 py-4">
            <h3 className="text-[17px] font-semibold mb-3">Quick Actions</h3>
            <div className="space-y-2">
              <Link href="/me/edit" className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-md block">
                <Button variant="ghost" className="w-full justify-start transition-all duration-300 hover:scale-[1.02] hover:shadow-sm active:scale-[0.98]">
                  <Settings className="h-5 w-5 mr-3 transition-transform duration-300 group-hover:rotate-90" />
                  <span className="text-[15px]">Account Settings</span>
                </Button>
              </Link>
              <div className="md:hidden">
                <ContactUsDialog>
                  <Button variant="ghost" className="w-full justify-start transition-all duration-300 hover:scale-[1.02] hover:shadow-sm active:scale-[0.98]">
                    <MessageCircle className="h-5 w-5 mr-3" />
                    <span className="text-[15px]">Contact Us</span>
                  </Button>
                </ContactUsDialog>
              </div>
              <Link href="/contact" className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-md block">
                <Button variant="ghost" className="w-full justify-start transition-all duration-300 hover:scale-[1.02] hover:shadow-sm active:scale-[0.98]">
                  <HelpCircle className="h-5 w-5 mr-3 transition-transform duration-300 group-hover:scale-110" />
                  <span className="text-[15px]">Help & Support</span>
                </Button>
              </Link>
              <Button
                variant="ghost"
                className="w-full justify-start h-11 text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={handleLogout}
              >
                <LogOut className="h-5 w-5 mr-3" />
                <span className="text-[15px]">Log Out</span>
              </Button>
            </div>
          </div>
        </div>

        {/* App Info */}
        <div className="bg-background px-4 md:px-6 py-6">
          <div className="text-center space-y-2 text-[13px] text-muted-foreground">
            <p>Harthio v0.3</p>
            <p>Your recovery companion</p>
            <div className="flex justify-center gap-4 mt-4">
              <Link href="/privacy" className="hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm px-1">
                Privacy
              </Link>
              <Link href="/terms" className="hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm px-1">
                Terms
              </Link>
              <Link href="/contact" className="hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm px-1">
                Contact
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
