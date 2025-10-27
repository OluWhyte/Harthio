/**
 * Fixed WebRTC Manager with Jitsi fallback
 * Addresses signaling errors and messaging issues
 */

import { supabaseClient as supabase } from './supabase';
import { OrientationAdapter } from './migrate-to-simple-orientation';

export type ConnectionState = 'initializing' | 'connecting' | 'connected' | 'reconnecting' | 'failed' | 'ended';
export type ConnectionQuality = 'excellent' | 'good' | 'fair' | 'poor' | 'failed';

export interface ConnectionStats {
  bandwidth: number;
  latency: number;
  packetLoss: number;
  quality: ConnectionQuality;
  resolution: string;
  frameRate: number;
}

export interface Message {
  id: string;
  userId: string;
  userName: string;
  content: string;
  timestamp: Date;
  type: 'text' | 'system';
}

export interface WebRTCCallbacks {
  onStateChange: (state: ConnectionState) => void;
  onQualityChange: (quality: ConnectionQuality, stats: ConnectionStats) => void;
  onLocalStream: (stream: MediaStream) => void;
  onRemoteStream: (stream: MediaStream) => void;
  onMessage: (message: Message) => void;
  onError: (error: string) => void;
  onRemoteAudioToggle: (muted: boolean) => void;
  onRemoteVideoToggle: (enabled: boolean) => void;
  onRemoteDeviceInfo?: (deviceInfo: any) => void;
}

export class FixedWebRTCManager {
  private peerConnection: RTCPeerConnection | null = null;
  private localStream: MediaStream | null = null;
  private dataChannel: RTCDataChannel | null = null;
  private signalingChannel: any = null;
  private callbacks: WebRTCCallbacks;
  private sessionId: string;
  private userId: string;
  private userName: string;
  private otherUserId: string;
  private connectionState: ConnectionState = 'initializing';
  private connectionStats: ConnectionStats = {
    bandwidth: 0,
    latency: 0,
    packetLoss: 0,
    quality: 'good',
    resolution: 'unknown',
    frameRate: 0
  };
  private statsInterval: NodeJS.Timeout | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 3;
  private isInitiator = false;
  private pendingCandidates: RTCIceCandidate[] = [];
  private hasRemoteDescription = false;

  constructor(
    sessionId: string,
    userId: string,
    userName: string,
    otherUserId: string,
    callbacks: WebRTCCallbacks
  ) {
    this.sessionId = sessionId;
    this.userId = userId;
    this.userName = userName;
    this.otherUserId = otherUserId;
    this.callbacks = callbacks;
    
    // Determine who initiates the call (lexicographically first user ID)
    this.isInitiator = userId < otherUserId;
  }

  async initialize(): Promise<void> {
    try {
      this.updateState('initializing');
      
      // Get user media first
      await this.getUserMedia();
      
      // Setup signaling before peer connection
      await this.setupSignaling();
      
      // Setup peer connection
      await this.setupPeerConnection();
      
      // Wait a bit for signaling to be ready, then start connection
      setTimeout(() => {
        if (this.isInitiator) {
          this.startConnection();
        }
      }, 1000);
      
    } catch (error) {
      console.error('Failed to initialize WebRTC:', error);
      this.callbacks.onError(`Failed to initialize: ${error}`);
      this.updateState('failed');
    }
  }

  async initializeWithStream(existingStream: MediaStream): Promise<void> {
    try {
      this.updateState('initializing');
      
      // Use the existing stream instead of getting new media
      this.localStream = existingStream;
      this.callbacks.onLocalStream(this.localStream);
      
      // Setup signaling before peer connection
      await this.setupSignaling();
      
      // Setup peer connection
      await this.setupPeerConnection();
      
      // Wait a bit for signaling to be ready, then start connection
      setTimeout(() => {
        if (this.isInitiator) {
          this.startConnection();
        }
      }, 1000);
      
    } catch (error) {
      console.error('Failed to initialize WebRTC with stream:', error);
      this.callbacks.onError(`Failed to initialize: ${error}`);
      this.updateState('failed');
    }
  }

