/**
 * Video Service Manager
 * Intelligently manages multiple video calling providers with fallback
 * Optimized for African mobile networks
 */

import {
  JitsiService,
  type JitsiConfig,
  type JitsiCallbacks,
} from "./jitsi-service";
import {
  JitsiSelfService,
  type JitsiSelfConfig,
  type JitsiSelfCallbacks,
} from "./jitsi-self-service";
import {
  DailyService,
  type DailyConfig,
  type DailyCallbacks,
} from "./daily-service";

export type VideoProvider = "jitsi-public" | "daily" | "jitsi-self" | "webrtc";
export type ConnectionState =
  | "initializing"
  | "connecting"
  | "connected"
  | "reconnecting"
  | "failed"
  | "ended";

export interface VideoServiceConfig {
  sessionId: string;
  displayName: string;
  email?: string;
  avatarUrl?: string;
}

export interface VideoServiceCallbacks {
  onReady: () => void;
  onJoined: () => void;
  onLeft: () => void;
  onError: (error: any, provider: VideoProvider) => void;
  onMessage: (message: { from: string; message: string }) => void;
  onParticipantJoined: (participant: any) => void;
  onParticipantLeft: (participant: any) => void;
  onConnectionQualityChanged: (quality: string) => void;
  onProviderChanged: (provider: VideoProvider, reason: string) => void;
  onRemoteDeviceInfo?: (deviceInfo: any) => void;
}

export class VideoServiceManager {
  private currentProvider: VideoProvider | null = null;
  private currentService: JitsiService | JitsiSelfService | DailyService | null = null;
  private config: VideoServiceConfig;
  private callbacks: VideoServiceCallbacks;
  private fallbackAttempts = 0;
  private maxFallbackAttempts = 4; // Match the number of providers
  private containerId: string = "";

  // Provider priority - try embedded providers first, WebRTC as last resort
  private providerPriority: VideoProvider[] = [
    "daily", // Good with API key - excellent mobile optimization
    "jitsi-public", // Reliable public Jitsi fallback
    "jitsi-self", // Your self-hosted with coturn
    "webrtc", // Last resort - handled by parent component
  ];

  constructor(config: VideoServiceConfig, callbacks: VideoServiceCallbacks) {
    this.config = config;
    this.callbacks = callbacks;
  }

  async initialize(containerId: string): Promise<void> {
    this.containerId = containerId;
    await this.tryNextProvider();
  }

  private async tryNextProvider(): Promise<void> {
    if (this.fallbackAttempts >= this.maxFallbackAttempts) {
      console.error('🚨 All video providers failed, no more options');
      this.callbacks.onError(new Error("All video providers failed"), "webrtc");
      return;
    }

    const provider = this.providerPriority[this.fallbackAttempts];
    console.log(`🔄 Trying video provider ${this.fallbackAttempts + 1}/${this.maxFallbackAttempts}: ${provider}`);
    this.fallbackAttempts++;

    try {
      console.log(`📡 Initializing ${provider}...`);
      await this.initializeProvider(provider);
      console.log(`✅ ${provider} initialized successfully`);
    } catch (error) {
      console.error(`❌ Provider ${provider} failed:`, error);
      console.log(`🔄 Will try next provider in 1 second...`);

      // Try next provider
      setTimeout(() => {
        this.tryNextProvider();
      }, 1000);
    }
  }

  private async initializeProvider(provider: VideoProvider): Promise<void> {
    // Clean up current service
    if (this.currentService) {
      this.currentService.dispose();
      this.currentService = null;
    }

    this.currentProvider = provider;

    // Handle WebRTC fallback first - no container needed
    if (provider === "webrtc") {
      // Signal that WebRTC fallback is needed - don't throw error
      this.callbacks.onProviderChanged("webrtc", "All other providers failed");
      this.callbacks.onError(
        new Error("WebRTC fallback needed - handled by parent"),
        "webrtc"
      );
      return; // Don't throw, let parent handle WebRTC
    }

    const container = document.getElementById(this.containerId);
    if (!container) {
      throw new Error(`Container ${this.containerId} not found`);
    }

    // Clear container
    container.innerHTML = "";

    switch (provider) {
      case "jitsi-public":
        await this.initializeJitsiPublic();
        break;
      case "daily":
        await this.initializeDaily();
        break;
      case "jitsi-self":
        await this.initializeJitsiSelf();
        break;
      default:
        throw new Error(`Unknown provider: ${provider}`);
    }

    console.log(`✅ Successfully initialized provider: ${provider}`);
    this.callbacks.onProviderChanged(
      provider,
      this.fallbackAttempts === 1 ? "Primary choice" : "Fallback"
    );
  }

