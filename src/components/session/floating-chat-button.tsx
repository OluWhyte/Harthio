/**
 * Floating Chat Button
 * Shows unread message count and provides quick access to chat
 * Styled like modern messaging apps (WhatsApp, Telegram, etc.)
 */

"use client";

import React from 'react';
import { MessageSquare, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface FloatingChatButtonProps {
  unreadCount: number;
  isOpen: boolean;
  onClick: () => void;
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  size?: 'sm' | 'md' | 'lg';
  accentColor?: string;
  className?: string;
  disabled?: boolean;
  showTooltip?: boolean;
}

export function FloatingChatButton({
  unreadCount,
  isOpen,
  onClick,
  position = 'bottom-right',
  size = 'md',
  accentColor = 'blue',
  className,
  disabled = false,
  showTooltip = true
}: FloatingChatButtonProps) {
  const getPositionClasses = () => {
    switch (position) {
      case 'bottom-right':
        return 'bottom-4 right-4 sm:bottom-6 sm:right-6';
      case 'bottom-left':
        return 'bottom-4 left-4 sm:bottom-6 sm:left-6';
      case 'top-right':
        return 'top-4 right-4 sm:top-6 sm:right-6';
      case 'top-left':
        return 'top-4 left-4 sm:top-6 sm:left-6';
      default:
        return 'bottom-4 right-4 sm:bottom-6 sm:right-6';
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'w-12 h-12';
      case 'md':
        return 'w-14 h-14 sm:w-16 sm:h-16';
      case 'lg':
        return 'w-16 h-16 sm:w-20 sm:h-20';
      default:
        return 'w-14 h-14 sm:w-16 sm:h-16';
    }
  };

  const getIconSize = () => {
    switch (size) {
      case 'sm':
        return 'w-5 h-5';
      case 'md':
        return 'w-6 h-6 sm:w-7 sm:h-7';
      case 'lg':
        return 'w-7 h-7 sm:w-8 sm:h-8';
      default:
        return 'w-6 h-6 sm:w-7 sm:h-7';
    }
  };

  const buttonContent = (
    <Button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        // Base styles
        "fixed z-50 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 active:scale-95",
        // Position
        getPositionClasses(),
        // Size
        getSizeClasses(),
        // Colors - use company branding
        isOpen 
          ? "bg-gray-600 hover:bg-gray-700 text-white" 
          : "bg-primary hover:bg-primary/90 text-white",
        // Animation
        "animate-in fade-in slide-in-from-bottom-2 duration-300",
        // Disabled state
        disabled && "opacity-50 cursor-not-allowed hover:scale-100",
        // Custom classes
        className
      )}
    >
      {/* Icon */}
      <div className="relative">
        {isOpen ? (
          <X className={getIconSize()} />
        ) : (
          <MessageSquare className={getIconSize()} />
        )}
        
        {/* Unread badge */}
        {unreadCount > 0 && !isOpen && (
          <Badge 
            className={cn(
              "absolute -top-2 -right-2 min-w-[1.25rem] h-5 p-0 flex items-center justify-center text-xs font-bold",
              "bg-red-500 text-white border-2 border-white",
              "animate-pulse"
            )}
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </Badge>
        )}
        
        {/* Connection status indicator */}
        <div className={cn(
          "absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white",
          disabled ? "bg-gray-400" : "bg-green-400"
        )} />
      </div>
    </Button>
  );

  if (!showTooltip) {
    return buttonContent;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {buttonContent}
        </TooltipTrigger>
        <TooltipContent side="left" className="mr-2">
          <div className="text-center">
            <p className="font-medium">
              {isOpen ? 'Close chat' : 'Open chat'}
            </p>
            {unreadCount > 0 && !isOpen && (
              <p className="text-xs text-gray-300">
                {unreadCount} unread message{unreadCount !== 1 ? 's' : ''}
              </p>
            )}
            {disabled && (
              <p className="text-xs text-red-300">
                Chat unavailable
              </p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// Preset configurations for common use cases
export const ChatButtonPresets = {
  // Modern messaging app style (WhatsApp, Telegram)
  modern: {
    size: 'md' as const,
    accentColor: 'green',
    position: 'bottom-right' as const,
    showTooltip: true
  },
  
  // Professional/business style (Slack, Teams)
  professional: {
    size: 'md' as const,
    accentColor: 'blue',
    position: 'bottom-right' as const,
    showTooltip: true
  },
  
  // Minimal style
  minimal: {
    size: 'sm' as const,
    accentColor: 'gray',
    position: 'bottom-right' as const,
    showTooltip: false
  },
  
  // Large/accessible style
  accessible: {
    size: 'lg' as const,
    accentColor: 'blue',
    position: 'bottom-right' as const,
    showTooltip: true
  }
};

// Usage example:
// <FloatingChatButton 
//   {...ChatButtonPresets.modern}
//   unreadCount={5}
//   isOpen={false}
//   onClick={() => setShowChat(true)}
// />