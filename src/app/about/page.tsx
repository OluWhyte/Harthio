'use client';

import Link from 'next/link';
import { Logo } from '@/components/common/logo';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, Heart, Users, Shield, Target, Lightbulb, Globe } from 'lucide-react';
import Image from 'next/image';

export default function AboutPage() {
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
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold mb-4 sm:mb-6 bg-gradient-to-r from-primary via-accent to-primary/80 bg-clip-text text-transparent leading-tight">
                Our Mission: End Loneliness Through Connection
              </h1>
              <p className="text-base sm:text-lg md:text-xl text-gray-600 mb-6 sm:mb-8 leading-relaxed px-4">
                We believe that everyone deserves to feel heard, understood, and supported. Harthio was born from the simple truth that meaningful conversations can heal, inspire, and transform lives.
              </p>
            </div>
          </div>
        </section>

        {/* Story Section */}
        <section className="w-full py-12 sm:py-16">
          <div className="container px-4 sm:px-6 md:px-8">
            <div className="grid lg:grid-cols-2 gap-8 sm:gap-12 items-center">
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6">The Story Behind Harthio</h2>
                <div className="space-y-3 sm:space-y-4 text-sm sm:text-base text-gray-600">
                  <p>
                    In 2023, our founder Oluwaseyi Akinlolu was going through a difficult health crisis. Despite being surrounded by people, he felt completely alone in his struggle. Traditional networking felt shallow, therapy was expensive, and friends, while caring, couldn't relate to his specific challenges.
                  </p>
                  <p>
                    That's when he had a simple but powerful realization: <strong>somewhere out there was someone who had walked his exact path and would understand completely.</strong> The problem wasn't a lack of empathetic people—it was the lack of a way to find them.
                  </p>
                  <p>
                    Harthio was born from this insight. We're not just another social platform or networking app. We're a bridge between people who need support and those who can provide it, based on shared experiences and genuine understanding.
                  </p>
                </div>
              </div>
              <div className="relative order-first lg:order-last">
                <Image
                  src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
                  width="600"
                  height="400"
                  alt="People connecting in meaningful conversation"
                  className="rounded-xl sm:rounded-2xl shadow-lg w-full h-[250px] sm:h-[300px] md:h-[400px] object-cover"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Values Section */}
        <section className="w-full py-12 sm:py-16 bg-gray-50">
          <div className="container px-4 sm:px-6 md:px-8">
            <div className="text-center mb-8 sm:mb-12">
              <h2 className="text-2xl sm:text-3xl font-bold mb-3 sm:mb-4">Our Core Values</h2>
              <p className="text-sm sm:text-base text-gray-600 max-w-2xl mx-auto px-4">
                These principles guide everything we do at Harthio, from product decisions to community policies.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              <Card className="text-center p-4 sm:p-6 lg:p-8 border-2 hover:border-primary/20 transition-colors">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                  <Heart className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
                </div>
                <h3 className="text-lg sm:text-xl font-semibold mb-2 sm:mb-3">Empathy First</h3>
                <p className="text-sm sm:text-base text-gray-600">
                  Every feature, every policy, every decision starts with understanding human emotions and needs.
                </p>
              </Card>

              <Card className="text-center p-4 sm:p-6 lg:p-8 border-2 hover:border-accent/20 transition-colors">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                  <Shield className="h-6 w-6 sm:h-8 sm:w-8 text-accent" />
                </div>
                <h3 className="text-lg sm:text-xl font-semibold mb-2 sm:mb-3">Safety & Trust</h3>
                <p className="text-sm sm:text-base text-gray-600">
                  We create spaces where vulnerability is protected and authentic connection can flourish.
                </p>
              </Card>

              <Card className="text-center p-4 sm:p-6 lg:p-8 border-2 hover:border-primary/20 transition-colors">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                  <Users className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
                </div>
                <h3 className="text-lg sm:text-xl font-semibold mb-2 sm:mb-3">Inclusive Community</h3>
                <p className="text-sm sm:text-base text-gray-600">
                  Everyone deserves support, regardless of background, identity, or life circumstances.
                </p>
              </Card>

              <Card className="text-center p-4 sm:p-6 lg:p-8 border-2 hover:border-accent/20 transition-colors">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                  <Target className="h-6 w-6 sm:h-8 sm:w-8 text-accent" />
                </div>
                <h3 className="text-lg sm:text-xl font-semibold mb-2 sm:mb-3">Intentional Matching</h3>
                <p className="text-sm sm:text-base text-gray-600">
                  Quality over quantity. We focus on creating meaningful connections, not endless options.
                </p>
              </Card>

              <Card className="text-center p-4 sm:p-6 lg:p-8 border-2 hover:border-primary/20 transition-colors">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                  <Lightbulb className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
                </div>
                <h3 className="text-lg sm:text-xl font-semibold mb-2 sm:mb-3">Continuous Learning</h3>
                <p className="text-sm sm:text-base text-gray-600">
                  We constantly evolve based on user feedback and research on human connection.
                </p>
              </Card>

              <Card className="text-center p-4 sm:p-6 lg:p-8 border-2 hover:border-accent/20 transition-colors">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                  <Globe className="h-6 w-6 sm:h-8 sm:w-8 text-accent" />
                </div>
                <h3 className="text-lg sm:text-xl font-semibold mb-2 sm:mb-3">Global Impact</h3>
                <p className="text-sm sm:text-base text-gray-600">
                  Loneliness is a global epidemic. We're building solutions that work across cultures and borders.
                </p>
              </Card>
            </div>
          </div>
        </section>

        {/* Team Section */}
        <section className="w-full py-12 sm:py-16">
          <div className="container px-4 sm:px-6 md:px-8">
            <div className="text-center mb-8 sm:mb-12">
              <h2 className="text-2xl sm:text-3xl font-bold mb-3 sm:mb-4">Meet the Team</h2>
              <p className="text-sm sm:text-base text-gray-600">
                A diverse group of builders, dreamers, and connection enthusiasts.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 max-w-4xl mx-auto">
              <Card className="text-center p-4 sm:p-6">
                <Image
                  src="https://images.unsplash.com/photo-1759947716170-acc64d00bcd0?q=80&w=322&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D=80"
                  width="100"
                  height="100"
                  alt="Oluwaseyi Akinlolu"
                  className="rounded-full mx-auto mb-3 sm:mb-4 w-20 h-20 sm:w-24 sm:h-24 lg:w-28 lg:h-28 object-cover"
                />
                <h3 className="font-semibold mb-1 text-sm sm:text-base">Oluwaseyi Akinlolu</h3>
                <p className="text-xs sm:text-sm text-gray-600 mb-2">Founder & CEO</p>
                <p className="text-xs text-gray-500 leading-relaxed">
                  Visionary leader who experienced the loneliness epidemic firsthand and decided to create a platform for meaningful human connections.
                </p>
              </Card>

              <Card className="text-center p-4 sm:p-6">
                <Image
                  src="https://images.unsplash.com/photo-1759946258447-860d8408fdf3?q=80&w=464&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D=80"
                  width="100"
                  height="100"
                  alt="Tosin Adewumi"
                  className="rounded-full mx-auto mb-3 sm:mb-4 w-20 h-20 sm:w-24 sm:h-24 lg:w-28 lg:h-28 object-cover"
                />
                <h3 className="font-semibold mb-1 text-sm sm:text-base">Tosin Adewumi</h3>
                <p className="text-xs sm:text-sm text-gray-600 mb-2">Product Manager</p>
                <p className="text-xs text-gray-500 leading-relaxed">
                  Product strategist focused on creating user-centered experiences that facilitate authentic connections and meaningful conversations.
                </p>
              </Card>

              <Card className="text-center p-4 sm:p-6 sm:col-span-2 lg:col-span-1">
                <Image
                  src="https://images.unsplash.com/photo-1739296408127-b6cc9c5c094b?q=80&w=387&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D=80"
                  width="100"
                  height="100"
                  alt="Ojo Olokun"
                  className="rounded-full mx-auto mb-3 sm:mb-4 w-20 h-20 sm:w-24 sm:h-24 lg:w-28 lg:h-28 object-cover"
                />
                <h3 className="font-semibold mb-1 text-sm sm:text-base">Ojo Olokun</h3>
                <p className="text-xs sm:text-sm text-gray-600 mb-2">Community Manager</p>
                <p className="text-xs text-gray-500 leading-relaxed">
                  Community advocate ensuring every interaction on Harthio is safe, supportive, and aligned with our values of empathy and understanding.
                </p>
              </Card>
            </div>
          </div>
        </section>

        {/* Vision Section */}
        <section className="w-full py-12 sm:py-16 bg-gray-50">
          <div className="container px-4 sm:px-6 md:px-8">
            <div className="text-center mb-8 sm:mb-12">
              <h2 className="text-2xl sm:text-3xl font-bold mb-3 sm:mb-4">Our Vision</h2>
              <p className="text-sm sm:text-base md:text-lg text-gray-600 max-w-3xl mx-auto leading-relaxed px-4">
                We envision a world where no one has to face their struggles alone. Where meaningful conversations 
                replace surface-level interactions. Where finding someone who truly understands your situation 
                is just a few clicks away.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 gap-8 sm:gap-12 max-w-4xl mx-auto">
              <div className="text-center">
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                  <Heart className="h-8 w-8 sm:h-10 sm:w-10 text-primary" />
                </div>
                <h3 className="text-lg sm:text-xl font-semibold mb-2 sm:mb-3">End Loneliness</h3>
                <p className="text-sm sm:text-base text-gray-600">
                  Create a world where everyone has access to meaningful human connection and support.
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                  <Users className="h-8 w-8 sm:h-10 sm:w-10 text-accent" />
                </div>
                <h3 className="text-lg sm:text-xl font-semibold mb-2 sm:mb-3">Build Understanding</h3>
                <p className="text-sm sm:text-base text-gray-600">
                  Foster deeper empathy and connection between people from all walks of life.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="w-full py-12 sm:py-16 bg-gradient-to-r from-primary via-accent to-primary text-white">
          <div className="container px-4 sm:px-6 md:px-8 text-center">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4">
              Join Our Mission
            </h2>
            <p className="text-base sm:text-lg md:text-xl mb-6 sm:mb-8 max-w-2xl mx-auto opacity-90 px-4">
              Help us build a world where no one has to face their struggles alone. Every conversation matters.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center max-w-md sm:max-w-none mx-auto">
              <Button size="lg" className="bg-white text-primary hover:bg-gray-100 text-base sm:text-lg px-6 sm:px-8 py-4 sm:py-6 w-full sm:w-auto">
                <Link href="/signup">Join as a Member</Link>
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="border-white text-white hover:bg-white hover:text-primary text-base sm:text-lg px-6 sm:px-8 py-4 sm:py-6 w-full sm:w-auto"
                onClick={() => import('@/lib/coming-soon-toast').then(m => m.showWorkWithUsComingSoon())}
              >
                Work With Us
              </Button>
            </div>
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