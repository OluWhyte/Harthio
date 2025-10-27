/**
 * Simplified Video Manager - One Provider at a Time
 * Use this to test providers individually without complexity
 */

export type ActiveProvider = 'webrtc-only' | 'daily-only' | 'jitsi-public-only' | 'jitsi-self-only';

export interface SimpleVideoConfig {
  sessionId: string;
  displayName: string;
  email?: string;
  avatarUrl?: string;
}

export interface SimpleVideoCallbacks {
  onReady: () => void;
  onJoined: () => void;
  onLeft: () => void;
  onError: (error: any) => void;
  onMessage: (message: { from: string; message: string }) => void;
  onParticipantJoined?: (participant: any) => void;
  onParticipantLeft?: (participant: any) => void;
  onConnectionQualityChanged?: (quality: string) => void;
  onRemoteDeviceInfo?: (deviceInfo: any) => void;
}

export class SimpleVideoManager {
  private activeProvider: ActiveProvider;
  private config: SimpleVideoConfig;
  private callbacks: SimpleVideoCallbacks;
  private containerId: string = '';
  private currentService: any = null;

  constructor(
    provider: ActiveProvider,
    config: SimpleVideoConfig, 
    callbacks: SimpleVideoCallbacks
  ) {
    this.activeProvider = provider;
    this.config = config;
    this.callbacks = callbacks;
  }

  async initialize(containerId: string): Promise<void> {
    this.containerId = containerId;
    console.log(`🎯 SimpleVideoManager: Initializing ${this.activeProvider}`);

    try {
      switch (this.activeProvider) {
        case 'webrtc-only':
          await this.initializeWebRTCOnly();
          break;
        case 'daily-only':
          await this.initializeDailyOnly();
          break;
        case 'jitsi-public-only':
          await this.initializeJitsiPublicOnly();
          break;
        case 'jitsi-self-only':
          await this.initializeJitsiSelfOnly();
          break;
        default:
          throw new Error(`Unknown provider: ${this.activeProvider}`);
      }
      
      console.log(`✅ SimpleVideoManager: ${this.activeProvider} initialized successfully`);
    } catch (error) {
      console.error(`❌ SimpleVideoManager: ${this.activeProvider} failed:`, error);
      this.callbacks.onError(error);
    }
  }

  private async initializeWebRTCOnly(): Promise<void> {
    // Import and use the existing WebRTC manager
    const { FixedWebRTCManager } = await import('./fixed-webrtc-manager');
    
    this.currentService = new FixedWebRTCManager(
      this.config.sessionId,
      'user-' + Date.now(), // userId
      this.config.displayName, // userName
      'other-user', // otherUserId - this should be provided by the session
      {
        onStateChange: (state) => {
          // Map state changes to our callbacks
          if (state === 'connected') {
            this.callbacks.onJoined();
          } else if (state === 'ended' || state === 'failed') {
            this.callbacks.onLeft();
          }
        },
        onQualityChange: (quality, stats) => {
          this.callbacks.onConnectionQualityChanged?.(quality);
        },
        onLocalStream: (stream) => {
          // Local stream ready
          this.callbacks.onReady();
        },
        onRemoteStream: (stream) => {
          // Remote participant joined
          this.callbacks.onParticipantJoined?.({ stream });
        },
        onMessage: (message) => {
          // Convert Message to our expected format
          this.callbacks.onMessage({
            from: message.userName || message.userId,
            message: message.content
          });
        },
        onError: (error) => this.callbacks.onError(error),
        onRemoteAudioToggle: (muted) => {
          // Handle remote audio toggle
        },
        onRemoteVideoToggle: (enabled) => {
          // Handle remote video toggle
        },
        onRemoteDeviceInfo: (deviceInfo) => this.callbacks.onRemoteDeviceInfo?.(deviceInfo),
      }
    );

    await this.currentService.initialize(this.containerId);
  }

