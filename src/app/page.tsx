"use client";

import Link from "next/link";
import { Logo } from "@/components/common/logo";
import { StructuredData } from "@/components/seo/structured-data";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  ArrowRight,
  Heart,
  Users,
  Calendar,
  Star,
  CheckCircle,
  Mail,
} from "lucide-react";
import Image from "next/image";

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
        <header className="px-3 sm:px-4 lg:px-6 h-14 sm:h-16 flex items-center border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
          <Link
            href="/"
            className="flex items-center justify-center"
            prefetch={false}
          >
            <Logo />
          </Link>
          <nav className="ml-auto flex gap-2 sm:gap-4 lg:gap-6 items-center">
            <Button
              variant="ghost"
              asChild
              className="hidden lg:inline-flex text-sm"
            >
              <Link href="/features">Features</Link>
            </Button>
            <Button
              variant="ghost"
              asChild
              className="hidden lg:inline-flex text-sm"
            >
              <Link href="/pricing">Pricing</Link>
            </Button>
            <Button
              variant="ghost"
              asChild
              className="hidden md:inline-flex text-sm"
            >
              <Link href="/blog">Blog</Link>
            </Button>
            <Button variant="ghost" asChild className="text-sm px-2 sm:px-4">
              <Link href="/login">Log In</Link>
            </Button>
            <Button
              asChild
              className="bg-primary hover:bg-primary/90 text-sm px-3 sm:px-4"
              size="sm"
            >
              <Link href="/signup">
                <span className="hidden xs:inline">Join Free</span>
                <span className="xs:hidden">Join</span>
                <ArrowRight className="ml-1 sm:ml-2 h-3 w-3 sm:h-4 sm:w-4" />
              </Link>
            </Button>
          </nav>
        </header>

        <main className="flex-1">
          {/* Hero Section */}
          <section
            className="w-full py-8 sm:py-12 md:py-16 lg:py-24 xl:py-32 bg-background"
            aria-label="Hero section"
          >
            <div className="container px-4 sm:px-6 md:px-8">
              <div className="grid gap-6 sm:gap-8 lg:grid-cols-2 lg:gap-12 xl:gap-16 items-center">
                <div className="flex flex-col justify-center space-y-4 sm:space-y-6 order-2 lg:order-1">
                  <div className="space-y-3 sm:space-y-4">
                    <div className="inline-block px-3 py-1 text-xs sm:text-sm bg-primary/10 text-primary rounded-full font-medium">
                      ✨ Never feel alone with your struggle again
                    </div>
                    <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl 2xl:text-7xl font-bold tracking-tight bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent leading-tight">
                      Find Someone Who Truly Gets It
                    </h1>
                    <p className="text-base sm:text-lg md:text-xl text-gray-600 leading-relaxed max-w-[600px]">
                      <strong>
                        Finally, someone who speaks your language.
                      </strong>{" "}
                      Schedule judgment-free conversations about business
                      stress, life changes, or passion projects—with perfect
                      matches who&apos;ve walked your path, not random
                      strangers.
                    </p>
                    <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-500">
                      <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-green-500 flex-shrink-0" />
                      <span>
                        Get connected to listeners for free emotional support.
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                    <Button
                      size="lg"
                      className="bg-primary hover:bg-primary/90 text-base sm:text-lg px-6 sm:px-8 py-4 sm:py-6 w-full sm:w-auto"
                    >
                      <Link
                        href="/signup"
                        className="flex items-center justify-center"
                      >
                        Join Free
                        <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
                      </Link>
                    </Button>
                  </div>
                </div>

                {/* Hero Image */}
                <div className="relative order-1 lg:order-2">
                  <div className="relative rounded-xl sm:rounded-2xl overflow-hidden shadow-xl sm:shadow-2xl h-[320px] sm:h-[380px] md:h-[420px] lg:h-[480px]">
                    <Image
                      src="https://images.unsplash.com/photo-1759593047536-5258c3c6a527?q=80&w=387&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D=80"
                      fill
                      alt="Two people having a meaningful conversation over video call"
                      className="object-cover"
                      style={{ objectPosition: "50% 25%" }}
                      priority
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                  </div>
                  {/* Floating testimonial */}
                  <div className="absolute -bottom-3 sm:-bottom-6 -left-3 sm:-left-6 bg-white rounded-lg sm:rounded-xl shadow-lg p-3 sm:p-4 max-w-[280px] sm:max-w-xs hidden sm:block">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="flex">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className="h-3 w-3 sm:h-4 sm:w-4 fill-yellow-400 text-yellow-400"
                          />
                        ))}
                      </div>
                    </div>
                    <p className="text-xs sm:text-sm text-gray-600 leading-tight">
                      &quot;If speaking kindly to plants can make them grow,
                      imagine what speaking kindly to humans can can do.&quot;
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Value Proposition Grid */}
          <section className="w-full py-12 sm:py-16 md:py-20 lg:py-24">
            <div className="container px-4 sm:px-6 md:px-8">
              <div className="text-center mb-8 sm:mb-12">
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4">
                  Why Harthio Heals Loneliness
                </h2>
                <p className="text-base sm:text-lg md:text-xl text-gray-600 max-w-2xl mx-auto px-4">
                  We understand the pain of feeling isolated in your struggles.
                  Here&apos;s how we create genuine connections.
                </p>
              </div>

              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                <Card className="border-2 hover:border-primary/20 transition-colors sm:col-span-2 lg:col-span-1">
                  <CardContent className="p-4 sm:p-6 text-center">
                    <div className="w-12 h-12 sm:w-16 sm:h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                      <Users className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
                    </div>
                    <h3 className="text-lg sm:text-xl font-semibold mb-2">
                      Perfect Matches, Not Randoms
                    </h3>
                    <p className="text-sm sm:text-base text-gray-600 mb-3 sm:mb-4">
                      &quot;I need advice but don&apos;t know who to ask&quot;
                    </p>
                    <p className="text-xs sm:text-sm font-medium text-primary">
                      → Get matched with vetted mentors who&apos;ve been there
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-2 hover:border-accent/20 transition-colors">
                  <CardContent className="p-4 sm:p-6 text-center">
                    <div className="w-12 h-12 sm:w-16 sm:h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                      <Calendar className="h-6 w-6 sm:h-8 sm:w-8 text-accent" />
                    </div>
                    <h3 className="text-lg sm:text-xl font-semibold mb-2">
                      Scheduled, Intentional Talks
                    </h3>
                    <p className="text-sm sm:text-base text-gray-600 mb-3 sm:mb-4">
                      &quot;Tired of flaky Zoom strangers&quot;
                    </p>
                    <p className="text-xs sm:text-sm font-medium text-accent">
                      → Scheduled, intention-based calls that actually happen
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-2 hover:border-primary/20 transition-colors">
                  <CardContent className="p-4 sm:p-6 text-center">
                    <div className="w-12 h-12 sm:w-16 sm:h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                      <Heart className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
                    </div>
                    <h3 className="text-lg sm:text-xl font-semibold mb-2">
                      Safe Space to Be Vulnerable
                    </h3>
                    <p className="text-sm sm:text-base text-gray-600 mb-3 sm:mb-4">
                      &quot;Can&apos;t afford therapy but need to vent&quot;
                    </p>
                    <p className="text-xs sm:text-sm font-medium text-primary">
                      → Free listener volunteers who truly care
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </section>

          {/* How It Works */}
          <section className="w-full py-12 sm:py-16 md:py-20 lg:py-24 bg-gray-50">
            <div className="container px-4 sm:px-6 md:px-8">
              <div className="text-center mb-8 sm:mb-12">
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4">
                  How It Works
                </h2>
                <p className="text-base sm:text-lg md:text-xl text-gray-600">
                  Three simple steps to meaningful connection
                </p>
              </div>

              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 max-w-5xl mx-auto">
                <div className="text-center sm:col-span-2 lg:col-span-1">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 bg-primary rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4 text-white text-lg sm:text-2xl font-bold">
                    1
                  </div>
                  <h3 className="text-lg sm:text-xl font-semibold mb-2">
                    Create or Find a Session
                  </h3>
                  <p className="text-sm sm:text-base text-gray-600 px-2">
                    Schedule your own conversation about what&apos;s on your
                    mind, or browse existing sessions to find someone facing
                    similar challenges.
                  </p>
                </div>

                <div className="text-center">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 bg-accent rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4 text-white text-lg sm:text-2xl font-bold">
                    2
                  </div>
                  <h3 className="text-lg sm:text-xl font-semibold mb-2">
                    Get Matched & Approved
                  </h3>
                  <p className="text-sm sm:text-base text-gray-600 px-2">
                    Request to join sessions that resonate with you, or approve
                    others who want to join yours. Connect with the right
                    person.
                  </p>
                </div>

                <div className="text-center">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 bg-primary rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4 text-white text-lg sm:text-2xl font-bold">
                    3
                  </div>
                  <h3 className="text-lg sm:text-xl font-semibold mb-2">
                    Have Your Conversation
                  </h3>
                  <p className="text-sm sm:text-base text-gray-600 px-2">
                    Meet via video call at your scheduled time. Share, listen,
                    and support each other in a safe space.
                  </p>
                </div>
              </div>

              <div className="text-center mt-8 sm:mt-12">
                <Button
                  size="lg"
                  className="bg-primary hover:bg-primary/90 text-base sm:text-lg px-6 sm:px-8 py-4 sm:py-6 w-full sm:w-auto"
                >
                  <Link
                    href="/signup"
                    className="flex items-center justify-center"
                  >
                    Start Connecting
                    <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
                  </Link>
                </Button>
              </div>
            </div>
          </section>

          {/* Social Proof */}
          <section className="w-full py-12 sm:py-16 md:py-20 lg:py-24">
            <div className="container px-4 sm:px-6 md:px-8">
              <div className="text-center mb-8 sm:mb-12">
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4">
                  Stories of Connection
                </h2>
                <p className="text-base sm:text-lg md:text-xl text-gray-600">
                  Real people finding real solutions to loneliness
                </p>
              </div>

              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
                <Card className="p-4 sm:p-6">
                  <div className="flex items-center gap-3 sm:gap-4 mb-3 sm:mb-4">
                    <Image
                      src="https://images.unsplash.com/photo-1759855698735-2b0fe3d25990?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
                      width="40"
                      height="40"
                      alt="Marcus T."
                      className="rounded-full w-10 h-10 sm:w-12 sm:h-12 object-cover"
                    />
                    <div>
                      <p className="font-semibold text-sm sm:text-base">
                        Bode Uche
                      </p>
                      <p className="text-xs sm:text-sm text-gray-500">
                        Single Dad, 42
                      </p>
                    </div>
                  </div>
                  <p className="text-sm sm:text-base text-gray-600 italic leading-relaxed">
                    &quot;After my divorce, I found someone who truly understood
                    my situation and put me through what to do and this fix my
                    life as a black divorcee and single dad living in the
                    UK.&quot;
                  </p>
                </Card>

                <Card className="p-4 sm:p-6">
                  <div className="flex items-center gap-3 sm:gap-4 mb-3 sm:mb-4">
                    <Image
                      src="https://images.unsplash.com/photo-1530785602389-07594beb8b73?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8YWZyaWNhbiUyMHdvbWFufGVufDB8fDB8fHww=80"
                      width="40"
                      height="40"
                      alt="Angela Haruna"
                      className="rounded-full w-10 h-10 sm:w-12 sm:h-12 object-cover"
                    />
                    <div>
                      <p className="font-semibold text-sm sm:text-base">
                        Angela Haruna
                      </p>
                      <p className="text-xs sm:text-sm text-gray-500">
                        Entrepreneur, 29
                      </p>
                    </div>
                  </div>
                  <p className="text-sm sm:text-base text-gray-600 italic leading-relaxed">
                    &quot;Building a startup felt impossibly lonely. I scheduled
                    a session about founder burnout and connected with someone
                    who had built and sold two companies. That conversation
                    saved my sanity.&quot;
                  </p>
                </Card>

                <Card className="p-4 sm:p-6">
                  <div className="flex items-center gap-3 sm:gap-4 mb-3 sm:mb-4">
                    <Image
                      src="https://images.unsplash.com/photo-1573497019418-b400bb3ab074?q=80&w=387&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D=80"
                      width="40"
                      height="40"
                      alt="Kemi Badmus"
                      className="rounded-full w-10 h-10 sm:w-12 sm:h-12 object-cover"
                    />
                    <div>
                      <p className="font-semibold text-sm sm:text-base">
                        Kemi Badmus
                      </p>
                      <p className="text-xs sm:text-sm text-gray-500">
                        Working Mom, 34
                      </p>
                    </div>
                  </div>
                  <p className="text-sm sm:text-base text-gray-600 italic leading-relaxed">
                    &quot;Balancing motherhood and my career felt overwhelming.
                    I connected with another working mom who shared practical
                    strategies that transformed how I manage both. I finally
                    feel like I can breathe again.&quot;
                  </p>
                </Card>

                <Card className="p-4 sm:p-6">
                  <div className="flex items-center gap-3 sm:gap-4 mb-3 sm:mb-4">
                    <Image
                      src="https://images.unsplash.com/photo-1533108344127-a586d2b02479?q=80&w=388&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D=80"
                      width="40"
                      height="40"
                      alt="David L."
                      className="rounded-full w-10 h-10 sm:w-12 sm:h-12 object-cover"
                    />
                    <div>
                      <p className="font-semibold text-sm sm:text-base">
                        Mohamad Kareem
                      </p>
                      <p className="text-xs sm:text-sm text-gray-500">
                        Career Changer, 35
                      </p>
                    </div>
                  </div>
                  <p className="text-sm sm:text-base text-gray-600 italic leading-relaxed">
                    &quot;Switching careers at 35 felt impossible. I posted
                    about my fears and connected with someone who had made the
                    same transition. They showed me it wasn&apos;t crazy—it was
                    possible.&quot;
                  </p>
                </Card>

                <Card className="p-4 sm:p-6">
                  <div className="flex items-center gap-3 sm:gap-4 mb-3 sm:mb-4">
                    <Image
                      src="https://images.unsplash.com/photo-1759852692971-a2abc6799cbd?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
                      width="40"
                      height="40"
                      alt="Sarah M."
                      className="rounded-full w-10 h-10 sm:w-12 sm:h-12 object-cover"
                    />
                    <div>
                      <p className="font-semibold text-sm sm:text-base">
                        Opeyemi Adebayo
                      </p>
                      <p className="text-xs sm:text-sm text-gray-500">
                        University Student, 21
                      </p>
                    </div>
                  </div>
                  <p className="text-sm sm:text-base text-gray-600 italic leading-relaxed">
                    &quot;College stress was eating me alive. I found someone
                    who had just graduated and understood the pressure of
                    finals, job hunting, and student loans. They helped me see
                    that I wasn&apos;t alone in feeling overwhelmed.&quot;
                  </p>
                </Card>

                <Card className="p-4 sm:p-6">
                  <div className="flex items-center gap-3 sm:gap-4 mb-3 sm:mb-4">
                    <Image
                      src="https://images.unsplash.com/photo-1616805765352-beedbad46b2a?q=80&w=387&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D=80"
                      width="40"
                      height="40"
                      alt="James R."
                      className="rounded-full w-10 h-10 sm:w-12 sm:h-12 object-cover"
                    />
                    <div>
                      <p className="font-semibold text-sm sm:text-base">
                        James Emeka
                      </p>
                      <p className="text-xs sm:text-sm text-gray-500">
                        Office Worker, 35
                      </p>
                    </div>
                  </div>
                  <p className="text-sm sm:text-base text-gray-600 italic leading-relaxed">
                    &quot;Despite having several social media accounts, I still
                    felt lonely. Sometimes you just need someone to listen
                    without judgment. I was having a rough week and found
                    someone who let me vent about work stress. No advice
                    needed—just someone who truly heard me.&quot;
                  </p>
                </Card>
              </div>
            </div>
          </section>

          {/* Final CTA */}
          <section className="w-full py-12 sm:py-16 md:py-20 lg:py-24 bg-gradient-to-r from-primary via-accent to-primary text-white">
            <div className="container px-4 sm:px-6 md:px-8 text-center">
              <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4 sm:mb-6 leading-tight">
                There&apos;s Always Someone Who Gets It
              </h2>
              <p className="text-base sm:text-lg md:text-xl mb-6 sm:mb-8 max-w-2xl mx-auto opacity-90 px-4">
                Your perfect conversation partner is waiting. Start your first
                meaningful connection today.
              </p>
              <Button
                size="lg"
                className="bg-white text-primary hover:bg-gray-100 text-base sm:text-lg px-6 sm:px-8 py-4 sm:py-6 mb-3 sm:mb-4 w-full sm:w-auto"
              >
                <Link
                  href="/signup"
                  className="flex items-center justify-center"
                >
                  Join Free
                  <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
                </Link>
              </Button>
              <p className="text-xs sm:text-sm opacity-75">
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
                    href="https://instagram.com/harthio"
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
