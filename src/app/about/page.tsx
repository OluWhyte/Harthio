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
      <header className="px-4 lg:px-6 h-16 flex items-center border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <Link href="/" className="flex items-center justify-center" prefetch={false}>
          <Logo />
        </Link>
        <nav className="ml-auto flex gap-4 sm:gap-6 items-center">
          <Button variant="ghost" asChild>
            <Link href="/" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Home
            </Link>
          </Button>
          <Button variant="ghost" asChild>
            <Link href="/login">Log In</Link>
          </Button>
          <Button asChild className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
            <Link href="/signup">Join Free</Link>
          </Button>
        </nav>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="w-full py-12 md:py-20 bg-gradient-to-br from-purple-50 via-pink-50 to-indigo-50">
          <div className="container px-4 md:px-6">
            <div className="text-center max-w-4xl mx-auto">
              <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 bg-clip-text text-transparent">
                Our Mission: End Loneliness Through Connection
              </h1>
              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                We believe that everyone deserves to feel heard, understood, and supported. Harthio was born from the simple truth that meaningful conversations can heal, inspire, and transform lives.
              </p>
            </div>
          </div>
        </section>

        {/* Story Section */}
        <section className="w-full py-16">
          <div className="container px-4 md:px-6">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl font-bold mb-6">The Story Behind Harthio</h2>
                <div className="space-y-4 text-gray-600">
                  <p>
                    In 2023, our founder Tosin Chen was going through a difficult career transition. Despite being surrounded by people, he felt completely alone in his struggle. Traditional networking felt shallow, therapy was expensive, and friends, while caring, couldn't relate to his specific challenges.
                  </p>
                  <p>
                    That's when he had a simple but powerful realization: <strong>somewhere out there was someone who had walked his exact path and would understand completely.</strong> The problem wasn't a lack of empathetic people—it was the lack of a way to find them.
                  </p>
                  <p>
                    Harthio was born from this insight. We're not just another social platform or networking app. We're a bridge between people who need support and those who can provide it, based on shared experiences and genuine understanding.
                  </p>
                </div>
              </div>
              <div className="relative">
                <Image
                  src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
                  width="600"
                  height="400"
                  alt="People connecting in meaningful conversation"
                  className="rounded-2xl shadow-lg"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Values Section */}
        <section className="w-full py-16 bg-gray-50">
          <div className="container px-4 md:px-6">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">Our Core Values</h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                These principles guide everything we do at Harthio, from product decisions to community policies.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              <Card className="text-center p-8 border-2 hover:border-purple-200 transition-colors">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Heart className="h-8 w-8 text-purple-600" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Empathy First</h3>
                <p className="text-gray-600">
                  Every feature, every policy, every decision starts with understanding human emotions and needs.
                </p>
              </Card>

              <Card className="text-center p-8 border-2 hover:border-pink-200 transition-colors">
                <div className="w-16 h-16 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Shield className="h-8 w-8 text-pink-600" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Safety & Trust</h3>
                <p className="text-gray-600">
                  We create spaces where vulnerability is protected and authentic connection can flourish.
                </p>
              </Card>

              <Card className="text-center p-8 border-2 hover:border-indigo-200 transition-colors">
                <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="h-8 w-8 text-indigo-600" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Inclusive Community</h3>
                <p className="text-gray-600">
                  Everyone deserves support, regardless of background, identity, or life circumstances.
                </p>
              </Card>

              <Card className="text-center p-8 border-2 hover:border-green-200 transition-colors">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Target className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Intentional Matching</h3>
                <p className="text-gray-600">
                  Quality over quantity. We focus on creating meaningful connections, not endless options.
                </p>
              </Card>

              <Card className="text-center p-8 border-2 hover:border-yellow-200 transition-colors">
                <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Lightbulb className="h-8 w-8 text-yellow-600" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Continuous Learning</h3>
                <p className="text-gray-600">
                  We constantly evolve based on user feedback and research on human connection.
                </p>
              </Card>

              <Card className="text-center p-8 border-2 hover:border-blue-200 transition-colors">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Globe className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Global Impact</h3>
                <p className="text-gray-600">
                  Loneliness is a global epidemic. We're building solutions that work across cultures and borders.
                </p>
              </Card>
            </div>
          </div>
        </section>

        {/* Team Section */}
        <section className="w-full py-16">
          <div className="container px-4 md:px-6">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">Meet the Team</h2>
              <p className="text-gray-600">
                A diverse group of builders, dreamers, and connection enthusiasts.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-4xl mx-auto">
              <Card className="text-center p-6">
                <Image
                  src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80"
                  width="120"
                  height="120"
                  alt="Tosin Chen"
                  className="rounded-full mx-auto mb-4"
                />
                <h3 className="font-semibold mb-1">Tosin Chen</h3>
                <p className="text-sm text-gray-600 mb-2">Founder & CEO</p>
                <p className="text-xs text-gray-500">
                  Former product manager who experienced the loneliness epidemic firsthand and decided to do something about it.
                </p>
              </Card>

              <Card className="text-center p-6">
                <Image
                  src="https://images.unsplash.com/photo-1494790108755-2616b612b786?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80"
                  width="120"
                  height="120"
                  alt="Sarah Martinez"
                  className="rounded-full mx-auto mb-4"
                />
                <h3 className="font-semibold mb-1">Sarah Martinez</h3>
                <p className="text-sm text-gray-600 mb-2">Head of Community</p>
                <p className="text-xs text-gray-500">
                  Licensed therapist turned community builder, ensuring every interaction on Harthio is safe and supportive.
                </p>
              </Card>

              <Card className="text-center p-6">
                <Image
                  src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80"
                  width="120"
                  height="120"
                  alt="David Kim"
                  className="rounded-full mx-auto mb-4"
                />
                <h3 className="font-semibold mb-1">David Kim</h3>
                <p className="text-sm text-gray-600 mb-2">Lead Engineer</p>
                <p className="text-xs text-gray-500">
                  AI researcher passionate about using technology to solve human problems and create meaningful connections.
                </p>
              </Card>
            </div>
          </div>
        </section>

        {/* Vision Section */}
        <section className="w-full py-16 bg-gradient-to-br from-purple-50 via-pink-50 to-indigo-50">
          <div className="container px-4 md:px-6">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">Our Vision</h2>
              <p className="text-gray-600 max-w-3xl mx-auto text-lg leading-relaxed">
                We envision a world where no one has to face their struggles alone. Where meaningful conversations 
                replace surface-level interactions. Where finding someone who truly understands your situation 
                is just a few clicks away.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-12 max-w-4xl mx-auto">
              <div className="text-center">
                <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Heart className="h-10 w-10 text-purple-600" />
                </div>
                <h3 className="text-xl font-semibold mb-3">End Loneliness</h3>
                <p className="text-gray-600">
                  Create a world where everyone has access to meaningful human connection and support.
                </p>
              </div>
              <div className="text-center">
                <div className="w-20 h-20 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="h-10 w-10 text-pink-600" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Build Understanding</h3>
                <p className="text-gray-600">
                  Foster deeper empathy and connection between people from all walks of life.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="w-full py-16 bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 text-white">
          <div className="container px-4 md:px-6 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Join Our Mission
            </h2>
            <p className="text-xl mb-8 max-w-2xl mx-auto opacity-90">
              Help us build a world where no one has to face their struggles alone. Every conversation matters.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="bg-white text-purple-600 hover:bg-gray-100 text-lg px-8 py-6">
                <Link href="/signup">Join as a Member</Link>
              </Button>
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-purple-600 text-lg px-8 py-6">
                <Link href="/careers">Work With Us</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col sm:flex-row justify-between items-center">
            <div className="flex items-center gap-4 mb-4 sm:mb-0">
              <Logo className="text-white" />
              <p className="text-sm text-gray-400">&copy; 2024 Harthio Inc. All rights reserved.</p>
            </div>
            <nav className="flex gap-6 text-sm">
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