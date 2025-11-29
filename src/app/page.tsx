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

// Force dynamic rendering to avoid build issues
export const dynamic = "force-dynamic";

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
                    href="https://twitter.com/harthio_"
                    className="text-gray-400 hover:text-white transition-colors"
                    aria-label="Follow us on Twitter"
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
                  <Link
                    href="https://www.reddit.com/user/harthio/"
                    className="text-gray-400 hover:text-white transition-colors"
                    aria-label="Follow us on Reddit"
                  >
                    <svg
                      className="h-5 w-5"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z" />
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
                &copy; 2025 Stria Technologies All rights reserved.
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
