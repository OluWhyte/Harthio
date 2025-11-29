"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Users,
  Calendar,
  Heart,
  Shield,
  Sparkles,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

const features = [
  {
    icon: Users,
    title: "AI-Powered Matching",
    description:
      "Our intelligent system connects you with people who truly understand your situation and share your interests.",
    color: "from-rose-500 to-pink-500",
    bgGradient: "from-rose-50 to-pink-50",
  },
  {
    icon: Calendar,
    title: "Flexible Scheduling",
    description:
      "Schedule sessions at times that work for you. No pressure, no rush—just meaningful conversations when you're ready.",
    color: "from-teal-500 to-cyan-500",
    bgGradient: "from-teal-50 to-cyan-50",
  },
  {
    icon: Heart,
    title: "Safe Space Guarantee",
    description:
      "Every conversation is moderated and protected. Share openly in an environment built for empathy and understanding.",
    color: "from-purple-500 to-indigo-500",
    bgGradient: "from-purple-50 to-indigo-50",
  },
  {
    icon: Shield,
    title: "Privacy First",
    description:
      "Your conversations are private and secure. We never share your data, and you control what you reveal.",
    color: "from-blue-500 to-indigo-500",
    bgGradient: "from-blue-50 to-indigo-50",
  },
  {
    icon: Sparkles,
    title: "Real-Time Connection",
    description:
      "High-quality video and voice calls with instant messaging. Feel the connection, not the technology.",
    color: "from-amber-500 to-orange-500",
    bgGradient: "from-amber-50 to-orange-50",
  },
  {
    icon: TrendingUp,
    title: "Track Your Progress",
    description:
      "Monitor your recovery journey with built-in tracking tools. Celebrate milestones and see how far you've come.",
    color: "from-emerald-500 to-green-500",
    bgGradient: "from-emerald-50 to-green-50",
  },
];

export function FeatureRevealCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  useEffect(() => {
    if (!isAutoPlaying) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % features.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [isAutoPlaying]);

  const goToNext = () => {
    setIsAutoPlaying(false);
    setCurrentIndex((prev) => (prev + 1) % features.length);
  };

  const goToPrevious = () => {
    setIsAutoPlaying(false);
    setCurrentIndex((prev) => (prev - 1 + features.length) % features.length);
  };

  const goToSlide = (index: number) => {
    setIsAutoPlaying(false);
    setCurrentIndex(index);
  };

  const currentFeature = features[currentIndex];
  const Icon = currentFeature.icon;

  return (
    <section className="w-full py-12 sm:py-16 md:py-20 lg:py-24 bg-white relative overflow-hidden">
      {/* Animated background gradient */}
      <div
        className={`absolute inset-0 bg-gradient-to-br ${currentFeature.bgGradient} transition-all duration-1000 ease-in-out opacity-30`}
      />

      <div className="container px-4 sm:px-6 md:px-8 relative z-10">
        <div className="text-center mb-8 sm:mb-12">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4">
            Everything You Need to Connect
          </h2>
          <p className="text-base sm:text-lg md:text-xl text-gray-600">
            Powerful features designed for meaningful conversations
          </p>
        </div>

        {/* Main Feature Card */}
        <div className="max-w-4xl mx-auto mb-8">
          <Card className="relative overflow-hidden">
            {/* Animated gradient background */}
            <div
              className={`absolute inset-0 bg-gradient-to-br ${currentFeature.bgGradient} opacity-50 transition-all duration-1000`}
            />

            <div className="relative p-8 sm:p-12 md:p-16">
              <div className="flex flex-col items-center text-center">
                {/* Animated Icon */}
                <div
                  className={`w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-br ${currentFeature.color} flex items-center justify-center mb-6 animate-pulse-slow shadow-lg`}
                  key={currentIndex}
                >
                  <Icon className="h-10 w-10 sm:h-12 sm:w-12 text-white" />
                </div>

                {/* Feature Content */}
                <div
                  className="space-y-4 animate-fade-in"
                  key={`content-${currentIndex}`}
                >
                  <h3
                    className={`text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r ${currentFeature.color} bg-clip-text text-transparent`}
                  >
                    {currentFeature.title}
                  </h3>
                  <p className="text-base sm:text-lg md:text-xl text-gray-700 max-w-2xl">
                    {currentFeature.description}
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Navigation Controls */}
        <div className="flex items-center justify-center gap-4 mb-6">
          <Button
            variant="outline"
            size="icon"
            onClick={goToPrevious}
            className="rounded-full hover:scale-110 transition-transform"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>

          {/* Dots Indicator */}
          <div className="flex gap-2">
            {features.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`h-2 rounded-full transition-all duration-300 ${
                  index === currentIndex
                    ? "w-8 bg-primary"
                    : "w-2 bg-gray-300 hover:bg-gray-400"
                }`}
                aria-label={`Go to feature ${index + 1}`}
              />
            ))}
          </div>

          <Button
            variant="outline"
            size="icon"
            onClick={goToNext}
            className="rounded-full hover:scale-110 transition-transform"
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>

        {/* Feature Grid Preview */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 max-w-5xl mx-auto">
          {features.map((feature, index) => {
            const FeatureIcon = feature.icon;
            return (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`p-4 rounded-lg transition-all duration-300 ${
                  index === currentIndex
                    ? `bg-gradient-to-br ${feature.bgGradient} scale-105 shadow-lg`
                    : "bg-gray-50 hover:bg-gray-100 hover:scale-105"
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-full bg-gradient-to-br ${feature.color} flex items-center justify-center mx-auto mb-2 ${
                    index === currentIndex ? "animate-pulse-slow" : ""
                  }`}
                >
                  <FeatureIcon className="h-5 w-5 text-white" />
                </div>
                <p
                  className={`text-xs font-medium ${
                    index === currentIndex ? "text-gray-900" : "text-gray-600"
                  }`}
                >
                  {feature.title.split(" ")[0]}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Floating particles effect */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 bg-primary/20 rounded-full animate-float"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${i * 0.5}s`,
              animationDuration: `${3 + Math.random() * 2}s`,
            }}
          />
        ))}
      </div>
    </section>
  );
}
