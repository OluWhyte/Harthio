"use client";

import Link from "next/link";
import { Logo } from "@/components/common/logo";
import { StructuredData } from "@/components/seo/structured-data";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowRight, Mail } from "lucide-react";
import Image from "next/image";
import dynamicImport from "next/dynamic";
import { HeroCarousel } from "@/components/landing/HeroCarousel";
import { ScrollReveal } from "@/components/landing/ScrollReveal";
import "@/styles/landing-animations.css";

// Lazy load below-the-fold components for better performance
const AICompanionShowcase = dynamicImport(
  () => import("@/components/landing/AICompanionShowcase").then(mod => ({ default: mod.AICompanionShowcase })),
  { ssr: false, loading: () => <div className="h-[600px] animate-pulse bg-gray-50" /> }
);

const RecoveryTrackerShowcase = dynamicImport(
  () => import("@/components/landing/RecoveryTrackerShowcase").then(mod => ({ default: mod.RecoveryTrackerShowcase })),
  { ssr: false, loading: () => <div className="h-[600px] animate-pulse bg-gray-50" /> }
);

const ValuePropositionShowcase = dynamicImport(
  () => import("@/components/landing/ValuePropositionShowcase").then(mod => ({ default: mod.ValuePropositionShowcase })),
  { ssr: false, loading: () => <div className="h-[400px] animate-pulse bg-gray-50" /> }
);

const HowHarthioHelps = dynamicImport(
  () => import("@/components/landing/HowHarthioHelps").then(mod => ({ default: mod.HowHarthioHelps })),
  { ssr: false, loading: () => <div className="h-[600px] animate-pulse bg-gray-50" /> }
);

