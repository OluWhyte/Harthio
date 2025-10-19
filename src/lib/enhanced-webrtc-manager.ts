/**
 * Enhanced WebRTC Manager
 * Improved video calling with messaging support
 */

import { supabaseClient as supabase } from './supabase';

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
}

export class EnhancedWebRTCManager {
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
  }

  async initialize(): Promise<void> {
    try {
      this.updateState('initializing');
      
      // Get user media
      await this.getUserMedia();
      
      // Setup peer connection
      await this.setupPeerConnection();
      
      // Setup signaling
      await this.setupSignaling();
      
      // Start connection process
      await this.startConnection();
      
    } catch (error) {
      console.error('Failed to initialize WebRTC:', error);
      this.callbacks.onError(`Failed to initialize: ${error}`);
      this.updateState('failed');
    }
  }

  private async getUserMedia(): Promise<void> {
    try {
      const constraints = {
        video: {
          width: { ideal: 1280, max: 1920 },
          height: { ideal: 720, max: 1080 },
          frameRate: { ideal: 30, max: 60 }
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      };

      this.localStream = await navigator.mediaDevices.getUserMedia(constraints);
      this.callbacks.onLocalStream(this.localStream);
    } catch (error) {
      console.error('Failed to get user media:', error);
      throw new Error('Camera/microphone access denied');
    }
  }

  private async setupPeerConnection(): Promise<void> {
    const configuration: RTCConfiguration = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        {
          urls: 'turn:openrelay.metered.ca:80',
          username: 'openrelayproject',
          credential: 'openrelayproject'
        },
        {
          urls: 'turn:openrelay.metered.ca:443',
          username: 'openrelayproject',
          credential: 'openrelayproject'
        }
      ],
      iceCandidatePoolSize: 10
    };

    this.peerConnection = new RTCPeerConnection(configuration);

    // Add local stream
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

    // Create data channel for messages
    this.dataChannel = this.peerConnection.createDataChannel('messages', {
      ordered: true
    });

    this.dataChannel.onopen = () => {
      console.log('Data channel opened');
    };

    this.dataChannel.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        this.handleDataChannelMessage(data);
      } catch (error) {
        console.error('Failed to parse data channel message:', error);
      }
    };

    // Handle incoming data channel
    this.peerConnection.ondatachannel = (event) => {
      const channel = event.channel;
      channel.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleDataChannelMessage(data);
        } catch (error) {
          console.error('Failed to parse incoming data channel message:', error);
        }
      };
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
    }
  }

  private async setupSignaling(): Promise<void> {
    // Subscribe to signaling messages
    this.signalingChannel = supabase
      .channel(`session-${this.sessionId}`)
      .on('broadcast', { event: 'signaling' }, (payload) => {
        if (payload.payload.from !== this.userId) {
          this.handleSignalingMessage(payload.payload);
        }
      })
      .subscribe();
  }

  private async handleSignalingMessage(message: any): Promise<void> {
    if (!this.peerConnection) return;

    try {
      switch (message.type) {
        case 'offer':
          await this.peerConnection.setRemoteDescription(message.offer);
          const answer = await this.peerConnection.createAnswer();
          await this.peerConnection.setLocalDescription(answer);
          this.sendSignalingMessage({
            type: 'answer',
            answer: answer
          });
          break;

        case 'answer':
          await this.peerConnection.setRemoteDescription(message.answer);
          break;

        case 'ice-candidate':
          await this.peerConnection.addIceCandidate(message.candidate);
          break;
      }
    } catch (error) {
      console.error('Error handling signaling message:', error);
      this.callbacks.onError(`Signaling error: ${error}`);
    }
  }

  private sendSignalingMessage(message: any): void {
    if (this.signalingChannel) {
      this.signalingChannel.send({
        type: 'broadcast',
        event: 'signaling',
        payload: {
          ...message,
          from: this.userId,
          to: this.otherUserId
        }
      });
    }
  }

  private async startConnection(): Promise<void> {
    if (!this.peerConnection) return;

    try {
      // Create and send offer
      const offer = await this.peerConnection.createOffer();
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
    }, 1000);
  }

  private processStats(stats: RTCStatsReport): void {
    let bandwidth = 0;
    let latency = 0;
    let packetLoss = 0;
    let resolution = 'unknown';
    let frameRate = 0;

    stats.forEach((report) => {
      if (report.type === 'inbound-rtp' && report.mediaType === 'video') {
        bandwidth = Math.round((report.bytesReceived * 8) / 1000); // kbps
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

    // Determine quality based on stats
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
      this.callbacks.onError('Maximum reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    this.updateState('reconnecting');

    setTimeout(async () => {
      try {
        await this.initialize();
      } catch (error) {
        console.error('Reconnection failed:', error);
        this.attemptReconnect();
      }
    }, 2000 * this.reconnectAttempts);
  }

  // Public methods
  toggleAudio(): boolean {
    if (this.localStream) {
      const audioTrack = this.localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        
        // Notify remote peer
        this.sendDataChannelMessage({
          type: 'audio-toggle',
          muted: !audioTrack.enabled
        });
        
        return !audioTrack.enabled;
      }
    }
    return false;
  }

  toggleVideo(): boolean {
    if (this.localStream) {
      const videoTrack = this.localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        
        // Notify remote peer
        this.sendDataChannelMessage({
          type: 'video-toggle',
          enabled: videoTrack.enabled
        });
        
        return !videoTrack.enabled;
      }
    }
    return false;
  }

  sendMessage(content: string): void {
    const message = {
      type: 'chat-message',
      id: Date.now().toString(),
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
    if (this.dataChannel && this.dataChannel.readyState === 'open') {
      this.dataChannel.send(JSON.stringify(message));
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
}