"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView, useScroll, useTransform } from "framer-motion";
import { Bot, Users, TrendingUp, ArrowRight, MessageCircle, Calendar, BarChart3, Sparkles } from "lucide-react";
import Link from "next/link";

/**
 * AntigravityFeatureShowcase - Premium feature presentation
 * Inspired by Antigravity's sequential reveal pattern
 */
export function HowHarthioHelps() {
    const containerRef = useRef<HTMLDivElement>(null);
    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start end", "end start"]
    });

    // Transform scroll progress to opacity for background
    const backgroundOpacity = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0, 1, 1, 0]);

    return (
        <div ref={containerRef} className="relative bg-white dark:bg-gray-950 overflow-hidden">
            {/* Animated background gradient */}
            <motion.div
                className="absolute inset-0 bg-gradient-to-br from-primary/5 via-accent/5 to-transparent pointer-events-none"
                style={{ opacity: backgroundOpacity }}
            />

            {/* Section Header */}
            <div className="container px-4 sm:px-6 md:px-8 py-20 md:py-32 text-center relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                >
                    <h2 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
                        <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
                            Three Ways
                        </span>
                        <br />
                        <span className="text-gray-900 dark:text-white">
                            Harthio Helps
                        </span>
                    </h2>
                    <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto leading-relaxed">
                        Whether you need instant support, human connection, or progress tracking—we've got you covered.
                    </p>
                </motion.div>
            </div>

            {/* Feature 1: AI Support - Antigravity Style */}
            <FeatureSection
                index={0}
                icon={<Bot className="w-12 h-12" />}
                title="AI Support Anytime"
                subtitle="Get instant help whenever you need it"
                description="Harthio AI is available 24/7 to provide evidence-based CBT tools, guidance, and crisis detection."
                features={[
                    { icon: MessageCircle, text: "Chat with AI therapist 24/7" },
                    { icon: Sparkles, text: "Evidence-based CBT techniques" },
                    { icon: MessageCircle, text: "Crisis detection and intervention" },
                    { icon: Sparkles, text: "Personalized coping strategies" },
                ]}
                ctaText="Try AI Chat"
                ctaHref="/harthio"
                gradient="from-primary to-accent"
            />

            {/* Feature 2: Real Conversations */}
            <FeatureSection
                index={1}
                icon={<Users className="w-12 h-12" />}
                title="Real Conversations"
                subtitle="Connect with people who truly understand"
                description="Schedule video calls and build genuine connections with others on the same journey."
                features={[
                    { icon: Calendar, text: "Browse sessions by topic" },
                    { icon: Users, text: "Create your own conversations" },
                    { icon: Calendar, text: "High-quality video/voice calls" },
                    { icon: Users, text: "Safe, moderated environment" },
                ]}
                ctaText="Browse Sessions"
                ctaHref="/sessions"
                gradient="from-accent to-primary"
            />

            {/* Feature 3: Track Progress */}
            <FeatureSection
                index={2}
                icon={<TrendingUp className="w-12 h-12" />}
                title="Track Your Journey"
                subtitle="Monitor your recovery and celebrate wins"
                description="Built-in tracking tools help you see your progress and celebrate every milestone."
                features={[
                    { icon: BarChart3, text: "Daily mood check-ins" },
                    { icon: TrendingUp, text: "Sobriety trackers with visual progress" },
                    { icon: BarChart3, text: "Milestone celebrations" },
                    { icon: TrendingUp, text: "Recovery pattern insights" },
                ]}
                ctaText="Start Tracking"
                ctaHref="/signup"
                gradient="from-primary to-accent"
            />

            {/* Bottom CTA */}
            <div className="container px-4 sm:px-6 md:px-8 py-32 md:py-40 relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                    className="max-w-4xl mx-auto text-center space-y-10"
                >
                    <h3 className="text-4xl sm:text-5xl md:text-6xl font-bold leading-tight">
                        <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
                            Ready to Start
                        </span>
                        <br />
                        <span className="text-gray-900 dark:text-white">
                            Your Journey?
                        </span>
                    </h3>
                    <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                        Join thousands who've found support, connection, and hope through Harthio.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
                        <Link
                            href="/signup"
                            className="group inline-flex items-center gap-3 px-10 py-5 rounded-full bg-primary text-white text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-500 ease-out hover:scale-105 active:scale-95"
                        >
                            <span>Join Free</span>
                            <ArrowRight className="w-5 h-5 transition-transform duration-500 ease-out group-hover:translate-x-2" />
                        </Link>
                        <Link
                            href="/harthio"
                            className="inline-flex items-center gap-3 px-10 py-5 rounded-full bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-lg font-semibold border-2 border-gray-200 dark:border-gray-800 hover:border-primary dark:hover:border-primary transition-all duration-500 ease-out hover:scale-105 active:scale-95"
                        >
                            <span>Try AI Chat</span>
                        </Link>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}

