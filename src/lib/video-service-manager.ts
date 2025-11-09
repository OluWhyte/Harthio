/**
 * Simplified Video Service Manager
 * Focus: Make it work reliably without complex recovery systems
 */

import 'webrtc-adapter'; // Cross-browser WebRTC compatibility
// COMMENTED OUT: Daily.co not currently used
// import { DailyService, DailyConfig, DailyCallbacks } from './daily-service';
import { P2PWebRTCService, P2PCallbacks } from './p2p-webrtc-service';
import { DeviceOrientationService, DeviceVideoMetadata, OrientationCallbacks } from './device-orientation-service';
import { ProviderCoordinator, createProviderCoordinator, type VideoProvider, type ProviderSelection } from './provider-coordinator';
import { SessionStateManager, createSessionStateManager } from './session-state-manager';

// COMMENTED OUT: Daily.co not currently used
// export type VideoServiceType = 'daily' | 'p2p' | 'none';
export type VideoServiceType = 'p2p' | 'none'; // Only P2P and none for now
export type VideoConnectionState = 'initializing' | 'connecting' | 'connected' | 'reconnecting' | 'failed' | 'ended';
export type VideoConnectionQuality = 'excellent' | 'good' | 'fair' | 'poor' | 'failed';

export interface VideoConnectionStats {
  bandwidth: number;
  latency: number;
  packetLoss: number;
  quality: VideoConnectionQuality;
  resolution: string;
  frameRate: number;
}

export interface VideoMessage {
  id: string;
  userId: string;
  userName: string;
  content: string;
  timestamp: number;
  type: 'text' | 'system';
}

export interface VideoServiceCallbacks {
  onStateChange: (state: VideoConnectionState) => void;
  onConnectionStats: (stats: VideoConnectionStats) => void;
  onError: (error: string, isRecoverable: boolean) => void;
  onMessage?: (message: VideoMessage) => void;
  onLocalStream?: (stream: MediaStream) => void;
  onRemoteStream?: (stream: MediaStream) => void;
  onParticipantJoined?: (participant: any) => void;
  onParticipantLeft?: (participant: any) => void;
}

export interface VideoServiceConfig {
  sessionId: string;
  userId: string;
  userName: string;
  userEmail?: string;
  otherUserId: string;
}

export class VideoServiceManager {
  // COMMENTED OUT: Daily.co not currently used
  // private dailyService: DailyService | null = null;
  private p2pService: P2PWebRTCService | null = null;
  private currentService: VideoServiceType = 'none';
  private callbacks: VideoServiceCallbacks;
  private config: VideoServiceConfig;
  private isInitialized = false;
  private retryCount = 0;
  private maxRetries = 2;
  
  // Simplified dependencies
  private providerCoordinator: ProviderCoordinator;
  private sessionStateManager: SessionStateManager;
  private orientationService: DeviceOrientationService;
  private selectedProvider: ProviderSelection | null = null;

  constructor(config: VideoServiceConfig, callbacks: VideoServiceCallbacks) {
    this.config = config;
    this.callbacks = callbacks;

    // Initialize provider coordinator
    this.providerCoordinator = createProviderCoordinator(
      config.sessionId,
      config.userId
    );
    
    // Set recovery callback for coordinated provider switching
    this.providerCoordinator.setRecoveryCallback((selection) => {
      console.log('🔄 Coordinated recovery requested:', selection);
      // Simplified: just log, no complex recovery
    });

    // Initialize session state manager
    this.sessionStateManager = createSessionStateManager(
      config.sessionId,
      config.userId,
      config.userName
    );

    // Initialize orientation service
    const orientationCallbacks: OrientationCallbacks = {
      onOrientationChange: (metadata: DeviceVideoMetadata) => {
        console.log('📱 Local orientation changed:', metadata);
      },
      onRemoteOrientationChange: (metadata: DeviceVideoMetadata) => {
        console.log('📱 Remote orientation changed:', metadata);
      }
    };

    this.orientationService = new DeviceOrientationService(orientationCallbacks);
  }

