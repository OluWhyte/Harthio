'use client';

import Link from 'next/link';
import { Logo } from '@/components/common/logo';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, FileText, Users, Shield, AlertTriangle, Scale, Mail } from 'lucide-react';

export default function TermsOfServicePage() {
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
            <Link href="/signup">Join Free</Link>
          </Button>
        </nav>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="w-full py-8 sm:py-12 md:py-16 bg-background">
          <div className="container px-4 sm:px-6 md:px-8">
            <div className="text-center max-w-4xl mx-auto">
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4 sm:mb-6 bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent leading-tight">
                Terms of Service
              </h1>
              <p className="text-base sm:text-lg text-gray-600 mb-4 sm:mb-6">
                These terms govern your use of Harthio and outline our mutual responsibilities for creating a safe, supportive community.
              </p>
              <p className="text-sm text-gray-500">
                Last updated: November 8, 2025
              </p>
            </div>
          </div>
        </section>

        {/* Key Points */}
        <section className="w-full py-8 sm:py-12 bg-gray-50">
          <div className="container px-4 sm:px-6 md:px-8">
            <div className="text-center mb-8 sm:mb-12">
              <h2 className="text-2xl sm:text-3xl font-bold mb-3 sm:mb-4">Key Points</h2>
              <p className="text-sm sm:text-base text-gray-600">Important highlights from our terms</p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 max-w-6xl mx-auto">
              <Card className="text-center p-4 sm:p-6">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                  <Users className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
                </div>
                <h3 className="font-semibold text-base sm:text-lg mb-2">Respectful Community</h3>
                <p className="text-sm sm:text-base text-gray-600">
                  Treat all users with respect, kindness, and empathy. No harassment, discrimination, or harmful behavior.
                </p>
              </Card>

              <Card className="text-center p-4 sm:p-6">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                  <Shield className="h-6 w-6 sm:h-8 sm:w-8 text-accent" />
                </div>
                <h3 className="font-semibold text-base sm:text-lg mb-2">Safe Environment</h3>
                <p className="text-sm sm:text-base text-gray-600">
                  We maintain a safe space for meaningful conversations. Report any violations of our community guidelines.
                </p>
              </Card>

              <Card className="text-center p-4 sm:p-6">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                  <FileText className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
                </div>
                <h3 className="font-semibold text-base sm:text-lg mb-2">Free Service</h3>
                <p className="text-sm sm:text-base text-gray-600">
                  Harthio is completely free. No hidden fees, premium tiers, or charges for any features.
                </p>
              </Card>
            </div>
          </div>
        </section>

        {/* Detailed Terms */}
        <section className="w-full py-12 sm:py-16">
          <div className="container px-4 sm:px-6 md:px-8">
            <div className="max-w-4xl mx-auto">
              
              {/* Acceptance of Terms */}
              <Card className="p-6 sm:p-8 mb-8">
                <h2 className="text-xl sm:text-2xl font-bold mb-4 flex items-center gap-3">
                  <Scale className="h-6 w-6 text-primary" />
                  Acceptance of Terms
                </h2>
                
                <div className="space-y-4 text-gray-600">
                  <p>
                    By accessing or using Harthio ("the Service"), you agree to be bound by these Terms of Service ("Terms"). 
                    If you disagree with any part of these terms, you may not access the Service.
                  </p>
                  
                  <p>
                    These Terms apply to all visitors, users, and others who access or use the Service. 
                    By creating an account, you represent that you are at least 13 years old and have the legal capacity to enter into this agreement.
                  </p>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h3 className="font-semibold text-blue-800 mb-2">Important Note</h3>
                    <p className="text-blue-700">
                      These Terms may be updated from time to time. We will notify you of significant changes, 
                      and your continued use of the Service constitutes acceptance of the updated Terms.
                    </p>
                  </div>
                </div>
              </Card>

              {/* Description of Service */}
              <Card className="p-6 sm:p-8 mb-8">
                <h2 className="text-xl sm:text-2xl font-bold mb-4">Description of Service</h2>
                
                <div className="space-y-4 text-gray-600">
                  <p>
                    Harthio is a platform that connects people for meaningful conversations through:
                  </p>
                  
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>AI-powered matching based on shared experiences and interests</li>
                    <li>Video and voice calling capabilities</li>
                    <li>Real-time messaging and chat features</li>
                    <li>Session scheduling and management tools</li>
                    <li>Community features and user profiles</li>
                  </ul>

                  <p>
                    The Service is provided free of charge and is designed to facilitate supportive, 
                    meaningful connections between users seeking understanding and empathy.
                  </p>
                </div>
              </Card>

              {/* User Accounts */}
              <Card className="p-6 sm:p-8 mb-8">
                <h2 className="text-xl sm:text-2xl font-bold mb-4">User Accounts and Registration</h2>
                
                <div className="space-y-4 text-gray-600">
                  <h3 className="text-lg font-semibold">Account Creation</h3>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>You must provide accurate and complete information when creating an account</li>
                    <li>You are responsible for maintaining the security of your account credentials</li>
                    <li>You must be at least 13 years old to create an account</li>
                    <li>One person may not maintain multiple accounts</li>
                  </ul>

                  <h3 className="text-lg font-semibold">Account Responsibilities</h3>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>Keep your login information secure and confidential</li>
                    <li>Notify us immediately of any unauthorized use of your account</li>
                    <li>You are responsible for all activities that occur under your account</li>
                    <li>Provide accurate profile information to facilitate meaningful connections</li>
                  </ul>
                </div>
              </Card>

              {/* Community Guidelines */}
              <Card className="p-6 sm:p-8 mb-8">
                <h2 className="text-xl sm:text-2xl font-bold mb-4 flex items-center gap-3">
                  <Users className="h-6 w-6 text-primary" />
                  Community Guidelines and Acceptable Use
                </h2>
                
                <div className="space-y-6 text-gray-600">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <h3 className="text-lg font-semibold mb-2 text-green-800">What We Encourage</h3>
                    <ul className="list-disc list-inside space-y-1 text-green-700">
                      <li>Respectful, empathetic, and supportive conversations</li>
                      <li>Sharing experiences and offering genuine help</li>
                      <li>Active listening and meaningful engagement</li>
                      <li>Respecting others' privacy and boundaries</li>
                      <li>Reporting violations to help maintain community safety</li>
                    </ul>
                  </div>

                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <h3 className="text-lg font-semibold mb-2 text-red-800">Prohibited Behavior</h3>
                    <ul className="list-disc list-inside space-y-1 text-red-700">
                      <li>Harassment, bullying, or intimidation of any kind</li>
                      <li>Discrimination based on race, gender, religion, sexuality, or other characteristics</li>
                      <li>Sharing inappropriate, explicit, or harmful content</li>
                      <li>Soliciting personal information or attempting to meet offline without consent</li>
                      <li>Spam, advertising, or promotional content</li>
                      <li>Impersonating others or providing false information</li>
                      <li>Using the platform for illegal activities</li>
                      <li>Attempting to circumvent safety measures or exploit vulnerabilities</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-2">Professional Boundaries</h3>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>Harthio is not a substitute for professional mental health services</li>
                      <li>Users should not provide medical, legal, or professional advice</li>
                      <li>Conversations should be supportive but not therapeutic in nature</li>
                      <li>Encourage seeking professional help when appropriate</li>
                    </ul>
                  </div>
                </div>
              </Card>

              {/* Privacy and Data */}
              <Card className="p-6 sm:p-8 mb-8">
                <h2 className="text-xl sm:text-2xl font-bold mb-4">Privacy and Data Protection</h2>
                
                <div className="space-y-4 text-gray-600">
                  <p>
                    Your privacy is important to us. Our collection and use of personal information is governed by our 
                    <Link href="/privacy" className="text-primary hover:underline"> Privacy Policy</Link>, 
                    which is incorporated into these Terms by reference.
                  </p>

                  <h3 className="text-lg font-semibold">Key Privacy Points</h3>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>We never sell your personal data to third parties</li>
                    <li>Video calls are encrypted end-to-end and not recorded</li>
                    <li>You control what information is shared in your profile</li>
                    <li>You can delete your account and data at any time</li>
                  </ul>

                  <h3 className="text-lg font-semibold">User Responsibilities</h3>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>Respect others' privacy and don't share personal information without consent</li>
                    <li>Don't record conversations without explicit permission from all participants</li>
                    <li>Report any privacy violations or concerns to our support team</li>
                  </ul>
                </div>
              </Card>

              {/* Intellectual Property */}
              <Card className="p-6 sm:p-8 mb-8">
                <h2 className="text-xl sm:text-2xl font-bold mb-4">Intellectual Property Rights</h2>
                
                <div className="space-y-4 text-gray-600">
                  <h3 className="text-lg font-semibold">Harthio's Rights</h3>
                  <p>
                    The Service and its original content, features, and functionality are owned by Stria Technologies 
                    and are protected by international copyright, trademark, patent, trade secret, and other intellectual property laws.
                  </p>

                  <h3 className="text-lg font-semibold">User Content</h3>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>You retain ownership of content you create and share on the platform</li>
                    <li>By using the Service, you grant us a license to use your content to provide and improve the Service</li>
                    <li>You are responsible for ensuring you have the right to share any content you post</li>
                    <li>We may remove content that violates these Terms or our community guidelines</li>
                  </ul>
                </div>
              </Card>

              {/* Service Availability */}
              <Card className="p-6 sm:p-8 mb-8">
                <h2 className="text-xl sm:text-2xl font-bold mb-4">Service Availability and Modifications</h2>
                
                <div className="space-y-4 text-gray-600">
                  <h3 className="text-lg font-semibold">Service Availability</h3>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>We strive to maintain high availability but cannot guarantee uninterrupted service</li>
                    <li>Scheduled maintenance will be announced in advance when possible</li>
                    <li>We are not liable for temporary unavailability due to technical issues</li>
                  </ul>

                  <h3 className="text-lg font-semibold">Service Modifications</h3>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>We may modify, suspend, or discontinue any part of the Service at any time</li>
                    <li>We will provide reasonable notice for significant changes</li>
                    <li>New features may be added to improve the user experience</li>
                  </ul>
                </div>
              </Card>

              {/* Disclaimers and Limitations */}
              <Card className="p-6 sm:p-8 mb-8">
                <h2 className="text-xl sm:text-2xl font-bold mb-4 flex items-center gap-3">
                  <AlertTriangle className="h-6 w-6 text-primary" />
                  Disclaimers and Limitations of Liability
                </h2>
                
                <div className="space-y-4 text-gray-600">
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <h3 className="text-lg font-semibold mb-2 text-yellow-800">Important Disclaimers</h3>
                    <ul className="list-disc list-inside space-y-1 text-yellow-700">
                      <li>Harthio is not a mental health service or professional counseling platform</li>
                      <li>We do not verify the credentials or qualifications of users</li>
                      <li>Conversations are between users and we are not responsible for their content</li>
                      <li>The Service is provided "as is" without warranties of any kind</li>
                    </ul>
                  </div>

                  <h3 className="text-lg font-semibold">Limitation of Liability</h3>
                  <p>
                    To the maximum extent permitted by law, Stria Technologies shall not be liable for any indirect, 
                    incidental, special, consequential, or punitive damages, or any loss of profits or revenues, 
                    whether incurred directly or indirectly, or any loss of data, use, goodwill, or other intangible losses.
                  </p>

                  <h3 className="text-lg font-semibold">User Responsibility</h3>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>You use the Service at your own risk and discretion</li>
                    <li>Seek professional help for serious mental health concerns</li>
                    <li>Verify any advice or information received through conversations</li>
                    <li>Report any concerning behavior or safety issues immediately</li>
                  </ul>
                </div>
              </Card>

              {/* Termination */}
              <Card className="p-6 sm:p-8 mb-8">
                <h2 className="text-xl sm:text-2xl font-bold mb-4">Account Termination</h2>
                
                <div className="space-y-4 text-gray-600">
                  <h3 className="text-lg font-semibold">Termination by You</h3>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>You may delete your account at any time through your account settings</li>
                    <li>Upon deletion, your personal data will be removed according to our Privacy Policy</li>
                    <li>Some information may be retained for legal or safety purposes</li>
                  </ul>

                  <h3 className="text-lg font-semibold">Termination by Us</h3>
                  <p>
                    We may suspend or terminate your account if you violate these Terms, engage in harmful behavior, 
                    or for other reasons necessary to protect our community. We will provide notice when possible, 
                    except in cases involving safety concerns or legal requirements.
                  </p>

                  <h3 className="text-lg font-semibold">Effect of Termination</h3>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>Your right to use the Service will cease immediately</li>
                    <li>You will lose access to your account and associated data</li>
                    <li>Provisions regarding intellectual property, disclaimers, and limitations will survive termination</li>
                  </ul>
                </div>
              </Card>

              {/* Governing Law */}
              <Card className="p-6 sm:p-8 mb-8">
                <h2 className="text-xl sm:text-2xl font-bold mb-4">Governing Law and Dispute Resolution</h2>
                
                <div className="space-y-4 text-gray-600">
                  <h3 className="text-lg font-semibold">Governing Law</h3>
                  <p>
                    These Terms shall be governed by and construed in accordance with the laws of Nigeria, 
                    without regard to its conflict of law provisions.
                  </p>

                  <h3 className="text-lg font-semibold">Dispute Resolution</h3>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>We encourage resolving disputes through direct communication first</li>
                    <li>Contact our support team for assistance with any issues</li>
                    <li>Legal disputes will be resolved in the courts of Lagos, Nigeria</li>
                    <li>You agree to resolve disputes individually, not as part of a class action</li>
                  </ul>
                </div>
              </Card>

              {/* Contact Information */}
              <Card className="p-6 sm:p-8 bg-primary/5 border-primary/20">
                <h2 className="text-xl sm:text-2xl font-bold mb-4 flex items-center gap-3">
                  <Mail className="h-6 w-6 text-primary" />
                  Contact Information
                </h2>
                
                <div className="space-y-4 text-gray-600">
                  <p>
                    If you have any questions about these Terms of Service, please contact us:
                  </p>
                  
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <h3 className="font-semibold mb-2">Email</h3>
                      <p>
                        <a href="mailto:seyi@harthio.com" className="text-primary hover:underline">seyi@harthio.com</a>
                      </p>
                    </div>
                    
                    <div>
                      <h3 className="font-semibold mb-2">Phone</h3>
                      <p>
                        <a href="tel:+2347030473033" className="text-primary hover:underline">+234 703 047 3033</a>
                      </p>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-2">Company Information</h3>
                    <p>
                      Stria Technologies<br />
                      Lagos, Nigeria<br />
                      <br />
                      Founder: Oluwaseyi Akinlolu
                    </p>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h3 className="font-semibold mb-2 text-blue-800">Effective Date</h3>
                    <p className="text-blue-700">
                      These Terms of Service are effective as of November 8, 2025, and will remain in effect 
                      except with respect to any changes in their provisions in the future.
                    </p>
                  </div>
                </div>
              </Card>
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
              <Link href="/security" className="text-gray-400 hover:text-white transition-colors">Security</Link>
              <Link href="/contact" className="text-gray-400 hover:text-white transition-colors">Contact</Link>
            </nav>
          </div>
        </div>
      </footer>
    </div>
  );
}