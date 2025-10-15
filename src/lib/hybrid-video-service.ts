// ============================================================================
// HYBRID VIDEO SERVICE
// ============================================================================
// Manages video calling with Jitsi Meet as primary and WebRTC as fallback
// Provides seamless switching between video calling methods
// ============================================================================

import { JitsiService, createJitsiConfig, type JitsiConnectionState } from './jitsi-service';
import { WebRTCManager, type ConnectionState } from './webrtc-manager';

export type VideoProvider = 'jitsi' | 'webrtc';
export type HybridConnectionState = 'initializing' | 'connecting' | 'connected' | 'reconnecting' | 'failed' | 'disconnected' | 'waiting';

export interface HybridVideoCallbacks {
  onConnectionStateChange: (state: HybridConnectionState) => void;
  onProviderChange: (provider: VideoProvider) => void;
  onError: (error: string) => void;
  onUserNotification?: (message: string) => void;
  onRemoteStream?: (stream: MediaStream) => void;
}

export interface VideoParticipant {
  userId: string;
  displayName: string;
  email?: string;
  avatarURL?: string;
}

export class HybridVideoService {
  private jitsiService: JitsiService | null = null;
  private webrtcManager: WebRTCManager | null = null;
  private currentProvider: VideoProvider | null = null;
  private connectionState: HybridConnectionState = 'initializing';
  private localStream: MediaStream | null = null;
  
  private sessionId: string;
  private currentUser: VideoParticipant;
  private remoteUser: VideoParticipant;
  private callbacks: HybridVideoCallbacks;
  
  private jitsiContainer: HTMLElement | null = null;
  private fallbackAttempted: boolean = false;
  private maxRetries: number = 2;
  private retryCount: number = 0;

  constructor(
    sessionId: string,
    currentUser: VideoParticipant,
    remoteUser: VideoParticipant,
    callbacks: HybridVideoCallbacks
  ) {
    this.sessionId = sessionId;
    this.currentUser = currentUser;
    this.remoteUser = remoteUser;
    this.callbacks = callbacks;
  }

  // Initialize video calling - try Jitsi first, fallback to WebRTC
  async initialize(localStream: MediaStream, jitsiContainer?: HTMLElement): Promise<void> {
    try {
      this.localStream = localStream;
      this.jitsiContainer = jitsiContainer || null;
      this.updateConnectionState('connecting');

      // Try Jitsi Meet first
      const jitsiAvailable = await JitsiService.checkAvailability();
      
      if (jitsiAvailable && this.jitsiContainer) {
        console.log('Attempting to connect via Jitsi Meet...');
        await this.initializeJitsi();
      } else {
        console.log('Jitsi not available, using WebRTC fallback...');
        await this.initializeWebRTC();
      }
    } catch (error) {
      console.error('Failed to initialize video service:', error);
      this.handleConnectionFailure(error);
    }
  }

  // Initialize Jitsi Meet
  private async initializeJitsi(): Promise<void> {
    try {
      if (!this.jitsiContainer) {
        throw new Error('Jitsi container not provided');
      }

      // Create Jitsi configuration
      const jitsiConfig = await createJitsiConfig(
        this.sessionId,
        this.currentUser.userId,
        {
          displayName: this.currentUser.displayName,
          email: this.currentUser.email,
          avatarURL: this.currentUser.avatarURL
        }
      );

      // Initialize Jitsi service
      this.jitsiService = new JitsiService(jitsiConfig, {
        onReady: () => {
          console.log('Jitsi Meet ready');
          this.currentProvider = 'jitsi';
          this.updateConnectionState('connected');
          this.callbacks.onProviderChange('jitsi');
          this.callbacks.onUserNotification?.('Connected via Jitsi Meet');
        },
        onJoined: () => {
          console.log('Joined Jitsi conference');
        },
        onLeft: () => {
          console.log('Left Jitsi conference');
          this.updateConnectionState('disconnected');
        },
        onError: (error) => {
          console.error('Jitsi error:', error);
          this.handleJitsiFailure(error);
        },
        onConnectionFailed: () => {
          console.error('Jitsi connection failed');
          this.handleJitsiFailure(new Error('Jitsi connection failed'));
        },
        onParticipantJoined: (participant) => {
          console.log('Participant joined Jitsi:', participant);
          this.callbacks.onUserNotification?.(`${participant.displayName || 'Participant'} joined the call`);
        },
        onParticipantLeft: (participant) => {
          console.log('Participant left Jitsi:', participant);
          this.callbacks.onUserNotification?.(`${participant.displayName || 'Participant'} left the call`);
        }
      });

      await this.jitsiService.initialize(this.jitsiContainer);
      
    } catch (error) {
      console.error('Failed to initialize Jitsi:', error);
      await this.handleJitsiFailure(error);
    }
  }

  // Initialize WebRTC fallback
  private async initializeWebRTC(): Promise<void> {
    try {
      if (!this.localStream) {
        throw new Error('Local stream not available for WebRTC');
      }

      console.log('Initializing WebRTC fallback...');
      
      this.webrtcManager = new WebRTCManager(
        this.sessionId,
        this.currentUser.userId,
        this.remoteUser.userId,
        this.currentUser.displayName,
        (remoteStream) => {
          console.log('WebRTC remote stream received');
          this.callbacks.onRemoteStream?.(remoteStream);
        },
        (state) => {
          console.log('WebRTC connection state:', state);
          this.handleWebRTCStateChange(state);
        },
        (error) => {
          console.error('WebRTC error:', error);
          this.callbacks.onError(error);
        },
        (notification) => {
          this.callbacks.onUserNotification?.(notification);
        }
      );

      await this.webrtcManager.initialize(this.localStream);
      this.currentProvider = 'webrtc';
      this.callbacks.onProviderChange('webrtc');
      
    } catch (error) {
      console.error('Failed to initialize WebRTC:', error);
      this.handleConnectionFailure(error);
    }
  }