  async initialize(containerId?: string): Promise<void> {
    if (this.isInitialized) {
      console.warn('Video service manager already initialized');
      return;
    }

    try {
      console.log('🚀 Initializing simplified video service manager...');

      // Step 1: Select best provider
      console.log('🎯 Selecting best provider...');
      const selection = await this.providerCoordinator.selectProvider();

      if (!selection || !selection.provider) {
        throw new Error('Failed to select video provider');
      }

      this.selectedProvider = selection;
      console.log('✅ Provider selected:', this.selectedProvider);

      // Step 2: Initialize selected provider
      const success = await this.initializeSelectedProvider(containerId);
      
      if (!success) {
        // Simple fallback: try the other provider once
        console.log('🔄 Trying fallback provider...');
        // COMMENTED OUT: Daily.co not currently used
        // const fallbackProvider = this.selectedProvider.provider === 'p2p' ? 'daily' : 'p2p';
        const fallbackProvider = 'p2p'; // Only P2P available for now
        
        this.selectedProvider = {
          provider: fallbackProvider as VideoProvider,
          roomId: this.config.sessionId,
          reason: 'Fallback after primary failure'
        };
        
        const fallbackSuccess = await this.initializeSelectedProvider(containerId);
        
        if (!fallbackSuccess) {
          throw new Error('Both video providers failed to initialize');
        }
      }

      // Step 3: Update session state
      await this.sessionStateManager.updateUserState('connected', this.selectedProvider.provider);

      // Step 4: Start orientation monitoring
      console.log('📱 Starting device orientation monitoring...');
      this.orientationService.startListening();

      this.isInitialized = true;
      console.log('✅ Video service manager initialized successfully with', this.selectedProvider.provider);

    } catch (error) {
      console.error('❌ Failed to initialize video service manager:', error);
      await this.sessionStateManager.updateUserState('failed', 'none');
      this.callbacks.onError('Video calling is currently unavailable. Chat is still working.', false);
      this.callbacks.onStateChange('failed');
      throw error;
    }
  }

  private async initializeSelectedProvider(containerId?: string): Promise<boolean> {
    if (!this.selectedProvider) {
      console.error('❌ No provider selected');
      return false;
    }
    
    console.log(`🚀 Initializing ${this.selectedProvider.provider} provider...`);
    
    // COMMENTED OUT: Daily.co not currently used
    // if (this.selectedProvider.provider === 'daily') {
    //   return await this.initializeDailyProvider(containerId);
    // } else {
    //   return await this.initializeP2PProvider();
    // }
    
    // Only P2P available for now
    return await this.initializeP2PProvider();
  }

