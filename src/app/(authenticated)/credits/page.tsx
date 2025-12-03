'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, Sparkles, Clock, CreditCard, History } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { creditsService, type CreditBalance } from '@/lib/services/credits-service';
import { PricingService } from '@/lib/services/pricing-service';
import { useToast } from '@/hooks/use-toast';
import { MobilePageHeader } from '@/components/harthio/mobile-page-header';
import { LoadingSpinner } from '@/components/common/loading-spinner';
import { platformSettingsService } from '@/lib/services/platform-settings-service';
import { paystackService } from '@/lib/services/paystack-service';

export default function CreditsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedPack = searchParams?.get('pack');
  const { user } = useAuth();
  const { toast } = useToast();

  const [balance, setBalance] = useState<CreditBalance | null>(null);
  const [purchaseHistory, setPurchaseHistory] = useState<any[]>([]);
  const [creditPacks, setCreditPacks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currency, setCurrency] = useState<'usd' | 'ngn'>('ngn'); // Default to NGN since USD not enabled yet
  const [creditsEnabled, setCreditsEnabled] = useState(false);
  const [paymentsEnabled, setPaymentsEnabled] = useState(false);
  const [proPricing, setProPricing] = useState({ usd: '9.99', ngn: '15000' });

  useEffect(() => {
    if (user?.uid) {
      loadData();
    }
  }, [user]);

  // Refresh balance when returning from payment
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('payment') === 'success' && user?.uid) {
      // Reload data after successful payment
      setTimeout(() => loadData(), 1000);
    }
  }, [user]);

  const loadData = async () => {
    if (!user?.uid) return;

    setLoading(true);
    try {
      const [balanceData, historyData, packs, settings] = await Promise.all([
        creditsService.getCreditBalance(user.uid),
        creditsService.getPurchaseHistory(user.uid),
        PricingService.getCreditPacks(),
        platformSettingsService.getSettings(),
      ]);

      setBalance(balanceData);
      setPurchaseHistory(historyData);
      setCreditPacks(packs);
      setCreditsEnabled(settings.creditsEnabled);
      setPaymentsEnabled(settings.paymentsEnabled);
      
      // Load Pro pricing from settings
      const { data: pricingData } = await supabase
        .from('platform_settings')
        .select('setting_value')
        .eq('setting_key', 'pricing')
        .single();
      
      if (pricingData?.setting_value?.pro) {
        setProPricing({
          usd: pricingData.setting_value.pro.usd || '9.99',
          ngn: pricingData.setting_value.pro.ngn || '15000',
        });
      }
      
      // Default to NGN since Paystack USD not enabled yet
      setCurrency('ngn');
    } catch (error) {
      console.error('Error loading credits data:', error);
      // Set defaults on error
      setBalance({ credits: 0, expiresAt: null, isExpired: false });
      setPurchaseHistory([]);
      setCreditsEnabled(false);
    } finally {
      setLoading(false);
    }
  };

  const handleBuyPack = async (packId: string) => {
    // Check if credits system is enabled (Monetization toggle)
    if (!creditsEnabled) {
      toast({
        title: 'Credits Not Available',
        description: 'The credits system is currently disabled.',
      });
      return;
    }
    
    // Check if payments are enabled (Finance toggle)
    if (!paymentsEnabled) {
      toast({
        title: 'Payments Coming Soon',
        description: 'Payment processing will be enabled soon. Check back later!',
      });
      return;
    }

    if (!user?.uid || !user?.email) {
      toast({
        title: 'Error',
        description: 'Please log in to purchase credits',
        variant: 'destructive',
      });
      return;
    }

    // Find the selected pack
    const pack = creditPacks.find(p => p.id === packId);
    if (!pack) {
      toast({
        title: 'Error',
        description: 'Invalid credit pack selected',
        variant: 'destructive',
      });
      return;
    }

    try {
      // Get the price based on selected currency
      const amount = currency === 'usd' 
        ? parseFloat(pack.priceUSD) 
        : parseFloat(pack.priceNGN);

      // Initialize Paystack payment
      const response = await paystackService.initializeTransaction({
        email: user.email,
        amount: paystackService.toKobo(amount), // Convert to kobo/cents
        currency: currency.toUpperCase() as 'NGN' | 'USD',
        metadata: {
          user_id: user.uid,
          pack_id: packId,
          credits: pack.credits,
          description: `${pack.name} - ${pack.credits} credits`,
        },
      });

      if (response.status && response.data?.authorization_url) {
        // Redirect to Paystack payment page
        window.location.href = response.data.authorization_url;
      } else {
        throw new Error(response.message || 'Failed to initialize payment');
      }
    } catch (error) {
      console.error('Payment initialization error:', error);
      toast({
        title: 'Payment Error',
        description: error instanceof Error ? error.message : 'Failed to initialize payment',
        variant: 'destructive',
      });
    }
  };

  const handleSubscribePro = async (plan: 'monthly' | 'yearly') => {
    // Check if payments are enabled
    if (!paymentsEnabled) {
      toast({
        title: 'Payments Coming Soon',
        description: 'Payment processing will be enabled soon. Check back later!',
      });
      return;
    }

    if (!user?.uid || !user?.email) {
      toast({
        title: 'Error',
        description: 'Please log in to subscribe',
        variant: 'destructive',
      });
      return;
    }

    try {
      // Calculate amount based on plan and currency
      const monthlyPrice = currency === 'usd' 
        ? parseFloat(proPricing.usd) 
        : parseFloat(proPricing.ngn);
      
      const amount = plan === 'monthly' ? monthlyPrice : monthlyPrice * 12 * 0.83; // 17% discount for yearly

      // Initialize Paystack payment
      const response = await paystackService.initializeTransaction({
        email: user.email,
        amount: paystackService.toKobo(amount),
        currency: currency.toUpperCase() as 'NGN' | 'USD',
        metadata: {
          user_id: user.uid,
          tier: 'pro',
          plan: plan,
          description: `Pro ${plan} subscription`,
        },
      });

      if (response.status && response.data?.authorization_url) {
        window.location.href = response.data.authorization_url;
      } else {
        throw new Error(response.message || 'Failed to initialize payment');
      }
    } catch (error) {
      console.error('Subscription payment error:', error);
      toast({
        title: 'Payment Error',
        description: error instanceof Error ? error.message : 'Failed to initialize payment',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return <LoadingSpinner size="lg" text="Loading your credits..." />;
  }

  if (!user) {
    return <LoadingSpinner size="lg" text="Redirecting to login..." />;
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <MobilePageHeader />

      <main className="flex-1 container px-4 py-6 max-w-6xl mx-auto">
        {/* Current Balance */}
        <Card className="mb-6 bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Your Balance</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold text-primary">
                    {loading ? '...' : balance?.credits || 0}
                  </span>
                  <span className="text-lg text-gray-600">messages</span>
                </div>
                {balance && balance.expiresAt && !balance.isExpired && (
                  <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Expires {new Date(balance.expiresAt).toLocaleDateString()}
                  </p>
                )}
                {balance?.isExpired && (
                  <p className="text-xs text-red-600 mt-1">Credits expired</p>
                )}
              </div>
              <Sparkles className="h-12 w-12 text-primary opacity-50" />
            </div>
          </CardContent>
        </Card>

        {/* Credit Packs */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold">Buy Credit Packs</h2>
            <div className="flex gap-2">
              <Button
                variant={currency === 'usd' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setCurrency('usd')}
              >
                USD ($)
              </Button>
              <Button
                variant={currency === 'ngn' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setCurrency('ngn')}
              >
                NGN (₦)
              </Button>
            </div>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {creditPacks.map((pack, index) => (
              <Card
                key={pack.id}
                className={`relative ${
                  index === 1
                    ? 'border-2 border-primary shadow-lg'
                    : 'border-2 border-gray-200'
                } ${selectedPack === pack.id ? 'ring-2 ring-primary' : ''}`}
              >
                {index === 1 && (
                  <div className="absolute top-0 right-0 bg-primary text-white px-3 py-1 text-xs font-bold rounded-bl-lg">
                    POPULAR
                  </div>
                )}
                
                <CardHeader className="text-center pb-3">
                  <CardTitle className={index === 1 ? 'text-primary' : ''}>
                    {pack.name}
                  </CardTitle>
                  <div className="text-3xl font-bold mt-2">
                    {PricingService.formatPrice(currency === 'usd' ? pack.priceUSD : pack.priceNGN, currency)}
                  </div>
                  <p className="text-sm text-gray-600">{pack.credits} AI messages</p>
                </CardHeader>

                <CardContent>
                  <div className="space-y-2 mb-4">
                    <div className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                      <span className="text-sm">{pack.credits} AI messages</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                      <span className="text-sm">Valid for {pack.days} days</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                      <span className="text-sm">Use anytime</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                      <span className="text-sm">Stack with Pro</span>
                    </div>
                  </div>

                  <Button
                    className="w-full"
                    variant={pack.popular ? 'default' : 'outline'}
                    onClick={() => handleBuyPack(pack.id)}
                  >
                    <CreditCard className="h-4 w-4 mr-2" />
                    Buy Now
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* How Credits Work */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              How Credits Work
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-gray-700">
            <p>
              <strong>Pay as you go:</strong> Buy credits when you need them, use them anytime.
            </p>
            <p>
              <strong>No subscription:</strong> One-time payment, no recurring charges.
            </p>
            <p>
              <strong>Stack credits:</strong> Buy multiple packs and they'll add up. Expiry extends with each purchase.
            </p>
            <p>
              <strong>Pro + Credits:</strong> If you have Pro, credits are saved for after your Pro expires.
            </p>
            <p>
              <strong>Priority:</strong> Pro → Credits → Free tier (3/day limit)
            </p>
          </CardContent>
        </Card>

        {/* Pro Subscription Option */}
        <Card className="mb-8 bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Want Unlimited Messages?
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-gray-700">
                If you use AI frequently, <strong>Pro subscription</strong> offers better value than credits.
              </p>
              
              <div className="grid sm:grid-cols-2 gap-4">
                {/* Pro Monthly */}
                <div className="p-4 bg-white rounded-lg border-2 border-primary/30">
                  <div className="text-center mb-3">
                    <p className="text-sm text-gray-600 mb-1">Pro Monthly</p>
                    <div className="text-3xl font-bold text-primary">
                      {currency === 'usd' ? `$${proPricing.usd}` : `₦${parseFloat(proPricing.ngn).toLocaleString()}`}
                    </div>
                    <p className="text-xs text-gray-500">per month</p>
                  </div>
                  <div className="space-y-2 mb-4">
                    <div className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                      <span>200 messages/day (~6,000/month)</span>
                    </div>
                    <div className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                      <span>Advanced CBT tools</span>
                    </div>
                    <div className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                      <span>20 custom trackers</span>
                    </div>
                    <div className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                      <span>14-day free trial</span>
                    </div>
                  </div>
                  <Button 
                    className="w-full"
                    onClick={() => handleSubscribePro('monthly')}
                  >
                    Start Free Trial
                  </Button>
                </div>

                {/* Pro Yearly */}
                <div className="p-4 bg-white rounded-lg border-2 border-accent/30">
                  <div className="text-center mb-3">
                    <p className="text-sm text-gray-600 mb-1">Pro Yearly</p>
                    <div className="text-3xl font-bold text-accent">
                      {currency === 'usd' 
                        ? `$${(parseFloat(proPricing.usd) * 12 * 0.83).toFixed(2)}` 
                        : `₦${(parseFloat(proPricing.ngn) * 12 * 0.83).toLocaleString()}`}
                    </div>
                    <p className="text-xs text-gray-500">per year (save 17%)</p>
                  </div>
                  <div className="space-y-2 mb-4">
                    <div className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                      <span>Everything in Monthly</span>
                    </div>
                    <div className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                      <span>Save {currency === 'usd' ? `$${(parseFloat(proPricing.usd) * 12 * 0.17).toFixed(2)}` : `₦${(parseFloat(proPricing.ngn) * 12 * 0.17).toLocaleString()}`} per year</span>
                    </div>
                    <div className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                      <span>Best value for daily users</span>
                    </div>
                  </div>
                  <Button 
                    className="w-full"
                    variant="outline"
                    onClick={() => handleSubscribePro('yearly')}
                  >
                    Subscribe Yearly
                  </Button>
                </div>
              </div>

              <p className="text-xs text-center text-gray-500">
                💡 Pro gives you 12x more messages than the $10 credit pack
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Purchase History */}
        {purchaseHistory.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Purchase History
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {purchaseHistory.map((purchase) => (
                  <div
                    key={purchase.id}
                    className="flex items-center justify-between py-2 border-b last:border-0"
                  >
                    <div>
                      <p className="font-medium">{purchase.credits_purchased} credits</p>
                      <p className="text-xs text-gray-500">
                        {new Date(purchase.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">${purchase.amount_usd}</p>
                      <p className="text-xs text-gray-500 capitalize">{purchase.status}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
