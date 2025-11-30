'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Sparkles, Plus, Minus, Search, ArrowLeft } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

interface UserCredit {
  id: string;
  email: string;
  ai_credits: number;
  credits_expire_at: string | null;
}

export default function ManageCreditsPage() {
  const [searchEmail, setSearchEmail] = useState('');
  const [searchedUser, setSearchedUser] = useState<UserCredit | null>(null);
  const [searching, setSearching] = useState(false);
  const [creditsToAdd, setCreditsToAdd] = useState('');
  const [validityDays, setValidityDays] = useState('30');
  const [processing, setProcessing] = useState(false);
  const { toast } = useToast();

  const handleSearch = async () => {
    if (!searchEmail.trim()) {
      toast({
        title: 'Email required',
        description: 'Please enter a user email to search',
        variant: 'destructive',
      });
      return;
    }

    setSearching(true);
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, email, ai_credits, credits_expire_at')
        .eq('email', searchEmail.trim())
        .single();

      if (error || !data) {
        toast({
          title: 'User not found',
          description: 'No user found with that email address',
          variant: 'destructive',
        });
        setSearchedUser(null);
        return;
      }

      setSearchedUser(data as any);
    } catch (error) {
      console.error('Error searching user:', error);
      toast({
        title: 'Search failed',
        description: 'An error occurred while searching',
        variant: 'destructive',
      });
    } finally {
      setSearching(false);
    }
  };

  const handleAddCredits = async () => {
    if (!searchedUser) return;

    const credits = parseInt(creditsToAdd);
    const days = parseInt(validityDays);

    if (isNaN(credits) || credits <= 0) {
      toast({
        title: 'Invalid amount',
        description: 'Please enter a valid number of credits',
        variant: 'destructive',
      });
      return;
    }

    if (isNaN(days) || days <= 0) {
      toast({
        title: 'Invalid validity',
        description: 'Please enter a valid number of days',
        variant: 'destructive',
      });
      return;
    }

    setProcessing(true);
    try {
      const now = new Date();
      const currentExpiry = searchedUser.credits_expire_at
        ? new Date(searchedUser.credits_expire_at)
        : null;

      // Calculate new expiry
      let newExpiry: Date;
      if (currentExpiry && currentExpiry > now) {
        // Extend existing expiry
        newExpiry = new Date(currentExpiry);
        newExpiry.setDate(newExpiry.getDate() + days);
      } else {
        // Start fresh expiry
        newExpiry = new Date(now);
        newExpiry.setDate(newExpiry.getDate() + days);
      }

      // Calculate new balance
      const currentCredits = currentExpiry && currentExpiry > now ? searchedUser.ai_credits : 0;
      const newBalance = currentCredits + credits;

      const { error } = await supabase
        .from('users')
        .update({
          ai_credits: newBalance,
          credits_expire_at: newExpiry.toISOString(),
        })
        .eq('id', searchedUser.id);

      if (error) throw error;

      toast({
        title: 'Credits added!',
        description: `Added ${credits} credits to ${searchedUser.email}`,
      });

      // Refresh user data
      setSearchedUser({
        ...searchedUser,
        ai_credits: newBalance,
        credits_expire_at: newExpiry.toISOString(),
      });
      setCreditsToAdd('');
    } catch (error) {
      console.error('Error adding credits:', error);
      toast({
        title: 'Failed to add credits',
        description: 'An error occurred',
        variant: 'destructive',
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleRemoveCredits = async () => {
    if (!searchedUser) return;

    const credits = parseInt(creditsToAdd);

    if (isNaN(credits) || credits <= 0) {
      toast({
        title: 'Invalid amount',
        description: 'Please enter a valid number of credits',
        variant: 'destructive',
      });
      return;
    }

    setProcessing(true);
    try {
      const newBalance = Math.max(0, searchedUser.ai_credits - credits);

      const { error } = await supabase
        .from('users')
        .update({ ai_credits: newBalance })
        .eq('id', searchedUser.id);

      if (error) throw error;

      toast({
        title: 'Credits removed!',
        description: `Removed ${credits} credits from ${searchedUser.email}`,
      });

      // Refresh user data
      setSearchedUser({
        ...searchedUser,
        ai_credits: newBalance,
      });
      setCreditsToAdd('');
    } catch (error) {
      console.error('Error removing credits:', error);
      toast({
        title: 'Failed to remove credits',
        description: 'An error occurred',
        variant: 'destructive',
      });
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/admin-v2/monetization">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Manage Credits</h1>
          <p className="text-muted-foreground">Add or remove credits for users</p>
        </div>
      </div>

      {/* Search User */}
      <Card>
        <CardHeader>
          <CardTitle>Find User</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <Input
                placeholder="Enter user email..."
                value={searchEmail}
                onChange={(e) => setSearchEmail(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <Button onClick={handleSearch} disabled={searching}>
              <Search className="h-4 w-4 mr-2" />
              {searching ? 'Searching...' : 'Search'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* User Details & Actions */}
      {searchedUser && (
        <>
          {/* Current Balance */}
          <Card>
            <CardHeader>
              <CardTitle>Current Balance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">User</p>
                  <p className="text-lg font-medium">{searchedUser.email}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Credits</p>
                    <p className="text-3xl font-bold text-primary">{searchedUser.ai_credits}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Expires</p>
                    <p className="text-lg font-medium">
                      {searchedUser.credits_expire_at
                        ? new Date(searchedUser.credits_expire_at).toLocaleDateString()
                        : 'No expiry'}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Add/Remove Credits */}
          <Card>
            <CardHeader>
              <CardTitle>Modify Credits</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="credits">Number of Credits</Label>
                  <Input
                    id="credits"
                    type="number"
                    placeholder="50"
                    value={creditsToAdd}
                    onChange={(e) => setCreditsToAdd(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="validity">Validity (days)</Label>
                  <Input
                    id="validity"
                    type="number"
                    placeholder="30"
                    value={validityDays}
                    onChange={(e) => setValidityDays(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Only applies when adding credits
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <Button
                  onClick={handleAddCredits}
                  disabled={processing || !creditsToAdd}
                  className="flex-1"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Credits
                </Button>
                <Button
                  onClick={handleRemoveCredits}
                  disabled={processing || !creditsToAdd}
                  variant="destructive"
                  className="flex-1"
                >
                  <Minus className="h-4 w-4 mr-2" />
                  Remove Credits
                </Button>
              </div>

              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground">
                  ⚠️ <strong>Warning:</strong> Manual credit changes are not tracked in purchase history.
                  Use this for support cases, refunds, or promotional credits only.
                </p>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