  // COMMENTED OUT: Daily.co not currently used
  /*
  private async initializeDailyProvider(containerId?: string): Promise<boolean> {
    try {
      console.log('🔄 Initializing Daily.co service...');
      
      const dailyConfig: DailyConfig = {
        roomUrl: `https://${process.env.NEXT_PUBLIC_DAILY_DOMAIN}/${this.selectedProvider!.roomId}`,
        roomName: this.selectedProvider!.roomId,
        userName: this.config.userName,
        userEmail: this.config.userEmail
      };

      const dailyCallbacks: DailyCallbacks = {
        onJoined: () => {
          console.log('✅ Daily.co: User joined successfully');
          this.currentService = 'daily';
          this.callbacks.onStateChange('connected');
        },
        onLeft: () => {
          console.log('👋 Daily.co: User left');
          this.currentService = 'none';
          this.callbacks.onStateChange('ended');
        },
        onParticipantJoined: (participant) => {
          console.log('👤 Daily.co: Participant joined', participant);
          this.callbacks.onParticipantJoined?.(participant);
        },
        onParticipantLeft: (participant) => {
          console.log('👋 Daily.co: Participant left', participant);
          this.callbacks.onParticipantLeft?.(participant);
        },
        onError: (error) => {
          console.error('❌ Daily.co error:', error);
          this.callbacks.onError(error, true);
        },
        onConnectionStateChange: (state) => {
          console.log('🔗 Daily.co connection state:', state);
        },
        onNetworkQualityChange: (stats) => {
          console.log('📊 Daily.co network quality:', stats);
        },
        onMessage: (message) => {
          console.log('💬 Daily.co message:', message);
        },
        onAudioToggle: (participant, enabled) => {
          console.log('🎤 Daily.co audio toggle:', participant, enabled);
        },
        onVideoToggle: (participant, enabled) => {
          console.log('📹 Daily.co video toggle:', participant, enabled);
        }
      };

      this.dailyService = new DailyService(dailyConfig, dailyCallbacks);
      
      if (containerId) {
        await this.dailyService.initialize(containerId);
      } else {
        await this.dailyService.initialize();
      }
      
      console.log('✅ Daily.co service initialized successfully');
      return true;
      
    } catch (error) {
      console.error('❌ Failed to initialize Daily.co:', error);
      return false;
    }
  }
  */
  // END OF COMMENTED OUT Daily.co provider method

  private async initializeP2PProvider(): Promise<boolean> {
    try {
      console.log('🔄 Initializing P2P WebRTC service...');

      const p2pCallbacks: P2PCallbacks = {
        onStateChange: (state) => {
          console.log('🔗 P2P state change:', state);
          if (state === 'connected') {
            this.currentService = 'p2p';
            console.log('✅ Current service set to P2P');
            this.callbacks.onStateChange('connected');
          } else if (state === 'ended') {
            this.currentService = 'none';
            this.callbacks.onStateChange('ended');
          } else if (state === 'failed') {
            this.callbacks.onStateChange('failed');
          } else if (state === 'connecting') {
            this.callbacks.onStateChange('connecting');
          }
        },
        onQualityChange: (quality, stats) => {
          console.log('📊 P2P quality change:', quality, stats);
          
          const connectionStats: VideoConnectionStats = {
            bandwidth: stats.bandwidth,
            latency: stats.latency,
            packetLoss: stats.packetLoss,
            quality: quality,
            resolution: stats.resolution,
            frameRate: stats.frameRate
          };
          
          this.callbacks.onConnectionStats(connectionStats);
        },
        onLocalStream: (stream) => {
          console.log('📹 P2P local stream received');
          this.callbacks.onLocalStream?.(stream);
        },
        onRemoteStream: (stream) => {
          console.log('📹 P2P remote stream received');
          this.callbacks.onRemoteStream?.(stream);
        },
        onMessage: (message) => {
          const videoMessage: VideoMessage = {
            id: message.id,
            userId: message.userId,
            userName: message.userName,
            content: message.content,
            timestamp: message.timestamp.getTime(),
            type: message.type as 'text' | 'system'
          };
          this.callbacks.onMessage?.(videoMessage);
        },
        onError: (error) => {
          console.error('❌ P2P error:', error);
          this.callbacks.onError(error, true);
        },
        onRemoteAudioToggle: (muted) => {
          console.log('🎤 P2P remote audio toggle:', muted);
        },
        onRemoteVideoToggle: (enabled) => {
          console.log('📹 P2P remote video toggle:', enabled);
        }
      };

      this.p2pService = new P2PWebRTCService(
        this.config.sessionId,
        this.config.userId,
        this.config.userName,
        this.config.otherUserId,
        p2pCallbacks
      );

      await this.p2pService.initialize();
      
      console.log('✅ P2P WebRTC service initialized successfully');
      return true;
      
    } catch (error) {
      console.error('❌ Failed to initialize P2P WebRTC:', error);
      return false;
    }
  }

