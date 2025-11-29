"use client";

import { ReactNode } from "react";

interface BrandGradientProps {
    children?: ReactNode;
    className?: string;
    animated?: boolean;
    opacity?: number;
}

/**
 * BrandGradient - Animated Rose→Teal gradient background
 * 
 * Creates a premium, shifting gradient using only brand colors.
 * Perfect for hero sections and CTAs.
 */
export function BrandGradient({
    children,
    className = "",
    animated = true,
    opacity = 1,
}: BrandGradientProps) {
    return (
        <div className={`relative ${className}`}>
            {/* Animated gradient background */}
            <div
                className={`absolute inset-0 bg-gradient-to-br from-primary via-accent to-primary bg-[length:200%_200%] ${animated ? "animate-brand-gradient" : ""
                    }`}
                style={{ opacity }}
            />

            {/* Content */}
            {children && <div className="relative z-10">{children}</div>}
        </div>
    );
}

/**
 * BrandGradientText - Gradient text using brand colors
 */
export function BrandGradientText({
    children,
    className = "",
}: {
    children: ReactNode;
    className?: string;
}) {
    return (
        <span
            className={`bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent ${className}`}
        >
            {children}
        </span>
    );
}

/**
 * BrandGradientBorder - Gradient border using brand colors
 */
export function BrandGradientBorder({
    children,
    className = "",
    borderWidth = 2,
}: {
    children: ReactNode;
    className?: string;
    borderWidth?: number;
}) {
    return (
        <div className={`relative ${className}`}>
            {/* Gradient border */}
            <div
                className="absolute inset-0 rounded-apple-xl bg-gradient-to-r from-primary via-accent to-primary opacity-50"
                style={{ padding: `${borderWidth}px` }}
            >
                <div className="w-full h-full bg-white dark:bg-gray-900 rounded-apple-xl" />
            </div>

            {/* Content */}
            <div className="relative z-10">{children}</div>
        </div>
    );
}
