/**
 * Enhanced Button Component
 * Adaptive touch targets based on viewport and device constraints
 */

import React from 'react';
import { Button, ButtonProps } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useEnhancedViewport } from '@/lib/enhanced-viewport';

export interface EnhancedButtonProps extends ButtonProps {
  touchTarget?: 'auto' | 'compact' | 'medium' | 'large';
  safeArea?: boolean; // Avoid browser gesture zones
  haptic?: boolean; // Add haptic feedback on mobile
  pressAnimation?: boolean; // Visual press feedback
}

export const EnhancedButton = React.forwardRef<HTMLButtonElement, EnhancedButtonProps>(
  ({ 
    className, 
    touchTarget = 'auto',
    safeArea = false,
    haptic = true,
    pressAnimation = true,
    children,
    onClick,
    ...props 
  }, ref) => {
    const { touchTargetConfig, safeZones } = useEnhancedViewport();
    const [isPressed, setIsPressed] = React.useState(false);

    // Determine touch target size
    const targetSize = touchTarget === 'auto' ? touchTargetConfig.size : touchTarget;

    // Get size classes based on touch target configuration
    const getSizeClasses = () => {
      const minSize = touchTargetConfig.minSize;
      
      switch (targetSize) {
        case 'large':
          return {
            size: `min-w-[${Math.max(minSize, 56)}px] min-h-[${Math.max(minSize, 56)}px]`,
            padding: 'px-6 py-4',
            text: 'text-base',
            icon: 'w-6 h-6'
          };
        case 'medium':
          return {
            size: `min-w-[${Math.max(minSize, 48)}px] min-h-[${Math.max(minSize, 48)}px]`,
            padding: 'px-4 py-3',
            text: 'text-sm',
            icon: 'w-5 h-5'
          };
        case 'compact':
          return {
            size: `min-w-[${Math.max(minSize, 44)}px] min-h-[${Math.max(minSize, 44)}px]`,
            padding: 'px-3 py-2',
            text: 'text-sm',
            icon: 'w-4 h-4'
          };
        default:
          return {
            size: `min-w-[${minSize}px] min-h-[${minSize}px]`,
            padding: 'px-4 py-3',
            text: 'text-sm',
            icon: 'w-5 h-5'
          };
      }
    };

    const sizeClasses = getSizeClasses();

    // Safe area margins
    const safeAreaClasses = safeArea ? {
      marginTop: `${safeZones.top}px`,
      marginBottom: `${safeZones.bottom}px`,
      marginLeft: `${safeZones.left}px`,
      marginRight: `${safeZones.right}px`
    } : {};

    // Handle click with haptic feedback
    const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
      // Haptic feedback on mobile
      if (haptic && 'vibrate' in navigator && touchTargetConfig.size !== 'large') {
        navigator.vibrate(10); // Short vibration
      }

      // Press animation
      if (pressAnimation) {
        setIsPressed(true);
        setTimeout(() => setIsPressed(false), 150);
      }

      onClick?.(event);
    };

    // Touch event handlers for better mobile interaction
    const handleTouchStart = () => {
      if (pressAnimation) setIsPressed(true);
    };

    const handleTouchEnd = () => {
      if (pressAnimation) {
        setTimeout(() => setIsPressed(false), 100);
      }
    };

    return (
      <Button
        ref={ref}
        className={cn(
          // Base classes
          'touch-manipulation select-none',
          
          // Size classes
          sizeClasses.size,
          sizeClasses.padding,
          sizeClasses.text,
          
          // Press animation
          pressAnimation && 'transition-transform duration-75',
          pressAnimation && isPressed && 'scale-95',
          
          // Focus improvements for accessibility
          'focus-visible:ring-2 focus-visible:ring-offset-2',
          
          // Custom classes
          className
        )}
        style={{
          ...safeAreaClasses,
          // Ensure minimum touch target
          minWidth: `${touchTargetConfig.minSize}px`,
          minHeight: `${touchTargetConfig.minSize}px`,
        }}
        onClick={handleClick}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        {...props}
      >
        {children}
      </Button>
    );
  }
);

EnhancedButton.displayName = 'EnhancedButton';

/**
 * Circular button variant for media controls
 */
export interface CircularButtonProps extends EnhancedButtonProps {
  icon: React.ReactNode;
}

export const CircularButton = React.forwardRef<HTMLButtonElement, CircularButtonProps>(
  ({ icon, touchTarget = 'auto', className, ...props }, ref) => {
    const { touchTargetConfig } = useEnhancedViewport();
    
    // Determine size based on touch target
    const targetSize = touchTarget === 'auto' ? touchTargetConfig.size : touchTarget;
    
    const getCircularSize = () => {
      const minSize = touchTargetConfig.minSize;
      
      switch (targetSize) {
        case 'large':
          return Math.max(minSize, 64);
        case 'medium':
          return Math.max(minSize, 56);
        case 'compact':
          return Math.max(minSize, 48);
        default:
          return minSize;
      }
    };

    const size = getCircularSize();

    return (
      <EnhancedButton
        ref={ref}
        className={cn(
          'rounded-full p-0 flex items-center justify-center',
          className
        )}
        style={{
          width: `${size}px`,
          height: `${size}px`,
          minWidth: `${size}px`,
          minHeight: `${size}px`,
        }}
        touchTarget={touchTarget}
        {...props}
      >
        {icon}
      </EnhancedButton>
    );
  }
);

CircularButton.displayName = 'CircularButton';

/**
 * Button group with proper spacing
 */
export interface ButtonGroupProps {
  children: React.ReactNode;
  className?: string;
  orientation?: 'horizontal' | 'vertical';
}

export const ButtonGroup: React.FC<ButtonGroupProps> = ({ 
  children, 
  className,
  orientation = 'horizontal'
}) => {
  const { touchTargetConfig } = useEnhancedViewport();
  
  const spacing = touchTargetConfig.spacing;
  const gapClass = orientation === 'horizontal' ? `gap-[${spacing}px]` : `gap-[${spacing}px]`;
  const flexDirection = orientation === 'horizontal' ? 'flex-row' : 'flex-col';

  return (
    <div 
      className={cn(
        'flex items-center justify-center',
        flexDirection,
        gapClass,
        className
      )}
      style={{
        gap: `${spacing}px`
      }}
    >
      {children}
    </div>
  );
};