export default function LandingPage() {
  return (
    <>
      <StructuredData
        type="website"
        data={{
          name: "Harthio",
          description:
            "Find someone who truly gets it. Connect with people who understand your struggles through meaningful conversations.",
          url: "https://harthio.com",
        }}
      />
      <StructuredData
        type="organization"
        data={{
          name: "Harthio",
          description:
            "Platform for meaningful conversations with AI-powered matching and moderation",
        }}
      />
      <div className="flex flex-col min-h-screen bg-background">
        {/* Header */}
        <header className="px-3 sm:px-4 lg:px-6 h-14 sm:h-16 flex items-center justify-between border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
          <Link
            href="/"
            className="flex items-center justify-center"
            prefetch={false}
          >
            <Logo />
          </Link>
          <nav className="hidden lg:flex gap-4 lg:gap-6 items-center absolute left-1/2 -translate-x-1/2">
            <Button
              variant="ghost"
              asChild
              size="sm"
            >
              <Link href="/features">Features</Link>
            </Button>
            <Button
              variant="ghost"
              asChild
              size="sm"
            >
              <Link href="/pricing">Pricing</Link>
            </Button>
            <Button
              variant="ghost"
              asChild
              size="sm"
            >
              <Link href="/blog">Blog</Link>
            </Button>
          </nav>
          <div className="flex gap-2 sm:gap-4 items-center">
            <Button variant="ghost" asChild size="sm">
              <Link href="/login">Log In</Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/signup">
                <span className="hidden xs:inline">Join Free</span>
                <span className="xs:hidden">Join</span>
                <ArrowRight className="ml-1 sm:ml-2 h-3 w-3 sm:h-4 sm:w-4" />
              </Link>
            </Button>
          </div>
        </header>

        <main className="flex-1">
          {/* Hero Section with Carousel */}
          <section
            className="w-full py-8 sm:py-12 md:py-16 lg:py-24 xl:py-32 bg-background relative overflow-hidden"
            aria-label="Hero section"
          >
            {/* Subtle animated gradient background - Brand colors */}
            <div className="absolute inset-0 animate-brand-gradient opacity-5 pointer-events-none" />

            <div className="container px-4 sm:px-6 md:px-8 relative z-10">
              <HeroCarousel />
            </div>
          </section>

          {/* Value Proposition Grid - Antigravity Style */}
          <ValuePropositionShowcase />

          {/* AI Companion Showcase */}
          <AICompanionShowcase />

          {/* Recovery Tracker Showcase */}
          <RecoveryTrackerShowcase />

          {/* How Harthio Helps - Sticky Scroll Showcase */}
          <HowHarthioHelps />

          {/* Social Proof */}
          <section className="w-full py-12 sm:py-16 md:py-20 lg:py-24">
            <div className="container px-4 sm:px-6 md:px-8">
              <div className="text-center mb-10 sm:mb-14 md:mb-16">
                <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 sm:mb-5 md:mb-6 leading-tight">
                  Real Stories, Real Progress
                </h2>
                <p className="text-lg sm:text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
                  How Harthio is helping people overcome challenges and find support
                </p>
              </div>

              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
                <ScrollReveal delay={0.1}>
                  <Card className="p-5 sm:p-7 hover:shadow-xl transition-shadow duration-300">
                    <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-5">
                      <Image
                        src="https://images.unsplash.com/photo-1759855698735-2b0fe3d25990?w=96&h=96&fit=crop&auto=format"
                        width={56}
                        height={56}
                        alt="Bode Uche"
                        className="rounded-full w-12 h-12 sm:w-14 sm:h-14 object-cover ring-2 ring-primary/10"
                        loading="lazy"
                        quality={75}
                      />
                      <div>
                        <p className="font-semibold text-base sm:text-lg">
                          Bode Uche
                        </p>
                        <p className="text-sm sm:text-base text-gray-500">
                          Single Dad, 42
                        </p>
                      </div>
                    </div>
                    <p className="text-base sm:text-lg text-gray-700 italic leading-relaxed">
                      &quot;After my divorce, I found someone who truly understood
                      my situation and put me through what to do and this fix my
                      life as a black divorcee and single dad living in the
                      UK.&quot;
                    </p>
                  </Card>
                </ScrollReveal>

                <ScrollReveal delay={0.2}>
                  <Card className="p-5 sm:p-7 hover:shadow-xl transition-shadow duration-300">
                    <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-5">
                      <Image
                        src="https://images.unsplash.com/photo-1530785602389-07594beb8b73?w=96&h=96&fit=crop&auto=format"
                        width={56}
                        height={56}
                        alt="Angela Haruna"
                        className="rounded-full w-12 h-12 sm:w-14 sm:h-14 object-cover ring-2 ring-primary/10"
                        loading="lazy"
                        quality={75}
                      />
                      <div>
                        <p className="font-semibold text-base sm:text-lg">
                          Angela Haruna
                        </p>
                        <p className="text-sm sm:text-base text-gray-500">
                          Entrepreneur, 29
                        </p>
                      </div>
                    </div>
                    <p className="text-base sm:text-lg text-gray-700 italic leading-relaxed">
                      &quot;Building a startup felt impossibly lonely. I scheduled
                      a session about founder burnout and connected with someone
                      who had built and sold two companies. That conversation
                      saved my sanity.&quot;
                    </p>
                  </Card>
                </ScrollReveal>

                <ScrollReveal delay={0.3}>
                  <Card className="p-5 sm:p-7 hover:shadow-xl transition-shadow duration-300">
                    <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-5">
                      <Image
                        src="https://images.unsplash.com/photo-1573497019418-b400bb3ab074?w=96&h=96&fit=crop&auto=format"
                        width={56}
                        height={56}
                        alt="Kemi Badmus"
                        className="rounded-full w-12 h-12 sm:w-14 sm:h-14 object-cover ring-2 ring-primary/10"
                        loading="lazy"
                        quality={75}
                      />
                      <div>
                        <p className="font-semibold text-base sm:text-lg">
                          Kemi Badmus
                        </p>
                        <p className="text-sm sm:text-base text-gray-500">
                          Survivor, 29
                        </p>
                      </div>
                    </div>
                    <p className="text-base sm:text-lg text-gray-700 italic leading-relaxed">
                      &quot;I saw a screenshot of a session about sexual assault on WhatsApp. Someone was brave enough to share their story. That gave me the courage to join Harthio, request to join that session, and finally speak about what happened to me. I wasn&apos;t alone anymore.&quot;
                    </p>
                  </Card>
                </ScrollReveal>

                <ScrollReveal delay={0.4}>
                  <Card className="p-5 sm:p-7 hover:shadow-xl transition-shadow duration-300">
                    <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-5">
                      <Image
                        src="https://images.unsplash.com/photo-1533108344127-a586d2b02479?w=96&h=96&fit=crop&auto=format"
                        width={56}
                        height={56}
                        alt="Mohamad Kareem"
                        className="rounded-full w-12 h-12 sm:w-14 sm:h-14 object-cover ring-2 ring-primary/10"
                        loading="lazy"
                        quality={75}
                      />
                      <div>
                        <p className="font-semibold text-base sm:text-lg">
                          Mohamad Kareem
                        </p>
                        <p className="text-sm sm:text-base text-gray-500">
                          In Recovery, 35
                        </p>
                      </div>
                    </div>
                    <p className="text-base sm:text-lg text-gray-700 italic leading-relaxed">
                      &quot;The sobriety tracker and AI companion kept me accountable during my darkest moments. Seeing my progress grow day by day gave me hope. 90 days sober and counting—I couldn&apos;t have done it without this support.&quot;
                    </p>
                  </Card>
                </ScrollReveal>

                <ScrollReveal delay={0.5}>
                  <Card className="p-5 sm:p-7 hover:shadow-xl transition-shadow duration-300">
                    <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-5">
                      <Image
                        src="https://images.unsplash.com/photo-1759852692971-a2abc6799cbd?w=96&h=96&fit=crop&auto=format"
                        width={56}
                        height={56}
                        alt="Opeyemi Adebayo"
                        className="rounded-full w-12 h-12 sm:w-14 sm:h-14 object-cover ring-2 ring-primary/10"
                        loading="lazy"
                        quality={75}
                      />
                      <div>
                        <p className="font-semibold text-base sm:text-lg">
                          Opeyemi Adebayo
                        </p>
                        <p className="text-sm sm:text-base text-gray-500">
                          University Student, 21
                        </p>
                      </div>
                    </div>
                    <p className="text-base sm:text-lg text-gray-700 italic leading-relaxed">
                      &quot;The AI companion is like having a therapist in my pocket. When anxiety hits at 2am, I can talk through it immediately. It helped me identify my triggers and gave me coping techniques that actually work.&quot;
                    </p>
                  </Card>
                </ScrollReveal>

                <ScrollReveal delay={0.6}>
                  <Card className="p-5 sm:p-7 hover:shadow-xl transition-shadow duration-300">
                    <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-5">
                      <Image
                        src="https://images.unsplash.com/photo-1616805765352-beedbad46b2a?w=96&h=96&fit=crop&auto=format"
                        width={56}
                        height={56}
                        alt="James Emeka"
                        className="rounded-full w-12 h-12 sm:w-14 sm:h-14 object-cover ring-2 ring-primary/10"
                        loading="lazy"
                        quality={75}
                      />
                      <div>
                        <p className="font-semibold text-base sm:text-lg">
                          James Emeka
                        </p>
                        <p className="text-sm sm:text-base text-gray-500">
                          Recovering Addict, 28
                        </p>
                      </div>
                    </div>
                    <p className="text-base sm:text-lg text-gray-700 italic leading-relaxed">
                      &quot;After years of hiding my addiction, I finally found a safe space to be honest. The recovery tracker shows me how far I&apos;ve come, and when cravings hit, the AI companion talks me through it. 60 days clean—I never thought I&apos;d make it this far.&quot;
                    </p>
                  </Card>
                </ScrollReveal>
              </div>
            </div>
          </section>

          {/* Final CTA - Enhanced with Animated Gradient */}
          <section className="w-full py-12 sm:py-16 md:py-20 lg:py-24 relative overflow-hidden">
            {/* Animated brand gradient background */}
            <div className="absolute inset-0 animate-brand-gradient" />

            {/* Floating particles */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              {[...Array(8)].map((_, i) => (
                <div
                  key={i}
                  className="absolute w-2 h-2 bg-white/30 rounded-full animate-float"
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                    animationDelay: `${i * 0.5}s`,
                    animationDuration: `${3 + Math.random() * 2}s`,
                  }}
                />
              ))}
            </div>

            <div className="container px-4 sm:px-6 md:px-8 text-center relative z-10">
              <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-5 sm:mb-6 md:mb-8 leading-tight text-white">
                There&apos;s Always Someone Who Gets It
              </h2>
              <p className="text-xl sm:text-xl md:text-2xl mb-8 sm:mb-10 max-w-3xl mx-auto opacity-95 px-4 text-white leading-relaxed">
                Your perfect conversation partner is waiting. Start your first
                meaningful connection today.
              </p>
              <Button
                size="lg"
                variant="outline"
                className="bg-white border-white text-primary hover:bg-white/90 hover:scale-105 transition-all duration-apple ease-apple-spring mb-4 sm:mb-5 w-full sm:w-auto shadow-xl text-lg px-8 py-6 h-auto"
                asChild
              >
                <Link href="/signup" className="flex items-center justify-center">
                  Join Free
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <p className="text-sm sm:text-base opacity-80 text-white">
                Start connecting today
              </p>
            </div>
          </section>
        </main>

        {/* Enhanced Footer */}
        <footer className="bg-gray-900 text-white py-8 sm:py-12">
          <div className="container px-4 sm:px-6 md:px-8">
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
              {/* Company Info */}
              <div className="space-y-3 sm:space-y-4 sm:col-span-2 lg:col-span-1">
                <div className="text-white">
                  <Logo />
                </div>
                <p className="text-gray-400 text-xs sm:text-sm leading-relaxed">
                  Connecting hearts and minds through meaningful conversations.
                  Never feel alone in your journey again.
                </p>
                <div className="flex space-x-3 sm:space-x-4">
                  <Link
                    href="https://x.com/harthiohq"
                    className="text-gray-400 hover:text-white transition-colors"
                    aria-label="Follow us on X"
                  >
                    <svg
                      className="h-5 w-5"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                    </svg>
                  </Link>
                  <Link
                    href="https://instagram.com/harthiohq"
                    className="text-gray-400 hover:text-white transition-colors"
                    aria-label="Follow us on Instagram"
                  >
                    <svg
                      className="h-5 w-5"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                    </svg>
                  </Link>
                  <Link
                    href="https://harthio.com"
                    className="text-gray-400 hover:text-white transition-colors"
                    aria-label="Follow us on TikTok"
                  >
                    <svg
                      className="h-5 w-5"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
                    </svg>
                  </Link>
                  <Link
                    href="https://linkedin.com/company/harthio"
                    className="text-gray-400 hover:text-white transition-colors"
                    aria-label="Connect with us on LinkedIn"
                  >
                    <svg
                      className="h-5 w-5"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                    </svg>
                  </Link>
                </div>
              </div>

              {/* Product */}
              <div>
                <h3 className="font-semibold mb-3 sm:mb-4 text-sm sm:text-base">
                  Product
                </h3>
                <ul className="space-y-1 sm:space-y-2 text-xs sm:text-sm text-gray-400">
                  <li>
                    <Link
                      href="/features"
                      className="hover:text-white transition-colors"
                    >
                      Features
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/pricing"
                      className="hover:text-white transition-colors"
                    >
                      Pricing
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/blog"
                      className="hover:text-white transition-colors"
                    >
                      Blog
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/help"
                      className="hover:text-white transition-colors"
                    >
                      Help Center
                    </Link>
                  </li>
                </ul>
              </div>

              {/* Company */}
              <div>
                <h3 className="font-semibold mb-3 sm:mb-4 text-sm sm:text-base">
                  Company
                </h3>
                <ul className="space-y-1 sm:space-y-2 text-xs sm:text-sm text-gray-400">
                  <li>
                    <Link
                      href="/about"
                      className="hover:text-white transition-colors"
                    >
                      About Us
                    </Link>
                  </li>
                  <li>
                    <button
                      onClick={() =>
                        import("@/lib/coming-soon-toast").then((m) =>
                          m.showCareersComingSoon()
                        )
                      }
                      className="hover:text-white transition-colors text-left"
                    >
                      Careers
                    </button>
                  </li>
                  <li>
                    <Link
                      href="/contact"
                      className="hover:text-white transition-colors"
                    >
                      Contact
                    </Link>
                  </li>
                </ul>
              </div>

              {/* Contact & Legal */}
              <div>
                <h3 className="font-semibold mb-3 sm:mb-4 text-sm sm:text-base">
                  Get in Touch
                </h3>
                <ul className="space-y-1 sm:space-y-2 text-xs sm:text-sm text-gray-400">
                  <li className="flex items-center gap-2">
                    <Mail className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                    <a
                      href="mailto:seyi@harthio.com"
                      className="hover:text-white transition-colors break-all"
                    >
                      seyi@harthio.com
                    </a>
                  </li>
                  <li className="pt-2">
                    <p className="text-xs font-semibold text-gray-300 mb-2">Follow Us</p>
                    <div className="flex gap-3">
                      <a
                        href="https://x.com/harthiohq"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-white transition-colors"
                        aria-label="X (Twitter)"
                      >
                        𝕏
                      </a>
                      <a
                        href="https://instagram.com/harthiohq"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-white transition-colors"
                        aria-label="Instagram"
                      >
                        IG
                      </a>
                      <a
                        href="https://harthio.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-white transition-colors"
                        aria-label="TikTok"
                      >
                        TT
                      </a>
                    </div>
                  </li>
                  <li>
                    <Link
                      href="/privacy"
                      className="hover:text-white transition-colors"
                    >
                      Privacy Policy
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/terms"
                      className="hover:text-white transition-colors"
                    >
                      Terms of Service
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/security"
                      className="hover:text-white transition-colors"
                    >
                      Security
                    </Link>
                  </li>
                </ul>
              </div>
            </div>

            <div className="border-t border-gray-800 mt-6 sm:mt-8 pt-6 sm:pt-8 flex flex-col sm:flex-row justify-between items-center gap-2 sm:gap-0">
              <p className="text-xs text-gray-400 text-center sm:text-left">
                &copy; 2025 Xcrowme Advisory Technology All rights reserved.
              </p>
              <p className="text-xs text-gray-400 text-center sm:text-right">
                Made with ❤️ for meaningful connections
              </p>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
