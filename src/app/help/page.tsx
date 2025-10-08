'use client';

import Link from 'next/link';
import { Logo } from '@/components/common/logo';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { 
  ArrowLeft, 
  Search, 
  MessageCircle, 
  Video, 
  Calendar, 
  Users, 
  Shield, 
  Settings,
  HelpCircle,
  Book,
  Mail,
  Phone,
  ArrowRight,
  ChevronRight,
  CheckCircle,
  AlertCircle,
  Info
} from 'lucide-react';
import { useState } from 'react';

export default function HelpCenterPage() {
  const [searchQuery, setSearchQuery] = useState('');

  const helpCategories = [
    {
      icon: MessageCircle,
      title: 'Getting Started',
      description: 'Learn the basics of using Harthio',
      articles: [
        'How to create your first session',
        'Setting up your profile',
        'Finding the right conversation partner',
        'Understanding the matching system'
      ]
    },
    {
      icon: Video,
      title: 'Video Calls & Messaging',
      description: 'Everything about conversations',
      articles: [
        'Starting a video call',
        'Using chat during calls',
        'Troubleshooting audio/video issues',
        'Screen sharing basics'
      ]
    },
    {
      icon: Calendar,
      title: 'Session Management',
      description: 'Scheduling and managing sessions',
      articles: [
        'How to schedule a session',
        'Joining someone else\'s session',
        'Canceling or rescheduling',
        'Session reminders and notifications'
      ]
    },
    {
      icon: Shield,
      title: 'Safety & Privacy',
      description: 'Staying safe on Harthio',
      articles: [
        'Community guidelines',
        'Reporting inappropriate behavior',
        'Privacy settings and controls',
        'Blocking and unblocking users'
      ]
    },
    {
      icon: Users,
      title: 'Community',
      description: 'Building meaningful connections',
      articles: [
        'How matching works',
        'Building your reputation',
        'Giving and receiving feedback',
        'Finding support groups'
      ]
    },
    {
      icon: Settings,
      title: 'Account & Settings',
      description: 'Managing your account',
      articles: [
        'Updating your profile',
        'Notification preferences',
        'Account security',
        'Deleting your account'
      ]
    }
  ];

  const quickAnswers = [
    {
      question: 'How do I start my first conversation?',
      answer: 'Create a session by clicking "New Session" in your dashboard, set a topic and time, then wait for someone to join or browse existing sessions to join others.',
      type: 'getting-started'
    },
    {
      question: 'Is Harthio really free?',
      answer: 'Yes! Harthio is completely free with no hidden costs, premium tiers, or credit card requirements. All features are included at no charge.',
      type: 'billing'
    },
    {
      question: 'How does the matching system work?',
      answer: 'Our AI analyzes your interests, experiences, and conversation preferences to match you with compatible people who can provide relevant support.',
      type: 'matching'
    },
    {
      question: 'What if I don\'t feel comfortable with someone?',
      answer: 'You can end any conversation politely, block users, or report inappropriate behavior. Your safety and comfort are our top priorities.',
      type: 'safety'
    },
    {
      question: 'Can I remain anonymous?',
      answer: 'Yes! You can use a pseudonym, avoid sharing personal details, and control what information is visible on your profile.',
      type: 'privacy'
    },
    {
      question: 'How do I report a problem?',
      answer: 'Use the report button during conversations, contact our support team, or email us at seyi@harthio.com for immediate assistance.',
      type: 'support'
    }
  ];

  const filteredAnswers = quickAnswers.filter(qa => 
    qa.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    qa.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
                How Can We Help You?
              </h1>
              <p className="text-base sm:text-lg md:text-xl text-gray-600 mb-6 sm:mb-8 leading-relaxed px-4">
                Find answers to common questions, learn how to use Harthio effectively, and get the support you need.
              </p>
              
              {/* Search Bar */}
              <div className="relative max-w-2xl mx-auto">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search for help articles, guides, or common questions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-3 text-base border-2 border-gray-200 focus:border-primary rounded-lg"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Quick Answers */}
        {searchQuery && (
          <section className="w-full py-8 sm:py-12 bg-gray-50">
            <div className="container px-4 sm:px-6 md:px-8">
              <h2 className="text-xl sm:text-2xl font-bold mb-6 text-center">Search Results</h2>
              <div className="max-w-4xl mx-auto space-y-4">
                {filteredAnswers.length > 0 ? (
                  filteredAnswers.map((qa, index) => (
                    <Card key={index} className="p-4 sm:p-6">
                      <h3 className="font-semibold text-base sm:text-lg mb-2 flex items-start gap-2">
                        <HelpCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                        {qa.question}
                      </h3>
                      <p className="text-sm sm:text-base text-gray-600 ml-7">{qa.answer}</p>
                    </Card>
                  ))
                ) : (
                  <Card className="p-6 text-center">
                    <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="font-semibold text-lg mb-2">No results found</h3>
                    <p className="text-gray-600 mb-4">Try different keywords or browse our help categories below.</p>
                    <Button variant="outline" onClick={() => setSearchQuery('')}>
                      Clear Search
                    </Button>
                  </Card>
                )}
              </div>
            </div>
          </section>
        )}

        {/* Help Categories */}
        <section className="w-full py-12 sm:py-16">
          <div className="container px-4 sm:px-6 md:px-8">
            <div className="text-center mb-8 sm:mb-12">
              <h2 className="text-2xl sm:text-3xl font-bold mb-3 sm:mb-4">Browse Help Topics</h2>
              <p className="text-sm sm:text-base text-gray-600">Find detailed guides and tutorials</p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 max-w-6xl mx-auto">
              {helpCategories.map((category, index) => (
                <Card key={index} className="border-2 hover:border-primary/20 transition-colors cursor-pointer group">
                  <CardHeader className="text-center pb-4">
                    <div className="w-12 h-12 sm:w-16 sm:h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4 group-hover:bg-primary/20 transition-colors">
                      <category.icon className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
                    </div>
                    <CardTitle className="text-lg sm:text-xl">{category.title}</CardTitle>
                    <p className="text-sm sm:text-base text-gray-600">{category.description}</p>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {category.articles.map((article, articleIndex) => (
                        <li key={articleIndex} className="flex items-center gap-2 text-sm text-gray-600 hover:text-primary transition-colors">
                          <ChevronRight className="h-4 w-4 flex-shrink-0" />
                          <span className="cursor-pointer">{article}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Quick Answers Section */}
        {!searchQuery && (
          <section className="w-full py-12 sm:py-16 bg-gray-50">
            <div className="container px-4 sm:px-6 md:px-8">
              <div className="text-center mb-8 sm:mb-12">
                <h2 className="text-2xl sm:text-3xl font-bold mb-3 sm:mb-4">Frequently Asked Questions</h2>
                <p className="text-sm sm:text-base text-gray-600">Quick answers to common questions</p>
              </div>

              <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6">
                {quickAnswers.slice(0, 6).map((qa, index) => (
                  <Card key={index} className="p-4 sm:p-6">
                    <h3 className="font-semibold text-base sm:text-lg mb-2 flex items-start gap-2">
                      <HelpCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                      {qa.question}
                    </h3>
                    <p className="text-sm sm:text-base text-gray-600 ml-7 leading-relaxed">{qa.answer}</p>
                  </Card>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Contact Support */}
        <section className="w-full py-12 sm:py-16">
          <div className="container px-4 sm:px-6 md:px-8">
            <div className="text-center mb-8 sm:mb-12">
              <h2 className="text-2xl sm:text-3xl font-bold mb-3 sm:mb-4">Still Need Help?</h2>
              <p className="text-sm sm:text-base text-gray-600">Our support team is here to assist you</p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 max-w-4xl mx-auto">
              <Card className="text-center p-4 sm:p-6 hover:shadow-lg transition-shadow">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                  <Mail className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
                </div>
                <h3 className="font-semibold mb-2 text-sm sm:text-base">Email Support</h3>
                <p className="text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4">Get detailed help via email</p>
                <Button variant="outline" size="sm" asChild>
                  <a href="mailto:seyi@harthio.com">Contact Us</a>
                </Button>
              </Card>

              <Card className="text-center p-4 sm:p-6 hover:shadow-lg transition-shadow">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                  <Phone className="h-6 w-6 sm:h-8 sm:w-8 text-accent" />
                </div>
                <h3 className="font-semibold mb-2 text-sm sm:text-base">Phone Support</h3>
                <p className="text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4">Urgent support needs</p>
                <Button variant="outline" size="sm" asChild>
                  <a href="tel:+2347030473033">Call Us</a>
                </Button>
              </Card>

              <Card className="text-center p-4 sm:p-6 hover:shadow-lg transition-shadow sm:col-span-2 lg:col-span-1">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                  <MessageCircle className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
                </div>
                <h3 className="font-semibold mb-2 text-sm sm:text-base">Community Help</h3>
                <p className="text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4">Get help from other users</p>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/signup">Join Community</Link>
                </Button>
              </Card>
            </div>
          </div>
        </section>

        {/* Tips Section */}
        <section className="w-full py-12 sm:py-16 bg-gray-50">
          <div className="container px-4 sm:px-6 md:px-8">
            <div className="text-center mb-8 sm:mb-12">
              <h2 className="text-2xl sm:text-3xl font-bold mb-3 sm:mb-4">Pro Tips</h2>
              <p className="text-sm sm:text-base text-gray-600">Make the most of your Harthio experience</p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 max-w-6xl mx-auto">
              <Card className="p-4 sm:p-6">
                <div className="flex items-start gap-3 sm:gap-4">
                  <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6 text-primary flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold text-sm sm:text-base mb-1">Complete Your Profile</h3>
                    <p className="text-xs sm:text-sm text-gray-600">
                      A detailed profile helps others understand your background and improves matching quality.
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="p-4 sm:p-6">
                <div className="flex items-start gap-3 sm:gap-4">
                  <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6 text-primary flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold text-sm sm:text-base mb-1">Be Specific in Sessions</h3>
                    <p className="text-xs sm:text-sm text-gray-600">
                      Clear session topics and descriptions attract the right conversation partners.
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="p-4 sm:p-6">
                <div className="flex items-start gap-3 sm:gap-4">
                  <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6 text-primary flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold text-sm sm:text-base mb-1">Practice Active Listening</h3>
                    <p className="text-xs sm:text-sm text-gray-600">
                      Focus on understanding rather than just waiting to speak. Ask follow-up questions.
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="p-4 sm:p-6">
                <div className="flex items-start gap-3 sm:gap-4">
                  <Info className="h-5 w-5 sm:h-6 sm:w-6 text-accent flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold text-sm sm:text-base mb-1">Test Your Setup</h3>
                    <p className="text-xs sm:text-sm text-gray-600">
                      Check your camera and microphone before important conversations to avoid technical issues.
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="p-4 sm:p-6">
                <div className="flex items-start gap-3 sm:gap-4">
                  <Info className="h-5 w-5 sm:h-6 sm:w-6 text-accent flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold text-sm sm:text-base mb-1">Respect Boundaries</h3>
                    <p className="text-xs sm:text-sm text-gray-600">
                      Everyone has different comfort levels. Respect privacy and don't pressure for personal details.
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="p-4 sm:p-6">
                <div className="flex items-start gap-3 sm:gap-4">
                  <Info className="h-5 w-5 sm:h-6 sm:w-6 text-accent flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold text-sm sm:text-base mb-1">Give Feedback</h3>
                    <p className="text-xs sm:text-sm text-gray-600">
                      Rate your conversations to help improve the matching system and build community trust.
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="w-full py-12 sm:py-16 bg-gradient-to-r from-primary via-accent to-primary text-white">
          <div className="container px-4 sm:px-6 md:px-8 text-center">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4">
              Ready to Get Started?
            </h2>
            <p className="text-base sm:text-lg md:text-xl mb-6 sm:mb-8 max-w-2xl mx-auto opacity-90 px-4">
              Join thousands of people finding meaningful connections and support on Harthio.
            </p>
            <Button size="lg" className="bg-white text-primary hover:bg-gray-100 text-base sm:text-lg px-6 sm:px-8 py-4 sm:py-6 w-full sm:w-auto">
              <Link href="/signup" className="flex items-center justify-center">
                Start Connecting
                <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
              </Link>
            </Button>
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