  // Handle Jitsi failure and fallback to WebRTC
  private async handleJitsiFailure(error: any): Promise<void> {
    console.log('Jitsi failed, attempting WebRTC fallback...');
    
    if (this.fallbackAttempted) {
      this.handleConnectionFailure(error);
      return;
    }

    this.fallbackAttempted = true;
    this.callbacks.onUserNotification?.('Switching to backup connection...');
    
    // Clean up Jitsi
    if (this.jitsiService) {
      this.jitsiService.dispose();
      this.jitsiService = null;
    }

    // Try WebRTC
    try {
      await this.initializeWebRTC();
    } catch (webrtcError) {
      console.error('WebRTC fallback also failed:', webrtcError);
      this.handleConnectionFailure(webrtcError);
    }
  }

  // Handle WebRTC state changes
  private handleWebRTCStateChange(state: ConnectionState): void {
    switch (state) {
      case 'connecting':
        this.updateConnectionState('connecting');
        break;
      case 'connected':
        this.updateConnectionState('connected');
        break;
      case 'reconnecting':
        this.updateConnectionState('reconnecting');
        break;
      case 'failed':
        this.handleWebRTCFailure();
        break;
      case 'waiting':
        this.updateConnectionState('waiting');
        break;
      case 'disconnected':
        this.updateConnectionState('disconnected');
        break;
      default:
        this.updateConnectionState(state as HybridConnectionState);
    }
  }

  // Handle WebRTC failure
  private handleWebRTCFailure(): void {
    if (this.retryCount < this.maxRetries) {
      this.retryCount++;
      console.log(`WebRTC failed, retry attempt ${this.retryCount}/${this.maxRetries}`);
      this.updateConnectionState('reconnecting');
      
      setTimeout(() => {
        this.retryConnection();
      }, 2000 * this.retryCount); // Exponential backoff
    } else {
      this.handleConnectionFailure(new Error('WebRTC connection failed after retries'));
    }
  }

  // Retry connection
  private async retryConnection(): Promise<void> {
    try {
      if (this.currentProvider === 'webrtc' && this.localStream) {
        // Clean up existing WebRTC
        if (this.webrtcManager) {
          await this.webrtcManager.cleanup();
          this.webrtcManager = null;
        }
        
        // Reinitialize WebRTC
        await this.initializeWebRTC();
      }
    } catch (error) {
      console.error('Retry failed:', error);
      this.handleConnectionFailure(error);
    }
  }

  // Handle final connection failure
  private handleConnectionFailure(error: any): void {
    console.error('All connection methods failed:', error);
    this.updateConnectionState('failed');
    this.callbacks.onError('Unable to establish video connection. Please check your internet connection and try again.');
  }

  // Update connection state
  private updateConnectionState(state: HybridConnectionState): void {
    if (this.connectionState !== state) {
      this.connectionState = state;
      this.callbacks.onConnectionStateChange(state);
    }
  }

  // Control methods
  toggleAudio(): void {
    if (this.currentProvider === 'jitsi' && this.jitsiService) {
      this.jitsiService.toggleAudio();
    } else if (this.currentProvider === 'webrtc' && this.webrtcManager) {
      // Get current mute state from local stream
      const audioTracks = this.localStream?.getAudioTracks() || [];
      const isMuted = audioTracks.length > 0 && !audioTracks[0].enabled;
      this.webrtcManager.toggleAudio(!isMuted);
    }
  }

  toggleVideo(): void {
    if (this.currentProvider === 'jitsi' && this.jitsiService) {
      this.jitsiService.toggleVideo();
    } else if (this.currentProvider === 'webrtc' && this.webrtcManager) {
      // Get current video state from local stream
      const videoTracks = this.localStream?.getVideoTracks() || [];
      const isVideoOff = videoTracks.length > 0 && !videoTracks[0].enabled;
      this.webrtcManager.toggleVideo(!isVideoOff);
    }
  }

  hangup(): void {
    if (this.currentProvider === 'jitsi' && this.jitsiService) {
      this.jitsiService.hangup();
    }
    // WebRTC cleanup is handled in the cleanup method
  }

  // Get current provider
  getCurrentProvider(): VideoProvider | null {
    return this.currentProvider;
  }

  // Get connection state
  getConnectionState(): HybridConnectionState {
    return this.connectionState;
  }

  // Get participant count (for Jitsi)
  getParticipantCount(): number {
    if (this.currentProvider === 'jitsi' && this.jitsiService) {
      return this.jitsiService.getParticipantCount();
    }
    return this.connectionState === 'connected' ? 2 : 1; // For WebRTC, assume 2 when connected
  }

  // Check if using Jitsi
  isUsingJitsi(): boolean {
    return this.currentProvider === 'jitsi';
  }

  // Check if using WebRTC
  isUsingWebRTC(): boolean {
    return this.currentProvider === 'webrtc';
  }

  // Cleanup all resources
  async cleanup(): Promise<void> {
    console.log('Cleaning up hybrid video service');

    // Clean up Jitsi
    if (this.jitsiService) {
      this.jitsiService.dispose();
      this.jitsiService = null;
    }

    // Clean up WebRTC
    if (this.webrtcManager) {
      await this.webrtcManager.cleanup();
      this.webrtcManager = null;
    }

    // Clean up local stream
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
    }

    this.currentProvider = null;
    this.updateConnectionState('disconnected');
  }
}