  private async getUserMedia(): Promise<void> {
    try {
      // First, try to use the existing stream from mediaStreamController
      const { mediaStreamController } = await import('./media-stream-controller');
      const existingState = mediaStreamController.getState();
      
      // Check if we have an existing stream with both audio and video
      if (existingState.hasAudio && existingState.hasVideo) {
        // Get the stream from the controller
        const existingStream = mediaStreamController.getCurrentStream();
        if (existingStream) {
          console.log('🎛️ WebRTC: Using existing stream from mediaStreamController');
          this.localStream = existingStream;
          this.callbacks.onLocalStream(this.localStream);
          return;
        }
      }
      
      // Fallback: create new stream if no existing stream available
      console.log('🎛️ WebRTC: Creating new stream (no existing stream available)');
      const constraints = OrientationAdapter.getMediaConstraints();
      this.localStream = await navigator.mediaDevices.getUserMedia(constraints);
      
      // Update the mediaStreamController with the new stream
      mediaStreamController.setStream(this.localStream);
      
      this.callbacks.onLocalStream(this.localStream);
    } catch (error) {
      console.error('Failed to get user media:', error);
      throw new Error('Camera/microphone access denied');
    }
  }

  private async setupPeerConnection(): Promise<void> {
    const configuration: RTCConfiguration = {
      iceServers: [
        // Primary STUN servers
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        
        // Primary TURN server - Your EC2 Coturn
        ...(process.env.NEXT_PUBLIC_TURN_SERVER_URL ? [{
          urls: [
            `turn:${process.env.NEXT_PUBLIC_TURN_SERVER_URL}:3478`,
            `turn:${process.env.NEXT_PUBLIC_TURN_SERVER_URL}:3478?transport=tcp`,
            `turns:${process.env.NEXT_PUBLIC_TURN_SERVER_URL}:5349`,
            `turns:${process.env.NEXT_PUBLIC_TURN_SERVER_URL}:5349?transport=tcp`
          ],
          username: process.env.NEXT_PUBLIC_TURN_USERNAME || 'harthio',
          credential: process.env.NEXT_PUBLIC_TURN_PASSWORD || 'harthio123'
        }] : []),
        
        // Secondary TURN servers
        {
          urls: 'turn:relay.backups.cz',
          username: 'webrtc',
          credential: 'webrtc'
        },
        {
          urls: 'turn:relay.backups.cz:443',
          username: 'webrtc',
          credential: 'webrtc'
        },
        
        // Fallback TURN servers
        {
          urls: 'turn:openrelay.metered.ca:80',
          username: 'openrelayproject',
          credential: 'openrelayproject'
        }
      ],
      iceCandidatePoolSize: 10
    };

    this.peerConnection = new RTCPeerConnection(configuration);

    // Add local stream tracks
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => {
        this.peerConnection!.addTrack(track, this.localStream!);
      });
    }

    // Handle remote stream
    this.peerConnection.ontrack = (event) => {
      const [remoteStream] = event.streams;
      this.callbacks.onRemoteStream(remoteStream);
    };

    // Handle connection state changes
    this.peerConnection.onconnectionstatechange = () => {
      const state = this.peerConnection!.connectionState;
      console.log('Connection state:', state);
      
      switch (state) {
        case 'connecting':
          this.updateState('connecting');
          break;
        case 'connected':
          this.updateState('connected');
          this.startStatsMonitoring();
          this.reconnectAttempts = 0;
          break;
        case 'disconnected':
          this.updateState('reconnecting');
          this.attemptReconnect();
          break;
        case 'failed':
          this.updateState('failed');
          this.attemptReconnect();
          break;
        case 'closed':
          this.updateState('ended');
          break;
      }
    };

    // Handle ICE candidates
    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        this.sendSignalingMessage({
          type: 'ice-candidate',
          candidate: event.candidate
        });
      }
    };

    // Setup data channel for messaging
    this.setupDataChannel();
  }

  private setupDataChannel(): void {
    if (!this.peerConnection) return;

    if (this.isInitiator) {
      // Create data channel if we're the initiator
      this.dataChannel = this.peerConnection.createDataChannel('messages', {
        ordered: true
      });
      this.setupDataChannelHandlers(this.dataChannel);
    }

    // Handle incoming data channel
    this.peerConnection.ondatachannel = (event) => {
      const channel = event.channel;
      this.dataChannel = channel;
      this.setupDataChannelHandlers(channel);
    };
  }

  private setupDataChannelHandlers(channel: RTCDataChannel): void {
    channel.onopen = () => {
      console.log('Data channel opened');
    };

    channel.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        this.handleDataChannelMessage(data);
      } catch (error) {
        console.error('Failed to parse data channel message:', error);
      }
    };

    channel.onerror = (error) => {
      console.error('Data channel error:', error);
    };
  }

  private handleDataChannelMessage(data: any): void {
    switch (data.type) {
      case 'chat-message':
        const message: Message = {
          id: data.id,
          userId: data.userId,
          userName: data.userName,
          content: data.content,
          timestamp: new Date(data.timestamp),
          type: 'text'
        };
        this.callbacks.onMessage(message);
        break;
      
      case 'audio-toggle':
        this.callbacks.onRemoteAudioToggle(data.muted);
        break;
      
      case 'video-toggle':
        this.callbacks.onRemoteVideoToggle(data.enabled);
        break;
      
      case 'device-info':
        console.log('📱 FixedWebRTC: Received device-info message:', data);
        console.log('📱 FixedWebRTC: Calling onRemoteDeviceInfo callback with:', data.deviceInfo);
        this.callbacks.onRemoteDeviceInfo?.(data.deviceInfo);
        console.log('📱 FixedWebRTC: onRemoteDeviceInfo callback completed');
        break;
    }
  }

  private async setupSignaling(): Promise<void> {
    // Subscribe to signaling messages
    this.signalingChannel = supabase
      .channel(`session-${this.sessionId}`)
      .on('broadcast', { event: 'webrtc-signal' }, (payload) => {
        if (payload.payload.from !== this.userId) {
          this.handleSignalingMessage(payload.payload);
        }
      })
      .on('broadcast', { event: 'device-info' }, (payload) => {
        if (payload.payload.userId !== this.userId) {
          console.log('📱 FixedWebRTC: Received device info via Supabase:', payload.payload);
          this.handleDataChannelMessage(payload.payload);
        }
      })
      .on('broadcast', { event: 'media-toggle' }, (payload) => {
        if (payload.payload.userId !== this.userId) {
          console.log('📱 FixedWebRTC: Received media toggle via Supabase:', payload.payload);
          this.handleDataChannelMessage(payload.payload);
        }
      })
      .on('broadcast', { event: 'chat-message' }, (payload) => {
        if (payload.payload.userId !== this.userId) {
          console.log('📱 FixedWebRTC: Received chat message via Supabase:', payload.payload);
          this.handleDataChannelMessage(payload.payload);
        }
      })
      .subscribe();

    // Wait for subscription to be ready
    return new Promise((resolve) => {
      setTimeout(resolve, 500);
    });
  }

  private async handleSignalingMessage(message: any): Promise<void> {
    if (!this.peerConnection) return;

    try {
      const currentState = this.peerConnection.signalingState;
      console.log(`Handling ${message.type} in state: ${currentState}`);

      switch (message.type) {
        case 'offer':
          // Only handle offer if we're in the right state
          if (currentState === 'stable' || currentState === 'have-local-offer') {
            console.log('Received offer, setting remote description');
            await this.peerConnection.setRemoteDescription(new RTCSessionDescription(message.offer));
            this.hasRemoteDescription = true;
            
            // Process any pending ICE candidates
            for (const candidate of this.pendingCandidates) {
              try {
                await this.peerConnection.addIceCandidate(candidate);
              } catch (candidateError) {
                console.warn('Failed to add pending candidate:', candidateError);
              }
            }
            this.pendingCandidates = [];
            
            // Only create answer if we're in have-remote-offer state
            if (this.peerConnection.signalingState === 'have-remote-offer') {
              const answer = await this.peerConnection.createAnswer();
              await this.peerConnection.setLocalDescription(answer);
              this.sendSignalingMessage({
                type: 'answer',
                answer: answer
              });
            }
          } else {
            console.warn(`Cannot handle offer in state: ${currentState}`);
          }
          break;

        case 'answer':
          // Only handle answer if we're expecting it
          if (currentState === 'have-local-offer') {
            console.log('Received answer, setting remote description');
            await this.peerConnection.setRemoteDescription(new RTCSessionDescription(message.answer));
            this.hasRemoteDescription = true;
            
            // Process any pending ICE candidates
            for (const candidate of this.pendingCandidates) {
              try {
                await this.peerConnection.addIceCandidate(candidate);
              } catch (candidateError) {
                console.warn('Failed to add pending candidate:', candidateError);
              }
            }
            this.pendingCandidates = [];
          } else {
            console.warn(`Cannot handle answer in state: ${currentState}`);
          }
          break;

        case 'ice-candidate':
          if (this.hasRemoteDescription && this.peerConnection.remoteDescription) {
            try {
              await this.peerConnection.addIceCandidate(new RTCIceCandidate(message.candidate));
            } catch (candidateError) {
              console.warn('Failed to add ICE candidate:', candidateError);
            }
          } else {
            // Queue the candidate until we have remote description
            this.pendingCandidates.push(new RTCIceCandidate(message.candidate));
            console.log('Queued ICE candidate, pending count:', this.pendingCandidates.length);
          }
          break;
      }
    } catch (error) {
      console.error('Error handling signaling message:', error);
      // Only show critical errors to user
      const errorString = error instanceof Error ? error.message : String(error);
      if (errorString.includes('InvalidStateError')) {
        console.warn('WebRTC state error, connection will retry automatically');
      } else if (!errorString.includes('setRemoteDescription')) {
        this.callbacks.onError(`Connection error: Please try reconnecting`);
      }
    }
  }

  private sendSignalingMessage(message: any): void {
    if (this.signalingChannel) {
      this.signalingChannel.send({
        type: 'broadcast',
        event: 'webrtc-signal',
        payload: {
          ...message,
          from: this.userId,
          to: this.otherUserId,
          timestamp: Date.now()
        }
      });
    }
  }

  private async startConnection(): Promise<void> {
    if (!this.peerConnection) return;

    try {
      console.log('Creating offer...');
      const offer = await this.peerConnection.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true
      });
      
      await this.peerConnection.setLocalDescription(offer);
      
      this.sendSignalingMessage({
        type: 'offer',
        offer: offer
      });
    } catch (error) {
      console.error('Failed to create offer:', error);
      this.callbacks.onError(`Failed to start connection: ${error}`);
    }
  }

  private startStatsMonitoring(): void {
    if (this.statsInterval) {
      clearInterval(this.statsInterval);
    }

    this.statsInterval = setInterval(async () => {
      if (this.peerConnection) {
        try {
          const stats = await this.peerConnection.getStats();
          this.processStats(stats);
        } catch (error) {
          console.error('Failed to get stats:', error);
        }
      }
    }, 2000); // Less frequent to reduce overhead
  }

  private processStats(stats: RTCStatsReport): void {
    let bandwidth = 0;
    let latency = 0;
    let packetLoss = 0;
    let resolution = 'unknown';
    let frameRate = 0;

    stats.forEach((report) => {
      if (report.type === 'inbound-rtp' && report.mediaType === 'video') {
        bandwidth = Math.round((report.bytesReceived * 8) / 1000);
        frameRate = report.framesPerSecond || 0;
        if (report.frameWidth && report.frameHeight) {
          resolution = `${report.frameWidth}x${report.frameHeight}`;
        }
      }
      
      if (report.type === 'candidate-pair' && report.state === 'succeeded') {
        latency = report.currentRoundTripTime ? Math.round(report.currentRoundTripTime * 1000) : 0;
      }
      
      if (report.type === 'inbound-rtp') {
        const packetsLost = report.packetsLost || 0;
        const packetsReceived = report.packetsReceived || 0;
        if (packetsReceived > 0) {
          packetLoss = (packetsLost / (packetsLost + packetsReceived)) * 100;
        }
      }
    });

    // Determine quality
    let quality: ConnectionQuality = 'excellent';
    if (latency > 300 || packetLoss > 5) {
      quality = 'poor';
    } else if (latency > 200 || packetLoss > 2) {
      quality = 'fair';
    } else if (latency > 100 || packetLoss > 1) {
      quality = 'good';
    }

    this.connectionStats = {
      bandwidth,
      latency,
      packetLoss,
      quality,
      resolution,
      frameRate
    };

    this.callbacks.onQualityChange(quality, this.connectionStats);
  }

  private updateState(state: ConnectionState): void {
    this.connectionState = state;
    this.callbacks.onStateChange(state);
  }

  private async attemptReconnect(): Promise<void> {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      this.updateState('failed');
      this.callbacks.onError('Connection failed. Please try switching to Jitsi or refresh the page.');
      return;
    }

    this.reconnectAttempts++;
    this.updateState('reconnecting');

    setTimeout(async () => {
      try {
        // Clean up current connection
        if (this.peerConnection) {
          this.peerConnection.close();
          this.peerConnection = null;
        }
        
        // Reset state
        this.hasRemoteDescription = false;
        this.pendingCandidates = [];
        
        // Reinitialize
        await this.setupPeerConnection();
        
        if (this.isInitiator) {
          await this.startConnection();
        }
      } catch (error) {
        console.error('Reconnection failed:', error);
        this.attemptReconnect();
      }
    }, 2000 * this.reconnectAttempts);
  }

  // Public methods
  async toggleAudio(): Promise<boolean> {
    console.log('🎤 WebRTC: toggleAudio called - delegating to mediaStreamController');
    
    try {
      const { mediaStreamController } = await import('./media-stream-controller');
      const isMuted = mediaStreamController.toggleAudio();
      
      // Notify remote peer
      this.sendDataChannelMessage({
        type: 'audio-toggle',
        muted: isMuted
      });
      
      return isMuted;
    } catch (error) {
      console.error('🎤 Failed to toggle audio:', error);
      return false;
    }
  }

  async toggleVideo(): Promise<boolean> {
    console.log('📹 WebRTC: toggleVideo called - delegating to mediaStreamController');
    
    try {
      const { mediaStreamController } = await import('./media-stream-controller');
      const isVideoOff = mediaStreamController.toggleVideo();
      
      // Notify remote peer
      this.sendDataChannelMessage({
        type: 'video-toggle',
        enabled: !isVideoOff
      });
      
      return isVideoOff;
    } catch (error) {
      console.error('📹 Failed to toggle video:', error);
      return false;
    }
  }

  sendMessage(content: string): void {
    const message = {
      type: 'chat-message',
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      userId: this.userId,
      userName: this.userName,
      content,
      timestamp: new Date().toISOString()
    };

    this.sendDataChannelMessage(message);

    // Also trigger callback for local message
    this.callbacks.onMessage({
      id: message.id,
      userId: 'current-user', // Mark as current user for UI
      userName: message.userName,
      content: message.content,
      timestamp: new Date(),
      type: 'text' as const
    });
  }

  private sendDataChannelMessage(message: any): void {
    console.log('📱 FixedWebRTC: sendDataChannelMessage called with:', message);
    console.log('📱 FixedWebRTC: Data channel state:', {
      exists: !!this.dataChannel,
      readyState: this.dataChannel?.readyState
    });
    
    if (this.dataChannel && this.dataChannel.readyState === 'open') {
      try {
        console.log('📱 FixedWebRTC: Sending via data channel');
        this.dataChannel.send(JSON.stringify(message));
        console.log('📱 FixedWebRTC: Successfully sent via data channel');
      } catch (error) {
        console.error('📱 FixedWebRTC: Failed to send data channel message:', error);
        // Fallback: send via Supabase for messaging
        console.log('📱 FixedWebRTC: Falling back to Supabase');
        this.sendMessageViaSupabase(message);
      }
    } else {
      console.log('📱 FixedWebRTC: Data channel not open, using Supabase fallback');
      // Fallback: send via Supabase for messaging
      this.sendMessageViaSupabase(message);
    }
  }

  private sendMessageViaSupabase(message: any): void {
    console.log('📱 FixedWebRTC: sendMessageViaSupabase called with:', message);
    
    if (message.type === 'chat-message') {
      console.log('📱 FixedWebRTC: Sending chat message via Supabase');
      // Send message via Supabase as fallback
      this.signalingChannel?.send({
        type: 'broadcast',
        event: 'chat-message',
        payload: message
      });
    } else if (message.type === 'device-info') {
      console.log('📱 FixedWebRTC: Sending device info via Supabase');
      // Send device info via Supabase as fallback
      this.signalingChannel?.send({
        type: 'broadcast',
        event: 'device-info',
        payload: message
      });
    } else if (message.type === 'audio-toggle' || message.type === 'video-toggle') {
      console.log('📱 FixedWebRTC: Sending media toggle via Supabase');
      // Send media toggles via Supabase as fallback
      this.signalingChannel?.send({
        type: 'broadcast',
        event: 'media-toggle',
        payload: message
      });
    } else {
      console.warn('📱 FixedWebRTC: Unknown message type for Supabase fallback:', message.type);
    }
  }

  async reconnect(): Promise<void> {
    this.reconnectAttempts = 0;
    await this.initialize();
  }

  async endCall(): Promise<void> {
    this.updateState('ended');

    // Stop stats monitoring
    if (this.statsInterval) {
      clearInterval(this.statsInterval);
      this.statsInterval = null;
    }

    // Close data channel
    if (this.dataChannel) {
      this.dataChannel.close();
      this.dataChannel = null;
    }

    // Close peer connection
    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }

    // Stop local stream
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
    }

    // Unsubscribe from signaling
    if (this.signalingChannel) {
      this.signalingChannel.unsubscribe();
      this.signalingChannel = null;
    }
  }

  getConnectionState(): ConnectionState {
    return this.connectionState;
  }

  getConnectionStats(): ConnectionStats {
    return this.connectionStats;
  }

  sendDeviceInfo(deviceInfo: any): void {
    console.log('📱 FixedWebRTC: sendDeviceInfo called with:', deviceInfo);
    
    const message = {
      type: 'device-info',
      deviceInfo,
      userId: this.userId, // ✅ Add userId for proper filtering
      timestamp: new Date().toISOString()
    };

    console.log('📱 FixedWebRTC: Sending device info message:', message);
    this.sendDataChannelMessage(message);
    console.log('📱 FixedWebRTC: Device info message sent via data channel');
  }
}