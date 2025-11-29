"use client";

import { ReactNode } from "react";
import { ScrollReveal } from "./ScrollReveal";
import Image from "next/image";

interface StickyFeatureProps {
    title: string;
    description: string;
    features: string[];
    imageSrc: string;
    imageAlt: string;
    ctaText: string;
    ctaHref: string;
    layout?: "image-left" | "image-right";
    icon?: ReactNode;
}

/**
 * StickyFeature - Antigravity-style sticky scroll section
 * 
 * Image stays sticky while content reveals on scroll.
 * Alternating layouts create visual rhythm.
 */
export function StickyFeature({
    title,
    description,
    features,
    imageSrc,
    imageAlt,
    ctaText,
    ctaHref,
    layout = "image-left",
    icon,
}: StickyFeatureProps) {
    const isImageLeft = layout === "image-left";

    return (
        <section className="min-h-screen flex items-center py-20 md:py-32 relative overflow-hidden">
            {/* Subtle gradient background */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 pointer-events-none" />

            <div className="container px-4 sm:px-6 md:px-8 relative z-10">
                <div className={`grid lg:grid-cols-2 gap-12 lg:gap-16 items-center ${!isImageLeft ? "lg:grid-flow-dense" : ""}`}>
                    {/* Sticky Image */}
                    <div className={`${!isImageLeft ? "lg:col-start-2" : ""}`}>
                        <div className="sticky top-[20vh] h-[60vh] flex items-center">
                            <ScrollReveal direction={isImageLeft ? "left" : "right"} duration={0.8}>
                                <div className="relative rounded-apple-xl overflow-hidden shadow-apple-xl border border-gray-200/50 dark:border-gray-800/50 bg-white dark:bg-gray-900">
                                    {/* Gradient overlay for depth */}
                                    <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/10 pointer-events-none" />

                                    <Image
                                        src={imageSrc}
                                        alt={imageAlt}
                                        width={600}
                                        height={400}
                                        className="w-full h-auto object-cover"
                                    />
                                </div>
                            </ScrollReveal>
                        </div>
                    </div>

                    {/* Content */}
                    <div className={`space-y-6 ${!isImageLeft ? "lg:col-start-1 lg:row-start-1" : ""}`}>
                        <ScrollReveal delay={0.2}>
                            {/* Icon */}
                            {icon && (
                                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-primary to-accent shadow-lg mb-4">
                                    <div className="text-white">
                                        {icon}
                                    </div>
                                </div>
                            )}

                            {/* Title */}
                            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
                                {title}
                            </h2>
                        </ScrollReveal>

                        <ScrollReveal delay={0.3}>
                            <p className="text-lg md:text-xl text-gray-600 dark:text-gray-400 leading-relaxed">
                                {description}
                            </p>
                        </ScrollReveal>

                        {/* Features List */}
                        <div className="space-y-4">
                            {features.map((feature, index) => (
                                <ScrollReveal key={index} delay={0.4 + index * 0.1}>
                                    <div className="flex items-start gap-3 group">
                                        {/* Checkmark with brand gradient */}
                                        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center mt-0.5 transition-transform duration-apple ease-apple-spring group-hover:scale-110">
                                            <svg
                                                className="w-4 h-4 text-white"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                stroke="currentColor"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2.5}
                                                    d="M5 13l4 4L19 7"
                                                />
                                            </svg>
                                        </div>
                                        <p className="text-base md:text-lg text-gray-700 dark:text-gray-300">
                                            {feature}
                                        </p>
                                    </div>
                                </ScrollReveal>
                            ))}
                        </div>

                        {/* CTA Button */}
                        <ScrollReveal delay={0.7}>
                            <a
                                href={ctaHref}
                                className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-gradient-to-r from-primary to-accent text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-apple ease-apple-spring hover:scale-105 active:scale-95 group"
                            >
                                <span>{ctaText}</span>
                                <svg
                                    className="w-5 h-5 transition-transform duration-apple ease-apple-spring group-hover:translate-x-1"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M13 7l5 5m0 0l-5 5m5-5H6"
                                    />
                                </svg>
                            </a>
                        </ScrollReveal>
                    </div>
                </div>
            </div>
        </section>
    );
}