  private async initializeDailyOnly(): Promise<void> {
    // Import and use Daily service
    const { DailyService } = await import('./daily-service');
    
    this.currentService = new DailyService(
      {
        roomName: this.config.sessionId,
        displayName: this.config.displayName,
        email: this.config.email,
        avatarUrl: this.config.avatarUrl,
      },
      {
        onReady: () => this.callbacks.onReady(),
        onJoined: () => this.callbacks.onJoined(),
        onLeft: () => this.callbacks.onLeft(),
        onError: (error) => this.callbacks.onError(error),
        onMessage: (message) => this.callbacks.onMessage(message),
        onParticipantJoined: (participant) => this.callbacks.onParticipantJoined?.(participant),
        onParticipantLeft: (participant) => this.callbacks.onParticipantLeft?.(participant),
        onConnectionQualityChanged: (quality) => this.callbacks.onConnectionQualityChanged?.(quality),
        onRemoteDeviceInfo: (deviceInfo) => this.callbacks.onRemoteDeviceInfo?.(deviceInfo),
      }
    );

    await this.currentService.initialize(this.containerId);
  }

  private async initializeJitsiPublicOnly(): Promise<void> {
    // Import and use Jitsi service
    const { JitsiService } = await import('./jitsi-service');
    
    this.currentService = new JitsiService(
      {
        roomName: `harthio-${this.config.sessionId}`,
        displayName: this.config.displayName,
        email: this.config.email,
        avatarUrl: this.config.avatarUrl,
      },
      {
        onReady: () => this.callbacks.onReady(),
        onJoined: () => this.callbacks.onJoined(),
        onLeft: () => this.callbacks.onLeft(),
        onError: (error) => this.callbacks.onError(error),
        onMessage: (message) => this.callbacks.onMessage(message),
        onRemoteDeviceInfo: (deviceInfo) => this.callbacks.onRemoteDeviceInfo?.(deviceInfo),
      }
    );

    await this.currentService.initialize(this.containerId);
  }

  private async initializeJitsiSelfOnly(): Promise<void> {
    // Import and use self-hosted Jitsi service
    const { JitsiSelfService } = await import('./jitsi-self-service');
    
    this.currentService = new JitsiSelfService(
      {
        roomName: `harthio-${this.config.sessionId}`,
        displayName: this.config.displayName,
        email: this.config.email,
        avatarUrl: this.config.avatarUrl,
      },
      {
        onReady: () => this.callbacks.onReady(),
        onJoined: () => this.callbacks.onJoined(),
        onLeft: () => this.callbacks.onLeft(),
        onError: (error) => this.callbacks.onError(error),
        onMessage: (message) => this.callbacks.onMessage(message),
        onRemoteDeviceInfo: (deviceInfo) => this.callbacks.onRemoteDeviceInfo?.(deviceInfo),
      }
    );

    await this.currentService.initialize(this.containerId);
  }

  // Delegate methods to current service
  sendMessage(message: string): void {
    if (this.currentService && 'sendMessage' in this.currentService) {
      this.currentService.sendMessage(message);
    }
  }

  async toggleAudio(): Promise<boolean | undefined> {
    if (this.currentService && 'toggleAudio' in this.currentService) {
      return await this.currentService.toggleAudio();
    }
    return undefined;
  }

  async toggleVideo(): Promise<boolean | undefined> {
    if (this.currentService && 'toggleVideo' in this.currentService) {
      return await this.currentService.toggleVideo();
    }
    return undefined;
  }

  hangup(): void {
    if (this.currentService && 'hangup' in this.currentService) {
      this.currentService.hangup();
    }
  }

  dispose(): void {
    if (this.currentService && 'dispose' in this.currentService) {
      this.currentService.dispose();
    }
    this.currentService = null;
  }

  getCurrentProvider(): ActiveProvider {
    return this.activeProvider;
  }

  isConnected(): boolean {
    if (this.currentService && 'isConnected' in this.currentService) {
      return this.currentService.isConnected();
    }
    return false;
  }

  sendDeviceInfo(deviceInfo: any): void {
    if (this.currentService && 'sendDeviceInfo' in this.currentService) {
      this.currentService.sendDeviceInfo(deviceInfo);
    }
  }
}

// Configuration helper - change this to test different providers
export const CURRENT_TEST_PROVIDER: ActiveProvider = 'webrtc-only'; // Change this to test others

// Factory function for easy switching
export function createSimpleVideoManager(
  config: SimpleVideoConfig,
  callbacks: SimpleVideoCallbacks
): SimpleVideoManager {
  return new SimpleVideoManager(CURRENT_TEST_PROVIDER, config, callbacks);
}