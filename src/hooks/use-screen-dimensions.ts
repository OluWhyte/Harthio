'use client'

import { useState, useEffect } from 'react'

interface ScreenDimensions {
  width: number
  height: number
  availableWidth: number
  availableHeight: number
  isPortrait: boolean
  isLandscape: boolean
  deviceType: 'phone' | 'tablet' | 'desktop'
  buttonSize: number
  iconSize: number
  spacing: number
  padding: number
  fontSize: string
}

export function useScreenDimensions(): ScreenDimensions {
  const [dimensions, setDimensions] = useState<ScreenDimensions>({
    width: 0,
    height: 0,
    availableWidth: 0,
    availableHeight: 0,
    isPortrait: false,
    isLandscape: false,
    deviceType: 'desktop',
    buttonSize: 64,
    iconSize: 28,
    spacing: 16,
    padding: 24,
    fontSize: 'text-base'
  })

  useEffect(() => {
    const calculateDimensions = () => {
      const width = window.innerWidth
      const height = window.innerHeight
      const screenWidth = window.screen?.width || width
      const screenHeight = window.screen?.height || height
      
      // Calculate available space (accounting for browser UI)
      const availableWidth = width
      const availableHeight = height
      
      // Determine orientation
      const isPortrait = height > width
      const isLandscape = width > height
      
      // Determine device type based on actual screen size and pixel density
      let deviceType: 'phone' | 'tablet' | 'desktop' = 'desktop'
      
      // Use physical screen dimensions and pixel ratio for better detection
      const pixelRatio = window.devicePixelRatio || 1
      const physicalWidth = screenWidth * pixelRatio
      const physicalHeight = screenHeight * pixelRatio
      
      // Phone detection: smaller physical dimensions or very narrow width
      if (physicalWidth < 1200 || width < 500 || (width < 800 && height < 600)) {
        deviceType = 'phone'
      }
      // Tablet detection: medium physical dimensions
      else if (physicalWidth < 2000 || width < 1200 || (width < 1400 && height < 1000)) {
        deviceType = 'tablet'
      }
      // Desktop: everything else
      else {
        deviceType = 'desktop'
      }
      
      // Calculate sizes based on available space and device type
      let buttonSize: number
      let iconSize: number
      let spacing: number
      let padding: number
      let fontSize: string
      
      if (deviceType === 'phone') {
        // Phone: Scale based on available width
        const scale = Math.min(width / 375, height / 667) // Base on iPhone dimensions
        buttonSize = Math.max(48, Math.min(64, 48 * scale))
        iconSize = Math.max(20, Math.min(28, 20 * scale))
        spacing = Math.max(8, Math.min(16, 8 * scale))
        padding = Math.max(12, Math.min(20, 12 * scale))
        fontSize = width < 350 ? 'text-sm' : 'text-base'
      } else if (deviceType === 'tablet') {
        // Tablet: Scale based on available space
        const scale = Math.min(width / 768, height / 1024) // Base on iPad dimensions
        buttonSize = Math.max(56, Math.min(72, 56 * scale))
        iconSize = Math.max(24, Math.min(32, 24 * scale))
        spacing = Math.max(12, Math.min(20, 12 * scale))
        padding = Math.max(16, Math.min(24, 16 * scale))
        fontSize = 'text-base'
      } else {
        // Desktop: Standard sizes
        buttonSize = 64
        iconSize = 28
        spacing = 20
        padding = 24
        fontSize = 'text-lg'
      }
      
      setDimensions({
        width,
        height,
        availableWidth,
        availableHeight,
        isPortrait,
        isLandscape,
        deviceType,
        buttonSize: Math.round(buttonSize),
        iconSize: Math.round(iconSize),
        spacing: Math.round(spacing),
        padding: Math.round(padding),
        fontSize
      })
    }

    // Calculate on mount
    calculateDimensions()

    // Recalculate on resize and orientation change
    window.addEventListener('resize', calculateDimensions)
    window.addEventListener('orientationchange', () => {
      // Delay to allow browser to update dimensions
      setTimeout(calculateDimensions, 100)
    })

    return () => {
      window.removeEventListener('resize', calculateDimensions)
      window.removeEventListener('orientationchange', calculateDimensions)
    }
  }, [])

  return dimensions
}