  private async initializeJitsiPublic(): Promise<void> {
    const jitsiConfig: JitsiConfig = {
      roomName: `harthio-${this.config.sessionId}`,
      displayName: this.config.displayName,
      email: this.config.email,
      avatarUrl: this.config.avatarUrl,
    };

    const jitsiCallbacks: JitsiCallbacks = {
      onReady: () => this.callbacks.onReady(),
      onJoined: () => {
        console.log('📡 Jitsi Public: Successfully joined meeting');
        this.callbacks.onJoined();
      },
      onLeft: () => this.callbacks.onLeft(),
      onError: (error) => {
        console.error("Jitsi Public error:", error);
        // Try next provider
        setTimeout(() => this.tryNextProvider(), 1000);
      },
      onMessage: (message) => this.callbacks.onMessage(message),
      onRemoteDeviceInfo: (deviceInfo) => {
        console.log('📱 Jitsi Public: Received remote device info:', deviceInfo);
        this.callbacks.onRemoteDeviceInfo?.(deviceInfo);
      },
    };

    this.currentService = new JitsiService(jitsiConfig, jitsiCallbacks);
    await this.currentService.initialize(this.containerId);
  }

  private async initializeDaily(): Promise<void> {
    const dailyConfig: DailyConfig = {
      roomName: this.config.sessionId,
      displayName: this.config.displayName,
      email: this.config.email,
      avatarUrl: this.config.avatarUrl,
    };

    const dailyCallbacks: DailyCallbacks = {
      onReady: () => this.callbacks.onReady(),
      onJoined: () => {
        console.log('📡 Daily: Successfully joined meeting');
        this.callbacks.onJoined();
      },
      onLeft: () => this.callbacks.onLeft(),
      onError: (error) => {
        console.error("Daily error:", error);
        // Try next provider
        setTimeout(() => this.tryNextProvider(), 1000);
      },
      onMessage: (message) => this.callbacks.onMessage(message),
      onParticipantJoined: (participant) =>
        this.callbacks.onParticipantJoined(participant),
      onParticipantLeft: (participant) =>
        this.callbacks.onParticipantLeft(participant),
      onConnectionQualityChanged: (quality) =>
        this.callbacks.onConnectionQualityChanged(quality),
      onRemoteDeviceInfo: (deviceInfo) => {
        console.log('📱 Daily: Received remote device info:', deviceInfo);
        this.callbacks.onRemoteDeviceInfo?.(deviceInfo);
      },
    };

    this.currentService = new DailyService(dailyConfig, dailyCallbacks);
    await this.currentService.initialize(this.containerId);
  }

  private async initializeJitsiSelf(): Promise<void> {
    // Use your self-hosted Jitsi with custom domain and coturn
    const jitsiSelfConfig: JitsiSelfConfig = {
      roomName: `harthio-${this.config.sessionId}`,
      displayName: this.config.displayName,
      email: this.config.email,
      avatarUrl: this.config.avatarUrl,
    };

    const jitsiSelfCallbacks: JitsiSelfCallbacks = {
      onReady: () => this.callbacks.onReady(),
      onJoined: () => this.callbacks.onJoined(),
      onLeft: () => this.callbacks.onLeft(),
      onError: (error) => {
        console.error("Jitsi Self error:", error);
        // Try next provider
        setTimeout(() => this.tryNextProvider(), 1000);
      },
      onMessage: (message) => this.callbacks.onMessage(message),
      onRemoteDeviceInfo: (deviceInfo) => this.callbacks.onRemoteDeviceInfo?.(deviceInfo),
    };

    this.currentService = new JitsiSelfService(jitsiSelfConfig, jitsiSelfCallbacks);
    await this.currentService.initialize(this.containerId);
  }

  // Public methods that delegate to current service
  sendMessage(message: string): void {
    if (this.currentService) {
      this.currentService.sendMessage(message);
    }
  }

