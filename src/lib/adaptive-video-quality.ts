/**
 * Adaptive Video Quality Service
 * Single source of truth for video quality management across all video services
 * Monitors network conditions and provides adaptive quality recommendations
 * 
 * BANDWIDTH MANAGEMENT APPROACH:
 * ===============================
 * This service follows WebRTC best practices by NOT hardcoding video bitrates.
 * Instead, it relies on the browser's built-in bandwidth estimation and 
 * Transport Wide Congestion Control (TWCC) for optimal real-time adaptation.
 * 
 * Why Native Browser Adaptation is Better:
 * - Automatically adjusts quality in real-time based on network conditions
 * - Uses advanced algorithms for bandwidth estimation and congestion control
 * - Keeps calls alive by reducing quality instead of dropping connections
 * - Adapts faster than any manual implementation could
 * 
 * This service provides:
 * - Resolution and framerate constraints (safe to set)
 * - Network condition monitoring for provider selection
 * - Quality level recommendations based on device/network capabilities
 * 
 * What it does NOT do:
 * - Set hardcoded bitrates (commented out to prevent interference)
 * - Override browser's native bandwidth adaptation
 * - Enforce specific encoding parameters that could hurt performance
 */

export interface NetworkConditions {
  networkSpeed: number; // Mbps
  signalStrength: number; // 0-100 (WiFi bars or cellular signal)
  networkCongestion: 'low' | 'medium' | 'high';
  devicePerformance: 'excellent' | 'good' | 'fair' | 'poor';
  connectionType: 'wifi' | 'cellular' | 'ethernet' | 'unknown';
  isMobile: boolean;
}

export interface VideoQualityProfile {
  name: 'excellent' | 'good' | 'fair' | 'poor';
  resolution: { width: number; height: number };
  frameRate: { min: number; ideal: number; max: number };
  // COMMENTED OUT: Bitrate enforcement interferes with native browser bandwidth adaptation
  // Modern browsers use TWCC (Transport Wide Congestion Control) for optimal real-time adaptation
  // bitrate: { min: number; ideal: number; max: number }; // kbps
  description: string;
}

export interface AdaptiveVideoConstraints {
  video: {
    width: { ideal: number; max: number };
    height: { ideal: number; max: number };
    frameRate: { ideal: number; max: number };
  };
  audio: {
    echoCancellation: boolean;
    noiseSuppression: boolean;
    autoGainControl: boolean;
    sampleRate?: number;
    channelCount?: number;
  };
}

export class AdaptiveVideoQualityService {
  private static instance: AdaptiveVideoQualityService;
  private currentConditions: NetworkConditions;
  private currentProfile: VideoQualityProfile;
  private monitoringInterval: NodeJS.Timeout | null = null;
  private callbacks: ((profile: VideoQualityProfile, conditions: NetworkConditions) => void)[] = [];
  private lastLoggedSpeed: number | null = null;
  private lastLoggedCongestion: string | null = null;
  private devicePerformanceLogged: boolean = false;
  private verboseLogging: boolean = process.env.NODE_ENV === 'development';

  // Video Quality Profiles (Single Source of Truth)
  // Based on your requirements: 720p→480p→360p→240p/144p with 15-30fps
  // 
  // IMPORTANT: Bitrate values are COMMENTED OUT to allow native browser bandwidth adaptation
  // Modern browsers use built-in bandwidth estimation and TWCC (Transport Wide Congestion Control)
  // This provides better real-time adaptation and keeps calls alive instead of dropping them
  private readonly qualityProfiles: Record<string, VideoQualityProfile> = {
    excellent: {
      name: 'excellent',
      resolution: { width: 1280, height: 720 }, // 720p HD - like basic HD
      frameRate: { min: 24, ideal: 30, max: 30 },
      // bitrate: { min: 1200, ideal: 1800, max: 2500 }, // COMMENTED: Let browser adapt
      description: 'HD quality - clear and smooth, like DVD to basic HD'
    },
    good: {
      name: 'good',
      resolution: { width: 854, height: 480 }, // 480p - like DVD quality
      frameRate: { min: 20, ideal: 25, max: 30 },
      // bitrate: { min: 600, ideal: 1000, max: 1500 }, // COMMENTED: Let browser adapt
      description: 'Good quality - clear detail for seeing faces'
    },
    fair: {
      name: 'fair',
      resolution: { width: 640, height: 360 }, // 360p - like older YouTube
      frameRate: { min: 15, ideal: 20, max: 25 },
      // bitrate: { min: 300, ideal: 500, max: 800 }, // COMMENTED: Let browser adapt
      description: 'Fair quality - watchable, might be fuzzy but no freezing'
    },
    poor: {
      name: 'poor',
      resolution: { width: 320, height: 240 }, // 240p - very basic, blocky
      frameRate: { min: 12, ideal: 15, max: 20 },
      // bitrate: { min: 150, ideal: 250, max: 400 }, // COMMENTED: Let browser adapt
      description: 'Basic quality - pixelated but call keeps going'
    }
  };