/**
 * FeatureSection - Individual feature with Antigravity-style reveal
 */
function FeatureSection({
    index,
    icon,
    title,
    subtitle,
    description,
    features,
    ctaText,
    ctaHref,
    gradient,
}: {
    index: number;
    icon: React.ReactNode;
    title: string;
    subtitle: string;
    description: string;
    features: Array<{ icon: any; text: string }>;
    ctaText: string;
    ctaHref: string;
    gradient: string;
}) {
    const ref = useRef<HTMLDivElement>(null);
    const isInView = useInView(ref, { once: true, margin: "-20%" });
    const [hasAnimated, setHasAnimated] = useState(false);

    // Determine solid color based on gradient
    const isPrimary = gradient.includes("primary");
    const solidColor = isPrimary ? "bg-primary" : "bg-accent";
    const textColor = isPrimary ? "text-primary" : "text-accent";

    useEffect(() => {
        if (isInView && !hasAnimated) {
            setHasAnimated(true);
        }
    }, [isInView, hasAnimated]);

    return (
        <div ref={ref} className="container px-4 sm:px-6 md:px-8 py-20 md:py-32 relative z-10">
            <div className="max-w-6xl mx-auto">
                <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
                    {/* Left: Content */}
                    <motion.div
                        initial={{ opacity: 0, x: -60 }}
                        animate={hasAnimated ? { opacity: 1, x: 0 } : {}}
                        transition={{ duration: 1, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
                        className="space-y-8"
                    >
                        {/* Icon - Solid color, no gradient */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={hasAnimated ? { opacity: 1, scale: 1 } : {}}
                            transition={{ duration: 0.8, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
                            className={`inline-flex w-20 h-20 rounded-2xl ${solidColor} items-center justify-center shadow-lg`}
                        >
                            <div className="text-white">{icon}</div>
                        </motion.div>

                        {/* Title */}
                        <div className="space-y-3">
                            <motion.h3
                                initial={{ opacity: 0, y: 20 }}
                                animate={hasAnimated ? { opacity: 1, y: 0 } : {}}
                                transition={{ duration: 0.8, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
                                className={`text-4xl sm:text-5xl md:text-6xl font-bold leading-tight ${textColor}`}
                            >
                                {title}
                            </motion.h3>
                            <motion.p
                                initial={{ opacity: 0, y: 20 }}
                                animate={hasAnimated ? { opacity: 1, y: 0 } : {}}
                                transition={{ duration: 0.8, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
                                className="text-xl md:text-2xl text-gray-600 dark:text-gray-400"
                            >
                                {subtitle}
                            </motion.p>
                        </div>

                        {/* Description */}
                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={hasAnimated ? { opacity: 1, y: 0 } : {}}
                            transition={{ duration: 0.8, delay: 0.6, ease: [0.22, 1, 0.36, 1] }}
                            className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed"
                        >
                            {description}
                        </motion.p>

                        {/* CTA - Solid color, no gradient */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={hasAnimated ? { opacity: 1, y: 0 } : {}}
                            transition={{ duration: 0.8, delay: 0.7, ease: [0.22, 1, 0.36, 1] }}
                        >
                            <Link
                                href={ctaHref}
                                className={`group inline-flex items-center gap-3 px-8 py-4 rounded-full ${solidColor} text-white text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-500 ease-out hover:scale-105 active:scale-95`}
                            >
                                <span>{ctaText}</span>
                                <ArrowRight className="w-5 h-5 transition-transform duration-500 ease-out group-hover:translate-x-2" />
                            </Link>
                        </motion.div>
                    </motion.div>

                    {/* Right: Feature List - Testimonial-style cards */}
                    <motion.div
                        initial={{ opacity: 0, x: 60 }}
                        animate={hasAnimated ? { opacity: 1, x: 0 } : {}}
                        transition={{ duration: 1, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
                        className="space-y-4"
                    >
                        {features.map((feature, idx) => {
                            const FeatureIcon = feature.icon;
                            return (
                                <motion.div
                                    key={idx}
                                    initial={{ opacity: 0, x: 40 }}
                                    animate={hasAnimated ? { opacity: 1, x: 0 } : {}}
                                    transition={{
                                        duration: 0.8,
                                        delay: 0.6 + idx * 0.1,
                                        ease: [0.22, 1, 0.36, 1],
                                    }}
                                    className="group p-4 sm:p-6 rounded-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5"
                                >
                                    <div className="flex items-start gap-4">
                                        {/* Icon - Solid color circle, no gradient */}
                                        <div className={`flex-shrink-0 w-10 h-10 rounded-full ${solidColor} flex items-center justify-center`}>
                                            <FeatureIcon className="w-5 h-5 text-white" />
                                        </div>
                                        <p className="text-base font-medium text-gray-900 dark:text-white pt-1.5">
                                            {feature.text}
                                        </p>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </motion.div>
                </div>
            </div>
        </div>
    );
}
