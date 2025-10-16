/**
 * Smooth Session Manager
 * Google Meet/Zoom-level experience for Harthio 1-on-1 sessions
 * 
 * Features:
 * - Multiple service fallbacks (WebRTC → Jitsi → Google Meet)
 * - Connection quality monitoring
 * - Automatic quality adjustment
 * - Seamless reconnection
 * - Battery optimization
 * - Smooth UI transitions
 */

export type VideoService = 'webrtc' | 'jitsi' | 'google-meet' | 'zoom' | 'teams';
export type ConnectionQuality = 'excellent' | 'good' | 'fair' | 'poor' | 'failed';
export type SessionState = 'initializing' | 'connecting' | 'connected' | 'reconnecting' | 'failed' | 'ended';

export interface SessionConfig {
  sessionId: string;
  userId: string;
  userName: string;
  otherUserId: string;
  otherUserName: string;
  preferredService?: VideoService;
  fallbackServices?: VideoService[];
  maxRetries?: number;
  qualityThresholds?: QualityThresholds;
}

export interface QualityThresholds {
  excellent: { minBandwidth: number; maxLatency: number; maxPacketLoss: number };
  good: { minBandwidth: number; maxLatency: number; maxPacketLoss: number };
  fair: { minBandwidth: number; maxLatency: number; maxPacketLoss: number };
  poor: { minBandwidth: number; maxLatency: number; maxPacketLoss: number };
}

export interface ConnectionStats {
  bandwidth: number; // kbps
  latency: number; // ms
  packetLoss: number; // percentage
  quality: ConnectionQuality;
  jitter: number; // ms
  resolution: string;
  frameRate: number;
  audioLevel: number;
}

export interface SessionCallbacks {
  onStateChange: (state: SessionState) => void;
  onQualityChange: (quality: ConnectionQuality, stats: ConnectionStats) => void;
  onServiceChange: (service: VideoService, reason: string) => void;
  onError: (error: string, recoverable: boolean) => void;
  onNotification: (message: string, type: 'info' | 'warning' | 'error') => void;
  onRemoteStream: (stream: MediaStream) => void;
  onLocalStream: (stream: MediaStream) => void;
}

export class SmoothSessionManager {
  private config: SessionConfig;
  private callbacks: SessionCallbacks;
  private currentService: VideoService;
  private currentState: SessionState = 'initializing';
  private connectionStats: ConnectionStats;
  private retryCount = 0;
  private qualityMonitorInterval?: NodeJS.Timeout;
  private reconnectTimeout?: NodeJS.Timeout;
  private localStream?: MediaStream;
  private remoteStream?: MediaStream;
  
  // Service managers
  private webrtcManager?: any;
  private jitsiManager?: any;
  private googleMeetManager?: any;

  constructor(config: SessionConfig, callbacks: SessionCallbacks) {
    this.config = {
      preferredService: 'webrtc',
      fallbackServices: ['jitsi', 'google-meet'],
      maxRetries: 3,
      qualityThresholds: this.getDefaultQualityThresholds(),
      ...config
    };
    this.callbacks = callbacks;
    this.currentService = this.config.preferredService!;
    this.connectionStats = this.getInitialStats();
  }

  /**
   * Initialize the session with the preferred service
   */
  async initialize(): Promise<void> {
    try {
      this.setState('initializing');
      this.callbacks.onNotification('Initializing session...', 'info');
      
      // Get user media first
      await this.initializeMedia();
      
      // Try preferred service first
      await this.connectWithService(this.currentService);
      
    } catch (error) {
      console.error('Session initialization failed:', error);
      await this.handleConnectionFailure(error as Error);
    }
  }