  // Simple provider failure handling
  private async handleProviderFailure(provider: VideoProvider, reason: string): Promise<void> {
    console.log(`❌ Provider ${provider} failed: ${reason}`);
    
    // Simple approach: just show error message
    this.callbacks.onError(
      `Video connection failed. Chat is still working.`, 
      false
    );
  }

  // Public methods
  async toggleAudio(): Promise<boolean> {
    console.log('🎤 Audio toggle requested, currentService:', this.currentService);
    
    // COMMENTED OUT: Daily.co not currently used
    // if (this.currentService === 'daily' && this.dailyService) {
    //   return await this.dailyService.toggleAudio();
    // } else if (this.currentService === 'p2p' && this.p2pService) {
    if (this.currentService === 'p2p' && this.p2pService) {
      return this.p2pService.toggleAudio();
    }
    
    console.warn('⚠️ No active video service for audio toggle');
    return false;
  }

  async toggleVideo(): Promise<boolean> {
    console.log('📹 Video toggle requested, currentService:', this.currentService);
    
    // COMMENTED OUT: Daily.co not currently used
    // if (this.currentService === 'daily' && this.dailyService) {
    //   return await this.dailyService.toggleVideo();
    // } else if (this.currentService === 'p2p' && this.p2pService) {
    if (this.currentService === 'p2p' && this.p2pService) {
      return this.p2pService.toggleVideo();
    }
    
    console.warn('⚠️ No active video service for video toggle');
    return false;
  }

  getCurrentService(): VideoServiceType {
    return this.currentService;
  }

  getDetailedStatus(): any {
    return {
      currentService: this.currentService,
      selectedProvider: this.selectedProvider,
      isInitialized: this.isInitialized,
      retryCount: this.retryCount,
      providerQualities: this.providerCoordinator.getProviderQualities()
    };
  }

  async endCall(): Promise<void> {
    console.log('🔚 Ending video call...');
    
    // Cleanup services
    // COMMENTED OUT: Daily.co not currently used
    // if (this.dailyService) {
    //   await this.dailyService.leave();
    //   await this.dailyService.destroy();
    //   this.dailyService = null;
    // }
    
    if (this.p2pService) {
      await this.p2pService.endCall();
      this.p2pService = null;
    }
    
    // Stop orientation monitoring
    this.orientationService.stopListening();
    
    // Update state
    this.currentService = 'none';
    this.isInitialized = false;
    this.callbacks.onStateChange('ended');
    
    console.log('✅ Video call ended and cleaned up');
  }

  // Utility methods
  private getDeviceType(): string {
    if (typeof window === 'undefined') return 'unknown';
    
    const userAgent = navigator.userAgent;
    if (/Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent)) {
      return 'mobile';
    } else if (/iPad/i.test(userAgent)) {
      return 'tablet';
    } else {
      return 'desktop';
    }
  }

  private getBrowserInfo(): any {
    if (typeof window === 'undefined') return {};
    
    const userAgent = navigator.userAgent;
    let browserName = 'Unknown';
    let browserVersion = 'Unknown';
    
    if (userAgent.includes('Chrome')) {
      browserName = 'Chrome';
      const match = userAgent.match(/Chrome\/(\d+)/);
      browserVersion = match ? match[1] : 'Unknown';
    } else if (userAgent.includes('Firefox')) {
      browserName = 'Firefox';
      const match = userAgent.match(/Firefox\/(\d+)/);
      browserVersion = match ? match[1] : 'Unknown';
    } else if (userAgent.includes('Safari')) {
      browserName = 'Safari';
      const match = userAgent.match(/Version\/(\d+)/);
      browserVersion = match ? match[1] : 'Unknown';
    }
    
    return {
      name: browserName,
      version: browserVersion,
      userAgent: userAgent
    };
  }

  private getNetworkType(): string {
    if (typeof window === 'undefined') return 'unknown';
    
    const connection = (navigator as any).connection;
    if (connection) {
      return connection.effectiveType || connection.type || 'unknown';
    }
    
    return 'unknown';
  }
}