"use client";

import { useEffect, useRef, ReactNode, memo } from "react";
import { motion, useInView, useAnimation } from "framer-motion";

interface ScrollRevealProps {
    children: ReactNode;
    delay?: number;
    duration?: number;
    direction?: "up" | "down" | "left" | "right" | "none";
    className?: string;
    once?: boolean;
}

/**
 * ScrollReveal - Antigravity-style scroll-triggered reveal animation
 * 
 * Reveals content smoothly as it enters the viewport with customizable
 * direction, delay, and duration. Uses Intersection Observer for performance.
 * 
 * Optimized with React.memo to prevent unnecessary re-renders
 */
const ScrollRevealComponent = ({
    children,
    delay = 0,
    duration = 0.7,
    direction = "up",
    className = "",
    once = true,
}: ScrollRevealProps) => {
    const ref = useRef(null);
    const isInView = useInView(ref, { once, margin: "-100px" });
    const controls = useAnimation();

    useEffect(() => {
        if (isInView) {
            controls.start("visible");
        } else if (!once) {
            controls.start("hidden");
        }
    }, [isInView, controls, once]);

    // Direction-based initial positions
    const directions = {
        up: { y: 60, x: 0 },
        down: { y: -60, x: 0 },
        left: { y: 0, x: 60 },
        right: { y: 0, x: -60 },
        none: { y: 0, x: 0 },
    };

    const variants = {
        hidden: {
            opacity: 0,
            y: directions[direction].y,
            x: directions[direction].x,
            scale: 0.95,
        },
        visible: {
            opacity: 1,
            y: 0,
            x: 0,
            scale: 1,
            transition: {
                duration,
                delay,
                ease: [0.22, 1, 0.36, 1], // Antigravity easing curve
            },
        },
    };

    return (
        <motion.div
            ref={ref}
            initial="hidden"
            animate={controls}
            variants={variants as any}
            className={className}
        >
            {children}
        </motion.div>
    );
};

// Memoized export to prevent unnecessary re-renders
export const ScrollReveal = memo(ScrollRevealComponent);

/**
 * StaggeredReveal - Reveals children with staggered delays
 * Perfect for grids and lists
 * 
 * Optimized with React.memo
 */
interface StaggeredRevealProps {
    children: ReactNode[];
    staggerDelay?: number;
    className?: string;
}

const StaggeredRevealComponent = ({
    children,
    staggerDelay = 0.15,
    className = "",
}: StaggeredRevealProps) => {
    return (
        <div className={className}>
            {children.map((child, index) => (
                <ScrollReveal key={index} delay={index * staggerDelay}>
                    {child}
                </ScrollReveal>
            ))}
        </div>
    );
};

// Memoized export
export const StaggeredReveal = memo(StaggeredRevealComponent);
