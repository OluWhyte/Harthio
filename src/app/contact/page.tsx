'use client';

import Link from 'next/link';
import { Logo } from '@/components/common/logo';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, Mail, MessageCircle, Phone, MapPin, Clock, Send } from 'lucide-react';
import { ContactUsDialog } from '@/components/harthio/contact-us-dialog';
import { useState } from 'react';

export default function ContactPage() {
  const [isContactDialogOpen, setIsContactDialogOpen] = useState(false);

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
            <div className="text-center max-w-3xl mx-auto">
              <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 bg-clip-text text-transparent">
                Get in Touch
              </h1>
              <p className="text-xl text-gray-600 mb-8">
                Have questions about Harthio? Need support? Want to share your story? We'd love to hear from you.
              </p>
            </div>
          </div>
        </section>

        {/* Contact Options */}
        <section className="w-full py-12">
          <div className="container px-4 md:px-6">
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
              <Card className="text-center p-6 hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setIsContactDialogOpen(true)}>
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MessageCircle className="h-8 w-8 text-purple-600" />
                </div>
                <h3 className="font-semibold mb-2">Send a Message</h3>
                <p className="text-sm text-gray-600 mb-4">Quick questions or feedback</p>
                <Button variant="outline" size="sm">Contact Form</Button>
              </Card>

              <Card className="text-center p-6 hover:shadow-lg transition-shadow">
                <div className="w-16 h-16 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Mail className="h-8 w-8 text-pink-600" />
                </div>
                <h3 className="font-semibold mb-2">Email Us</h3>
                <p className="text-sm text-gray-600 mb-4">For detailed inquiries</p>
                <a href="mailto:hello@harthio.com" className="text-pink-600 hover:underline text-sm">
                  hello@harthio.com
                </a>
              </Card>

              <Card className="text-center p-6 hover:shadow-lg transition-shadow">
                <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Phone className="h-8 w-8 text-indigo-600" />
                </div>
                <h3 className="font-semibold mb-2">Call Us</h3>
                <p className="text-sm text-gray-600 mb-4">Urgent support needs</p>
                <a href="tel:+1-555-HARTHIO" className="text-indigo-600 hover:underline text-sm">
                  +1 (555) HARTHIO
                </a>
              </Card>

              <Card className="text-center p-6 hover:shadow-lg transition-shadow">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Clock className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="font-semibold mb-2">Office Hours</h3>
                <p className="text-sm text-gray-600 mb-2">Mon-Fri: 9AM-6PM PST</p>
                <p className="text-sm text-gray-600">Sat-Sun: 10AM-4PM PST</p>
              </Card>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="w-full py-12 bg-gray-50">
          <div className="container px-4 md:px-6">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">Frequently Asked Questions</h2>
              <p className="text-gray-600">Quick answers to common questions</p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              <div>
                <h3 className="font-semibold mb-2">How does Harthio matching work?</h3>
                <p className="text-gray-600 text-sm mb-4">
                  Our AI analyzes your conversation needs, interests, and preferences to match you with the most compatible listeners, mentors, or peers who have relevant experience.
                </p>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Is Harthio really free?</h3>
                <p className="text-gray-600 text-sm mb-4">
                  Yes! Our core matching and conversation features are completely free. We believe meaningful connections shouldn't have a price tag.
                </p>
              </div>

              <div>
                <h3 className="font-semibold mb-2">How do you ensure safety?</h3>
                <p className="text-gray-600 text-sm mb-4">
                  All users go through verification, we have community guidelines, reporting systems, and optional anonymity features for sensitive conversations.
                </p>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Can I remain anonymous?</h3>
                <p className="text-gray-600 text-sm mb-4">
                  Absolutely. You can choose to use a pseudonym and avatar for conversations where you prefer privacy while still getting meaningful support.
                </p>
              </div>

              <div>
                <h3 className="font-semibold mb-2">What if I don't like my match?</h3>
                <p className="text-gray-600 text-sm mb-4">
                  No problem! You can politely end the conversation and request a new match. Our AI learns from your preferences to improve future matches.
                </p>
              </div>

              <div>
                <h3 className="font-semibold mb-2">How long are conversations?</h3>
                <p className="text-gray-600 text-sm mb-4">
                  You decide! Conversations can be as short as 15 minutes or as long as 2 hours. Most meaningful exchanges happen in 30-60 minute sessions.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Support Team */}
        <section className="w-full py-12">
          <div className="container px-4 md:px-6">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">Meet Our Support Team</h2>
              <p className="text-gray-600">Real humans who care about your experience</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 max-w-3xl mx-auto">
              <Card className="text-center p-6">
                <div className="w-20 h-20 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full mx-auto mb-4 flex items-center justify-center text-white text-xl font-bold">
                  TC
                </div>
                <h3 className="font-semibold mb-1">Tosin Chen</h3>
                <p className="text-sm text-gray-600 mb-2">Founder & CEO</p>
                <p className="text-xs text-gray-500">
                  "I started Harthio because I believe everyone deserves to feel heard and understood."
                </p>
              </Card>

              <Card className="text-center p-6">
                <div className="w-20 h-20 bg-gradient-to-r from-pink-500 to-indigo-500 rounded-full mx-auto mb-4 flex items-center justify-center text-white text-xl font-bold">
                  SM
                </div>
                <h3 className="font-semibold mb-1">Sarah Martinez</h3>
                <p className="text-sm text-gray-600 mb-2">Community Manager</p>
                <p className="text-xs text-gray-500">
                  "I help ensure every conversation on Harthio is safe, supportive, and meaningful."
                </p>
              </Card>

              <Card className="text-center p-6">
                <div className="w-20 h-20 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full mx-auto mb-4 flex items-center justify-center text-white text-xl font-bold">
                  DK
                </div>
                <h3 className="font-semibold mb-1">David Kim</h3>
                <p className="text-sm text-gray-600 mb-2">Technical Support</p>
                <p className="text-xs text-gray-500">
                  "I make sure the technology works seamlessly so you can focus on connecting."
                </p>
              </Card>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="w-full py-16 bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 text-white">
          <div className="container px-4 md:px-6 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Ready to Start Connecting?
            </h2>
            <p className="text-xl mb-8 max-w-2xl mx-auto opacity-90">
              Don't wait to find your tribe. Join thousands who've already discovered the power of meaningful conversations.
            </p>
            <Button size="lg" className="bg-white text-purple-600 hover:bg-gray-100 text-lg px-8 py-6">
              <Link href="/signup" className="flex items-center">
                Join Harthio Free
                <Send className="ml-2 h-5 w-5" />
              </Link>
            </Button>
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
              <Link href="/blog" className="text-gray-400 hover:text-white transition-colors">Blog</Link>
            </nav>
          </div>
        </div>
      </footer>

      {/* Contact Dialog */}
      <ContactUsDialog 
        isOpen={isContactDialogOpen} 
        onClose={() => setIsContactDialogOpen(false)} 
      />
    </div>
  );
}