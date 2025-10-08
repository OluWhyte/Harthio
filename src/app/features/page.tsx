'use client';

import Link from 'next/link';
import { Logo } from '@/components/common/logo';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  ArrowLeft, 
  Video, 
  MessageCircle, 
  Calendar, 
  Users, 
  Shield, 
  Heart, 
  Zap, 
  Globe, 
  Lock, 
  UserCheck, 
  Clock,
  ArrowRight,
  CheckCircle,
  Star,
  Smartphone,
  Bell,
  Settings
} from 'lucide-react';
import Image from 'next/image';

export default function FeaturesPage() {
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
                Powerful Features for Meaningful Connections
              </h1>
              <p className="text-base sm:text-lg md:text-xl text-gray-600 mb-6 sm:mb-8 leading-relaxed px-4">
                Discover all the tools and features that make Harthio the perfect platform for finding genuine support, 
                meaningful conversations, and lasting connections.
              </p>
            </div>
          </div>
        </section>

        {/* Core Features */}
        <section className="w-full py-12 sm:py-16">
          <div className="container px-4 sm:px-6 md:px-8">
            <div className="text-center mb-8 sm:mb-12">
              <h2 className="text-2xl sm:text-3xl font-bold mb-3 sm:mb-4">Core Features</h2>
              <p className="text-sm sm:text-base text-gray-600">Everything you need for meaningful connections</p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {/* Video Calling */}
              <Card className="border-2 hover:border-primary/20 transition-colors">
                <CardHeader className="text-center">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                    <Video className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
                  </div>
                  <CardTitle className="text-lg sm:text-xl">HD Video Calling</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <p className="text-sm sm:text-base text-gray-600 mb-4">
                    Crystal-clear video calls with WebRTC technology. Connect face-to-face with people who understand your journey.
                  </p>
                  <ul className="text-xs sm:text-sm text-gray-500 space-y-1">
                    <li>• HD video quality</li>
                    <li>• Screen sharing support</li>
                    <li>• Cross-platform compatibility</li>
                    <li>• Secure peer-to-peer connection</li>
                  </ul>
                </CardContent>
              </Card>

              {/* Real-time Messaging */}
              <Card className="border-2 hover:border-accent/20 transition-colors">
                <CardHeader className="text-center">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                    <MessageCircle className="h-6 w-6 sm:h-8 sm:w-8 text-accent" />
                  </div>
                  <CardTitle className="text-lg sm:text-xl">Real-time Chat</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <p className="text-sm sm:text-base text-gray-600 mb-4">
                    Instant messaging during video calls and standalone conversations. Share thoughts and resources in real-time.
                  </p>
                  <ul className="text-xs sm:text-sm text-gray-500 space-y-1">
                    <li>• Instant message delivery</li>
                    <li>• File and image sharing</li>
                    <li>• Message history</li>
                    <li>• Typing indicators</li>
                  </ul>
                </CardContent>
              </Card>

              {/* Session Scheduling */}
              <Card className="border-2 hover:border-primary/20 transition-colors">
                <CardHeader className="text-center">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                    <Calendar className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
                  </div>
                  <CardTitle className="text-lg sm:text-xl">Smart Scheduling</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <p className="text-sm sm:text-base text-gray-600 mb-4">
                    Schedule conversations that work for everyone. Set topics, time preferences, and find the perfect match.
                  </p>
                  <ul className="text-xs sm:text-sm text-gray-500 space-y-1">
                    <li>• Flexible time slots</li>
                    <li>• Topic-based matching</li>
                    <li>• Calendar integration</li>
                    <li>• Automatic reminders</li>
                  </ul>
                </CardContent>
              </Card>

              {/* AI Matching */}
              <Card className="border-2 hover:border-accent/20 transition-colors">
                <CardHeader className="text-center">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                    <Zap className="h-6 w-6 sm:h-8 sm:w-8 text-accent" />
                  </div>
                  <CardTitle className="text-lg sm:text-xl">AI-Powered Matching</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <p className="text-sm sm:text-base text-gray-600 mb-4">
                    Our intelligent system matches you with people who truly understand your situation and can provide relevant support.
                  </p>
                  <ul className="text-xs sm:text-sm text-gray-500 space-y-1">
                    <li>• Experience-based matching</li>
                    <li>• Interest compatibility</li>
                    <li>• Conversation style analysis</li>
                    <li>• Continuous learning</li>
                  </ul>
                </CardContent>
              </Card>

              {/* Safety & Moderation */}
              <Card className="border-2 hover:border-primary/20 transition-colors">
                <CardHeader className="text-center">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                    <Shield className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
                  </div>
                  <CardTitle className="text-lg sm:text-xl">Safe Environment</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <p className="text-sm sm:text-base text-gray-600 mb-4">
                    Community guidelines, reporting systems, and moderation ensure every conversation is respectful and supportive.
                  </p>
                  <ul className="text-xs sm:text-sm text-gray-500 space-y-1">
                    <li>• Community moderation</li>
                    <li>• Report and block features</li>
                    <li>• Safety guidelines</li>
                    <li>• 24/7 support team</li>
                  </ul>
                </CardContent>
              </Card>

              {/* Privacy Controls */}
              <Card className="border-2 hover:border-accent/20 transition-colors">
                <CardHeader className="text-center">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                    <Lock className="h-6 w-6 sm:h-8 sm:w-8 text-accent" />
                  </div>
                  <CardTitle className="text-lg sm:text-xl">Privacy First</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <p className="text-sm sm:text-base text-gray-600 mb-4">
                    Complete control over your privacy. Choose what to share, use pseudonyms, and maintain anonymity when needed.
                  </p>
                  <ul className="text-xs sm:text-sm text-gray-500 space-y-1">
                    <li>• Anonymous conversations</li>
                    <li>• Pseudonym support</li>
                    <li>• Data encryption</li>
                    <li>• Privacy settings</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Advanced Features */}
        <section className="w-full py-12 sm:py-16 bg-gray-50">
          <div className="container px-4 sm:px-6 md:px-8">
            <div className="text-center mb-8 sm:mb-12">
              <h2 className="text-2xl sm:text-3xl font-bold mb-3 sm:mb-4">Advanced Features</h2>
              <p className="text-sm sm:text-base text-gray-600">Enhanced tools for deeper connections</p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 sm:gap-12 max-w-6xl mx-auto">
              {/* Mobile Optimized */}
              <div className="flex gap-4 sm:gap-6">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <Smartphone className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-semibold mb-2">Mobile Optimized</h3>
                  <p className="text-sm sm:text-base text-gray-600 mb-3">
                    Seamless experience across all devices. Connect from anywhere with our responsive design and mobile-first approach.
                  </p>
                  <ul className="text-xs sm:text-sm text-gray-500 space-y-1">
                    <li>• Progressive Web App (PWA)</li>
                    <li>• Touch-optimized interface</li>
                    <li>• Offline message sync</li>
                    <li>• Mobile notifications</li>
                  </ul>
                </div>
              </div>

              {/* Profile System */}
              <div className="flex gap-4 sm:gap-6">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-accent/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <UserCheck className="h-6 w-6 sm:h-8 sm:w-8 text-accent" />
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-semibold mb-2">Rich Profiles</h3>
                  <p className="text-sm sm:text-base text-gray-600 mb-3">
                    Create detailed profiles that help others understand your background, interests, and the type of support you're seeking.
                  </p>
                  <ul className="text-xs sm:text-sm text-gray-500 space-y-1">
                    <li>• Customizable bio and interests</li>
                    <li>• Experience sharing</li>
                    <li>• Rating and feedback system</li>
                    <li>• Verification badges</li>
                  </ul>
                </div>
              </div>

              {/* Notifications */}
              <div className="flex gap-4 sm:gap-6">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <Bell className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-semibold mb-2">Smart Notifications</h3>
                  <p className="text-sm sm:text-base text-gray-600 mb-3">
                    Stay connected with intelligent notifications that respect your time and preferences. Never miss important conversations.
                  </p>
                  <ul className="text-xs sm:text-sm text-gray-500 space-y-1">
                    <li>• Session reminders</li>
                    <li>• New match notifications</li>
                    <li>• Message alerts</li>
                    <li>• Customizable preferences</li>
                  </ul>
                </div>
              </div>

              {/* Settings & Customization */}
              <div className="flex gap-4 sm:gap-6">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-accent/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <Settings className="h-6 w-6 sm:h-8 sm:w-8 text-accent" />
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-semibold mb-2">Personalization</h3>
                  <p className="text-sm sm:text-base text-gray-600 mb-3">
                    Customize your experience with themes, notification preferences, and privacy settings that work for your lifestyle.
                  </p>
                  <ul className="text-xs sm:text-sm text-gray-500 space-y-1">
                    <li>• Custom themes and layouts</li>
                    <li>• Notification scheduling</li>
                    <li>• Privacy level controls</li>
                    <li>• Accessibility options</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Feature Showcase */}
        <section className="w-full py-12 sm:py-16">
          <div className="container px-4 sm:px-6 md:px-8">
            <div className="grid lg:grid-cols-2 gap-8 sm:gap-12 items-center max-w-6xl mx-auto">
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6">
                  Experience the Difference
                </h2>
                <div className="space-y-4 sm:space-y-6">
                  <div className="flex items-start gap-3 sm:gap-4">
                    <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6 text-primary flex-shrink-0 mt-1" />
                    <div>
                      <h3 className="font-semibold text-sm sm:text-base mb-1">Quality Over Quantity</h3>
                      <p className="text-xs sm:text-sm text-gray-600">
                        We focus on meaningful matches rather than endless options. Every connection is intentional.
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3 sm:gap-4">
                    <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6 text-primary flex-shrink-0 mt-1" />
                    <div>
                      <h3 className="font-semibold text-sm sm:text-base mb-1">Real-Time Connection</h3>
                      <p className="text-xs sm:text-sm text-gray-600">
                        Instant messaging and video calls create authentic, real-time conversations that build trust.
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3 sm:gap-4">
                    <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6 text-primary flex-shrink-0 mt-1" />
                    <div>
                      <h3 className="font-semibold text-sm sm:text-base mb-1">Safe & Supportive</h3>
                      <p className="text-xs sm:text-sm text-gray-600">
                        Community guidelines and moderation ensure every interaction is respectful and helpful.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="relative">
                <Image
                  src="https://images.unsplash.com/photo-1600880292203-757bb62b4baf?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
                  width="600"
                  height="400"
                  alt="People connecting through video call"
                  className="rounded-xl sm:rounded-2xl shadow-lg w-full h-[250px] sm:h-[300px] md:h-[400px] object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-xl sm:rounded-2xl" />
              </div>
            </div>
          </div>
        </section>

        {/* Coming Soon Features */}
        <section className="w-full py-12 sm:py-16 bg-gray-50">
          <div className="container px-4 sm:px-6 md:px-8">
            <div className="text-center mb-8 sm:mb-12">
              <h2 className="text-2xl sm:text-3xl font-bold mb-3 sm:mb-4">Coming Soon</h2>
              <p className="text-sm sm:text-base text-gray-600">Exciting features we're working on</p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 max-w-6xl mx-auto">
              <Card className="text-center p-4 sm:p-6 opacity-75">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Globe className="h-5 w-5 sm:h-6 sm:w-6 text-gray-500" />
                </div>
                <h3 className="font-semibold text-sm sm:text-base mb-2">Multi-language Support</h3>
                <p className="text-xs sm:text-sm text-gray-500">Connect across language barriers</p>
              </Card>

              <Card className="text-center p-4 sm:p-6 opacity-75">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Users className="h-5 w-5 sm:h-6 sm:w-6 text-gray-500" />
                </div>
                <h3 className="font-semibold text-sm sm:text-base mb-2">Group Sessions</h3>
                <p className="text-xs sm:text-sm text-gray-500">Multi-person support groups</p>
              </Card>

              <Card className="text-center p-4 sm:p-6 opacity-75">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Star className="h-5 w-5 sm:h-6 sm:w-6 text-gray-500" />
                </div>
                <h3 className="font-semibold text-sm sm:text-base mb-2">Mentor Program</h3>
                <p className="text-xs sm:text-sm text-gray-500">Connect with experienced mentors</p>
              </Card>

              <Card className="text-center p-4 sm:p-6 opacity-75">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Heart className="h-5 w-5 sm:h-6 sm:w-6 text-gray-500" />
                </div>
                <h3 className="font-semibold text-sm sm:text-base mb-2">Wellness Tools</h3>
                <p className="text-xs sm:text-sm text-gray-500">Integrated mental health resources</p>
              </Card>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="w-full py-12 sm:py-16 bg-gradient-to-r from-primary via-accent to-primary text-white">
          <div className="container px-4 sm:px-6 md:px-8 text-center">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4">
              Experience All Features for Free
            </h2>
            <p className="text-base sm:text-lg md:text-xl mb-6 sm:mb-8 max-w-2xl mx-auto opacity-90 px-4">
              Every feature is included at no cost. Start connecting with people who truly understand your journey.
            </p>
            <Button size="lg" className="bg-white text-primary hover:bg-gray-100 text-base sm:text-lg px-6 sm:px-8 py-4 sm:py-6 w-full sm:w-auto">
              <Link href="/signup" className="flex items-center justify-center">
                Get Started Free
                <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
              </Link>
            </Button>
            <p className="text-xs sm:text-sm opacity-75 mt-4">All features included • No premium tiers • Always free</p>
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