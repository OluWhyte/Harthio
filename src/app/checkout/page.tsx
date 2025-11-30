'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import { Logo } from '@/components/common/logo';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Check, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { getTierInfo, addSubscriptionTime } from '@/lib/services/tier-service';
import { PricingService } from '@/lib/services/pricing-service';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const plan = searchParams?.get('plan'); // 'monthly' or 'yearly'
  const price = searchParams?.get('price');
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [tierInfo, setTierInfo] = useState<any>(null);
  const [proPriceUSD, setProPriceUSD] = useState('9.99');
  const [proPriceNGN, setProPriceNGN] = useState('15000');
  const [currency, setCurrency] = useState<'usd' | 'ngn'>('usd');

  useEffect(() => {
    if (!user) {
      router.push('/login?redirect=/checkout');
      return;
    }

    if (!plan || !price) {
      router.push('/pricing');
      return;
    }

    loadTierInfo();
  }, [user, plan, price]);

  const loadTierInfo = async () => {
    if (!user) return;
    const [info, priceUSD, priceNGN] = await Promise.all([
      getTierInfo((user as any).id),
      PricingService.getProPrice('usd'),
      PricingService.getProPrice('ngn')
    ]);
    setTierInfo(info);
    setProPriceUSD(priceUSD);
    setProPriceNGN(priceNGN);
    // Detect currency - you can enhance this with user's country
    setCurrency('usd');
    setIsLoading(false);
  };

  const calculateMonthsRemaining = () => {
    if (!tierInfo?.subscriptionEndDate) return 0;
    const now = new Date();
    const endDate = new Date(tierInfo.subscriptionEndDate);
    if (endDate <= now) return 0;
    return Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24 * 30));
  };

  const handlePayment = () => {
    // TODO: Integrate with your payment gateway
    // For now, just show a message
    toast({
      title: 'Payment Gateway Integration Required',
      description: 'This will redirect to your payment processor (Stripe alternative)',
      variant: 'default'
    });

    // Example: After successful payment, call addSubscriptionTime
    // const months = plan === 'yearly' ? 12 : 1;
    // await addSubscriptionTime(user.id, months, paymentId);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const months = plan === 'yearly' ? 12 : 1;
  const currentMonths = calculateMonthsRemaining();
  const totalMonths = currentMonths + months;

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Header */}
      <header className="px-4 lg:px-6 h-16 flex items-center border-b bg-white/80 backdrop-blur-sm">
        <Link href="/" className="flex items-center justify-center">
          <Logo />
        </Link>
        <nav className="ml-auto">
          <Button variant="ghost" asChild>
            <Link href="/pricing" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Pricing
            </Link>
          </Button>
        </nav>
      </header>

      <main className="flex-1 py-12">
        <div className="container max-w-2xl px-4">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2">Complete Your Purchase</h1>
            <p className="text-gray-600">Review your order and proceed to payment</p>
          </div>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center pb-4 border-b">
                <div>
                  <p className="font-semibold">
                    {plan === 'yearly' ? 'Pro Yearly Plan' : 'Pro Monthly Plan'}
                  </p>
                  <p className="text-sm text-gray-600">
                    {plan === 'yearly' ? '12 months of Pro access' : '1 month of Pro access'}
                  </p>
                </div>
                <p className="text-2xl font-bold text-primary">${price}</p>
              </div>

              {tierInfo?.tier === 'pro' && currentMonths > 0 && (
                <div className="bg-primary/5 p-4 rounded-lg">
                  <p className="text-sm font-medium text-primary mb-1">
                    ✨ Subscription Extension
                  </p>
                  <p className="text-sm text-gray-700">
                    You currently have <strong>{currentMonths} month{currentMonths !== 1 ? 's' : ''}</strong> remaining.
                    After this purchase, you'll have <strong>{totalMonths} month{totalMonths !== 1 ? 's' : ''}</strong> of Pro access.
                  </p>
                </div>
              )}

              {plan === 'yearly' && (
                <div className="bg-accent/5 p-4 rounded-lg">
                  <p className="text-sm font-medium text-accent mb-1">
                    💰 You're Saving {currency === 'usd' ? `$${(parseFloat(proPriceUSD) * 12 * 0.17).toFixed(2)}` : `₦${(parseFloat(proPriceNGN) * 12 * 0.17).toFixed(0)}`}!
                  </p>
                  <p className="text-sm text-gray-700">
                    Monthly price: {PricingService.formatPrice(proPriceUSD, currency)} × 12 = {PricingService.formatPrice((parseFloat(currency === 'usd' ? proPriceUSD : proPriceNGN) * 12).toFixed(2), currency)}
                    <br />
                    Yearly price: <strong>{PricingService.formatPrice((parseFloat(currency === 'usd' ? proPriceUSD : proPriceNGN) * 12 * 0.83).toFixed(2), currency)}</strong> (Save 17%)
                  </p>
                </div>
              )}

              <div className="pt-4">
                <p className="text-sm font-semibold mb-2">What's included:</p>
                <div className="space-y-1.5">
                  {[
                    'Unlimited AI companion (200 messages/day)',
                    'Full CBT tools suite',
                    '20 custom trackers',
                    'Visual journey timeline',
                    'Pattern detection & analytics',
                    'Priority support',
                    'Export your data'
                  ].map((feature, index) => (
                    <div key={index} className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-gray-700">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Button 
            onClick={handlePayment}
            className="w-full py-6 text-lg"
            size="lg"
          >
            Proceed to Payment
          </Button>

          <p className="text-xs text-center text-gray-500 mt-4">
            Secure payment processing • Cancel anytime • No hidden fees
          </p>
        </div>
      </main>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    }>
      <CheckoutContent />
    </Suspense>
  );
}
