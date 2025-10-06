
'use client';

import Link from 'next/link';
import { Logo } from '@/components/common/logo';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowRight, Heart, Users, Shield, Calendar, MessageCircle, Star, CheckCircle, Mail, Twitter, Linkedin, Instagram } from 'lucide-react';
import Image from 'next/image';

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Header */}
      <header className="px-4 lg:px-6 h-16 flex items-center border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <Link href="/" className="flex items-center justify-center" prefetch={false}>
          <Logo />
        </Link>
        <nav className="ml-auto flex gap-4 sm:gap-6 items-center">
          <Button variant="ghost" asChild className="hidden sm:inline-flex">
            <Link href="/blog">Blog</Link>
          </Button>
          <Button variant="ghost" asChild>
            <Link href="/login">Log In</Link>
          </Button>
          <Button asChild className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
            <Link href="/signup">Join Free <ArrowRight className="ml-2 h-4 w-4" /></Link>
          </Button>
        </nav>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="w-full py-12 md:py-24 lg:py-32 bg-gradient-to-br from-purple-50 via-pink-50 to-indigo-50">
          <div className="container px-4 md:px-6">
            <div className="grid gap-8 lg:grid-cols-2 lg:gap-12 items-center">
              <div className="flex flex-col justify-center space-y-6">
                <div className="space-y-4">
                  <div className="inline-block px-3 py-1 text-sm bg-purple-100 text-purple-800 rounded-full font-medium">
                    ✨ Never feel alone with your struggle again
                  </div>
                  <h1 className="text-4xl font-bold tracking-tight sm:text-6xl xl:text-7xl bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 bg-clip-text text-transparent">
                    Find Someone Who Truly Gets It
                  </h1>
                  <p className="text-xl text-gray-600 leading-relaxed max-w-[600px]">
                    <strong>Finally, someone who speaks your language.</strong> Schedule judgment-free conversations about business stress, life changes, or passion projects—with perfect matches who've walked your path, not random strangers.
                  </p>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>Like Calendly meets your most empathetic friend</span>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button size="lg" className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-lg px-8 py-6">
                    <Link href="/signup" className="flex items-center">
                      Join Free
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Link>
                  </Button>
                </div>

              </div>
              
              {/* Hero Image */}
              <div className="relative">
                <div className="relative rounded-2xl overflow-hidden shadow-2xl">
                  <Image
                    src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2088&q=80"
                    width="600"
                    height="400"
                    alt="Two people having a meaningful conversation over video call"
                    className="w-full h-[400px] object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                </div>
                {/* Floating testimonial */}
                <div className="absolute -bottom-6 -left-6 bg-white rounded-xl shadow-lg p-4 max-w-xs">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                  </div>
                  <p className="text-sm text-gray-600">"After my divorce, I found someone who truly understood my situation and put me through what to do and this fix my life."</p>
                  <p className="text-xs text-gray-400 mt-1">~ Marcus T., 42</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Value Proposition Grid */}
        <section className="w-full py-16 md:py-24">
          <div className="container px-4 md:px-6">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Why Harthio Heals Loneliness</h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                We understand the pain of feeling isolated in your struggles. Here's how we create genuine connections.
              </p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8">
              <Card className="border-2 hover:border-purple-200 transition-colors">
                <CardContent className="p-6 text-center">
                  <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Users className="h-8 w-8 text-purple-600" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Perfect Matches, Not Randoms</h3>
                  <p className="text-gray-600 mb-4">"I need advice but don't know who to ask"</p>
                  <p className="text-sm font-medium text-purple-600">→ Get matched with vetted mentors who've been there</p>
                </CardContent>
              </Card>

              <Card className="border-2 hover:border-pink-200 transition-colors">
                <CardContent className="p-6 text-center">
                  <div className="w-16 h-16 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Calendar className="h-8 w-8 text-pink-600" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Scheduled, Intentional Talks</h3>
                  <p className="text-gray-600 mb-4">"Tired of flaky Zoom strangers"</p>
                  <p className="text-sm font-medium text-pink-600">→ Scheduled, intention-based calls that actually happen</p>
                </CardContent>
              </Card>

              <Card className="border-2 hover:border-indigo-200 transition-colors">
                <CardContent className="p-6 text-center">
                  <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Heart className="h-8 w-8 text-indigo-600" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Safe Space to Be Vulnerable</h3>
                  <p className="text-gray-600 mb-4">"Can't afford therapy but need to vent"</p>
                  <p className="text-sm font-medium text-indigo-600">→ Free listener volunteers who truly care</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="w-full py-16 md:py-24 bg-gray-50">
          <div className="container px-4 md:px-6">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">How It Works</h2>
              <p className="text-xl text-gray-600">Three simple steps to meaningful connection</p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              <div className="text-center">
                <div className="w-20 h-20 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4 text-white text-2xl font-bold">
                  1
                </div>
                <h3 className="text-xl font-semibold mb-2">Create or Find a Session</h3>
                <p className="text-gray-600">Schedule your own conversation about what's on your mind, or browse existing sessions to find someone facing similar challenges.</p>
              </div>

              <div className="text-center">
                <div className="w-20 h-20 bg-gradient-to-r from-pink-500 to-indigo-500 rounded-full flex items-center justify-center mx-auto mb-4 text-white text-2xl font-bold">
                  2
                </div>
                <h3 className="text-xl font-semibold mb-2">Get Matched & Approved</h3>
                <p className="text-gray-600">Request to join sessions that resonate with you, or approve others who want to join yours. Connect with the right person.</p>
              </div>

              <div className="text-center">
                <div className="w-20 h-20 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4 text-white text-2xl font-bold">
                  3
                </div>
                <h3 className="text-xl font-semibold mb-2">Have Your Conversation</h3>
                <p className="text-gray-600">Meet via video call at your scheduled time. Share, listen, and support each other in a safe space.</p>
              </div>
            </div>

            <div className="text-center mt-12">
              <Button size="lg" className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-lg px-8 py-6">
                <Link href="/signup" className="flex items-center">
                  Start Connecting
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Social Proof */}
        <section className="w-full py-16 md:py-24">
          <div className="container px-4 md:px-6">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Stories of Connection</h2>
              <p className="text-xl text-gray-600">Real people finding real solutions to loneliness</p>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              <Card className="p-6">
                <div className="flex items-center gap-4 mb-4">
                  <Image
                    src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80"
                    width="50"
                    height="50"
                    alt="Marcus T."
                    className="rounded-full"
                  />
                  <div>
                    <p className="font-semibold">Marcus T.</p>
                    <p className="text-sm text-gray-500">Single Dad, 42</p>
                  </div>
                </div>
                <p className="text-gray-600 italic">"After my divorce, I found someone who truly understood my situation and put me through what to do and this fix my life."</p>
              </Card>

              <Card className="p-6">
                <div className="flex items-center gap-4 mb-4">
                  <Image
                    src="https://images.unsplash.com/photo-1594736797933-d0501ba2fe65?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80"
                    width="50"
                    height="50"
                    alt="Angela Haruna"
                    className="rounded-full"
                  />
                  <div>
                    <p className="font-semibold">Angela Haruna</p>
                    <p className="text-sm text-gray-500">Entrepreneur, 29</p>
                  </div>
                </div>
                <p className="text-gray-600 italic">"Building a startup felt impossibly lonely. I scheduled a session about founder burnout and connected with someone who had built and sold two companies. That conversation saved my sanity."</p>
              </Card>

              <Card className="p-6">
                <div className="flex items-center gap-4 mb-4">
                  <Image
                    src="https://images.unsplash.com/photo-1531123897727-8f129e1688ce?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80"
                    width="50"
                    height="50"
                    alt="Kemi Badmus"
                    className="rounded-full"
                  />
                  <div>
                    <p className="font-semibold">Kemi Badmus</p>
                    <p className="text-sm text-gray-500">Working Mom, 34</p>
                  </div>
                </div>
                <p className="text-gray-600 italic">"Balancing motherhood and my career felt overwhelming. I connected with another working mom who shared practical strategies that transformed how I manage both. I finally feel like I can breathe again."</p>
              </Card>

              <Card className="p-6">
                <div className="flex items-center gap-4 mb-4">
                  <Image
                    src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80"
                    width="50"
                    height="50"
                    alt="David L."
                    className="rounded-full"
                  />
                  <div>
                    <p className="font-semibold">David L.</p>
                    <p className="text-sm text-gray-500">Career Changer, 35</p>
                  </div>
                </div>
                <p className="text-gray-600 italic">"Switching careers at 35 felt impossible. I posted about my fears and connected with someone who had made the same transition. They showed me it wasn't crazy—it was possible."</p>
              </Card>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="w-full py-16 md:py-24 bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 text-white">
          <div className="container px-4 md:px-6 text-center">
            <h2 className="text-3xl md:text-5xl font-bold mb-6">
              There's Always Someone Who Gets It
            </h2>
            <p className="text-xl mb-8 max-w-2xl mx-auto opacity-90">
              Your perfect conversation partner is waiting. Start your first meaningful connection today.
            </p>
            <Button size="lg" className="bg-white text-purple-600 hover:bg-gray-100 text-lg px-8 py-6 mb-4">
              <Link href="/signup" className="flex items-center">
                Join Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <p className="text-sm opacity-75">Start connecting today</p>
          </div>
        </section>
      </main>

      {/* Enhanced Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container px-4 md:px-6">
          <div className="grid md:grid-cols-4 gap-8">
            {/* Company Info */}
            <div className="space-y-4">
              <Logo className="text-white" />
              <p className="text-gray-400 text-sm">
                Connecting hearts and minds through meaningful conversations. Never feel alone in your journey again.
              </p>
              <div className="flex space-x-4">
                <Link href="https://twitter.com/harthio" className="text-gray-400 hover:text-white transition-colors">
                  <Twitter className="h-5 w-5" />
                </Link>
                <Link href="https://linkedin.com/company/harthio" className="text-gray-400 hover:text-white transition-colors">
                  <Linkedin className="h-5 w-5" />
                </Link>
                <Link href="https://instagram.com/harthio" className="text-gray-400 hover:text-white transition-colors">
                  <Instagram className="h-5 w-5" />
                </Link>
              </div>
            </div>

            {/* Product */}
            <div>
              <h3 className="font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><Link href="/features" className="hover:text-white transition-colors">Features</Link></li>
                <li><Link href="/pricing" className="hover:text-white transition-colors">Pricing</Link></li>
                <li><Link href="/blog" className="hover:text-white transition-colors">Blog</Link></li>
                <li><Link href="/help" className="hover:text-white transition-colors">Help Center</Link></li>
              </ul>
            </div>

            {/* Company */}
            <div>
              <h3 className="font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><Link href="/about" className="hover:text-white transition-colors">About Us</Link></li>
                <li><Link href="/careers" className="hover:text-white transition-colors">Careers</Link></li>
                <li><Link href="/press" className="hover:text-white transition-colors">Press</Link></li>
                <li><Link href="/contact" className="hover:text-white transition-colors">Contact</Link></li>
              </ul>
            </div>

            {/* Contact & Legal */}
            <div>
              <h3 className="font-semibold mb-4">Get in Touch</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  <a href="mailto:hello@harthio.com" className="hover:text-white transition-colors">
                    hello@harthio.com
                  </a>
                </li>
                <li><Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
                <li><Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link></li>
                <li><Link href="/security" className="hover:text-white transition-colors">Security</Link></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-8 pt-8 flex flex-col sm:flex-row justify-between items-center">
            <p className="text-xs text-gray-400">&copy; 2024 Harthio Inc. All rights reserved.</p>
            <p className="text-xs text-gray-400 mt-2 sm:mt-0">
              Made with ❤️ for meaningful connections
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
