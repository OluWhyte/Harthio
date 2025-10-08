'use client';

import Link from 'next/link';
import { Logo } from '@/components/common/logo';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Check, Heart, Users, Shield, Zap, ArrowRight } from 'lucide-react';

export default function PricingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Header */}
      <header className="px-3 sm:px-4 lg:px-6 h-14 sm:h-16 flex items-center border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <Link href="/" className="flex items-center justify-center" prefetch={false}>
          <Logo />
        </Link>
        <nav className="ml-auto flex gap-2 sm:gap-4 lg:gap-6 items-center">
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
        </nav>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="w-full py-8 sm:py-12 md:py-16 lg:py-20 bg-background">
          <div className="container px-4 sm:px-6 md:px-8">
            <div className="text-center max-w-4xl mx-auto">
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold mb-4 sm:mb-6 bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent leading-tight">
                Simple, Transparent Pricing
              </h1>
              <p className="text-base sm:text-lg md:text-xl text-gray-600 mb-6 sm:mb-8 leading-relaxed px-4">
                Harthio is completely free because we believe meaningful human connections shouldn't have a price tag. 
                Everyone deserves access to support and understanding.
              </p>
            </div>
          </div>
        </section>

        {/* Pricing Card */}
        <section className="w-full py-8 sm:py-12">
          <div className="container px-4 sm:px-6 md:px-8">
            <div className="max-w-2xl mx-auto">
              <Card className="border-2 border-primary/20 shadow-xl relative overflow-hidden">
                {/* Free Badge */}
                <div className="absolute top-0 right-0 bg-gradient-to-r from-primary to-accent text-white px-4 py-2 text-sm font-bold">
                  100% FREE
                </div>
                
                <CardHeader className="text-center pb-2 pt-8">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Heart className="h-8 w-8 sm:h-10 sm:w-10 text-primary" />
                  </div>
                  <CardTitle className="text-2xl sm:text-3xl md:text-4xl font-bold">
                    Forever Free
                  </CardTitle>
                  <div className="text-4xl sm:text-5xl md:text-6xl font-bold text-primary mt-4">
                    $0
                    <span className="text-lg sm:text-xl text-gray-500 font-normal">/month</span>
                  </div>
                  <p className="text-sm sm:text-base text-gray-600 mt-2">
                    No hidden fees, no premium tiers, no credit card required
                  </p>
                </CardHeader>

                <CardContent className="px-4 sm:px-6 pb-8">
                  {/* Features List */}
                  <div className="space-y-3 sm:space-y-4 mb-6 sm:mb-8">
                    {[
                      'Unlimited meaningful conversations',
                      'AI-powered matching with compatible people',
                      'Video and voice calling',
                      'Real-time messaging',
                      'Session scheduling and management',
                      'Safe and moderated environment',
                      'Mobile-optimized experience',
                      'Community support and resources',
                      'Profile customization',
                      'Privacy controls and anonymity options'
                    ].map((feature, index) => (
                      <div key={index} className="flex items-start gap-3">
                        <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                        <span className="text-sm sm:text-base text-gray-700">{feature}</span>
                      </div>
                    ))}
                  </div>

                  {/* CTA Button */}
                  <Button 
                    size="lg" 
                    className="w-full bg-primary hover:bg-primary/90 text-base sm:text-lg py-3 sm:py-4"
                    asChild
                  >
                    <Link href="/signup" className="flex items-center justify-center">
                      Start Connecting for Free
                      <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Why Free Section */}
        <section className="w-full py-12 sm:py-16 bg-gray-50">
          <div className="container px-4 sm:px-6 md:px-8">
            <div className="text-center mb-8 sm:mb-12">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4">
                Why Is Harthio Completely Free?
              </h2>
              <p className="text-base sm:text-lg text-gray-600 max-w-3xl mx-auto px-4">
                We believe in a world where everyone has access to meaningful human connection and support.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 max-w-6xl mx-auto">
              <Card className="text-center p-4 sm:p-6">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                  <Heart className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
                </div>
                <h3 className="text-lg sm:text-xl font-semibold mb-2 sm:mb-3">Human Connection is a Right</h3>
                <p className="text-sm sm:text-base text-gray-600">
                  Everyone deserves to feel heard and understood, regardless of their financial situation. 
                  Mental health support shouldn't be a luxury.
                </p>
              </Card>

              <Card className="text-center p-4 sm:p-6">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                  <Users className="h-6 w-6 sm:h-8 sm:w-8 text-accent" />
                </div>
                <h3 className="text-lg sm:text-xl font-semibold mb-2 sm:mb-3">Community Over Profit</h3>
                <p className="text-sm sm:text-base text-gray-600">
                  We're building a community, not a business. Our focus is on creating genuine connections 
                  and helping people find the support they need.
                </p>
              </Card>

              <Card className="text-center p-4 sm:p-6 sm:col-span-2 lg:col-span-1">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                  <Shield className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
                </div>
                <h3 className="text-lg sm:text-xl font-semibold mb-2 sm:mb-3">Sustainable Mission</h3>
                <p className="text-sm sm:text-base text-gray-600">
                  We're supported by grants, donations, and partnerships with organizations that share our mission 
                  of ending loneliness and building stronger communities.
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
              <p className="text-sm sm:text-base text-gray-600">Common questions about our free service</p>
            </div>

            <div className="grid sm:grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 max-w-4xl mx-auto">
              <div className="p-4 sm:p-6">
                <h3 className="font-semibold mb-2 text-sm sm:text-base">Will Harthio always be free?</h3>
                <p className="text-gray-600 text-xs sm:text-sm leading-relaxed">
                  Yes! Our core mission is to provide free access to meaningful connections. We may introduce 
                  optional premium features in the future, but the essential service will always remain free.
                </p>
              </div>

              <div className="p-4 sm:p-6">
                <h3 className="font-semibold mb-2 text-sm sm:text-base">How do you sustain the platform?</h3>
                <p className="text-gray-600 text-xs sm:text-sm leading-relaxed">
                  We're supported through grants from mental health organizations, donations from our community, 
                  and partnerships with companies that share our values.
                </p>
              </div>

              <div className="p-4 sm:p-6">
                <h3 className="font-semibold mb-2 text-sm sm:text-base">Are there any hidden costs?</h3>
                <p className="text-gray-600 text-xs sm:text-sm leading-relaxed">
                  Absolutely not. No credit card required, no trial periods, no surprise charges. 
                  Everything you see is completely free to use.
                </p>
              </div>

              <div className="p-4 sm:p-6">
                <h3 className="font-semibold mb-2 text-sm sm:text-base">What about data and privacy?</h3>
                <p className="text-gray-600 text-xs sm:text-sm leading-relaxed">
                  Your data is never sold or monetized. We use industry-standard encryption and security 
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
              Ready to Start Your Journey?
            </h2>
            <p className="text-base sm:text-lg md:text-xl mb-6 sm:mb-8 max-w-2xl mx-auto opacity-90 px-4">
              Join thousands of people who have found meaningful connections and support through Harthio.
            </p>
            <Button size="lg" className="bg-white text-primary hover:bg-gray-100 text-base sm:text-lg px-6 sm:px-8 py-4 sm:py-6 w-full sm:w-auto">
              <Link href="/signup" className="flex items-center justify-center">
                Join Harthio Free
                <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
              </Link>
            </Button>
            <p className="text-xs sm:text-sm opacity-75 mt-4">No credit card required • Start connecting immediately</p>
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