  private constructor() {
    this.currentConditions = this.getInitialConditions();
    this.currentProfile = this.qualityProfiles.good; // Start with good quality
  }

  static getInstance(): AdaptiveVideoQualityService {
    if (!AdaptiveVideoQualityService.instance) {
      AdaptiveVideoQualityService.instance = new AdaptiveVideoQualityService();
    }
    return AdaptiveVideoQualityService.instance;
  }

  // Start monitoring network conditions
  startMonitoring(): void {
    if (this.monitoringInterval) return;

    console.log('🔍 Starting adaptive video quality monitoring...');
    console.log('📊 Monitoring: Network speed, Signal strength, Congestion, Device performance');
    
    // Initial assessment
    this.assessNetworkConditions();
    
    // Monitor every 15 seconds (reduced frequency to prevent console spam)
    this.monitoringInterval = setInterval(() => {
      this.assessNetworkConditions();
    }, 15000);
  }

  // Stop monitoring
  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
      console.log('⏹️ Stopped adaptive video quality monitoring');
    }
  }

  // Subscribe to quality changes
  onQualityChange(callback: (profile: VideoQualityProfile, conditions: NetworkConditions) => void): void {
    this.callbacks.push(callback);
  }

  // Get current quality profile
  getCurrentProfile(): VideoQualityProfile {
    return this.currentProfile;
  }

  // Get current network conditions
  getCurrentConditions(): NetworkConditions {
    return this.currentConditions;
  }

  // Get video constraints for current quality
  getVideoConstraints(): AdaptiveVideoConstraints {
    const profile = this.currentProfile;
    const isMobile = this.currentConditions.isMobile;

    return {
      video: {
        width: { ideal: profile.resolution.width, max: profile.resolution.width },
        height: { ideal: profile.resolution.height, max: profile.resolution.height },
        frameRate: { ideal: profile.frameRate.ideal, max: profile.frameRate.max },
        ...(isMobile && { facingMode: 'user' }) // Front camera for mobile
      },
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
        ...(isMobile && {
          sampleRate: profile.name === 'poor' ? 8000 : 16000,
          channelCount: 1 // Mono for mobile
        })
      }
    };
  }

  // COMMENTED OUT: Daily.co specific settings not used
  // This method was for Daily.co integration but is not currently needed
  // since we're only using P2P WebRTC
  /*
  getDailySettings() {
    const profile = this.currentProfile;
    return {
      videoSource: {
        width: profile.resolution.width,
        height: profile.resolution.height,
        frameRate: profile.frameRate.ideal
      },
      bandwidth: {
        kbs: profile.bitrate.ideal, // This would interfere with native adaptation
        trackConstraints: {
          width: profile.resolution.width,
          height: profile.resolution.height,
          frameRate: profile.frameRate.ideal
        }
      }
    };
  }
  */

  // Alternative: Get constraints without bandwidth enforcement
  // This allows native browser adaptation while still providing resolution/framerate guidance
  getVideoConstraintsOnly() {
    const profile = this.currentProfile;
    return {
      videoSource: {
        width: profile.resolution.width,
        height: profile.resolution.height,
        frameRate: profile.frameRate.ideal
      }
      // No bandwidth constraints - let browser adapt automatically
    };
  }

  // Manually set quality (for user override)
  setQuality(qualityName: 'excellent' | 'good' | 'fair' | 'poor'): void {
    const newProfile = this.qualityProfiles[qualityName];
    if (newProfile && newProfile !== this.currentProfile) {
      console.log(`📹 Manual quality change: ${this.currentProfile.name} → ${newProfile.name}`);
      this.currentProfile = newProfile;
      this.notifyCallbacks();
    }
  }

  // Assess current network conditions
  private async assessNetworkConditions(): Promise<void> {
    const conditions: NetworkConditions = {
      networkSpeed: await this.measureNetworkSpeed(),
      signalStrength: this.getSignalStrength(),
      networkCongestion: this.detectNetworkCongestion(),
      devicePerformance: this.assessDevicePerformance(),
      connectionType: this.getConnectionType(),
      isMobile: this.isMobileDevice()
    };

    // Update conditions
    this.currentConditions = conditions;

    // Determine optimal quality based on conditions
    const optimalProfile = this.determineOptimalQuality(conditions);

    // Update quality if changed
    if (optimalProfile.name !== this.currentProfile.name) {
      console.log(`📹 Auto quality change: ${this.currentProfile.name} → ${optimalProfile.name}`, {
        networkSpeed: conditions.networkSpeed,
        signalStrength: conditions.signalStrength,
        congestion: conditions.networkCongestion,
        device: conditions.devicePerformance
      });
      
      this.currentProfile = optimalProfile;
      this.notifyCallbacks();
    }
  }

  // Determine optimal quality based on network conditions
  // Priority: Keep call connected > Video quality
  private determineOptimalQuality(conditions: NetworkConditions): VideoQualityProfile {
    const { networkSpeed, signalStrength, networkCongestion, devicePerformance, isMobile } = conditions;
    
    // Calculate quality score (0-100)
    let qualityScore = 0;
    const factors: string[] = [];

    // Network Speed (40% weight) - Most important factor
    if (networkSpeed >= 2.5) { qualityScore += 40; factors.push(`Speed: ${networkSpeed.toFixed(1)}Mbps (excellent)`); }
    else if (networkSpeed >= 1.5) { qualityScore += 30; factors.push(`Speed: ${networkSpeed.toFixed(1)}Mbps (good)`); }
    else if (networkSpeed >= 0.8) { qualityScore += 20; factors.push(`Speed: ${networkSpeed.toFixed(1)}Mbps (fair)`); }
    else if (networkSpeed >= 0.3) { qualityScore += 10; factors.push(`Speed: ${networkSpeed.toFixed(1)}Mbps (poor)`); }
    else { qualityScore += 5; factors.push(`Speed: ${networkSpeed.toFixed(1)}Mbps (very poor)`); }

    // Signal Strength (25% weight)
    if (signalStrength >= 85) { qualityScore += 25; factors.push(`Signal: ${signalStrength}% (excellent)`); }
    else if (signalStrength >= 70) { qualityScore += 20; factors.push(`Signal: ${signalStrength}% (good)`); }
    else if (signalStrength >= 50) { qualityScore += 15; factors.push(`Signal: ${signalStrength}% (fair)`); }
    else if (signalStrength >= 30) { qualityScore += 10; factors.push(`Signal: ${signalStrength}% (poor)`); }
    else { qualityScore += 5; factors.push(`Signal: ${signalStrength}% (very poor)`); }

    // Network Congestion (20% weight)
    if (networkCongestion === 'low') { qualityScore += 20; factors.push('Congestion: low'); }
    else if (networkCongestion === 'medium') { qualityScore += 10; factors.push('Congestion: medium'); }
    else { qualityScore += 5; factors.push('Congestion: high'); }

    // Device Performance (15% weight)
    if (devicePerformance === 'excellent') { qualityScore += 15; factors.push('Device: excellent'); }
    else if (devicePerformance === 'good') { qualityScore += 12; factors.push('Device: good'); }
    else if (devicePerformance === 'fair') { qualityScore += 8; factors.push('Device: fair'); }
    else { qualityScore += 5; factors.push('Device: poor'); }

    // Mobile penalty (reduce quality for mobile to save battery/data)
    if (isMobile) {
      qualityScore -= 10;
      factors.push('Mobile device (-10 points)');
    }

    // Determine quality based on score
    let selectedProfile: VideoQualityProfile;
    if (qualityScore >= 80) {
      selectedProfile = this.qualityProfiles.excellent; // 720p
    } else if (qualityScore >= 60) {
      selectedProfile = this.qualityProfiles.good; // 480p
    } else if (qualityScore >= 35) {
      selectedProfile = this.qualityProfiles.fair; // 360p
    } else {
      selectedProfile = this.qualityProfiles.poor; // 240p
    }

    // Only log quality changes, not every determination
    if (this.verboseLogging && this.currentProfile?.name !== selectedProfile.name) {
      console.log(`🎯 Video quality: ${this.currentProfile?.name || 'initial'} → ${selectedProfile.name}`);
    }
    return selectedProfile;
  }

  // Measure network speed with multiple methods
  private async measureNetworkSpeed(): Promise<number> {
    try {
      // Method 1: Network Information API (most accurate)
      if ('connection' in navigator) {
        const connection = (navigator as any).connection;
        if (connection && connection.downlink) {
          const speed = connection.downlink; // Mbps
          // Only log significant speed changes in development
          if (this.verboseLogging && (!this.lastLoggedSpeed || Math.abs(this.lastLoggedSpeed - speed) > 0.5)) {
            console.log(`📡 Network speed: ${speed} Mbps`);
            this.lastLoggedSpeed = speed;
          }
          return Math.max(0.1, speed); // Ensure minimum speed
        }
      }

      // Method 2: Simple latency test with small resource
      const startTime = performance.now();
      const testUrl = `data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7?t=${Date.now()}`;
      
      const response = await Promise.race([
        fetch(testUrl, { cache: 'no-cache' }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 2000))
      ]) as Response;
      
      const endTime = performance.now();
      const latency = endTime - startTime;
      
      if (response.ok) {
        // Convert latency to estimated speed
        let estimatedSpeed: number;
        if (latency < 50) estimatedSpeed = 3.0;      // Excellent
        else if (latency < 100) estimatedSpeed = 2.0; // Good
        else if (latency < 200) estimatedSpeed = 1.0; // Fair
        else if (latency < 500) estimatedSpeed = 0.5; // Poor
        else estimatedSpeed = 0.2;                    // Very poor
        
        console.log(`⏱️ Latency-based speed estimate: ${estimatedSpeed} Mbps (${latency}ms)`);
        return estimatedSpeed;
      }
    } catch (error) {
      console.warn('Network speed measurement failed:', error);
    }

    // Method 3: Fallback based on connection type
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      if (connection && connection.effectiveType) {
        const typeSpeedMap: Record<string, number> = {
          '4g': 2.5,
          '3g': 1.0,
          '2g': 0.3,
          'slow-2g': 0.1
        };
        const speed = typeSpeedMap[connection.effectiveType] || 1.0;
        console.log(`📶 Connection type speed: ${speed} Mbps (${connection.effectiveType})`);
        return speed;
      }
    }

    // Final fallback
    const defaultSpeed = this.isMobileDevice() ? 0.8 : 1.5;
    console.log(`🔄 Default speed assumption: ${defaultSpeed} Mbps`);
    return defaultSpeed;
  }

  // Get signal strength (0-100) - WiFi bars or cellular signal
  private getSignalStrength(): number {
    try {
      // Method 1: Network Information API
      if ('connection' in navigator) {
        const connection = (navigator as any).connection;
        if (connection) {
          // Use RTT (round-trip time) as signal quality indicator
          if (connection.rtt) {
            // Lower RTT = better signal
            if (connection.rtt < 50) return 95;   // Excellent signal
            if (connection.rtt < 100) return 85;  // Very good signal
            if (connection.rtt < 200) return 70;  // Good signal
            if (connection.rtt < 400) return 50;  // Fair signal
            if (connection.rtt < 800) return 30;  // Poor signal
            return 15; // Very poor signal
          }
          
          // Fallback to effective type mapping
          const typeSignalMap: Record<string, number> = {
            '4g': 85,      // Strong 4G signal
            '3g': 65,      // Decent 3G signal
            '2g': 35,      // Weak 2G signal
            'slow-2g': 15  // Very weak signal
          };
          
          if (connection.effectiveType) {
            const signal = typeSignalMap[connection.effectiveType] || 70;
            console.log(`📶 Signal strength: ${signal}% (${connection.effectiveType})`);
            return signal;
          }
        }
      }

      // Method 2: Connection type heuristics
      const connectionType = this.getConnectionType();
      const typeSignalMap: Record<string, number> = {
        'ethernet': 95,  // Wired connection = excellent
        'wifi': 80,      // WiFi = good signal assumed
        'cellular': 60,  // Cellular = variable, assume fair
        'unknown': 70    // Unknown = assume decent
      };
      
      const signal = typeSignalMap[connectionType] || 70;
      console.log(`📡 Signal strength estimate: ${signal}% (${connectionType})`);
      return signal;
      
    } catch (error) {
      console.warn('Signal strength detection failed:', error);
      return 70; // Safe default
    }
  }

  // Detect network congestion - multiple indicators
  private detectNetworkCongestion(): 'low' | 'medium' | 'high' {
    try {
      let congestionScore = 0;
      const indicators: string[] = [];

      // Indicator 1: Round-trip time (RTT)
      if ('connection' in navigator) {
        const connection = (navigator as any).connection;
        if (connection && connection.rtt) {
          if (connection.rtt < 50) {
            congestionScore += 0; // Excellent RTT
            indicators.push(`RTT: ${connection.rtt}ms (excellent)`);
          } else if (connection.rtt < 100) {
            congestionScore += 1; // Good RTT
            indicators.push(`RTT: ${connection.rtt}ms (good)`);
          } else if (connection.rtt < 300) {
            congestionScore += 2; // Fair RTT
            indicators.push(`RTT: ${connection.rtt}ms (congested)`);
          } else {
            congestionScore += 3; // Poor RTT
            indicators.push(`RTT: ${connection.rtt}ms (high congestion)`);
          }
        }
      }

      // Indicator 2: Time-based congestion patterns
      const now = new Date();
      const hour = now.getHours();
      const dayOfWeek = now.getDay(); // 0 = Sunday, 6 = Saturday
      
      // Peak hours analysis
      const isWeekday = dayOfWeek >= 1 && dayOfWeek <= 5;
      const isBusinessHours = hour >= 9 && hour <= 17;
      const isEveningPeak = hour >= 18 && hour <= 22;
      const isLunchTime = hour >= 12 && hour <= 14;
      
      if (isWeekday && (isBusinessHours || isEveningPeak)) {
        congestionScore += 2;
        indicators.push('Peak hours (business/evening)');
      } else if (isWeekday && isLunchTime) {
        congestionScore += 1;
        indicators.push('Lunch time congestion');
      } else if (!isWeekday && isEveningPeak) {
        congestionScore += 1;
        indicators.push('Weekend evening');
      } else {
        indicators.push('Off-peak hours');
      }

      // Indicator 3: Connection type congestion likelihood
      const connectionType = this.getConnectionType();
      if (connectionType === 'cellular') {
        congestionScore += 1;
        indicators.push('Cellular network (variable)');
      } else if (connectionType === 'wifi') {
        // WiFi can be congested in dense areas
        congestionScore += 0.5;
        indicators.push('WiFi network');
      } else if (connectionType === 'ethernet') {
        indicators.push('Wired connection (stable)');
      }

      // Determine congestion level
      let congestion: 'low' | 'medium' | 'high';
      if (congestionScore <= 1) congestion = 'low';
      else if (congestionScore <= 3) congestion = 'medium';
      else congestion = 'high';

      // Only log congestion changes in development
      if (this.verboseLogging && this.lastLoggedCongestion !== congestion) {
        console.log(`🚦 Congestion: ${this.lastLoggedCongestion || 'unknown'} → ${congestion}`);
        this.lastLoggedCongestion = congestion;
      }
      return congestion;

    } catch (error) {
      console.warn('Network congestion detection failed:', error);
      return 'medium'; // Safe default
    }
  }

  // Assess device performance - CPU, memory, and capabilities
  private assessDevicePerformance(): 'excellent' | 'good' | 'fair' | 'poor' {
    try {
      let score = 0;
      const factors: string[] = [];

      // Factor 1: Device Memory (RAM)
      if ('deviceMemory' in navigator) {
        const memory = (navigator as any).deviceMemory;
        if (memory >= 8) { score += 4; factors.push(`RAM: ${memory}GB (excellent)`); }
        else if (memory >= 4) { score += 3; factors.push(`RAM: ${memory}GB (good)`); }
        else if (memory >= 2) { score += 2; factors.push(`RAM: ${memory}GB (fair)`); }
        else { score += 1; factors.push(`RAM: ${memory}GB (poor)`); }
      } else {
        // Estimate based on device type
        score += this.isMobileDevice() ? 2 : 3;
        factors.push('RAM: estimated');
      }

      // Factor 2: CPU Cores
      if ('hardwareConcurrency' in navigator) {
        const cores = navigator.hardwareConcurrency;
        if (cores >= 8) { score += 4; factors.push(`CPU: ${cores} cores (excellent)`); }
        else if (cores >= 4) { score += 3; factors.push(`CPU: ${cores} cores (good)`); }
        else if (cores >= 2) { score += 2; factors.push(`CPU: ${cores} cores (fair)`); }
        else { score += 1; factors.push(`CPU: ${cores} cores (poor)`); }
      } else {
        score += 2;
        factors.push('CPU: estimated');
      }

      // Factor 3: Device Type and User Agent Analysis
      const userAgent = navigator.userAgent.toLowerCase();
      if (userAgent.includes('iphone') || userAgent.includes('ipad')) {
        // iOS devices generally have good performance
        score += 3;
        factors.push('iOS device (good)');
      } else if (userAgent.includes('android')) {
        // Android varies widely
        score += 2;
        factors.push('Android device (fair)');
      } else {
        // Desktop/laptop
        score += 3;
        factors.push('Desktop/laptop (good)');
      }

      // Factor 4: WebRTC Support Quality
      if (typeof RTCPeerConnection !== 'undefined') {
        score += 1;
        factors.push('WebRTC supported');
      }

      // Calculate final performance level (max score: 12)
      let performance: 'excellent' | 'good' | 'fair' | 'poor';
      if (score >= 10) performance = 'excellent';
      else if (score >= 7) performance = 'good';
      else if (score >= 5) performance = 'fair';
      else performance = 'poor';

      // Only log device performance once in development
      if (this.verboseLogging && !this.devicePerformanceLogged) {
        console.log(`🖥️ Device: ${performance} performance`);
        this.devicePerformanceLogged = true;
      }
      return performance;

    } catch (error) {
      console.warn('Device performance assessment failed:', error);
      return this.isMobileDevice() ? 'fair' : 'good';
    }
  }

  // Get connection type
  private getConnectionType(): 'wifi' | 'cellular' | 'ethernet' | 'unknown' {
    try {
      if ('connection' in navigator) {
        const connection = (navigator as any).connection;
        if (connection && connection.type) {
          return connection.type;
        }
      }
      
      // Fallback: Mobile vs desktop assumption
      return this.isMobileDevice() ? 'cellular' : 'wifi';
    } catch (error) {
      return 'unknown';
    }
  }

  // Check if mobile device
  private isMobileDevice(): boolean {
    return /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }

  // Get initial conditions
  private getInitialConditions(): NetworkConditions {
    return {
      networkSpeed: 1.0,
      signalStrength: 70,
      networkCongestion: 'medium',
      devicePerformance: 'good',
      connectionType: 'unknown',
      isMobile: this.isMobileDevice()
    };
  }

  // Notify all callbacks of quality change
  private notifyCallbacks(): void {
    this.callbacks.forEach(callback => {
      try {
        callback(this.currentProfile, this.currentConditions);
      } catch (error) {
        console.error('Error in quality change callback:', error);
      }
    });
  }
}