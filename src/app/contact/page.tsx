'use client';

import Link from 'next/link';
import { Logo } from '@/components/common/logo';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, Mail, MessageCircle, Phone, MapPin, Clock, Send } from 'lucide-react';
export default function ContactPage() {

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
            <div className="text-center max-w-3xl mx-auto">
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold mb-4 sm:mb-6 bg-gradient-to-r from-primary via-accent to-primary/80 bg-clip-text text-transparent leading-tight">
                Get in Touch
              </h1>
              <p className="text-base sm:text-lg md:text-xl text-gray-600 mb-6 sm:mb-8 px-4">
                Have questions about Harthio? Need support? Want to share your story? We'd love to hear from you.
              </p>
            </div>
          </div>
        </section>

        {/* Contact Options */}
        <section className="w-full py-8 sm:py-12">
          <div className="container px-4 sm:px-6 md:px-8">
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8 sm:mb-12">
              <Card className="text-center p-4 sm:p-6 hover:shadow-lg transition-shadow">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                  <MessageCircle className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
                </div>
                <h3 className="font-semibold mb-2 text-sm sm:text-base">WhatsApp Chat</h3>
                <p className="text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4">Quick questions or feedback</p>
                <Button variant="outline" size="sm" className="text-xs sm:text-sm" asChild>
                  <a 
                    href="https://wa.me/2347030473033?text=Hello%20Harthio%20Team!%20I%20have%20a%20question%20about%20the%20platform."
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Chat on WhatsApp
                  </a>
                </Button>
              </Card>

              <Card className="text-center p-4 sm:p-6 hover:shadow-lg transition-shadow">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                  <Mail className="h-6 w-6 sm:h-8 sm:w-8 text-accent" />
                </div>
                <h3 className="font-semibold mb-2 text-sm sm:text-base">Email Us</h3>
                <p className="text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4">For detailed inquiries</p>
                <a href="mailto:seyi@harthio.com" className="text-accent hover:underline text-xs sm:text-sm break-all">
                  seyi@harthio.com
                </a>
              </Card>

              <Card className="text-center p-4 sm:p-6 hover:shadow-lg transition-shadow">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                  <Phone className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
                </div>
                <h3 className="font-semibold mb-2 text-sm sm:text-base">Call Us</h3>
                <p className="text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4">Urgent support needs</p>
                <a href="tel:+2347030473033" className="text-primary hover:underline text-xs sm:text-sm">
                  +234 703 047 3033
                </a>
              </Card>

              <Card className="text-center p-4 sm:p-6 hover:shadow-lg transition-shadow">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                  <Clock className="h-6 w-6 sm:h-8 sm:w-8 text-accent" />
                </div>
                <h3 className="font-semibold mb-2 text-sm sm:text-base">Office Hours</h3>
                <p className="text-xs sm:text-sm text-gray-600 mb-1 sm:mb-2">Mon-Fri: 9AM-6PM PST</p>
                <p className="text-xs sm:text-sm text-gray-600">Sat-Sun: 10AM-4PM PST</p>
              </Card>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="w-full py-8 sm:py-12 bg-gray-50">
          <div className="container px-4 sm:px-6 md:px-8">
            <div className="text-center mb-8 sm:mb-12">
              <h2 className="text-2xl sm:text-3xl font-bold mb-3 sm:mb-4">Frequently Asked Questions</h2>
              <p className="text-sm sm:text-base text-gray-600">Quick answers to common questions</p>
            </div>

            <div className="grid sm:grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 max-w-4xl mx-auto">
              <div className="p-4 sm:p-0">
                <h3 className="font-semibold mb-2 text-sm sm:text-base">How does Harthio matching work?</h3>
                <p className="text-gray-600 text-xs sm:text-sm mb-4 leading-relaxed">
                  Our AI analyzes your conversation needs, interests, and preferences to match you with the most compatible listeners, mentors, or peers who have relevant experience.
                </p>
              </div>

              <div className="p-4 sm:p-0">
                <h3 className="font-semibold mb-2 text-sm sm:text-base">Is Harthio really free?</h3>
                <p className="text-gray-600 text-xs sm:text-sm mb-4 leading-relaxed">
                  Yes! Our core matching and conversation features are completely free. We believe meaningful connections shouldn't have a price tag.
                </p>
              </div>

              <div className="p-4 sm:p-0">
                <h3 className="font-semibold mb-2 text-sm sm:text-base">How do you ensure safety?</h3>
                <p className="text-gray-600 text-xs sm:text-sm mb-4 leading-relaxed">
                  All users go through verification, we have community guidelines, reporting systems, and optional anonymity features for sensitive conversations.
                </p>
              </div>

              <div className="p-4 sm:p-0">
                <h3 className="font-semibold mb-2 text-sm sm:text-base">Can I remain anonymous?</h3>
                <p className="text-gray-600 text-xs sm:text-sm mb-4 leading-relaxed">
                  Absolutely. You can choose to use a pseudonym and avatar for conversations where you prefer privacy while still getting meaningful support.
                </p>
              </div>

              <div className="p-4 sm:p-0">
                <h3 className="font-semibold mb-2 text-sm sm:text-base">What if I don't like my match?</h3>
                <p className="text-gray-600 text-xs sm:text-sm mb-4 leading-relaxed">
                  No problem! You can politely end the conversation and request a new match. Our AI learns from your preferences to improve future matches.
                </p>
              </div>

              <div className="p-4 sm:p-0">
                <h3 className="font-semibold mb-2 text-sm sm:text-base">How long are conversations?</h3>
                <p className="text-gray-600 text-xs sm:text-sm mb-4 leading-relaxed">
                  You decide! Conversations can be as short as 15 minutes or as long as 2 hours. Most meaningful exchanges happen in 30-60 minute sessions.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Support Team */}
        <section className="w-full py-8 sm:py-12">
          <div className="container px-4 sm:px-6 md:px-8">
            <div className="text-center mb-8 sm:mb-12">
              <h2 className="text-2xl sm:text-3xl font-bold mb-3 sm:mb-4">Meet Our Support Team</h2>
              <p className="text-sm sm:text-base text-gray-600">Real humans who care about your experience</p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 max-w-4xl mx-auto">
              <Card className="text-center p-4 sm:p-6">
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-primary rounded-full mx-auto mb-3 sm:mb-4 flex items-center justify-center text-white text-lg sm:text-xl font-bold">
                  TC
                </div>
                <h3 className="font-semibold mb-1 text-sm sm:text-base">Tosin Chen</h3>
                <p className="text-xs sm:text-sm text-gray-600 mb-2">Founder & CEO</p>
                <p className="text-xs text-gray-500 leading-relaxed">
                  "I started Harthio because I believe everyone deserves to feel heard and understood."
                </p>
              </Card>

              <Card className="text-center p-4 sm:p-6">
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-accent rounded-full mx-auto mb-3 sm:mb-4 flex items-center justify-center text-white text-lg sm:text-xl font-bold">
                  SM
                </div>
                <h3 className="font-semibold mb-1 text-sm sm:text-base">Sarah Martinez</h3>
                <p className="text-xs sm:text-sm text-gray-600 mb-2">Community Manager</p>
                <p className="text-xs text-gray-500 leading-relaxed">
                  "I help ensure every conversation on Harthio is safe, supportive, and meaningful."
                </p>
              </Card>

              <Card className="text-center p-4 sm:p-6 sm:col-span-2 lg:col-span-1">
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-primary rounded-full mx-auto mb-3 sm:mb-4 flex items-center justify-center text-white text-lg sm:text-xl font-bold">
                  DK
                </div>
                <h3 className="font-semibold mb-1 text-sm sm:text-base">David Kim</h3>
                <p className="text-xs sm:text-sm text-gray-600 mb-2">Technical Support</p>
                <p className="text-xs text-gray-500 leading-relaxed">
                  "I make sure the technology works seamlessly so you can focus on connecting."
                </p>
              </Card>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="w-full py-12 sm:py-16 bg-gradient-to-r from-primary via-accent to-primary text-white">
          <div className="container px-4 sm:px-6 md:px-8 text-center">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4 leading-tight">
              Ready to Start Connecting?
            </h2>
            <p className="text-base sm:text-lg md:text-xl mb-6 sm:mb-8 max-w-2xl mx-auto opacity-90 px-4">
              Don't wait to find your tribe. Join thousands who've already discovered the power of meaningful conversations.
            </p>
            <Button size="lg" className="bg-white text-primary hover:bg-gray-100 text-base sm:text-lg px-6 sm:px-8 py-4 sm:py-6 w-full sm:w-auto">
              <Link href="/signup" className="flex items-center justify-center">
                Join Harthio Free
                <Send className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
              </Link>
            </Button>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-6 sm:py-8">
        <div className="container px-4 sm:px-6 md:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 sm:gap-0">
            <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4">
              <Logo className="text-white" />
              <p className="text-xs sm:text-sm text-gray-400 text-center sm:text-left">&copy; 2025 Stria Technologies All rights reserved.</p>
            </div>
            <nav className="flex gap-4 sm:gap-6 text-xs sm:text-sm">
              <Link href="/privacy" className="text-gray-400 hover:text-white transition-colors">Privacy</Link>
              <Link href="/terms" className="text-gray-400 hover:text-white transition-colors">Terms</Link>
              <Link href="/blog" className="text-gray-400 hover:text-white transition-colors">Blog</Link>
            </nav>
          </div>
        </div>
      </footer>


    </div>
  );
}