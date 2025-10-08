'use client';

import Link from 'next/link';
import { Logo } from '@/components/common/logo';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, Shield, Eye, Lock, Database, Users, Mail } from 'lucide-react';

export default function PrivacyPolicyPage() {
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
                Privacy Policy
              </h1>
              <p className="text-base sm:text-lg text-gray-600 mb-4 sm:mb-6">
                Your privacy is fundamental to our mission. Learn how we protect your personal information and conversations.
              </p>
              <p className="text-sm text-gray-500">
                Last updated: December 10, 2024
              </p>
            </div>
          </div>
        </section>

        {/* Privacy Highlights */}
        <section className="w-full py-8 sm:py-12 bg-gray-50">
          <div className="container px-4 sm:px-6 md:px-8">
            <div className="text-center mb-8 sm:mb-12">
              <h2 className="text-2xl sm:text-3xl font-bold mb-3 sm:mb-4">Privacy at a Glance</h2>
              <p className="text-sm sm:text-base text-gray-600">Key principles that guide our privacy practices</p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 max-w-6xl mx-auto">
              <Card className="text-center p-4 sm:p-6">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                  <Shield className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
                </div>
                <h3 className="font-semibold text-base sm:text-lg mb-2">Data Protection</h3>
                <p className="text-sm sm:text-base text-gray-600">
                  We use industry-standard encryption and security measures to protect your personal information.
                </p>
              </Card>

              <Card className="text-center p-4 sm:p-6">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                  <Eye className="h-6 w-6 sm:h-8 sm:w-8 text-accent" />
                </div>
                <h3 className="font-semibold text-base sm:text-lg mb-2">No Data Selling</h3>
                <p className="text-sm sm:text-base text-gray-600">
                  We never sell, rent, or share your personal data with third parties for marketing purposes.
                </p>
              </Card>

              <Card className="text-center p-4 sm:p-6">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                  <Lock className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
                </div>
                <h3 className="font-semibold text-base sm:text-lg mb-2">Your Control</h3>
                <p className="text-sm sm:text-base text-gray-600">
                  You have full control over your data, including the ability to view, edit, or delete your information.
                </p>
              </Card>
            </div>
          </div>
        </section>

        {/* Detailed Policy */}
        <section className="w-full py-12 sm:py-16">
          <div className="container px-4 sm:px-6 md:px-8">
            <div className="max-w-4xl mx-auto prose prose-gray">
              
              {/* Information We Collect */}
              <Card className="p-6 sm:p-8 mb-8">
                <h2 className="text-xl sm:text-2xl font-bold mb-4 flex items-center gap-3">
                  <Database className="h-6 w-6 text-primary" />
                  Information We Collect
                </h2>
                
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Account Information</h3>
                    <ul className="list-disc list-inside space-y-1 text-gray-600">
                      <li>Email address (required for account creation)</li>
                      <li>Display name and profile information you choose to provide</li>
                      <li>Profile picture (optional)</li>
                      <li>Date of birth (for age verification)</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-2">Usage Information</h3>
                    <ul className="list-disc list-inside space-y-1 text-gray-600">
                      <li>Session participation and scheduling data</li>
                      <li>Messages sent during conversations (encrypted)</li>
                      <li>Feedback and ratings you provide</li>
                      <li>Technical information about your device and browser</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-2">Automatically Collected Data</h3>
                    <ul className="list-disc list-inside space-y-1 text-gray-600">
                      <li>IP address and general location information</li>
                      <li>Device type, operating system, and browser information</li>
                      <li>Usage patterns and feature interactions</li>
                      <li>Performance and error logs (anonymized)</li>
                    </ul>
                  </div>
                </div>
              </Card>

              {/* How We Use Information */}
              <Card className="p-6 sm:p-8 mb-8">
                <h2 className="text-xl sm:text-2xl font-bold mb-4 flex items-center gap-3">
                  <Users className="h-6 w-6 text-primary" />
                  How We Use Your Information
                </h2>
                
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Core Service Delivery</h3>
                    <ul className="list-disc list-inside space-y-1 text-gray-600">
                      <li>Matching you with compatible conversation partners</li>
                      <li>Facilitating video calls and messaging</li>
                      <li>Managing session scheduling and notifications</li>
                      <li>Providing customer support and assistance</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-2">Platform Improvement</h3>
                    <ul className="list-disc list-inside space-y-1 text-gray-600">
                      <li>Analyzing usage patterns to improve matching algorithms</li>
                      <li>Identifying and fixing technical issues</li>
                      <li>Developing new features based on user needs</li>
                      <li>Ensuring platform safety and security</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-2">Communication</h3>
                    <ul className="list-disc list-inside space-y-1 text-gray-600">
                      <li>Sending important service updates and notifications</li>
                      <li>Responding to your inquiries and support requests</li>
                      <li>Sharing community guidelines and safety information</li>
                    </ul>
                  </div>
                </div>
              </Card>

              {/* Data Sharing */}
              <Card className="p-6 sm:p-8 mb-8">
                <h2 className="text-xl sm:text-2xl font-bold mb-4 flex items-center gap-3">
                  <Shield className="h-6 w-6 text-primary" />
                  Data Sharing and Disclosure
                </h2>
                
                <div className="space-y-4">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <h3 className="text-lg font-semibold mb-2 text-green-800">What We DON'T Do</h3>
                    <ul className="list-disc list-inside space-y-1 text-green-700">
                      <li>We never sell your personal data to third parties</li>
                      <li>We don't share your conversations with advertisers</li>
                      <li>We don't use your data for targeted advertising</li>
                      <li>We don't share your information for marketing purposes</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-2">Limited Sharing Scenarios</h3>
                    <p className="text-gray-600 mb-2">We may share limited information only in these specific cases:</p>
                    <ul className="list-disc list-inside space-y-1 text-gray-600">
                      <li><strong>Service Providers:</strong> Trusted partners who help us operate the platform (hosting, analytics)</li>
                      <li><strong>Legal Requirements:</strong> When required by law or to protect user safety</li>
                      <li><strong>Safety Concerns:</strong> To prevent harm or investigate violations of our terms</li>
                      <li><strong>Business Transfers:</strong> In the unlikely event of a merger or acquisition</li>
                    </ul>
                  </div>
                </div>
              </Card>

              {/* Data Security */}
              <Card className="p-6 sm:p-8 mb-8">
                <h2 className="text-xl sm:text-2xl font-bold mb-4 flex items-center gap-3">
                  <Lock className="h-6 w-6 text-primary" />
                  Data Security
                </h2>
                
                <div className="space-y-4">
                  <p className="text-gray-600">
                    We implement comprehensive security measures to protect your information:
                  </p>
                  
                  <ul className="list-disc list-inside space-y-2 text-gray-600">
                    <li><strong>Encryption:</strong> All data is encrypted in transit and at rest using industry-standard protocols</li>
                    <li><strong>Access Controls:</strong> Strict access controls limit who can view your information</li>
                    <li><strong>Regular Audits:</strong> We conduct regular security audits and vulnerability assessments</li>
                    <li><strong>Secure Infrastructure:</strong> Our servers are hosted in secure, certified data centers</li>
                    <li><strong>Employee Training:</strong> All team members receive privacy and security training</li>
                  </ul>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h3 className="text-lg font-semibold mb-2 text-blue-800">Video Call Security</h3>
                    <p className="text-blue-700">
                      Video calls use peer-to-peer encryption through WebRTC technology. 
                      Your conversations are encrypted end-to-end and are not stored on our servers.
                    </p>
                  </div>
                </div>
              </Card>

              {/* Your Rights */}
              <Card className="p-6 sm:p-8 mb-8">
                <h2 className="text-xl sm:text-2xl font-bold mb-4 flex items-center gap-3">
                  <Eye className="h-6 w-6 text-primary" />
                  Your Privacy Rights
                </h2>
                
                <div className="space-y-4">
                  <p className="text-gray-600">You have the following rights regarding your personal data:</p>
                  
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="border border-gray-200 rounded-lg p-4">
                      <h3 className="font-semibold mb-2">Access & Portability</h3>
                      <p className="text-sm text-gray-600">Request a copy of all personal data we have about you</p>
                    </div>
                    
                    <div className="border border-gray-200 rounded-lg p-4">
                      <h3 className="font-semibold mb-2">Correction</h3>
                      <p className="text-sm text-gray-600">Update or correct any inaccurate information</p>
                    </div>
                    
                    <div className="border border-gray-200 rounded-lg p-4">
                      <h3 className="font-semibold mb-2">Deletion</h3>
                      <p className="text-sm text-gray-600">Request deletion of your account and associated data</p>
                    </div>
                    
                    <div className="border border-gray-200 rounded-lg p-4">
                      <h3 className="font-semibold mb-2">Restriction</h3>
                      <p className="text-sm text-gray-600">Limit how we process your personal information</p>
                    </div>
                  </div>

                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <h3 className="font-semibold mb-2">How to Exercise Your Rights</h3>
                    <p className="text-gray-600 mb-2">
                      To exercise any of these rights, contact us at:
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-gray-600">
                      <li>Email: <a href="mailto:seyi@harthio.com" className="text-primary hover:underline">seyi@harthio.com</a></li>
                      <li>Phone: <a href="tel:+2347030473033" className="text-primary hover:underline">+234 703 047 3033</a></li>
                    </ul>
                  </div>
                </div>
              </Card>

              {/* Cookies and Tracking */}
              <Card className="p-6 sm:p-8 mb-8">
                <h2 className="text-xl sm:text-2xl font-bold mb-4">Cookies and Tracking</h2>
                
                <div className="space-y-4">
                  <p className="text-gray-600">
                    We use cookies and similar technologies to improve your experience:
                  </p>
                  
                  <div className="space-y-3">
                    <div>
                      <h3 className="font-semibold">Essential Cookies</h3>
                      <p className="text-sm text-gray-600">Required for basic functionality like login and security</p>
                    </div>
                    
                    <div>
                      <h3 className="font-semibold">Functional Cookies</h3>
                      <p className="text-sm text-gray-600">Remember your preferences and settings</p>
                    </div>
                    
                    <div>
                      <h3 className="font-semibold">Analytics Cookies</h3>
                      <p className="text-sm text-gray-600">Help us understand how you use the platform (anonymized)</p>
                    </div>
                  </div>

                  <p className="text-gray-600">
                    You can control cookies through your browser settings, though some features may not work properly if disabled.
                  </p>
                </div>
              </Card>

              {/* Children's Privacy */}
              <Card className="p-6 sm:p-8 mb-8">
                <h2 className="text-xl sm:text-2xl font-bold mb-4">Children's Privacy</h2>
                
                <div className="space-y-4">
                  <p className="text-gray-600">
                    Harthio is designed for users aged 13 and older. We take special care to protect younger users:
                  </p>
                  
                  <ul className="list-disc list-inside space-y-1 text-gray-600">
                    <li>Users under 18 have additional privacy protections</li>
                    <li>We do not knowingly collect data from children under 13</li>
                    <li>Parents can contact us to review or delete their child's information</li>
                    <li>Enhanced safety measures for users under 18</li>
                  </ul>
                </div>
              </Card>

              {/* International Users */}
              <Card className="p-6 sm:p-8 mb-8">
                <h2 className="text-xl sm:text-2xl font-bold mb-4">International Users</h2>
                
                <div className="space-y-4">
                  <p className="text-gray-600">
                    Harthio is operated from Nigeria and complies with applicable international privacy laws:
                  </p>
                  
                  <ul className="list-disc list-inside space-y-1 text-gray-600">
                    <li><strong>GDPR:</strong> European users have additional rights under GDPR</li>
                    <li><strong>CCPA:</strong> California residents have specific privacy rights</li>
                    <li><strong>Data Transfers:</strong> International data transfers are protected by appropriate safeguards</li>
                    <li><strong>Local Laws:</strong> We comply with applicable local privacy regulations</li>
                  </ul>
                </div>
              </Card>

              {/* Changes to Policy */}
              <Card className="p-6 sm:p-8 mb-8">
                <h2 className="text-xl sm:text-2xl font-bold mb-4">Changes to This Policy</h2>
                
                <div className="space-y-4">
                  <p className="text-gray-600">
                    We may update this privacy policy from time to time. When we do:
                  </p>
                  
                  <ul className="list-disc list-inside space-y-1 text-gray-600">
                    <li>We'll notify you of significant changes via email or platform notification</li>
                    <li>The updated policy will be posted on this page with a new "last updated" date</li>
                    <li>Your continued use of Harthio constitutes acceptance of the updated policy</li>
                    <li>You can always review the current policy at harthio.com/privacy</li>
                  </ul>
                </div>
              </Card>

              {/* Contact Information */}
              <Card className="p-6 sm:p-8 bg-primary/5 border-primary/20">
                <h2 className="text-xl sm:text-2xl font-bold mb-4 flex items-center gap-3">
                  <Mail className="h-6 w-6 text-primary" />
                  Contact Us About Privacy
                </h2>
                
                <div className="space-y-4">
                  <p className="text-gray-600">
                    If you have questions about this privacy policy or how we handle your data, please contact us:
                  </p>
                  
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <h3 className="font-semibold mb-2">Email</h3>
                      <p className="text-gray-600">
                        <a href="mailto:seyi@harthio.com" className="text-primary hover:underline">seyi@harthio.com</a>
                      </p>
                    </div>
                    
                    <div>
                      <h3 className="font-semibold mb-2">Phone</h3>
                      <p className="text-gray-600">
                        <a href="tel:+2347030473033" className="text-primary hover:underline">+234 703 047 3033</a>
                      </p>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-2">Mailing Address</h3>
                    <p className="text-gray-600">
                      Stria Technologies<br />
                      Lagos, Nigeria
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
              <Link href="/terms" className="text-gray-400 hover:text-white transition-colors">Terms</Link>
              <Link href="/security" className="text-gray-400 hover:text-white transition-colors">Security</Link>
              <Link href="/contact" className="text-gray-400 hover:text-white transition-colors">Contact</Link>
            </nav>
          </div>
        </div>
      </footer>
    </div>
  );
}