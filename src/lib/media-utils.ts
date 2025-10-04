// ============================================================================
// MEDIA UTILITIES
// ============================================================================
// Helper functions for handling media devices across different platforms
// Includes mobile-specific optimizations and fallbacks
// ============================================================================

export interface MediaConstraintsConfig {
  preferredWidth?: number;
  preferredHeight?: number;
  preferredFrameRate?: number;
  facingMode?: 'user' | 'environment';
}

export interface DeviceInfo {
  isMobile: boolean;
  isIOS: boolean;
  isAndroid: boolean;
  browser: string;
}

/**
 * Detect device and browser information
 */
export function getDeviceInfo(): DeviceInfo {
  const ua = navigator.userAgent;
  
  return {
    isMobile: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua),
    isIOS: /iPhone|iPad|iPod/i.test(ua),
    isAndroid: /Android/i.test(ua),
    browser: getBrowserName(ua)
  };
}

function getBrowserName(ua: string): string {
  if (ua.includes('Chrome')) return 'Chrome';
  if (ua.includes('Safari')) return 'Safari';
  if (ua.includes('Firefox')) return 'Firefox';
  if (ua.includes('Edge')) return 'Edge';
  return 'Unknown';
}

/**
 * Check if getUserMedia is available and HTTPS is being used
 */
export function checkMediaSupport(): { supported: boolean; error?: string } {
  // Check if getUserMedia is available
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    return {
      supported: false,
      error: 'Your browser does not support video calling. Please use a modern browser like Chrome, Firefox, or Safari.'
    };
  }

  // Check for HTTPS (required on mobile in production)
  // Allow HTTP for localhost and local network IPs (192.168.x.x, 172.x.x.x, 10.x.x.x) for development
  const deviceInfo = getDeviceInfo();
  const hostname = window.location.hostname;
  const isLocalNetwork = 
    hostname === 'localhost' || 
    hostname === '127.0.0.1' ||
    hostname.startsWith('192.168.') ||
    hostname.startsWith('172.') ||
    hostname.startsWith('10.');
  
  if (deviceInfo.isMobile && window.location.protocol !== 'https:' && !isLocalNetwork) {
    return {
      supported: false,
      error: 'Video calling requires a secure connection (HTTPS). Please access the site using https://.'
    };
  }

  return { supported: true };
}

/**
 * Get optimal media constraints based on device capabilities
 */
export function getMediaConstraints(config: MediaConstraintsConfig = {}): MediaStreamConstraints {
  const deviceInfo = getDeviceInfo();
  
  // Base constraints for all devices
  const baseAudioConstraints = {
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true,
  };

  // Mobile-optimized constraints
  if (deviceInfo.isMobile) {
    return {
      audio: {
        ...baseAudioConstraints,
        sampleRate: 16000, // Lower sample rate for mobile
      },
      video: {
        width: { ideal: config.preferredWidth || 640, max: 1280 },
        height: { ideal: config.preferredHeight || 480, max: 720 },
        frameRate: { ideal: config.preferredFrameRate || 15, max: 30 },
        facingMode: config.facingMode || 'user',
      }
    };
  }

  // Desktop constraints
  return {
    audio: {
      ...baseAudioConstraints,
      sampleRate: 48000,
    },
    video: {
      width: { ideal: config.preferredWidth || 1280 },
      height: { ideal: config.preferredHeight || 720 },
      frameRate: { ideal: config.preferredFrameRate || 30 },
    }
  };
}

/**
 * Progressive fallback strategy for getUserMedia
 * Tries multiple constraint configurations until one works
 */
export async function getUserMediaWithFallback(
  config: MediaConstraintsConfig = {}
): Promise<MediaStream> {
  const deviceInfo = getDeviceInfo();
  
  // Strategy 1: Try optimal constraints
  try {
    const constraints = getMediaConstraints(config);
    console.log('Attempting getUserMedia with optimal constraints:', constraints);
    return await navigator.mediaDevices.getUserMedia(constraints);
  } catch (error) {
    console.warn('Optimal constraints failed:', error);
  }

  // Strategy 2: Try basic constraints with facingMode (important for mobile)
  try {
    console.log('Attempting getUserMedia with basic constraints');
    return await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'user' },
      audio: true,
    });
  } catch (error) {
    console.warn('Basic constraints with facingMode failed:', error);
  }

  // Strategy 3: Try minimal constraints (just true/false)
  try {
    console.log('Attempting getUserMedia with minimal constraints');
    return await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    });
  } catch (error) {
    console.warn('Minimal constraints failed:', error);
  }

  // Strategy 4: Try very low resolution (for older devices)
  if (deviceInfo.isMobile) {
    try {
      console.log('Attempting getUserMedia with low resolution');
      return await navigator.mediaDevices.getUserMedia({
        video: { width: 320, height: 240 },
        audio: true,
      });
    } catch (error) {
      console.warn('Low resolution failed:', error);
    }
  }

  // Strategy 5: Audio only (last resort)
  try {
    console.log('Attempting getUserMedia with audio only');
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
    });
    console.warn('Only audio available - video not accessible');
    return stream;
  } catch (error) {
    console.error('All getUserMedia strategies failed:', error);
    throw error;
  }
}

