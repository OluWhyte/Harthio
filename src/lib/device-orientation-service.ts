/**
 * Device Orientation Service
 * Handles real-time device orientation detection and synchronization
 * Works with Daily.co, Agora, P2P WebRTC, and other video providers
 */

export interface DeviceVideoMetadata {
  // Video stream properties (from MediaStream)
  videoWidth: number;
  videoHeight: number;
  videoAspectRatio: number;
  
  // Device context
  deviceType: 'mobile' | 'tablet' | 'desktop';
  orientation: 'portrait' | 'landscape';
  screenWidth: number;
  screenHeight: number;
  screenAspectRatio: number;
  
  // Display preferences
  preferredDisplayMode: 'contain' | 'cover';
  timestamp: number;
}

export interface OrientationCallbacks {
  onOrientationChange: (metadata: DeviceVideoMetadata) => void;
  onRemoteOrientationChange: (remoteMetadata: DeviceVideoMetadata) => void;
}

export class DeviceOrientationService {
  private callbacks: OrientationCallbacks;
  private currentMetadata: DeviceVideoMetadata | null = null;
  private orientationChangeTimeout: NodeJS.Timeout | null = null;
  private isListening = false;

  constructor(callbacks: OrientationCallbacks) {
    this.callbacks = callbacks;
  }

  /**
   * Start listening for orientation changes
   */
  startListening(): void {
    if (this.isListening || typeof window === 'undefined') return;
    
    console.log('📱 Starting device orientation monitoring...');
    this.isListening = true;

    // Initial detection
    this.detectAndNotify();

    // Listen for orientation changes (mobile)
    window.addEventListener('orientationchange', this.handleOrientationChange);
    
    // Listen for resize events (desktop/tablet)
    window.addEventListener('resize', this.handleResize);
    
    // Listen for fullscreen changes
    document.addEventListener('fullscreenchange', this.handleFullscreenChange);
  }

  /**
   * Stop listening for orientation changes
   */
  stopListening(): void {
    if (!this.isListening) return;
    
    console.log('📱 Stopping device orientation monitoring...');
    this.isListening = false;

    window.removeEventListener('orientationchange', this.handleOrientationChange);
    window.removeEventListener('resize', this.handleResize);
    document.removeEventListener('fullscreenchange', this.handleFullscreenChange);
    
    if (this.orientationChangeTimeout) {
      clearTimeout(this.orientationChangeTimeout);
      this.orientationChangeTimeout = null;
    }
  }

  /**
   * Get current device metadata
   */
  getCurrentMetadata(): DeviceVideoMetadata | null {
    return this.currentMetadata;
  }

  /**
   * Update video stream metadata (called when video track changes)
   */
  updateVideoStreamMetadata(stream: MediaStream): void {
    const videoTrack = stream.getVideoTracks()[0];
    if (!videoTrack) return;

    const settings = videoTrack.getSettings();
    const videoWidth = settings.width || 0;
    const videoHeight = settings.height || 0;

    console.log('📹 Video stream metadata updated:', { videoWidth, videoHeight });
    
    // Trigger detection with new video info
    this.detectAndNotify(videoWidth, videoHeight);
  }

  /**
   * Handle remote orientation metadata
   */
  handleRemoteMetadata(remoteMetadata: DeviceVideoMetadata): void {
    console.log('📱 Remote device orientation received:', remoteMetadata);
    this.callbacks.onRemoteOrientationChange(remoteMetadata);
  }

  // Private methods

  private handleOrientationChange = (): void => {
    console.log('📱 Orientation change detected');
    this.debouncedDetection();
  };

  private handleResize = (): void => {
    console.log('📱 Window resize detected');
    this.debouncedDetection();
  };

  private handleFullscreenChange = (): void => {
    console.log('📱 Fullscreen change detected');
    this.debouncedDetection();
  };

  private debouncedDetection(): void {
    // Debounce rapid orientation changes
    if (this.orientationChangeTimeout) {
      clearTimeout(this.orientationChangeTimeout);
    }

    this.orientationChangeTimeout = setTimeout(() => {
      this.detectAndNotify();
    }, 150); // Wait for orientation to settle
  }

  private detectAndNotify(videoWidth?: number, videoHeight?: number): void {
    const metadata = this.detectDeviceMetadata(videoWidth, videoHeight);
    
    // Only notify if metadata actually changed
    if (!this.currentMetadata || this.hasMetadataChanged(this.currentMetadata, metadata)) {
      console.log('📱 Device metadata changed:', metadata);
      this.currentMetadata = metadata;
      this.callbacks.onOrientationChange(metadata);
    }
  }

  private detectDeviceMetadata(videoWidth?: number, videoHeight?: number): DeviceVideoMetadata {
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;
    const screenAspectRatio = screenWidth / screenHeight;
    
    // Detect device type based on screen size and user agent
    const deviceType = this.detectDeviceType(screenWidth);
    
    // Detect orientation
    const orientation = screenHeight > screenWidth ? 'portrait' : 'landscape';
    
    // Calculate video aspect ratio
    const videoAspectRatio = (videoWidth && videoHeight) ? videoWidth / videoHeight : screenAspectRatio;
    
    // Determine preferred display mode
    const preferredDisplayMode = this.getPreferredDisplayMode(deviceType, orientation);

    return {
      videoWidth: videoWidth || 0,
      videoHeight: videoHeight || 0,
      videoAspectRatio,
      deviceType,
      orientation,
      screenWidth,
      screenHeight,
      screenAspectRatio,
      preferredDisplayMode,
      timestamp: Date.now()
    };
  }

  private detectDeviceType(screenWidth: number): 'mobile' | 'tablet' | 'desktop' {
    // Enhanced device detection
    const userAgent = navigator.userAgent.toLowerCase();
    const isMobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
    
    if (isMobile) {
      return screenWidth < 768 ? 'mobile' : 'tablet';
    }
    
    // Desktop detection based on screen size
    if (screenWidth < 768) return 'mobile';
    if (screenWidth < 1024) return 'tablet';
    return 'desktop';
  }

  private getPreferredDisplayMode(deviceType: string, orientation: string): 'contain' | 'cover' {
    // Mobile portrait: prefer contain to show full video
    if (deviceType === 'mobile' && orientation === 'portrait') {
      return 'contain';
    }
    
    // Desktop/landscape: prefer cover to fill screen
    return 'cover';
  }

  private hasMetadataChanged(old: DeviceVideoMetadata, current: DeviceVideoMetadata): boolean {
    return (
      old.orientation !== current.orientation ||
      old.deviceType !== current.deviceType ||
      old.videoWidth !== current.videoWidth ||
      old.videoHeight !== current.videoHeight ||
      Math.abs(old.screenAspectRatio - current.screenAspectRatio) > 0.1
    );
  }
}