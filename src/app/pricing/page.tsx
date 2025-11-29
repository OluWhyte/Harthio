'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Logo } from '@/components/common/logo';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Check, Heart, Users, Shield, Zap, ArrowRight, Sparkles, User } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { startFreeTrial } from '@/lib/services/tier-service';
import { useToast } from '@/hooks/use-toast';
import { platformSettingsService } from '@/lib/services/platform-settings-service';

export default function PricingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isTrial = searchParams?.get('trial') === 'true';
  const { user } = useAuth();
  const { toast } = useToast();
  const [isStartingTrial, setIsStartingTrial] = useState(false);
  const [proEnabled, setProEnabled] = useState(false);
  const [creditsEnabled, setCreditsEnabled] = useState(false);

  useEffect(() => {
    const loadSettings = async () => {
      const settings = await platformSettingsService.getSettings();
      setProEnabled(settings.proTierEnabled);
      setCreditsEnabled(settings.creditsEnabled);
    };
    loadSettings();
  }, []);

  const handleStartTrial = async () => {
    if (!proEnabled) {
      toast({
        title: 'Coming Soon',
        description: 'Pro subscription will be available soon!',
      });
      return;
    }

    if (!user) {
      // Redirect to signup with return URL
      router.push('/signup?redirect=/pricing?trial=true');
      return;
    }

    setIsStartingTrial(true);
    
    const result = await startFreeTrial(user.id);
    
    if (result.success) {
      toast({
        title: '🎉 Trial started!',
        description: 'You now have 14 days of Pro access. Enjoy!'
      });
      router.push('/home');
    } else {
      toast({
        title: 'Could not start trial',
        description: result.error || 'Please try again or contact support',
        variant: 'destructive'
      });
    }
    
    setIsStartingTrial(false);
  };

  const handleProMonthly = () => {
    if (!proEnabled) {
      toast({
        title: 'Coming Soon',
        description: 'Pro subscription will be available soon!',
      });
      return;
    }

    if (!user) {
      router.push('/signup?redirect=/pricing?plan=monthly');
      return;
    }
    // TODO: Redirect to payment gateway with plan=monthly
    router.push('/checkout?plan=monthly&price=9.99');
  };

  const handleProYearly = () => {
    if (!proEnabled) {
      toast({
        title: 'Coming Soon',
        description: 'Pro subscription will be available soon!',
      });
      return;
    }

    if (!user) {
      router.push('/signup?redirect=/pricing?plan=yearly');
      return;
    }
    // TODO: Redirect to payment gateway with plan=yearly
    router.push('/checkout?plan=yearly&price=99.90');
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Header */}
      <header className="px-3 sm:px-4 lg:px-6 h-14 sm:h-16 flex items-center border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <Link href="/" className="flex items-center justify-center" prefetch={false}>
          <Logo />
        </Link>
        <nav className="ml-auto flex gap-2 sm:gap-4 lg:gap-6 items-center">
          {user ? (
            <>
              <Button variant="ghost" asChild className="hidden sm:flex text-sm">
                <Link href="/home" className="flex items-center gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Dashboard
                </Link>
              </Button>
              <Button variant="ghost" asChild className="text-sm px-2 sm:px-4">
                <Link href="/me" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  <span className="hidden sm:inline">Profile</span>
                </Link>
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" asChild className="hidden sm:flex text-sm">
                <Link href="/" className="flex items-center gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Home
                </Link>
              </Button>
              <Button variant="ghost" asChild className="text-sm px-2 sm:px-4">
                <Link href="/login">Log In</Link>
              </Button>
              <Button asChild className="bg-primary hover:bg-primary/90 text-sm px-3 sm:px-4" size="sm">
                <Link href="/signup">
                  <span className="hidden xs:inline">Join Free</span>
                  <span className="xs:hidden">Join</span>
                </Link>
              </Button>
            </>
          )}
        </nav>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="w-full py-8 sm:py-12 md:py-16 lg:py-20 bg-background">
          <div className="container px-4 sm:px-6 md:px-8">
            <div className="text-center max-w-4xl mx-auto">
              {isTrial && (
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
                  <Sparkles className="h-4 w-4" />
                  <span>Start with 14 days free!</span>
                </div>
              )}
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold mb-4 sm:mb-6 bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent leading-tight">
                Simple, Transparent Pricing
              </h1>
              <p className="text-base sm:text-lg md:text-xl text-gray-600 mb-6 sm:mb-8 leading-relaxed px-4">
                Start free with peer support. Upgrade to Pro for unlimited AI companion and advanced recovery tools.
              </p>
            </div>
          </div>
        </section>

        {/* Pricing Cards */}
        <section className="w-full py-8 sm:py-12">
          <div className="container px-4 sm:px-6 md:px-8">
            {/* Free Tier */}
            <div className="flex flex-wrap justify-center gap-5 sm:gap-6 max-w-6xl mx-auto mb-12">
              <Link href="/signup" className="block w-full max-w-[260px] group">
                <Card interactive className="border-2 border-gray-200 hover:border-gray-300 shadow-apple hover:shadow-apple-lg transition-all duration-apple ease-apple cursor-pointer h-full">
                  <CardHeader className="text-center pb-3 pt-5 px-4">
                    <CardTitle className="text-xl font-bold mb-1.5">Free</CardTitle>
                    <div className="text-4xl font-bold text-gray-900">
                      $0<span className="text-base text-gray-500 font-normal">/mo</span>
                    </div>
                    <p className="text-xs text-gray-600 mt-1">Get started</p>
                  </CardHeader>

                  <CardContent className="px-4 pb-4">
                    <div className="space-y-2">
                      {[
                        'Unlimited peer sessions',
                        'Daily mood check-ins',
                        '1 basic tracker',
                        '3 AI messages/day',
                        'Crisis resources (24/7)',
                        'Video & voice calling',
                        'Community support',
                        'Basic analytics'
                      ].map((feature, index) => (
                        <div key={index} className="flex items-start gap-2 animate-fade-in" style={{ animationDelay: `${index * 50}ms` }}>
                          <Check className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                          <span className="text-sm text-gray-700 leading-snug">{feature}</span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 pt-4 border-t text-center">
                      <span className="text-sm font-semibold text-gray-700 group-hover:text-primary transition-colors duration-apple">Get Started →</span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </div>

            {/* Credits Section */}
            <div className="text-center mb-8">
              <h2 className="text-2xl sm:text-3xl font-bold mb-3">Pay As You Go</h2>
              <p className="text-base text-gray-600 max-w-2xl mx-auto">
                Need more AI messages but not ready for Pro? Buy credit packs that never expire while valid.
              </p>
            </div>

            <div className="flex flex-wrap justify-center gap-5 sm:gap-6 max-w-5xl mx-auto mb-12">
              {/* Starter Pack */}
              <div onClick={() => {
                if (creditsEnabled) {
                  router.push('/credits?pack=starter');
                } else {
                  toast({
                    title: 'Coming Soon',
                    description: 'Credit purchases will be available soon!',
                  });
                }
              }} className="block cursor-pointer w-full max-w-[240px] group">
                <Card interactive className="border-2 border-gray-200 hover:border-gray-300 shadow-apple hover:shadow-apple-lg transition-all duration-apple ease-apple h-full">
                  <CardHeader className="text-center pb-3 pt-5 px-4">
                    <CardTitle className="text-lg font-bold mb-1.5">Starter Pack</CardTitle>
                    <div className="text-3xl font-bold text-gray-900">
                      $2<span className="text-sm text-gray-500 font-normal">.00</span>
                    </div>
                    <p className="text-xs text-gray-600 mt-1">50 AI messages</p>
                  </CardHeader>

                  <CardContent className="px-4 pb-4">
                    <div className="space-y-2">
                      {[
                        '50 AI messages',
                        'Valid for 30 days',
                        'Use anytime',
                        'Stack with Pro',
                      ].map((feature, index) => (
                        <div key={index} className="flex items-start gap-2">
                          <Check className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                          <span className="text-sm text-gray-700 leading-snug">{feature}</span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 pt-4 border-t text-center">
                      <span className="text-sm font-semibold text-gray-700 group-hover:text-primary transition-colors duration-apple">Buy Now →</span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Popular Pack */}
              <div onClick={() => {
                if (creditsEnabled) {
                  router.push('/credits?pack=popular');
                } else {
                  toast({
                    title: 'Coming Soon',
                    description: 'Credit purchases will be available soon!',
                  });
                }
              }} className="block cursor-pointer w-full max-w-[240px] group">
                <Card interactive className="border-2 border-primary hover:border-primary/80 shadow-apple-lg hover:shadow-apple-xl transition-all duration-apple ease-apple-spring bg-gradient-to-br from-primary/5 to-primary/10 h-full relative overflow-hidden">
                  <div className="absolute top-0 right-0 bg-gradient-to-r from-primary to-primary/90 text-white px-3 py-1 text-xs font-bold rounded-bl-lg shadow-apple">
                    POPULAR
                  </div>
                  
                  <CardHeader className="text-center pb-3 pt-5 px-4">
                    <CardTitle className="text-lg font-bold text-primary mb-1.5">Popular Pack</CardTitle>
                    <div className="text-3xl font-bold text-primary">
                      $5<span className="text-sm text-gray-600 font-normal">.00</span>
                    </div>
                    <p className="text-xs text-gray-600 mt-1">150 AI messages</p>
                  </CardHeader>

                  <CardContent className="px-4 pb-4">
                    <div className="space-y-2">
                      {[
                        '150 AI messages',
                        'Valid for 60 days',
                        'Best value per message',
                        'Stack with Pro',
                      ].map((feature, index) => (
                        <div key={index} className="flex items-start gap-2">
                          <Check className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                          <span className="text-sm text-gray-700 leading-snug">{feature}</span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 pt-4 border-t text-center">
                      <span className="text-sm font-semibold text-primary group-hover:scale-105 inline-block transition-transform duration-apple">Buy Now →</span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Power Pack */}
              <div onClick={() => {
                if (creditsEnabled) {
                  router.push('/credits?pack=power');
                } else {
                  toast({
                    title: 'Coming Soon',
                    description: 'Credit purchases will be available soon!',
                  });
                }
              }} className="block cursor-pointer w-full max-w-[240px] group">
                <Card interactive className="border-2 border-accent hover:border-accent/80 shadow-apple-lg hover:shadow-apple-xl transition-all duration-apple ease-apple-spring bg-gradient-to-br from-accent/5 to-accent/10 h-full relative overflow-hidden">
                  <div className="absolute top-0 right-0 bg-gradient-to-r from-accent to-accent/90 text-white px-3 py-1 text-xs font-bold rounded-bl-lg shadow-apple">
                    BEST DEAL
                  </div>
                  
                  <CardHeader className="text-center pb-3 pt-5 px-4">
                    <CardTitle className="text-lg font-bold text-accent mb-1.5">Power Pack</CardTitle>
                    <div className="text-3xl font-bold text-accent">
                      $10<span className="text-sm text-gray-600 font-normal">.00</span>
                    </div>
                    <p className="text-xs text-gray-600 mt-1">500 AI messages</p>
                  </CardHeader>

                  <CardContent className="px-4 pb-4">
                    <div className="space-y-2">
                      {[
                        '500 AI messages',
                        'Valid for 90 days',
                        'Lowest cost per message',
                        'Stack with Pro',
                      ].map((feature, index) => (
                        <div key={index} className="flex items-start gap-2">
                          <Check className="h-4 w-4 text-accent flex-shrink-0 mt-0.5" />
                          <span className="text-sm text-gray-700 leading-snug">{feature}</span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 pt-4 border-t text-center">
                      <span className="text-sm font-semibold text-accent group-hover:scale-105 inline-block transition-transform duration-apple">Buy Now →</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Pro Subscription Section */}
            <div className="text-center mb-8">
              <h2 className="text-2xl sm:text-3xl font-bold mb-3">Unlimited Access</h2>
              <p className="text-base text-gray-600 max-w-2xl mx-auto">
                For power users who want unlimited AI support and advanced recovery tools.
              </p>
            </div>

            <div className="flex flex-wrap justify-center gap-5 sm:gap-6 max-w-6xl mx-auto">
              {/* Pro Monthly - Apple Premium Style */}
              <div onClick={handleProMonthly} className="block cursor-pointer w-full max-w-[260px] group">
                <Card interactive className="border-2 border-primary hover:border-primary/80 shadow-apple-lg hover:shadow-apple-xl transition-all duration-apple ease-apple-spring bg-gradient-to-br from-primary/5 to-primary/10 h-full relative overflow-hidden">
                  <div className="absolute top-0 right-0 bg-gradient-to-r from-primary to-primary/90 text-white px-3 py-1 text-xs font-bold rounded-bl-lg shadow-apple">
                    POPULAR
                  </div>
                  
                  <CardHeader className="text-center pb-3 pt-5 px-4">
                    <CardTitle className="text-xl font-bold text-primary mb-1.5">Pro Monthly</CardTitle>
                    <div className="text-4xl font-bold text-primary">
                      $9.99<span className="text-base text-gray-600 font-normal">/mo</span>
                    </div>
                    <p className="text-xs text-gray-600 mt-1">14-day free trial</p>
                  </CardHeader>

                  <CardContent className="px-4 pb-4">
                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-primary mb-2">Everything in Free, plus:</p>
                      {[
                        'Unlimited AI (200 msg/day)',
                        'Full CBT tools suite',
                        '20 custom trackers',
                        'Visual journey timeline',
                        'Pattern detection',
                        'Advanced analytics',
                        'Priority support',
                        'Export your data'
                      ].map((feature, index) => (
                        <div key={index} className="flex items-start gap-2 animate-fade-in" style={{ animationDelay: `${index * 50}ms` }}>
                          <Check className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                          <span className="text-sm text-gray-700 leading-snug">{feature}</span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 pt-4 border-t text-center">
                      <span className="text-sm font-semibold text-primary group-hover:scale-105 inline-block transition-transform duration-apple">Subscribe Monthly →</span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Pro Yearly - Apple Premium Style */}
              <div onClick={handleProYearly} className="block cursor-pointer w-full max-w-[260px] group">
                <Card interactive className="border-2 border-accent hover:border-accent/80 shadow-apple-lg hover:shadow-apple-xl transition-all duration-apple ease-apple-spring bg-gradient-to-br from-accent/5 to-accent/10 h-full relative overflow-hidden">
                  <div className="absolute top-0 right-0 bg-gradient-to-r from-accent to-accent/90 text-white px-3 py-1 text-xs font-bold rounded-bl-lg shadow-apple">
                    BEST VALUE
                  </div>
                  
                  <CardHeader className="text-center pb-3 pt-5 px-4">
                    <CardTitle className="text-xl font-bold text-accent mb-1.5">Pro Yearly</CardTitle>
                    <div className="text-4xl font-bold text-accent">
                      $99.90<span className="text-base text-gray-600 font-normal">/yr</span>
                    </div>
                    <p className="text-xs text-gray-600 mt-1">Save $19.98 per year</p>
                  </CardHeader>

                  <CardContent className="px-4 pb-4">
                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-accent mb-2">Everything in Free, plus:</p>
                      {[
                        'Unlimited AI (200 msg/day)',
                        'Full CBT tools suite',
                        '20 custom trackers',
                        'Visual journey timeline',
                        'Pattern detection',
                        'Advanced analytics',
                        'Priority support',
                        'Export your data'
                      ].map((feature, index) => (
                        <div key={index} className="flex items-start gap-2 animate-fade-in" style={{ animationDelay: `${index * 50}ms` }}>
                          <Check className="h-4 w-4 text-accent flex-shrink-0 mt-0.5" />
                          <span className="text-sm text-gray-700 leading-snug">{feature}</span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 pt-4 border-t text-center">
                      <span className="text-sm font-semibold text-accent group-hover:scale-105 inline-block transition-transform duration-apple">Subscribe Yearly →</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* Why Harthio Section */}
        <section className="w-full py-12 sm:py-16 bg-gray-50">
          <div className="container px-4 sm:px-6 md:px-8">
            <div className="text-center mb-8 sm:mb-12">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4">
                Why Choose Harthio?
              </h2>
              <p className="text-base sm:text-lg text-gray-600 max-w-3xl mx-auto px-4">
                Accessible mental health support with AI-powered tools and peer connections.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 max-w-6xl mx-auto">
              <Card className="text-center p-4 sm:p-6">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                  <Sparkles className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
                </div>
                <h3 className="text-lg sm:text-xl font-semibold mb-2 sm:mb-3">AI-Powered Support</h3>
                <p className="text-sm sm:text-base text-gray-600">
                  24/7 AI companion with evidence-based CBT tools. Get support whenever you need it, 
                  with professional-grade techniques at your fingertips.
                </p>
              </Card>

              <Card className="text-center p-4 sm:p-6">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                  <Users className="h-6 w-6 sm:h-8 sm:w-8 text-accent" />
                </div>
                <h3 className="text-lg sm:text-xl font-semibold mb-2 sm:mb-3">Peer Connections</h3>
                <p className="text-sm sm:text-base text-gray-600">
                  Connect with others who truly understand your journey. Schedule meaningful conversations 
                  with people facing similar challenges.
                </p>
              </Card>

              <Card className="text-center p-4 sm:p-6 sm:col-span-2 lg:col-span-1">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                  <Heart className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
                </div>
                <h3 className="text-lg sm:text-xl font-semibold mb-2 sm:mb-3">Recovery Tracking</h3>
                <p className="text-sm sm:text-base text-gray-600">
                  Track your sobriety journey with real-time counters, visual progress, and milestone celebrations. 
                  See how far you've come.
                </p>
              </Card>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="w-full py-12 sm:py-16">
          <div className="container px-4 sm:px-6 md:px-8">
            <div className="text-center mb-8 sm:mb-12">
              <h2 className="text-2xl sm:text-3xl font-bold mb-3 sm:mb-4">Frequently Asked Questions</h2>
              <p className="text-sm sm:text-base text-gray-600">Common questions about pricing</p>
            </div>

            <div className="grid sm:grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 max-w-4xl mx-auto">
              <div className="p-4 sm:p-6">
                <h3 className="font-semibold mb-2 text-sm sm:text-base">Is the free tier really free?</h3>
                <p className="text-gray-600 text-xs sm:text-sm leading-relaxed">
                  Yes! No credit card required. You get unlimited peer sessions, daily check-ins, 
                  1 tracker, and limited AI support completely free forever.
                </p>
              </div>

              <div className="p-4 sm:p-6">
                <h3 className="font-semibold mb-2 text-sm sm:text-base">What happens after the 14-day trial?</h3>
                <p className="text-gray-600 text-xs sm:text-sm leading-relaxed">
                  You'll automatically downgrade to the free tier. No charges, no surprises. 
                  You can upgrade to Pro anytime if you want to continue with full features.
                </p>
              </div>

              <div className="p-4 sm:p-6">
                <h3 className="font-semibold mb-2 text-sm sm:text-base">Can I cancel Pro anytime?</h3>
                <p className="text-gray-600 text-xs sm:text-sm leading-relaxed">
                  Absolutely! Cancel anytime from your profile settings. You'll keep Pro access 
                  until the end of your billing period, then switch to free.
                </p>
              </div>

              <div className="p-4 sm:p-6">
                <h3 className="font-semibold mb-2 text-sm sm:text-base">Is my data safe and private?</h3>
                <p className="text-gray-600 text-xs sm:text-sm leading-relaxed">
                  Yes. Your data is never sold. We use industry-standard encryption and security 
                  measures to protect your privacy and conversations.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="w-full py-12 sm:py-16 bg-gradient-to-r from-primary via-accent to-primary text-white">
          <div className="container px-4 sm:px-6 md:px-8 text-center">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4">
              Ready to Start Your Recovery Journey?
            </h2>
            <p className="text-base sm:text-lg md:text-xl mb-6 sm:mb-8 max-w-2xl mx-auto opacity-90 px-4">
              Join Harthio today and get 24/7 support from AI and peers who understand your journey.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button 
                size="lg" 
                className="bg-white text-primary hover:bg-gray-100 text-base sm:text-lg px-6 sm:px-8 py-4 sm:py-6 w-full sm:w-auto"
                onClick={handleStartTrial}
                disabled={isStartingTrial}
              >
                {isStartingTrial ? 'Starting Trial...' : (
                  <>
                    Start 14-Day Free Trial
                    <Sparkles className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
                  </>
                )}
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                className="bg-transparent border-2 border-white text-white hover:bg-white/10 text-base sm:text-lg px-6 sm:px-8 py-4 sm:py-6 w-full sm:w-auto"
                asChild
              >
                <Link href="/signup">
                  Join Free
                  <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
                </Link>
              </Button>
            </div>
            <p className="text-xs sm:text-sm opacity-75 mt-4">No credit card required • Start immediately</p>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-6 sm:py-8">
        <div className="container px-4 sm:px-6 md:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-0">
            <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 mb-3 sm:mb-0">
              <Logo />
              <p className="text-xs sm:text-sm text-gray-400 text-center sm:text-left">&copy; 2025 Stria Technologies All rights reserved.</p>
            </div>
            <nav className="flex gap-4 sm:gap-6 text-xs sm:text-sm">
              <Link href="/privacy" className="text-gray-400 hover:text-white transition-colors">Privacy</Link>
              <Link href="/terms" className="text-gray-400 hover:text-white transition-colors">Terms</Link>
              <Link href="/contact" className="text-gray-400 hover:text-white transition-colors">Contact</Link>
            </nav>
          </div>
        </div>
      </footer>
    </div>
  );
}