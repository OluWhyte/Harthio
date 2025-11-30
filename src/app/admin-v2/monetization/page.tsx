'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { 
  Crown, Sparkles, DollarSign, Users, TrendingUp, Clock, Package,
  Search, RefreshCw, Activity, AlertCircle, Settings as SettingsIcon
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import Link from 'next/link';
import { LoadingSpinner } from '@/components/common/loading-spinner';

type TabType = 'pro' | 'credits';
type StatusFilter = 'all' | 'completed' | 'pending' | 'failed' | 'refunded';
type DateFilter = 'all' | 'today' | 'week' | 'month';

interface Purchase {
  id: string;
  user_id: string;
  user_email: string;
  credits_purchased: number;
  amount_usd: number;
  status: string;
  created_at: string;
}

export default function MonetizationPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [activeTab, setActiveTab] = useState<TabType>('pro');
  const [allPurchases, setAllPurchases] = useState<Purchase[]>([]);
  const [filteredPurchases, setFilteredPurchases] = useState<Purchase[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchEmail, setSearchEmail] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');
  const [proEnabled, setProEnabled] = useState(false);
  const [trialEnabled, setTrialEnabled] = useState(false);
  const [rateLimitEnabled, setRateLimitEnabled] = useState(false);
  const [creditsEnabled, setCreditsEnabled] = useState(false);
  
  // Pricing state
  const [proPriceUSD, setProPriceUSD] = useState('9.99');
  const [proPriceNGN, setProPriceNGN] = useState('15000');
  const [creditPacks, setCreditPacks] = useState([
    { id: 'starter', name: 'Starter Pack', credits: 50, priceUSD: '2.00', priceNGN: '3000', days: 30 },
    { id: 'popular', name: 'Popular Pack', credits: 150, priceUSD: '5.00', priceNGN: '7500', days: 60 },
    { id: 'power', name: 'Power Pack', credits: 500, priceUSD: '10.00', priceNGN: '15000', days: 90 }
  ]);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterPurchases();
  }, [allPurchases, searchEmail, statusFilter, dateFilter]);

  const loadData = async () => {
    try {
      setLoading(true);
      const { data: settingsData, error: settingsError } = await supabase
        .from('platform_settings')
        .select('*');
      
      if (settingsError) {
        console.error('Error loading settings:', settingsError);
      }
      
      const settingsMap: Record<string, any> = {};
      settingsData?.forEach(s => { settingsMap[s.setting_key] = s; });
      
      // Load settings with fallbacks
      setProEnabled(settingsMap['pro_tier_enabled']?.setting_value?.enabled ?? false);
      setTrialEnabled(settingsMap['trial_mode_enabled']?.setting_value?.enabled ?? false);
      setRateLimitEnabled(settingsMap['ai_rate_limiting_enabled']?.setting_value?.enabled ?? false);
      setCreditsEnabled(settingsMap['credits_enabled']?.setting_value?.enabled ?? false);
      
      // Load pricing
      const pricingData = settingsMap['pricing']?.setting_value;
      if (pricingData) {
        setProPriceUSD(pricingData.pro?.usd || '9.99');
        setProPriceNGN(pricingData.pro?.ngn || '15000');
        if (pricingData.credits) {
          setCreditPacks(pricingData.credits);
        }
      }
      
      // Log for debugging
      console.log('Credits setting loaded:', {
        exists: !!settingsMap['credits_enabled'],
        value: settingsMap['credits_enabled']?.setting_value,
        enabled: settingsMap['credits_enabled']?.setting_value?.enabled
      });

      const { data: usersData } = await supabase.from('users').select('id, email, subscription_tier, subscription_end_date, is_trial_active, trial_end_date, ai_credits, credits_expire_at');
      setUsers(usersData || []);

      const { data: purchasesData } = await supabase.from('credit_purchases').select('id, user_id, credits_purchased, amount_usd, status, created_at').order('created_at', { ascending: false });
      if (purchasesData) {
        const purchasesWithEmails = purchasesData.map(p => ({
          ...p,
          user_email: usersData?.find(u => u.id === p.user_id)?.email || 'Unknown'
        }));
        setAllPurchases(purchasesWithEmails as any);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast({ title: 'Error', description: 'Failed to load data', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const filterPurchases = () => {
    let filtered = [...allPurchases];
    if (searchEmail) {
      filtered = filtered.filter(p => p.user_email.toLowerCase().includes(searchEmail.toLowerCase()));
    }
    if (statusFilter !== 'all') {
      filtered = filtered.filter(p => p.status === statusFilter);
    }
    if (dateFilter !== 'all') {
      const now = new Date();
      let startDate = new Date();
      switch (dateFilter) {
        case 'today': startDate.setHours(0, 0, 0, 0); break;
        case 'week': startDate.setDate(now.getDate() - 7); break;
        case 'month': startDate.setMonth(now.getMonth() - 1); break;
      }
      filtered = filtered.filter(p => new Date(p.created_at) >= startDate);
    }
    setFilteredPurchases(filtered);
  };

  const updateSetting = async (key: string, value: any) => {
    setSaving(true);
    try {
      // First check if setting exists
      const { data: existing, error: checkError } = await supabase
        .from('platform_settings')
        .select('setting_key')
        .eq('setting_key', key)
        .maybeSingle();
      
      if (checkError) {
        console.error('Error checking setting:', checkError);
        throw checkError;
      }
      
      if (!existing) {
        // Create the setting if it doesn't exist
        const { error: insertError } = await supabase
          .from('platform_settings')
          .insert({
            setting_key: key,
            setting_value: value,
            description: key === 'credits_enabled' 
              ? 'Enable/disable pay-as-you-go credit system' 
              : 'Platform setting',
            updated_by: (user as any)?.id
          });
        
        if (insertError) {
          console.error('Error inserting setting:', insertError);
          throw insertError;
        }
      } else {
        // Update existing setting
        const { error: updateError } = await supabase
          .from('platform_settings')
          .update({ 
            setting_value: value, 
            updated_by: (user as any)?.id, 
            updated_at: new Date().toISOString() 
          })
          .eq('setting_key', key);
        
        if (updateError) {
          console.error('Error updating setting:', updateError);
          throw updateError;
        }
      }
      
      toast({ 
        title: 'Settings Updated', 
        description: 'Changes saved successfully' 
      });
      
      // Don't reload all data, just keep the current state
    } catch (error) {
      console.error('Error updating setting:', error);
      toast({ 
        title: 'Error', 
        description: 'Failed to update setting', 
        variant: 'destructive' 
      });
      // Revert the state on error
      await loadData();
    } finally {
      setSaving(false);
    }
  };

  const savePricing = async () => {
    setSaving(true);
    try {
      const pricingData = {
        pro: {
          usd: proPriceUSD,
          ngn: proPriceNGN
        },
        credits: creditPacks
      };

      await updateSetting('pricing', pricingData);
      
      toast({
        title: 'Pricing Updated',
        description: 'Prices have been saved and will reflect across the platform'
      });
    } catch (error) {
      console.error('Error saving pricing:', error);
      toast({
        title: 'Error',
        description: 'Failed to save pricing',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  const proUsers = users.filter(u => u.subscription_tier === 'pro');
  const activeSubscribers = proUsers.filter(u => u.subscription_end_date && new Date(u.subscription_end_date) > new Date()).length;
  const trialUsers = users.filter(u => u.is_trial_active && u.trial_end_date && new Date(u.trial_end_date) > new Date()).length;
  const proRevenue = activeSubscribers * 9.99;
  const completedPurchases = allPurchases.filter(p => p.status === 'completed');
  const totalCreditsSold = completedPurchases.reduce((sum, p) => sum + p.credits_purchased, 0);
  const creditsRevenue = completedPurchases.reduce((sum, p) => sum + Number(p.amount_usd), 0);
  const usersWithCredits = users.filter(u => u.ai_credits > 0);
  const now = new Date();
  const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const expiringUsers = usersWithCredits.filter(u => {
    if (!u.credits_expire_at) return false;
    const expiry = new Date(u.credits_expire_at);
    return expiry > now && expiry <= sevenDaysFromNow;
  }).length;

  if (loading) {
    return <LoadingSpinner size="lg" text="Loading monetization data..." />;
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 max-w-7xl">
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Monetization</h1>
            <p className="mt-1 text-sm text-gray-600">Manage Pro subscriptions and Credits system</p>
          </div>
          <Button variant="outline" size="sm" onClick={loadData} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
        </div>
      </div>

      <div className="space-y-6">
        {!proEnabled && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription><strong>Launch Mode:</strong> Pro tier disabled. All users have free access.</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-2 gap-2">
          <Button variant={activeTab === 'pro' ? 'default' : 'outline'} onClick={() => setActiveTab('pro')} className="text-xs sm:text-sm">
            <Crown className="h-4 w-4 mr-2" />Pro Tier
          </Button>
          <Button variant={activeTab === 'credits' ? 'default' : 'outline'} onClick={() => setActiveTab('credits')} className="text-xs sm:text-sm">
            <Sparkles className="h-4 w-4 mr-2" />Credits
          </Button>
        </div>

        {activeTab === 'pro' && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card><CardContent className="p-6"><div className="flex items-center justify-between"><div><p className="text-sm font-medium text-gray-600">Active Subscribers</p><p className="text-3xl font-bold text-gray-900 mt-2">{activeSubscribers}</p></div><div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center"><Crown className="h-6 w-6 text-purple-600" /></div></div></CardContent></Card>
              <Card><CardContent className="p-6"><div className="flex items-center justify-between"><div><p className="text-sm font-medium text-gray-600">Trial Users</p><p className="text-3xl font-bold text-blue-600 mt-2">{trialUsers}</p></div><div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center"><Users className="h-6 w-6 text-blue-600" /></div></div></CardContent></Card>
              <Card><CardContent className="p-6"><div className="flex items-center justify-between"><div><p className="text-sm font-medium text-gray-600">MRR</p><p className="text-3xl font-bold text-green-600 mt-2">${proRevenue.toFixed(2)}</p></div><div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center"><TrendingUp className="h-6 w-6 text-green-600" /></div></div></CardContent></Card>
              <Card><CardContent className="p-6"><div className="flex items-center justify-between"><div><p className="text-sm font-medium text-gray-600">Revenue</p><p className="text-3xl font-bold text-green-600 mt-2">${proRevenue.toFixed(2)}</p></div><div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center"><DollarSign className="h-6 w-6 text-green-600" /></div></div></CardContent></Card>
            </div>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-6">
                  <SettingsIcon className="h-5 w-5 text-gray-600" />
                  <h3 className="text-lg font-semibold">Pro Tier Settings</h3>
                </div>
                <div className="space-y-6">
                  {/* Enable Pro Tier */}
                  <div className="flex items-center justify-between py-3 border-b">
                    <div className="space-y-1 flex-1 mr-4">
                      <Label className="text-base font-semibold">Enable Pro Tier</Label>
                      <p className="text-sm text-gray-600">
                        Allow users to upgrade to Pro subscription ($9.99/month) for unlimited AI messages and premium features
                      </p>
                    </div>
                    <Switch 
                      checked={proEnabled} 
                      onCheckedChange={(e) => { 
                        setProEnabled(e); 
                        updateSetting('pro_tier_enabled', { enabled: e }); 
                      }} 
                      disabled={saving} 
                    />
                  </div>

                  {/* Enable Free Trials */}
                  <div className="flex items-center justify-between py-3 border-b">
                    <div className="space-y-1 flex-1 mr-4">
                      <Label className="text-base font-semibold">Enable Free Trials</Label>
                      <p className="text-sm text-gray-600">
                        Offer new users a 14-day free trial of Pro features to encourage conversions
                      </p>
                    </div>
                    <Switch 
                      checked={trialEnabled} 
                      onCheckedChange={(e) => { 
                        setTrialEnabled(e); 
                        updateSetting('trial_mode_enabled', { enabled: e, trial_days: 14 }); 
                      }} 
                      disabled={saving || !proEnabled} 
                    />
                  </div>

                  {/* Enable Rate Limiting */}
                  <div className="flex items-center justify-between py-3">
                    <div className="space-y-1 flex-1 mr-4">
                      <Label className="text-base font-semibold">Enable Rate Limiting</Label>
                      <p className="text-sm text-gray-600">
                        Limit free users to 3 AI messages per day. Pro users get unlimited messages
                      </p>
                    </div>
                    <Switch 
                      checked={rateLimitEnabled} 
                      onCheckedChange={(e) => { 
                        setRateLimitEnabled(e); 
                        updateSetting('ai_rate_limiting_enabled', { enabled: e, free_limit: 3, pro_limit: -1 }); 
                      }} 
                      disabled={saving || !proEnabled} 
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Pro Pricing Management */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-6">
                  <DollarSign className="h-5 w-5 text-gray-600" />
                  <h3 className="text-lg font-semibold">Pro Subscription Pricing</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Price (USD) - Monthly</Label>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-gray-600">$</span>
                      <Input
                        type="number"
                        step="0.01"
                        value={proPriceUSD}
                        onChange={(e) => setProPriceUSD(e.target.value)}
                        className="flex-1"
                        placeholder="9.99"
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Price (NGN) - Monthly</Label>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-gray-600">₦</span>
                      <Input
                        type="number"
                        step="100"
                        value={proPriceNGN}
                        onChange={(e) => setProPriceNGN(e.target.value)}
                        className="flex-1"
                        placeholder="15000"
                      />
                    </div>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t">
                  <Button onClick={savePricing} disabled={saving}>
                    {saving ? 'Saving...' : 'Save Pricing'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {activeTab === 'credits' && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card><CardContent className="p-6"><div className="flex items-center justify-between"><div><p className="text-sm font-medium text-gray-600">Credits Sold</p><p className="text-3xl font-bold text-gray-900 mt-2">{totalCreditsSold.toLocaleString()}</p></div><div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center"><Package className="h-6 w-6 text-blue-600" /></div></div></CardContent></Card>
              <Card><CardContent className="p-6"><div className="flex items-center justify-between"><div><p className="text-sm font-medium text-gray-600">Revenue</p><p className="text-3xl font-bold text-green-600 mt-2">${creditsRevenue.toFixed(2)}</p></div><div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center"><DollarSign className="h-6 w-6 text-green-600" /></div></div></CardContent></Card>
              <Card><CardContent className="p-6"><div className="flex items-center justify-between"><div><p className="text-sm font-medium text-gray-600">Active Users</p><p className="text-3xl font-bold text-blue-600 mt-2">{usersWithCredits.length}</p></div><div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center"><Activity className="h-6 w-6 text-blue-600" /></div></div></CardContent></Card>
              <Card><CardContent className="p-6"><div className="flex items-center justify-between"><div><p className="text-sm font-medium text-gray-600">Expiring Soon</p><p className="text-3xl font-bold text-orange-600 mt-2">{expiringUsers}</p></div><div className="h-12 w-12 bg-orange-100 rounded-lg flex items-center justify-center"><Clock className="h-6 w-6 text-orange-600" /></div></div></CardContent></Card>
            </div>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-6">
                  <SettingsIcon className="h-5 w-5 text-gray-600" />
                  <h3 className="text-lg font-semibold">Credits Settings</h3>
                </div>
                <div className="flex items-center justify-between py-3">
                  <div className="space-y-1 flex-1 mr-4">
                    <Label className="text-base font-semibold">Enable Credits System</Label>
                    <p className="text-sm text-gray-600">
                      Allow users to purchase AI message credits as pay-as-you-go packs. Credits don't expire daily like free messages
                    </p>
                  </div>
                  <Switch 
                    checked={creditsEnabled} 
                    onCheckedChange={async (checked) => { 
                      setCreditsEnabled(checked); 
                      await updateSetting('credits_enabled', { 
                        enabled: checked, 
                        packs: [
                          { id: 'starter', price: 2, credits: 50, days: 30 }, 
                          { id: 'popular', price: 5, credits: 150, days: 60 }, 
                          { id: 'power', price: 10, credits: 500, days: 90 }
                        ] 
                      }); 
                    }} 
                    disabled={saving} 
                  />
                </div>
              </CardContent>
            </Card>

            {/* Credit Packs Pricing Management */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-6">
                  <Package className="h-5 w-5 text-gray-600" />
                  <h3 className="text-lg font-semibold">Credit Packs Pricing</h3>
                </div>
                <div className="space-y-4">
                  {creditPacks.map((pack, index) => (
                    <div key={pack.id} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h4 className="font-semibold text-gray-900">{pack.name}</h4>
                          <p className="text-sm text-gray-600">{pack.credits} credits • Valid for {pack.days} days</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <Label className="text-xs font-medium">Price (USD)</Label>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-gray-600">$</span>
                            <Input
                              type="number"
                              step="0.01"
                              value={pack.priceUSD}
                              onChange={(e) => {
                                const newPacks = [...creditPacks];
                                newPacks[index].priceUSD = e.target.value;
                                setCreditPacks(newPacks);
                              }}
                              className="flex-1"
                            />
                          </div>
                        </div>
                        <div>
                          <Label className="text-xs font-medium">Price (NGN)</Label>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-gray-600">₦</span>
                            <Input
                              type="number"
                              step="100"
                              value={pack.priceNGN}
                              onChange={(e) => {
                                const newPacks = [...creditPacks];
                                newPacks[index].priceNGN = e.target.value;
                                setCreditPacks(newPacks);
                              }}
                              className="flex-1"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 pt-4 border-t">
                  <Button onClick={savePricing} disabled={saving}>
                    {saving ? 'Saving...' : 'Save Pricing'}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card><CardContent className="p-6"><div className="flex items-center justify-between mb-6"><h3 className="text-lg font-semibold">Credit Purchases</h3><Link href="/admin-v2/credits/manage"><Button size="sm"><Sparkles className="h-4 w-4 mr-2" />Manage Credits</Button></Link></div><div className="flex flex-col sm:flex-row gap-4 mb-6"><div className="flex-1"><div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" /><Input placeholder="Search by email..." value={searchEmail} onChange={(e) => setSearchEmail(e.target.value)} className="pl-9" /></div></div><Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}><SelectTrigger className="w-full sm:w-[180px]"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All Status</SelectItem><SelectItem value="completed">Completed</SelectItem><SelectItem value="pending">Pending</SelectItem><SelectItem value="failed">Failed</SelectItem><SelectItem value="refunded">Refunded</SelectItem></SelectContent></Select><Select value={dateFilter} onValueChange={(v) => setDateFilter(v as DateFilter)}><SelectTrigger className="w-full sm:w-[180px]"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All Time</SelectItem><SelectItem value="today">Today</SelectItem><SelectItem value="week">Last 7 Days</SelectItem><SelectItem value="month">Last 30 Days</SelectItem></SelectContent></Select></div>{filteredPurchases.length === 0 ? (<div className="text-center py-12"><Package className="h-12 w-12 text-gray-400 mx-auto mb-4" /><p className="text-sm text-gray-600">{searchEmail || statusFilter !== 'all' || dateFilter !== 'all' ? 'No purchases match filters' : 'No purchases yet'}</p></div>) : (<div className="space-y-3">{filteredPurchases.map((p) => (<div key={p.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"><div className="flex-1"><p className="font-medium text-sm">{p.user_email}</p><p className="text-xs text-gray-500">{new Date(p.created_at).toLocaleDateString()} at {new Date(p.created_at).toLocaleTimeString()}</p></div><div className="text-right mr-4"><p className="font-medium">{p.credits_purchased} credits</p><p className="text-sm text-gray-600">${p.amount_usd}</p></div><Badge variant={p.status === 'completed' ? 'default' : p.status === 'pending' ? 'secondary' : 'destructive'}>{p.status}</Badge></div>))}</div>)}</CardContent></Card>
          </>
        )}
      </div>
    </div>
  );
}
