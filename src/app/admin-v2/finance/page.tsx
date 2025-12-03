'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DollarSign, TrendingUp, CreditCard, Users, Package, Crown, Settings as SettingsIcon, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';

interface FinanceStats {
  // Credits
  creditsRevenue: number;
  creditsSold: number;
  creditsPurchases: number;
  
  // Subscriptions
  subscriptionRevenue: number;
  activeSubscribers: number;
  trialUsers: number;
  
  // Combined
  totalRevenue: number;
  monthlyRecurring: number;
}

export default function AdminFinancePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [stats, setStats] = useState<FinanceStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [paymentsEnabled, setPaymentsEnabled] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadFinanceData();
  }, []);

  const loadFinanceData = async () => {
    setLoading(true);
    
    try {
      // Load payments enabled setting
      const { data: settingsData } = await supabase
        .from('platform_settings')
        .select('*');
      
      const settingsMap: Record<string, any> = {};
      settingsData?.forEach(s => { settingsMap[s.setting_key] = s; });
      
      setPaymentsEnabled(settingsMap['payments_enabled']?.setting_value?.enabled ?? false);
      
      // Get credit purchases
      const { data: creditPurchases } = await supabase
        .from('credit_purchases')
        .select('amount_usd, credits_purchased, status');

      const completedCredits = creditPurchases?.filter(p => p.status === 'completed') || [];
      const creditsRevenue = completedCredits.reduce((sum, p) => sum + Number(p.amount_usd), 0);
      const creditsSold = completedCredits.reduce((sum, p) => sum + p.credits_purchased, 0);

      // Get subscription data
      const { data: users } = await supabase
        .from('users')
        .select('subscription_tier, subscription_end_date, is_trial_active, trial_end_date');

      const proUsers = users?.filter(u => u.subscription_tier === 'pro') || [];
      const activeSubscribers = proUsers.filter(u => {
        if (!u.subscription_end_date) return false;
        return new Date(u.subscription_end_date) > new Date();
      }).length;

      const trialUsers = users?.filter(u => u.is_trial_active && u.trial_end_date && new Date(u.trial_end_date) > new Date()).length || 0;

      // Calculate subscription revenue (estimate: $9.99/month per active subscriber)
      const subscriptionRevenue = activeSubscribers * 9.99;
      const monthlyRecurring = subscriptionRevenue; // MRR

      setStats({
        creditsRevenue,
        creditsSold,
        creditsPurchases: completedCredits.length,
        subscriptionRevenue,
        activeSubscribers,
        trialUsers,
        totalRevenue: creditsRevenue + subscriptionRevenue,
        monthlyRecurring,
      });
    } catch (error) {
      console.error('Error loading finance data:', error);
    } finally {
      setLoading(false);
    }
  };

  const updatePaymentsSetting = async (enabled: boolean) => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('platform_settings')
        .update({ 
          setting_value: { enabled, message: enabled ? 'Payments are enabled' : 'Payment processing is currently disabled. Coming soon!' },
          updated_by: (user as any)?.id,
          updated_at: new Date().toISOString()
        })
        .eq('setting_key', 'payments_enabled');
      
      if (error) throw error;
      
      setPaymentsEnabled(enabled);
      toast({
        title: enabled ? 'Payments Enabled' : 'Payments Disabled',
        description: enabled 
          ? 'Users can now make payments for credits and subscriptions'
          : 'Payment buttons will show "Coming Soon" message',
      });
    } catch (error) {
      console.error('Error updating payments setting:', error);
      toast({
        title: 'Error',
        description: 'Failed to update payment settings',
        variant: 'destructive',
      });
      // Revert on error
      await loadFinanceData();
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Finance</h1>
          <p className="text-muted-foreground">Revenue and subscription analytics</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map(i => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">Finance</h1>
        <p className="text-muted-foreground">Revenue and subscription analytics</p>
      </div>

      {/* Payment Settings */}
      {!paymentsEnabled && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Payments Disabled:</strong> All payment buttons show "Coming Soon". Enable below to accept payments.
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-6">
            <SettingsIcon className="h-5 w-5 text-gray-600" />
            <h3 className="text-lg font-semibold">Payment Processing</h3>
          </div>
          <div className="flex items-center justify-between py-3">
            <div className="space-y-1 flex-1 mr-4">
              <Label className="text-base font-semibold">Enable Payments</Label>
              <p className="text-sm text-gray-600">
                Master switch to enable/disable all payment processing. When disabled, buy buttons show "Coming Soon". 
                When enabled, users can purchase credits and Pro subscriptions via Paystack.
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                💡 This is separate from feature toggles in Monetization. Features can be enabled without accepting payments.
              </p>
            </div>
            <Switch 
              checked={paymentsEnabled} 
              onCheckedChange={updatePaymentsSetting}
              disabled={saving} 
            />
          </div>
        </CardContent>
      </Card>

      {/* Overview Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Total Revenue */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats?.totalRevenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              All time
            </p>
          </CardContent>
        </Card>

        {/* Monthly Recurring Revenue */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">MRR</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats?.monthlyRecurring.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Monthly recurring
            </p>
          </CardContent>
        </Card>

        {/* Active Subscribers */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pro Subscribers</CardTitle>
            <Crown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.activeSubscribers}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Active subscriptions
            </p>
          </CardContent>
        </Card>

        {/* Trial Users */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Trial Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.trialUsers}</div>
            <p className="text-xs text-muted-foreground mt-1">
              In 14-day trial
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Breakdown */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="subscriptions">Subscriptions</TabsTrigger>
          <TabsTrigger value="credits">Credits</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Subscription Revenue */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Crown className="h-5 w-5 text-primary" />
                  Subscription Revenue
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Total Revenue</p>
                  <p className="text-3xl font-bold">${stats?.subscriptionRevenue.toFixed(2)}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Active Subs</p>
                    <p className="text-2xl font-bold">{stats?.activeSubscribers}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">In Trial</p>
                    <p className="text-2xl font-bold">{stats?.trialUsers}</p>
                  </div>
                </div>
                <div className="pt-4 border-t">
                  <p className="text-xs text-muted-foreground">
                    Estimated based on $9.99/month per active subscriber
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Credits Revenue */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5 text-primary" />
                  Credits Revenue
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Total Revenue</p>
                  <p className="text-3xl font-bold">${stats?.creditsRevenue.toFixed(2)}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Credits Sold</p>
                    <p className="text-2xl font-bold">{stats?.creditsSold}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Purchases</p>
                    <p className="text-2xl font-bold">{stats?.creditsPurchases}</p>
                  </div>
                </div>
                <div className="pt-4 border-t">
                  <p className="text-xs text-muted-foreground">
                    One-time credit pack purchases
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Revenue Split */}
          <Card>
            <CardHeader>
              <CardTitle>Revenue Split</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Subscriptions</span>
                    <span className="text-sm text-muted-foreground">
                      {stats?.totalRevenue ? ((stats.subscriptionRevenue / stats.totalRevenue) * 100).toFixed(1) : 0}%
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full"
                      style={{
                        width: stats?.totalRevenue
                          ? `${(stats.subscriptionRevenue / stats.totalRevenue) * 100}%`
                          : '0%',
                      }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Credits</span>
                    <span className="text-sm text-muted-foreground">
                      {stats?.totalRevenue ? ((stats.creditsRevenue / stats.totalRevenue) * 100).toFixed(1) : 0}%
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className="bg-accent h-2 rounded-full"
                      style={{
                        width: stats?.totalRevenue
                          ? `${(stats.creditsRevenue / stats.totalRevenue) * 100}%`
                          : '0%',
                      }}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="subscriptions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Subscription Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Active Pro</p>
                    <p className="text-2xl font-bold">{stats?.activeSubscribers}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">In Trial</p>
                    <p className="text-2xl font-bold">{stats?.trialUsers}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">MRR</p>
                    <p className="text-2xl font-bold">${stats?.monthlyRecurring.toFixed(2)}</p>
                  </div>
                </div>
                <div className="pt-4 border-t">
                  <p className="text-sm text-muted-foreground">
                    💡 Tip: Track conversion rate from trial to paid in Analytics
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="credits" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Credits Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Sold</p>
                    <p className="text-2xl font-bold">{stats?.creditsSold}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Purchases</p>
                    <p className="text-2xl font-bold">{stats?.creditsPurchases}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Revenue</p>
                    <p className="text-2xl font-bold">${stats?.creditsRevenue.toFixed(2)}</p>
                  </div>
                </div>
                <div className="pt-4 border-t">
                  <p className="text-sm text-muted-foreground">
                    💡 Tip: View detailed credit analytics in Credits page
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
