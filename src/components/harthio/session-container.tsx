'use client'

import { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface SessionContainerProps {
  children: ReactNode
  className?: string
}

export function SessionContainer({ children, className }: SessionContainerProps) {
  return (
    <div 
      className={cn(
        // Full viewport container that fits exactly to all screens
        'fixed inset-0 w-full h-full',
        // Prevent any overflow or scrolling
        'overflow-hidden',
        // Ensure proper box sizing
        'box-border',
        // Dark background for video sessions
        'bg-black',
        // Ensure it's above other content
        'z-10',
        className
      )}
      style={{
        // Ensure it takes exactly the viewport dimensions
        width: '100vw',
        height: '100vh',
        maxWidth: '100vw',
        maxHeight: '100vh',
        // Prevent any margin/padding issues
        margin: 0,
        padding: 0,
      }}
    >
      {/* Inner container for content */}
      <div className="relative w-full h-full flex flex-col">
        {children}
      </div>
    </div>
  )
}