/**
 * Get user-friendly error message based on error type
 */
export function getMediaErrorMessage(error: any): string {
  const deviceInfo = getDeviceInfo();
  const errorName = error?.name || '';

  switch (errorName) {
    case 'NotAllowedError':
    case 'PermissionDeniedError':
      if (deviceInfo.isIOS) {
        return 'Camera and microphone access was denied. Please go to Settings > Safari > Camera & Microphone and allow access, then refresh this page.';
      } else if (deviceInfo.isAndroid) {
        return 'Camera and microphone access was denied. Please tap the camera icon in your browser\'s address bar and allow permissions, then refresh this page.';
      } else {
        return 'Camera and microphone access was denied. Please click the camera icon in your browser\'s address bar and allow permissions, then refresh this page.';
      }

    case 'NotFoundError':
    case 'DevicesNotFoundError':
      if (deviceInfo.isMobile) {
        return 'No camera or microphone found. Please check that your device has a working camera and microphone, and that no other app is using them.';
      } else {
        return 'No camera or microphone found. Please check that your devices are properly connected and not being used by another application.';
      }

    case 'NotReadableError':
    case 'TrackStartError':
      if (deviceInfo.isMobile) {
        return 'Camera or microphone is being used by another app. Please close other apps that might be using your camera or microphone, then try again.';
      } else {
        return 'Camera or microphone is already in use. Please close other applications that might be using these devices, then try again.';
      }

    case 'OverconstrainedError':
    case 'ConstraintNotSatisfiedError':
      return 'Your device doesn\'t support the required video settings. Trying with basic settings...';

    case 'TypeError':
      return 'Browser configuration error. Please try refreshing the page or using a different browser.';

    case 'SecurityError':
      const hostname = window.location.hostname;
      const isLocalNetwork = 
        hostname === 'localhost' || 
        hostname === '127.0.0.1' ||
        hostname.startsWith('192.168.') ||
        hostname.startsWith('172.') ||
        hostname.startsWith('10.');
      
      if (window.location.protocol !== 'https:' && !isLocalNetwork) {
        return 'Video calling requires a secure connection. Please access this site using https://.';
      }
      return 'Security error: Camera and microphone access is blocked. Please check your browser settings.';

    default:
      if (deviceInfo.isMobile) {
        return 'Could not access camera and microphone. Please ensure you\'ve granted permissions and no other app is using them. Try refreshing the page.';
      } else {
        return 'Could not access camera and microphone. Please check your permissions and device settings, then refresh the page.';
      }
  }
}

/**
 * Check if media devices are available before requesting access
 */
export async function checkMediaDevicesAvailable(): Promise<{
  hasCamera: boolean;
  hasMicrophone: boolean;
  devices: MediaDeviceInfo[];
}> {
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    
    return {
      hasCamera: devices.some(device => device.kind === 'videoinput'),
      hasMicrophone: devices.some(device => device.kind === 'audioinput'),
      devices
    };
  } catch (error) {
    console.error('Failed to enumerate devices:', error);
    return {
      hasCamera: false,
      hasMicrophone: false,
      devices: []
    };
  }
}

/**
 * Request permissions with user-friendly prompts
 */
export async function requestMediaPermissions(): Promise<{
  granted: boolean;
  stream?: MediaStream;
  error?: string;
}> {
  // First check if devices are available
  const deviceCheck = await checkMediaDevicesAvailable();
  
  if (!deviceCheck.hasCamera && !deviceCheck.hasMicrophone) {
    return {
      granted: false,
      error: 'No camera or microphone found on your device.'
    };
  }

  // Try to get media stream
  try {
    const stream = await getUserMediaWithFallback();
    return {
      granted: true,
      stream
    };
  } catch (error) {
    return {
      granted: false,
      error: getMediaErrorMessage(error)
    };
  }
}