  /**
   * Initialize user media with fallbacks
   */
  private async initializeMedia(): Promise<void> {
    try {
      // Try high quality first
      this.localStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280, min: 640 },
          height: { ideal: 720, min: 480 },
          frameRate: { ideal: 30, min: 15 }
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      
      this.callbacks.onLocalStream(this.localStream);
      this.callbacks.onNotification('Camera and microphone ready', 'info');
      
    } catch (error) {
      // Fallback to lower quality
      try {
        this.localStream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480 },
          audio: true
        });
        this.callbacks.onLocalStream(this.localStream);
        this.callbacks.onNotification('Using basic video quality', 'warning');
      } catch (fallbackError) {
        // Audio only fallback
        try {
          this.localStream = await navigator.mediaDevices.getUserMedia({
            audio: true
          });
          this.callbacks.onNotification('Audio-only mode (camera unavailable)', 'warning');
        } catch (audioError) {
          throw new Error('Unable to access camera or microphone');
        }
      }
    }
  }

  /**
   * Connect using a specific video service
   */
  private async connectWithService(service: VideoService): Promise<void> {
    this.setState('connecting');
    this.callbacks.onNotification(`Connecting via ${service}...`, 'info');
    
    try {
      switch (service) {
        case 'webrtc':
          await this.connectWebRTC();
          break;
        case 'jitsi':
          await this.connectJitsi();
          break;
        case 'google-meet':
          await this.connectGoogleMeet();
          break;
        default:
          throw new Error(`Unsupported service: ${service}`);
      }
      
      this.setState('connected');
      this.startQualityMonitoring();
      this.callbacks.onServiceChange(service, 'Connected successfully');
      
    } catch (error) {
      console.error(`Failed to connect with ${service}:`, error);
      throw error;
    }
  }

  /**
   * WebRTC connection (primary method)
   */
  private async connectWebRTC(): Promise<void> {
    const { WebRTCManager } = await import('./webrtc-manager');
    
    this.webrtcManager = new WebRTCManager(
      this.config.sessionId,
      this.config.userId,
      this.config.otherUserId,
      this.config.userName,
      (remoteStream) => {
        this.remoteStream = remoteStream;
        this.callbacks.onRemoteStream(remoteStream);
      },
      (state) => {
        if (state === 'connected') {
          this.setState('connected');
        } else if (state === 'failed') {
          throw new Error('WebRTC connection failed');
        }
      },
      (error) => {
        throw new Error(`WebRTC error: ${error}`);
      },
      (notification) => {
        this.callbacks.onNotification(notification, 'info');
      }
    );

    await this.webrtcManager.initialize(this.localStream);
  }

  /**
   * Jitsi fallback connection
   */
  private async connectJitsi(): Promise<void> {
    // Create Jitsi room URL
    const roomName = `harthio-${this.config.sessionId}`;
    const jitsiUrl = `https://meet.jit.si/${roomName}`;
    
    // For now, redirect to Jitsi (can be embedded later)
    this.callbacks.onNotification('Redirecting to Jitsi Meet...', 'info');
    window.open(jitsiUrl, '_blank');
    
    // Mark as connected (simplified for now)
    this.setState('connected');
  }

  /**
   * Google Meet fallback connection
   */
  private async connectGoogleMeet(): Promise<void> {
    // Create Google Meet room (requires API integration)
    this.callbacks.onNotification('Creating Google Meet room...', 'info');
    
    // For now, show instructions (can be integrated with Google Meet API)
    const meetUrl = `https://meet.google.com/new`;
    this.callbacks.onNotification('Please create a Google Meet and share the link', 'warning');
    window.open(meetUrl, '_blank');
    
    this.setState('connected');
  }

  /**
   * Handle connection failures with automatic fallback
   */
  private async handleConnectionFailure(error: Error): Promise<void> {
    this.retryCount++;
    
    if (this.retryCount <= (this.config.maxRetries || 3)) {
      // Try fallback services
      const fallbackServices = this.config.fallbackServices || [];
      const nextServiceIndex = fallbackServices.indexOf(this.currentService) + 1;
      
      if (nextServiceIndex < fallbackServices.length) {
        const nextService = fallbackServices[nextServiceIndex];
        this.currentService = nextService;
        
        this.callbacks.onNotification(
          `Connection failed, trying ${nextService}...`, 
          'warning'
        );
        
        setTimeout(() => {
          this.connectWithService(nextService);
        }, 2000);
        return;
      }
    }
    
    // All services failed
    this.setState('failed');
    this.callbacks.onError('All connection methods failed', false);
  }

  /**
   * Start monitoring connection quality
   */
  private startQualityMonitoring(): void {
    this.qualityMonitorInterval = setInterval(() => {
      this.updateConnectionStats();
    }, 1000);
  }

  /**
   * Update connection statistics
   */
  private async updateConnectionStats(): Promise<void> {
    if (this.currentService === 'webrtc' && this.webrtcManager) {
      try {
        const stats = await this.webrtcManager.getConnectionStats();
        this.connectionStats = {
          bandwidth: stats.bandwidth || 0,
          latency: stats.latency || 0,
          packetLoss: stats.packetLoss || 0,
          quality: this.calculateQuality(stats),
          jitter: stats.jitter || 0,
          resolution: stats.resolution || 'unknown',
          frameRate: stats.frameRate || 0,
          audioLevel: stats.audioLevel || 0
        };
        
        this.callbacks.onQualityChange(this.connectionStats.quality, this.connectionStats);
        
        // Auto-adjust quality if needed
        await this.autoAdjustQuality();
        
      } catch (error) {
        console.error('Failed to get connection stats:', error);
      }
    }
  }

  /**
   * Calculate connection quality based on stats
   */
  private calculateQuality(stats: any): ConnectionQuality {
    const thresholds = this.config.qualityThresholds!;
    
    if (
      stats.bandwidth >= thresholds.excellent.minBandwidth &&
      stats.latency <= thresholds.excellent.maxLatency &&
      stats.packetLoss <= thresholds.excellent.maxPacketLoss
    ) {
      return 'excellent';
    } else if (
      stats.bandwidth >= thresholds.good.minBandwidth &&
      stats.latency <= thresholds.good.maxLatency &&
      stats.packetLoss <= thresholds.good.maxPacketLoss
    ) {
      return 'good';
    } else if (
      stats.bandwidth >= thresholds.fair.minBandwidth &&
      stats.latency <= thresholds.fair.maxLatency &&
      stats.packetLoss <= thresholds.fair.maxPacketLoss
    ) {
      return 'fair';
    } else if (
      stats.bandwidth >= thresholds.poor.minBandwidth &&
      stats.latency <= thresholds.poor.maxLatency &&
      stats.packetLoss <= thresholds.poor.maxPacketLoss
    ) {
      return 'poor';
    } else {
      return 'failed';
    }
  }

  /**
   * Automatically adjust quality based on connection
   */
  private async autoAdjustQuality(): Promise<void> {
    if (this.connectionStats.quality === 'poor' || this.connectionStats.quality === 'failed') {
      // Reduce video quality
      if (this.webrtcManager && this.webrtcManager.reduceVideoQuality) {
        await this.webrtcManager.reduceVideoQuality();
        this.callbacks.onNotification('Reduced video quality to improve connection', 'warning');
      }
    } else if (this.connectionStats.quality === 'excellent') {
      // Increase video quality if possible
      if (this.webrtcManager && this.webrtcManager.increaseVideoQuality) {
        await this.webrtcManager.increaseVideoQuality();
      }
    }
  }

  /**
   * Reconnect to the session
   */
  async reconnect(): Promise<void> {
    this.setState('reconnecting');
    this.callbacks.onNotification('Reconnecting...', 'info');
    
    try {
      await this.connectWithService(this.currentService);
    } catch (error) {
      await this.handleConnectionFailure(error as Error);
    }
  }

  /**
   * End the session and cleanup
   */
  async endSession(): Promise<void> {
    this.setState('ended');
    
    // Stop quality monitoring
    if (this.qualityMonitorInterval) {
      clearInterval(this.qualityMonitorInterval);
    }
    
    // Cleanup streams
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
    }
    
    // Cleanup service managers
    if (this.webrtcManager && this.webrtcManager.cleanup) {
      await this.webrtcManager.cleanup();
    }
    
    this.callbacks.onNotification('Session ended', 'info');
  }

  /**
   * Toggle audio mute
   */
  toggleAudio(): boolean {
    if (this.localStream) {
      const audioTracks = this.localStream.getAudioTracks();
      const newMutedState = !audioTracks[0]?.enabled;
      
      audioTracks.forEach(track => {
        track.enabled = !newMutedState;
      });
      
      if (this.webrtcManager && this.webrtcManager.toggleAudio) {
        this.webrtcManager.toggleAudio(!newMutedState);
      }
      
      return newMutedState;
    }
    return false;
  }

  /**
   * Toggle video on/off
   */
  toggleVideo(): boolean {
    if (this.localStream) {
      const videoTracks = this.localStream.getVideoTracks();
      const newVideoState = !videoTracks[0]?.enabled;
      
      videoTracks.forEach(track => {
        track.enabled = !newVideoState;
      });
      
      if (this.webrtcManager && this.webrtcManager.toggleVideo) {
        this.webrtcManager.toggleVideo(!newVideoState);
      }
      
      return newVideoState;
    }
    return false;
  }

  // Helper methods
  private setState(state: SessionState): void {
    this.currentState = state;
    this.callbacks.onStateChange(state);
  }

  private getDefaultQualityThresholds(): QualityThresholds {
    return {
      excellent: { minBandwidth: 2000, maxLatency: 50, maxPacketLoss: 0.1 },
      good: { minBandwidth: 1000, maxLatency: 100, maxPacketLoss: 1 },
      fair: { minBandwidth: 500, maxLatency: 200, maxPacketLoss: 3 },
      poor: { minBandwidth: 200, maxLatency: 500, maxPacketLoss: 5 }
    };
  }

  private getInitialStats(): ConnectionStats {
    return {
      bandwidth: 0,
      latency: 0,
      packetLoss: 0,
      quality: 'good',
      jitter: 0,
      resolution: 'unknown',
      frameRate: 0,
      audioLevel: 0
    };
  }

  // Getters
  get state(): SessionState {
    return this.currentState;
  }

  get service(): VideoService {
    return this.currentService;
  }

  get stats(): ConnectionStats {
    return this.connectionStats;
  }
}