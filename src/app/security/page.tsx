'use client';

import Link from 'next/link';
import { Logo } from '@/components/common/logo';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  ArrowLeft, 
  Shield, 
  Lock, 
  Eye, 
  Server, 
  Key, 
  AlertTriangle,
  CheckCircle,
  Users,
  FileText,
  Mail,
  Phone
} from 'lucide-react';

export default function SecurityPage() {
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
                Security & Trust
              </h1>
              <p className="text-base sm:text-lg text-gray-600 mb-4 sm:mb-6">
                Your safety and privacy are our top priorities. Learn about the comprehensive security measures we use to protect your conversations and personal information.
              </p>
            </div>
          </div>
        </section>    
    {/* Security Overview */}
        <section className="w-full py-8 sm:py-12 bg-gray-50">
          <div className="container px-4 sm:px-6 md:px-8">
            <div className="text-center mb-8 sm:mb-12">
              <h2 className="text-2xl sm:text-3xl font-bold mb-3 sm:mb-4">Security Overview</h2>
              <p className="text-sm sm:text-base text-gray-600">Multi-layered protection for your peace of mind</p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 max-w-6xl mx-auto">
              <Card className="text-center p-4 sm:p-6">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                  <Lock className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
                </div>
                <h3 className="font-semibold text-base sm:text-lg mb-2">End-to-End Encryption</h3>
                <p className="text-sm sm:text-base text-gray-600">
                  All video calls and messages are encrypted using industry-standard protocols.
                </p>
              </Card>

              <Card className="text-center p-4 sm:p-6">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                  <Shield className="h-6 w-6 sm:h-8 sm:w-8 text-accent" />
                </div>
                <h3 className="font-semibold text-base sm:text-lg mb-2">Data Protection</h3>
                <p className="text-sm sm:text-base text-gray-600">
                  Your personal information is protected with advanced security measures and access controls.
                </p>
              </Card>

              <Card className="text-center p-4 sm:p-6">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                  <Eye className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
                </div>
                <h3 className="font-semibold text-base sm:text-lg mb-2">Privacy First</h3>
                <p className="text-sm sm:text-base text-gray-600">
                  We never sell your data and give you complete control over your privacy settings.
                </p>
              </Card>

              <Card className="text-center p-4 sm:p-6">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                  <Users className="h-6 w-6 sm:h-8 sm:w-8 text-accent" />
                </div>
                <h3 className="font-semibold text-base sm:text-lg mb-2">Community Safety</h3>
                <p className="text-sm sm:text-base text-gray-600">
                  Comprehensive moderation and reporting systems keep our community safe and supportive.
                </p>
              </Card>
            </div>
          </div>
        </section>

        {/* Technical Security */}
        <section className="w-full py-12 sm:py-16">
          <div className="container px-4 sm:px-6 md:px-8">
            <div className="max-w-6xl mx-auto">
              
              {/* Encryption & Data Security */}
              <Card className="p-6 sm:p-8 mb-8">
                <h2 className="text-xl sm:text-2xl font-bold mb-6 flex items-center gap-3">
                  <Lock className="h-6 w-6 text-primary" />
                  Encryption & Data Security
                </h2>
                
                <div className="grid md:grid-cols-2 gap-6 sm:gap-8">
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Video Call Security</h3>
                    <ul className="space-y-2 text-gray-600">
                      <li className="flex items-start gap-2">
                        <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                        <span>WebRTC peer-to-peer encryption</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                        <span>DTLS-SRTP protocol for media encryption</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                        <span>No video/audio recording or storage</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                        <span>Secure TURN servers for NAT traversal</span>
                      </li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-3">Data Encryption</h3>
                    <ul className="space-y-2 text-gray-600">
                      <li className="flex items-start gap-2">
                        <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                        <span>AES-256 encryption for data at rest</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                        <span>TLS 1.3 for data in transit</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                        <span>Encrypted database storage</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                        <span>Secure key management system</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </Card>

              {/* Infrastructure Security */}
              <Card className="p-6 sm:p-8 mb-8">
                <h2 className="text-xl sm:text-2xl font-bold mb-6 flex items-center gap-3">
                  <Server className="h-6 w-6 text-primary" />
                  Infrastructure Security
                </h2>
                
                <div className="grid md:grid-cols-2 gap-6 sm:gap-8">
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Cloud Security</h3>
                    <ul className="space-y-2 text-gray-600">
                      <li className="flex items-start gap-2">
                        <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                        <span>SOC 2 Type II compliant hosting</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                        <span>ISO 27001 certified data centers</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                        <span>24/7 security monitoring</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                        <span>Regular security audits and penetration testing</span>
                      </li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-3">Access Controls</h3>
                    <ul className="space-y-2 text-gray-600">
                      <li className="flex items-start gap-2">
                        <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                        <span>Multi-factor authentication for admin access</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                        <span>Role-based access control (RBAC)</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                        <span>Principle of least privilege</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                        <span>Regular access reviews and audits</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </Card>

              {/* Application Security */}
              <Card className="p-6 sm:p-8 mb-8">
                <h2 className="text-xl sm:text-2xl font-bold mb-6 flex items-center gap-3">
                  <Key className="h-6 w-6 text-primary" />
                  Application Security
                </h2>
                
                <div className="space-y-6">
                  <div className="grid md:grid-cols-3 gap-4 sm:gap-6">
                    <div className="text-center p-4 border border-gray-200 rounded-lg">
                      <h3 className="font-semibold mb-2">Input Validation</h3>
                      <p className="text-sm text-gray-600">All user inputs are validated and sanitized to prevent injection attacks</p>
                    </div>
                    
                    <div className="text-center p-4 border border-gray-200 rounded-lg">
                      <h3 className="font-semibold mb-2">CSRF Protection</h3>
                      <p className="text-sm text-gray-600">Cross-site request forgery protection on all state-changing operations</p>
                    </div>
                    
                    <div className="text-center p-4 border border-gray-200 rounded-lg">
                      <h3 className="font-semibold mb-2">Rate Limiting</h3>
                      <p className="text-sm text-gray-600">API rate limiting to prevent abuse and ensure service availability</p>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-3">Security Headers</h3>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <ul className="grid sm:grid-cols-2 gap-2 text-sm text-gray-600">
                        <li>• Content Security Policy (CSP)</li>
                        <li>• HTTP Strict Transport Security (HSTS)</li>
                        <li>• X-Frame-Options</li>
                        <li>• X-Content-Type-Options</li>
                        <li>• X-XSS-Protection</li>
                        <li>• Referrer Policy</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </section>        {/*
 Privacy & User Control */}
        <section className="w-full py-12 sm:py-16 bg-gray-50">
          <div className="container px-4 sm:px-6 md:px-8">
            <div className="max-w-6xl mx-auto">
              
              <Card className="p-6 sm:p-8 mb-8">
                <h2 className="text-xl sm:text-2xl font-bold mb-6 flex items-center gap-3">
                  <Eye className="h-6 w-6 text-primary" />
                  Privacy Controls & User Rights
                </h2>
                
                <div className="grid md:grid-cols-2 gap-6 sm:gap-8">
                  <div>
                    <h3 className="text-lg font-semibold mb-3">What You Control</h3>
                    <ul className="space-y-2 text-gray-600">
                      <li className="flex items-start gap-2">
                        <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                        <span>Profile visibility and information sharing</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                        <span>Who can contact you and send session requests</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                        <span>Notification preferences and frequency</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                        <span>Data retention and deletion preferences</span>
                      </li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-3">Anonymity Options</h3>
                    <ul className="space-y-2 text-gray-600">
                      <li className="flex items-start gap-2">
                        <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                        <span>Use pseudonyms instead of real names</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                        <span>Avatar images instead of photos</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                        <span>Limited profile information sharing</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                        <span>Anonymous conversation options</span>
                      </li>
                    </ul>
                  </div>
                </div>

                <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h3 className="font-semibold text-blue-800 mb-2">Your Data Rights</h3>
                  <p className="text-blue-700 text-sm">
                    You have the right to access, correct, delete, or export your personal data at any time. 
                    Contact our support team or use your account settings to exercise these rights.
                  </p>
                </div>
              </Card>
            </div>
          </div>
        </section>

        {/* Community Safety */}
        <section className="w-full py-12 sm:py-16">
          <div className="container px-4 sm:px-6 md:px-8">
            <div className="max-w-6xl mx-auto">
              
              <Card className="p-6 sm:p-8 mb-8">
                <h2 className="text-xl sm:text-2xl font-bold mb-6 flex items-center gap-3">
                  <Users className="h-6 w-6 text-primary" />
                  Community Safety & Moderation
                </h2>
                
                <div className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6 sm:gap-8">
                    <div>
                      <h3 className="text-lg font-semibold mb-3">Proactive Safety Measures</h3>
                      <ul className="space-y-2 text-gray-600">
                        <li className="flex items-start gap-2">
                          <Shield className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                          <span>AI-powered content moderation</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <Shield className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                          <span>Real-time conversation monitoring for safety</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <Shield className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                          <span>Automated detection of harmful behavior</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <Shield className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                          <span>Community guidelines enforcement</span>
                        </li>
                      </ul>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold mb-3">Reporting & Response</h3>
                      <ul className="space-y-2 text-gray-600">
                        <li className="flex items-start gap-2">
                          <AlertTriangle className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
                          <span>Easy-to-use reporting system</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <AlertTriangle className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
                          <span>24/7 safety team response</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <AlertTriangle className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
                          <span>Immediate action on safety violations</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <AlertTriangle className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
                          <span>Support for affected users</span>
                        </li>
                      </ul>
                    </div>
                  </div>

                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <h3 className="font-semibold text-yellow-800 mb-2 flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5" />
                      Emergency Situations
                    </h3>
                    <p className="text-yellow-700 text-sm">
                      If you encounter an emergency or immediate safety concern, contact local emergency services first. 
                      Then report the incident to our safety team for platform-related action.
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </section>

        {/* Compliance & Certifications */}
        <section className="w-full py-12 sm:py-16 bg-gray-50">
          <div className="container px-4 sm:px-6 md:px-8">
            <div className="text-center mb-8 sm:mb-12">
              <h2 className="text-2xl sm:text-3xl font-bold mb-3 sm:mb-4">Compliance & Certifications</h2>
              <p className="text-sm sm:text-base text-gray-600">We meet international security and privacy standards</p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 max-w-6xl mx-auto">
              <Card className="text-center p-4 sm:p-6">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                  <FileText className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
                </div>
                <h3 className="font-semibold text-base mb-2">GDPR Compliant</h3>
                <p className="text-sm text-gray-600">Full compliance with European data protection regulations</p>
              </Card>

              <Card className="text-center p-4 sm:p-6">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                  <Shield className="h-6 w-6 sm:h-8 sm:w-8 text-accent" />
                </div>
                <h3 className="font-semibold text-base mb-2">SOC 2 Type II</h3>
                <p className="text-sm text-gray-600">Audited security controls and operational effectiveness</p>
              </Card>

              <Card className="text-center p-4 sm:p-6">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                  <Lock className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
                </div>
                <h3 className="font-semibold text-base mb-2">ISO 27001</h3>
                <p className="text-sm text-gray-600">International standard for information security management</p>
              </Card>

              <Card className="text-center p-4 sm:p-6">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                  <CheckCircle className="h-6 w-6 sm:h-8 sm:w-8 text-accent" />
                </div>
                <h3 className="font-semibold text-base mb-2">CCPA Ready</h3>
                <p className="text-sm text-gray-600">California Consumer Privacy Act compliance for US users</p>
              </Card>
            </div>
          </div>
        </section>

        {/* Security Best Practices */}
        <section className="w-full py-12 sm:py-16">
          <div className="container px-4 sm:px-6 md:px-8">
            <div className="max-w-4xl mx-auto">
              
              <Card className="p-6 sm:p-8 mb-8">
                <h2 className="text-xl sm:text-2xl font-bold mb-6">Security Best Practices for Users</h2>
                
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Account Security</h3>
                    <ul className="space-y-2 text-gray-600">
                      <li className="flex items-start gap-2">
                        <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                        <span>Use a strong, unique password for your Harthio account</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                        <span>Enable two-factor authentication when available</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                        <span>Log out from shared or public devices</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                        <span>Regularly review your account activity</span>
                      </li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-3">Conversation Safety</h3>
                    <ul className="space-y-2 text-gray-600">
                      <li className="flex items-start gap-2">
                        <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                        <span>Don't share personal information like addresses or financial details</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                        <span>Trust your instincts - end conversations that feel uncomfortable</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                        <span>Report any inappropriate behavior immediately</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                        <span>Use the platform's built-in communication tools</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </Card>

              {/* Contact Security Team */}
              <Card className="p-6 sm:p-8 bg-primary/5 border-primary/20">
                <h2 className="text-xl sm:text-2xl font-bold mb-4 flex items-center gap-3">
                  <Mail className="h-6 w-6 text-primary" />
                  Security Contact
                </h2>
                
                <div className="space-y-4 text-gray-600">
                  <p>
                    If you discover a security vulnerability or have security concerns, please contact our security team:
                  </p>
                  
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <h3 className="font-semibold mb-2">Security Email</h3>
                      <p>
                        <a href="mailto:seyi@harthio.com" className="text-primary hover:underline">seyi@harthio.com</a>
                      </p>
                      <p className="text-sm text-gray-500">For security vulnerabilities and concerns</p>
                    </div>
                    
                    <div>
                      <h3 className="font-semibold mb-2">Emergency Contact</h3>
                      <p>
                        <a href="tel:+2347030473033" className="text-primary hover:underline">+234 703 047 3033</a>
                      </p>
                      <p className="text-sm text-gray-500">For urgent security incidents</p>
                    </div>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h3 className="font-semibold mb-2 text-blue-800">Responsible Disclosure</h3>
                    <p className="text-blue-700 text-sm">
                      We appreciate security researchers who help us keep Harthio safe. 
                      Please report vulnerabilities responsibly and give us time to address issues before public disclosure.
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
              <p className="text-xs sm:text-sm text-gray-400 text-center sm:text-left">&copy; 2025 Xcrowme Advisory Technology All rights reserved.</p>
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
