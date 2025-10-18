'use client';

import { useState, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FloatingRefreshArrowProps {
  show: boolean;
  onRefresh: () => void;
  className?: string;
}

export function FloatingRefreshArrow({ show, onRefresh, className }: FloatingRefreshArrowProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (show) {
      setIsVisible(true);
      // Small delay to trigger animation
      setTimeout(() => setIsAnimating(true), 50);
    } else {
      setIsAnimating(false);
      // Wait for animation to complete before hiding
      setTimeout(() => setIsVisible(false), 300);
    }
  }, [show]);

  const handleClick = () => {
    onRefresh();
    setIsAnimating(false);
    setTimeout(() => setIsVisible(false), 300);
  };

  if (!isVisible) return null;

  return (
    <div
      className={cn(
        'fixed top-0 left-1/2 transform -translate-x-1/2 z-50 transition-all duration-300 ease-out cursor-pointer',
        isAnimating ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0',
        className
      )}
      onClick={handleClick}
    >
      <div className="bg-gradient-to-r from-rose-500 to-teal-500 text-white px-4 py-2 rounded-b-lg shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-2 group hover:scale-105">
        <ChevronDown className="w-4 h-4 animate-bounce" />
        <span className="text-sm font-medium">New sessions available</span>
        <ChevronDown className="w-4 h-4 animate-bounce" style={{ animationDelay: '0.1s' }} />
      </div>
      
      {/* Subtle glow effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-rose-500/30 to-teal-500/30 rounded-b-lg blur-md -z-10 group-hover:blur-lg transition-all duration-200" />
      
      {/* Pulse effect for attention */}
      <div className="absolute inset-0 bg-gradient-to-r from-rose-500/10 to-teal-500/10 rounded-b-lg animate-pulse -z-20" />
    </div>
  );
}