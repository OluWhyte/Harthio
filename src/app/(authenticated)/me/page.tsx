'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { User, Loader2, CheckCircle, Edit, Settings, HelpCircle, LogOut } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

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

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

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
      {/* Main Content */}
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        {/* Profile Card */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center space-y-4">
              <Avatar className="h-32 w-32 ring-4 ring-primary/10 shadow-lg">
                <AvatarImage src={userProfile.avatar_url || undefined} alt="Profile" />
                <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                  {getInitials(userProfile.display_name || '')}
                </AvatarFallback>
              </Avatar>

              <div className="space-y-2">
                <h2 className="text-2xl font-bold">{userProfile.display_name || 'User'}</h2>
                {userProfile.headline && (
                  <p className="text-[15px] text-muted-foreground italic">"{userProfile.headline}"</p>
                )}
              </div>

              {/* Contact Info */}
              <div className="space-y-2 text-[15px] text-muted-foreground">
                <div className="flex items-center justify-center gap-2">
                  <span>📧</span>
                  <span>{userProfile.email}</span>
                </div>
                {userProfile.country && (
                  <div className="flex items-center justify-center gap-2">
                    <span>📍</span>
                    <span>{userProfile.country}</span>
                  </div>
                )}
              </div>

              {/* Recovery Goals */}
              {userProfile.recovery_goals && (
                <div className="mt-4 p-4 bg-primary/5 rounded-lg border border-primary/10">
                  <h3 className="text-sm font-semibold text-primary mb-2">Recovery Goals</h3>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {userProfile.recovery_goals}
                  </p>
                </div>
              )}

              {/* Verification Badge */}
              <Badge variant="secondary" className="px-3 py-1">
                <CheckCircle className="h-4 w-4 mr-1 text-green-500" />
                Email Verified
              </Badge>

              {/* Member Since */}
              <p className="text-sm text-muted-foreground">
                {getMemberSince(userProfile.created_at)}
              </p>

              {/* Edit Profile Button */}
              <Link href="/me/edit" className="w-full max-w-xs">
                <Button variant="outline" className="w-full">
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Profile
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
            <Link href="/me/edit">
              <Button variant="ghost" className="w-full justify-start">
                <Settings className="h-4 w-4 mr-2" />
                Account Settings
              </Button>
            </Link>
            <Link href="/contact">
              <Button variant="ghost" className="w-full justify-start">
                <HelpCircle className="h-4 w-4 mr-2" />
                Help & Support
              </Button>
            </Link>
            <Button
              variant="ghost"
              className="w-full justify-start text-destructive hover:text-destructive"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Log Out
            </Button>
          </CardContent>
        </Card>

        {/* Pro Tier Placeholder */}
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="pt-6">
            <div className="text-center space-y-3">
              <div className="text-4xl">✨</div>
              <h3 className="text-lg font-semibold">Upgrade to Pro</h3>
              <p className="text-sm text-muted-foreground">
                Get unlimited AI conversations, advanced CBT tools, and priority support
              </p>
              <Button className="mt-2" disabled>
                Coming Soon
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* App Info */}
        <Card>
          <CardContent className="pt-6">
            <div className="text-center space-y-2 text-sm text-muted-foreground">
              <p>Harthio v0.3</p>
              <p>Your recovery companion</p>
              <div className="flex justify-center gap-4 mt-4">
                <Link href="/privacy" className="hover:text-primary">
                  Privacy
                </Link>
                <Link href="/terms" className="hover:text-primary">
                  Terms
                </Link>
                <Link href="/contact" className="hover:text-primary">
                  Contact
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
