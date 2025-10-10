// Mobile detection and optimization utilities

export function isMobileDevice(): boolean {
  if (typeof window === 'undefined') return false;
  
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
}

export function isTouchDevice(): boolean {
  if (typeof window === 'undefined') return false;
  
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
}

export function getViewportSize() {
  if (typeof window === 'undefined') return { width: 0, height: 0 };
  
  return {
    width: window.innerWidth,
    height: window.innerHeight,
  };
}

export function isSlowConnection(): boolean {
  if (typeof navigator === 'undefined' || !('connection' in navigator)) {
    return false;
  }
  
  const connection = (navigator as any).connection;
  return connection && (
    connection.effectiveType === 'slow-2g' || 
    connection.effectiveType === '2g' ||
    connection.saveData === true
  );
}

// Optimize for mobile performance
export function getMobileOptimizedSettings() {
  const isMobile = isMobileDevice();
  const isSlowConn = isSlowConnection();
  
  return {
    // Reduce API call frequency on mobile
    apiCallInterval: isMobile ? 300000 : 60000, // 5 minutes vs 1 minute
    // Reduce real-time updates on slow connections
    realtimeUpdates: !isSlowConn,
    // Optimize image loading
    imageQuality: isMobile && isSlowConn ? 60 : 80,
    // Reduce animation complexity
    reduceAnimations: isMobile && isSlowConn,
  };
}