  async toggleAudio(): Promise<boolean | undefined> {
    console.log("🎤 VideoServiceManager: toggleAudio called");
    if (this.currentService) {
      if ("toggleAudio" in this.currentService) {
        console.log(`🎤 Delegating to ${this.currentProvider} service`);
        const result = await this.currentService.toggleAudio();
        console.log(`🎤 Service returned muted state: ${result}`);
        return result;
      } else {
        console.warn(
          `🎤 Current service ${this.currentProvider} does not support toggleAudio`
        );
      }
    } else {
      console.warn("🎤 No current service available for toggleAudio");
    }
    return undefined;
  }

  async toggleVideo(): Promise<boolean | undefined> {
    console.log("📹 VideoServiceManager: toggleVideo called");
    if (this.currentService) {
      if ("toggleVideo" in this.currentService) {
        console.log(`📹 Delegating to ${this.currentProvider} service`);
        const result = await this.currentService.toggleVideo();
        console.log(`📹 Service returned video off state: ${result}`);
        return result;
      } else {
        console.warn(
          `📹 Current service ${this.currentProvider} does not support toggleVideo`
        );
      }
    } else {
      console.warn("📹 No current service available for toggleVideo");
    }
    return undefined;
  }

  hangup(): void {
    if (this.currentService) {
      this.currentService.hangup();
    }
  }

  dispose(): void {
    if (this.currentService) {
      this.currentService.dispose();
      this.currentService = null;
    }
    this.currentProvider = null;
    this.fallbackAttempts = 0;
  }

  getCurrentProvider(): VideoProvider | null {
    return this.currentProvider;
  }

  isConnected(): boolean {
    return this.currentService ? this.currentService.isConnected() : false;
  }

  async getConnectionStats(): Promise<any> {
    if (this.currentService) {
      return await this.currentService.getConnectionStats();
    }
    return null;
  }

  // Force switch to specific provider (for testing)
  async switchToProvider(provider: VideoProvider): Promise<void> {
    this.fallbackAttempts = this.providerPriority.indexOf(provider);
    await this.initializeProvider(provider);
  }

  // Get current audio/video states from the active service
  getCurrentStates(): { isAudioMuted: boolean; isVideoOff: boolean } {
    console.log("🔧 VideoServiceManager: getCurrentStates called");
    if (this.currentService) {
      if ("getCurrentStates" in this.currentService) {
        const states = (this.currentService as any).getCurrentStates();
        console.log(`🔧 Service returned states: audio muted=${states.isAudioMuted}, video off=${states.isVideoOff}`);
        return states;
      } else {
        console.warn(`🔧 Current service ${this.currentProvider} does not support getCurrentStates`);
      }
    } else {
      console.warn("🔧 No current service available for getCurrentStates");
    }
    
    return {
      isAudioMuted: false,
      isVideoOff: false
    };
  }

  // Set initial mute states (call after initialization)
  async setInitialMuteStates(
    audioMuted: boolean,
    videoOff: boolean
  ): Promise<void> {
    console.log(
      `🔧 VideoServiceManager: Setting initial mute states - audio: ${audioMuted}, video: ${videoOff}`
    );
    if (this.currentService) {
      if ("setInitialMuteStates" in this.currentService) {
        await (this.currentService as any).setInitialMuteStates(
          audioMuted,
          videoOff
        );
      } else {
        console.warn(
          `🔧 Current service ${this.currentProvider} does not support setInitialMuteStates`
        );
        // Fallback: use toggle methods if initial state doesn't match desired state
        // This is a bit hacky but works for services that don't have explicit set methods
        if (audioMuted) {
          await this.toggleAudio(); // Assume service starts unmuted, so toggle to mute
        }
        if (videoOff) {
          await this.toggleVideo(); // Assume service starts with video on, so toggle to off
        }
      }
    }
  }

  // Get available providers
  getAvailableProviders(): VideoProvider[] {
    return [...this.providerPriority];
  }

  // Manual retry with current provider
  async retry(): Promise<void> {
    if (this.currentProvider) {
      await this.initializeProvider(this.currentProvider);
    }
  }

  // Send device info to remote participants
  sendDeviceInfo(deviceInfo: any): void {
    if (this.currentService && 'sendDeviceInfo' in this.currentService) {
      (this.currentService as any).sendDeviceInfo(deviceInfo);
    }
  }
}
