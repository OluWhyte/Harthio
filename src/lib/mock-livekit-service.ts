/**
 * Mock LiveKit Service for Local Testing
 * Simulates LiveKit functionality without requiring a server
 */

import { ConnectionState } from 'livekit-client';

export interface MockLiveKitConfig {
  serverUrl: string;
  roomName: string;
  participantName: string;
  token: string;
}

export interface MockLiveKitCallbacks {
  onConnected: () => void;
  onDisconnected: () => void;
  onParticipantJoined: (participant: any) => void;
  onParticipantLeft: (participant: any) => void;
  onTrackSubscribed: (track: any, participant: any) => void;
  onTrackUnsubscribed: (track: any, participant: any) => void;
  onError: (error: Error) => void;
  onConnectionStateChanged: (state: ConnectionState) => void;
}

export class MockLiveKitService {
  private config: MockLiveKitConfig;
  private callbacks: MockLiveKitCallbacks;
  private isConnected = false;
  private localStream: MediaStream | null = null;
  private isAudioMuted = false;
  private isVideoOff = false;
  private connectionState: ConnectionState = ConnectionState.Disconnected;

  constructor(config: MockLiveKitConfig, callbacks: MockLiveKitCallbacks) {
    this.config = config;
    this.callbacks = callbacks;
    
    console.log('🧪 Mock LiveKit Service initialized for testing');
    console.log('   Room:', config.roomName);
    console.log('   Participant:', config.participantName);
  }

  /**
   * Simulate connection to LiveKit room
   */
  async connect(): Promise<void> {
    console.log('🔗 Mock: Connecting to room...');
    
    this.connectionState = ConnectionState.Connecting;
    this.callbacks.onConnectionStateChanged(this.connectionState);
    
    // Simulate connection delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    this.isConnected = true;
    this.connectionState = ConnectionState.Connected;
    
    this.callbacks.onConnectionStateChanged(this.connectionState);
    this.callbacks.onConnected();
    
    console.log('✅ Mock: Connected to room');
  }

  /**
   * Simulate enabling camera and microphone
   */
  async enableCameraAndMicrophone(): Promise<void> {
    console.log('📹 Mock: Enabling camera and microphone...');
    
    try {
      // Get real user media for testing
      this.localStream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480 },
        audio: true
      });
      
      console.log('✅ Mock: Camera and microphone enabled');
    } catch (error) {
      console.error('❌ Mock: Failed to get user media:', error);
      this.callbacks.onError(error as Error);
      throw error;
    }
  }

  /**
   * Simulate toggling microphone
   */
  async toggleMicrophone(): Promise<boolean> {
    this.isAudioMuted = !this.isAudioMuted;
    
    if (this.localStream) {
      const audioTracks = this.localStream.getAudioTracks();
      audioTracks.forEach(track => {
        track.enabled = !this.isAudioMuted;
      });
    }
    
    console.log(`🎤 Mock: Microphone ${this.isAudioMuted ? 'muted' : 'unmuted'}`);
    return this.isAudioMuted;
  }

  /**
   * Simulate toggling camera
   */
  async toggleCamera(): Promise<boolean> {
    this.isVideoOff = !this.isVideoOff;
    
    if (this.localStream) {
      const videoTracks = this.localStream.getVideoTracks();
      videoTracks.forEach(track => {
        track.enabled = !this.isVideoOff;
      });
    }
    
    console.log(`📹 Mock: Camera ${this.isVideoOff ? 'disabled' : 'enabled'}`);
    return !this.isVideoOff;
  }

  /**
   * Get local video element
   */
  getLocalVideoElement(): HTMLVideoElement | null {
    if (!this.localStream) return null;
    
    const video = document.createElement('video');
    video.srcObject = this.localStream;
    video.autoplay = true;
    video.muted = true; // Prevent echo
    video.playsInline = true;
    
    return video;
  }

  /**
   * Get mock remote video element
   */
  getRemoteVideoElement(): HTMLVideoElement | null {
    // For testing, we'll create a mock remote video
    const video = document.createElement('video');
    
    // Create a canvas with animated content to simulate remote video
    const canvas = document.createElement('canvas');
    canvas.width = 640;
    canvas.height = 480;
    const ctx = canvas.getContext('2d');
    
    if (ctx) {
      // Animate the canvas
      let frame = 0;
      const animate = () => {
        ctx.fillStyle = `hsl(${frame % 360}, 50%, 50%)`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.fillStyle = 'white';
        ctx.font = '24px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Mock Remote Participant', canvas.width / 2, canvas.height / 2);
        ctx.fillText(`Frame: ${frame}`, canvas.width / 2, canvas.height / 2 + 40);
        
        frame++;
        requestAnimationFrame(animate);
      };
      animate();
      
      // Convert canvas to video stream
      const stream = canvas.captureStream(30);
      video.srcObject = stream;
      video.autoplay = true;
      video.playsInline = true;
    }
    
    // Simulate remote participant joining after a delay
    setTimeout(() => {
      const mockParticipant = {
        identity: 'mock-remote-user',
        name: 'Mock Remote User'
      };
      
      this.callbacks.onParticipantJoined(mockParticipant);
      this.callbacks.onTrackSubscribed({ kind: 'video' }, mockParticipant);
    }, 2000);
    
    return video;
  }

  /**
   * Get connection state
   */
  getConnectionState(): ConnectionState {
    return this.connectionState;
  }

  /**
   * Get participant count (mock)
   */
  getParticipantCount(): number {
    return this.isConnected ? 2 : 1; // Self + 1 mock participant when connected
  }

  /**
   * Simulate disconnect
   */
  async disconnect(): Promise<void> {
    console.log('🔌 Mock: Disconnecting...');
    
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
    }
    
    this.isConnected = false;
    this.connectionState = ConnectionState.Disconnected;
    
    this.callbacks.onConnectionStateChanged(this.connectionState);
    this.callbacks.onDisconnected();
    
    console.log('✅ Mock: Disconnected');
  }

  /**
   * Get current mute states
   */
  getCurrentStates(): { isAudioMuted: boolean; isVideoOff: boolean } {
    return {
      isAudioMuted: this.isAudioMuted,
      isVideoOff: this.isVideoOff
    };
  }

  /**
   * Check if connected
   */
  isRoomConnected(): boolean {
    return this.isConnected && this.connectionState === ConnectionState.Connected;
  }
}