/**
 * Peer-to-Peer WebRTC Service - Fallback Solution
 * Simple, direct WebRTC connection between two users
 * 
 * BANDWIDTH MANAGEMENT APPROACH:
 * ==============================
 * This service follows WebRTC best practices by relying entirely on the browser's
 * native bandwidth adaptation capabilities:
 * 
 * ✅ Uses browser's built-in bandwidth estimation
 * ✅ Leverages TWCC (Transport Wide Congestion Control) for real-time adaptation
 * ✅ Allows automatic quality scaling based on network conditions
 * ✅ No hardcoded bitrates that could interfere with native adaptation
 */

import { SessionQualityLogger, RealTimeStats } from './session-quality-logger';
import { AdaptiveVideoQualityService, VideoQualityProfile, NetworkConditions } from './adaptive-video-quality';
import { meteredTURNService } from './metered-turn-service';
import { SignalingProvider, SignalingMessage } from './signaling/signaling-provider';
import { SupabaseSignalingProvider } from './signaling/supabase-provider';

export type P2PConnectionState = 'initializing' | 'connecting' | 'connected' | 'reconnecting' | 'failed' | 'ended';
export type P2PConnectionQuality = 'excellent' | 'good' | 'fair' | 'poor' | 'failed';

export interface P2PConnectionStats {
  bandwidth: number;
  latency: number;
  packetLoss: number;
  quality: P2PConnectionQuality;
  resolution: string;
  frameRate: number;
}

export interface P2PMessage {
  id: string;
  userId: string;
  userName: string;
  content: string;
  timestamp: Date;
  type: 'text' | 'system' | 'device-metadata';
  metadata?: any;
}

export interface P2PCallbacks {
  onStateChange: (state: P2PConnectionState) => void;
  onQualityChange: (quality: P2PConnectionQuality, stats: P2PConnectionStats) => void;
  onLocalStream: (stream: MediaStream) => void;
  onRemoteStream: (stream: MediaStream) => void;
  onMessage: (message: P2PMessage) => void;
  onError: (error: string) => void;
  onRemoteAudioToggle: (muted: boolean) => void;
  onRemoteVideoToggle: (enabled: boolean) => void;
}

export class P2PWebRTCService {
  private connectionState: P2PConnectionState = 'initializing';
  private connectionStats: P2PConnectionStats = {
    bandwidth: 0,
    latency: 0,
    packetLoss: 0,
    quality: 'good',
    resolution: 'unknown',
    frameRate: 0
  };
  private statsInterval: NodeJS.Timeout | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 2;
  private isInitiator = false;
  private pendingCandidates: RTCIceCandidate[] = [];
  private hasRemoteDescription = false;
  private qualityService: AdaptiveVideoQualityService;
  private currentSender: RTCRtpSender | null = null;
  private isConnecting = false;
  private connectionStarted = false;
  private qualityLogger: SessionQualityLogger;

  // Signaling
  private signalingProvider: SignalingProvider;

  // Perfect Negotiation state
  private makingOffer = false;
  private ignoreOffer = false;
  private isPolite = false;

  private sessionId: string;
  private userId: string;
  private userName: string;
  private otherUserId: string;
  private callbacks: P2PCallbacks;
  private peerConnection: RTCPeerConnection | null = null;
  private dataChannel: RTCDataChannel | null = null;
  private localStream: MediaStream | null = null;

  constructor(
    sessionId: string,
    userId: string,
    userName: string,
    otherUserId: string,
    callbacks: P2PCallbacks,
    signalingProvider?: SignalingProvider
  ) {
    this.sessionId = sessionId;
    this.userId = userId;
    this.userName = userName;
    this.otherUserId = otherUserId;
    this.callbacks = callbacks;

    // Use provided signaling provider or default to Supabase
    this.signalingProvider = signalingProvider || new SupabaseSignalingProvider();

    this.qualityService = AdaptiveVideoQualityService.getInstance();
    this.qualityLogger = new SessionQualityLogger(sessionId, userId, 'p2p');

    // Determine who initiates the call (lexicographically first user ID)
    this.isInitiator = userId < otherUserId;

    // Perfect Negotiation: Assign polite/impolite roles
    this.isPolite = userId > otherUserId;

    console.log(`🎭 Perfect Negotiation: ${this.isPolite ? 'POLITE' : 'IMPOLITE'} peer (${this.isInitiator ? 'initiator' : 'responder'})`);
  }

  async initialize(): Promise<void> {
    try {
      this.updateState('initializing');

      // Start adaptive quality monitoring
      this.qualityService.startMonitoring();

      // Subscribe to quality changes
      this.qualityService.onQualityChange((profile, conditions) => {
        this.handleQualityChange(profile, conditions);
      });

      // Get user media with adaptive constraints
      await this.getUserMedia();

      // Setup signaling
      await this.setupSignaling();

      // Setup peer connection
      await this.setupPeerConnection();

      // Start connection if initiator
      if (this.isInitiator) {
        console.log('Initiator waiting for other user to join...');
      } else {
        console.log('Non-initiator ready, waiting for offer...');
      }

    } catch (error) {
      console.error('Failed to initialize P2P WebRTC:', error);
      this.callbacks.onError(`Failed to initialize: ${error}`);
      this.updateState('failed');
    }
  }

  private async getUserMedia(): Promise<void> {
    try {
      const isSecureContext = window.isSecureContext || location.protocol === 'https:' || location.hostname === 'localhost';

      if (!isSecureContext) {
        throw new Error('Camera access requires HTTPS. Please use HTTPS or localhost for mobile testing.');
      }

      const adaptiveConstraints = this.qualityService.getVideoConstraints();
      const currentProfile = this.qualityService.getCurrentProfile();

      console.log('Requesting camera/microphone access with adaptive quality:', {
        profile: currentProfile.name,
        resolution: `${currentProfile.resolution.width}x${currentProfile.resolution.height}`,
        frameRate: currentProfile.frameRate.ideal,
        isSecureContext
      });

      this.localStream = await navigator.mediaDevices.getUserMedia(adaptiveConstraints);
      this.callbacks.onLocalStream(this.localStream);
      console.log('✅ Camera/microphone access granted with adaptive quality');
    } catch (error) {
      console.error('Failed to get user media:', error);

      const err = error as any;
      if (err.name === 'NotAllowedError') {
        throw new Error('Camera/microphone access denied. Please allow permissions and try again.');
      } else if (err.name === 'NotFoundError') {
        throw new Error('No camera/microphone found. Please check your device.');
      } else if (err.name === 'NotSecureError' || err.message?.includes('HTTPS')) {
        throw new Error('Camera access requires HTTPS. Please use: npm run dev:https');
      }

      try {
        console.log('Trying fallback constraints...');
        const fallbackConstraints = {
          video: { width: 320, height: 240, frameRate: 10 },
          audio: true
        };
        this.localStream = await navigator.mediaDevices.getUserMedia(fallbackConstraints);
        this.callbacks.onLocalStream(this.localStream);
      } catch (fallbackError) {
        throw new Error('Camera/microphone access denied');
      }
    }
  }

  private setOptimalCodecPreferences(): void {
    if (!this.peerConnection) return;

    try {
      const transceivers = this.peerConnection.getTransceivers();

      transceivers.forEach(transceiver => {
        const { sender, receiver } = transceiver;
        const track = sender.track || receiver.track;

        if (!track) return;

        const capabilities = RTCRtpSender.getCapabilities(track.kind);
        if (!capabilities || !capabilities.codecs) return;

        let preferredCodecs: any[] = [];

        if (track.kind === 'audio') {
          const opusCodecs = capabilities.codecs.filter(codec =>
            codec.mimeType.toLowerCase().includes('opus')
          );
          const otherCodecs = capabilities.codecs.filter(codec =>
            !codec.mimeType.toLowerCase().includes('opus')
          );

          preferredCodecs = [...opusCodecs, ...otherCodecs];

          if (opusCodecs.length > 0) {
            console.log('🎵 Audio codec preference: Opus (optimal for voice)');
          }
        } else if (track.kind === 'video') {
          const vp9Codecs = capabilities.codecs.filter(codec =>
            codec.mimeType.toLowerCase().includes('vp9')
          );
          const vp8Codecs = capabilities.codecs.filter(codec =>
            codec.mimeType.toLowerCase().includes('vp8')
          );
          const h264Codecs = capabilities.codecs.filter(codec =>
            codec.mimeType.toLowerCase().includes('h264')
          );
          const otherCodecs = capabilities.codecs.filter(codec =>
            !codec.mimeType.toLowerCase().includes('vp9') &&
            !codec.mimeType.toLowerCase().includes('vp8') &&
            !codec.mimeType.toLowerCase().includes('h264')
          );

          preferredCodecs = [...vp9Codecs, ...vp8Codecs, ...h264Codecs, ...otherCodecs];

          if (vp9Codecs.length > 0) {
            console.log('🎥 Video codec preference: VP9 (best compression & quality)');
          } else if (vp8Codecs.length > 0) {
            console.log('🎥 Video codec preference: VP8 (good quality & compatibility)');
          }
        }

        if (preferredCodecs.length > 0 && typeof transceiver.setCodecPreferences === 'function') {
          transceiver.setCodecPreferences(preferredCodecs);
          console.log(`✅ Codec preferences set for ${track.kind}:`,
            preferredCodecs.slice(0, 3).map(c => c.mimeType).join(', ')
          );
        }
      });
    } catch (error) {
      console.warn('⚠️ Could not set codec preferences (browser may not support):', error);
    }
  }

  private async setupSignaling(): Promise<void> {
    console.log(`Setting up P2P signaling for session ${this.sessionId}, user ${this.userId} -> ${this.otherUserId}`);

    this.signalingProvider.onMessage(async (message: SignalingMessage) => {
      await this.handleSignalingMessage(message);
    });

    await this.signalingProvider.connect(this.sessionId, this.userId);

    console.log('📢 Sending user-joined message to other user');
    this.sendSignalingMessage({
      type: 'user-joined',
      userInfo: {
        userId: this.userId,
        userName: this.userName
      }
    });

    this.sendBroadcastMessage({
      type: 'user-joined',
      userInfo: {
        userId: this.userId,
        userName: this.userName
      }
    });

    setTimeout(() => {
      if (this.isInitiator &&
        this.peerConnection?.signalingState === 'stable' &&
        !this.connectionStarted &&
        !this.isConnecting) {
        console.log('⏰ Timeout reached, starting connection anyway (other user might be ready)');
        this.startConnection();
      }
    }, 5000);
  }

  private async handleSignalingMessage(message: SignalingMessage): Promise<void> {
    console.log('Handling P2P signaling message:', message.type, message);

    if (!this.peerConnection) {
      console.warn('No peer connection available for signaling message');
      return;
    }

    try {
      switch (message.type) {
        case 'user-joined':
          console.log('👋 Other user joined:', message.payload.userInfo);
          if (this.isInitiator &&
            this.peerConnection.signalingState === 'stable' &&
            !this.connectionStarted &&
            !this.isConnecting) {
            console.log('🚀 Starting connection as initiator after user joined');
            setTimeout(() => this.startConnection(), 500);
          } else {
            console.log('⏳ Non-initiator ready, waiting for offer... (or connection already started)');
          }
          break;

        case 'offer':
          try {
            console.log('📨 Received offer, current signaling state:', this.peerConnection.signalingState);

            const offerCollision =
              this.peerConnection.signalingState !== 'stable' ||
              this.makingOffer;

            this.ignoreOffer = !this.isPolite && offerCollision;

            if (this.ignoreOffer) {
              console.log('🚫 IMPOLITE peer ignoring offer (glare detected, proceeding with own negotiation)');
              return;
            }

            if (offerCollision) {
              console.log('🚦 POLITE peer detected glare, rolling back own offer to process incoming offer');
              await this.peerConnection.setLocalDescription({ type: 'rollback' } as RTCSessionDescriptionInit);
            }

            console.log('✅ Setting remote description from offer...');
            await this.peerConnection.setRemoteDescription(new RTCSessionDescription(message.payload.offer));
            this.hasRemoteDescription = true;
            console.log('✅ Set remote description from offer successfully');

            for (const candidate of this.pendingCandidates) {
              try {
                await this.peerConnection.addIceCandidate(candidate);
                console.log('Added pending ICE candidate');
              } catch (error) {
                console.warn('Failed to add pending candidate:', error);
              }
            }
            this.pendingCandidates = [];

            console.log('🔄 Creating answer...');
            const answer = await this.peerConnection.createAnswer();
            console.log('🔄 Setting local description (answer)...');
            await this.peerConnection.setLocalDescription(answer);
            console.log('✅ Created and set local answer');

            console.log('📤 Sending answer to remote peer...');
            this.sendSignalingMessage({
              type: 'answer',
              answer: answer
            });
            console.log('✅ Answer sent successfully');
          } catch (error) {
            console.error('❌ Failed to handle offer:', error);
          }
          break;

        case 'answer':
          try {
            console.log('📨 Received answer, current signaling state:', this.peerConnection.signalingState);

            if (this.peerConnection.signalingState === 'have-local-offer') {
              console.log('✅ Setting remote description from answer...');
              await this.peerConnection.setRemoteDescription(new RTCSessionDescription(message.payload.answer));
              this.hasRemoteDescription = true;
              console.log('✅ Set remote description from answer successfully');

              for (const candidate of this.pendingCandidates) {
                try {
                  await this.peerConnection.addIceCandidate(candidate);
                  console.log('Added pending ICE candidate');
                } catch (error) {
                  console.warn('Failed to add pending candidate:', error);
                }
              }
              this.pendingCandidates = [];
            } else {
              console.log('⚠️ Received answer in unexpected state:', this.peerConnection.signalingState);
            }
          } catch (error) {
            console.error('❌ Failed to handle answer:', error);
          }
          break;

        case 'ice-candidate':
          if (this.hasRemoteDescription && this.peerConnection.remoteDescription) {
            try {
              await this.peerConnection.addIceCandidate(new RTCIceCandidate(message.payload.candidate));
            } catch (error) {
              console.warn('Failed to add ICE candidate:', error);
            }
          } else {
            this.pendingCandidates.push(new RTCIceCandidate(message.payload.candidate));
          }
          break;
      }
    } catch (error) {
      console.error('Error handling P2P signaling message:', error);
    }
  }

  private sendSignalingMessage(message: any): void {
    if (this.signalingProvider) {
      console.log('📤 Sending P2P signaling message:', {
        type: message.type,
        from: this.userId,
        to: this.otherUserId
      });

      this.signalingProvider.sendMessage(
        this.otherUserId,
        message.type,
        message
      );
    } else {
      console.error('❌ No signaling provider available');
    }
  }

  private sendBroadcastMessage(message: any): void {
    if (this.signalingProvider) {
      console.log('📢 Broadcasting P2P message:', {
        type: message.type,
        from: this.userId,
        to: 'all'
      });

      this.signalingProvider.sendMessage(
        'all',
        message.type,
        message
      );
    }
  }

  private async setupPeerConnection(): Promise<void> {
    const iceServers = await meteredTURNService.getAllICEServers();

    const configuration: RTCConfiguration = {
      iceServers,
      iceCandidatePoolSize: 10,
      iceTransportPolicy: 'all',
      bundlePolicy: 'max-bundle',
      rtcpMuxPolicy: 'require'
    };

    console.log(`🔧 Creating RTCPeerConnection with ${iceServers.length} ICE servers`);
    this.peerConnection = new RTCPeerConnection(configuration);

    if (this.localStream) {
      this.localStream.getTracks().forEach(track => {
        this.peerConnection!.addTrack(track, this.localStream!);
      });

      this.setOptimalCodecPreferences();
    }

    this.peerConnection.ontrack = (event) => {
      console.log('Received remote track:', event.track.kind, event.streams.length);
      const [remoteStream] = event.streams;
      if (remoteStream) {
        console.log('Remote stream received with tracks:', remoteStream.getTracks().length);
        this.callbacks.onRemoteStream(remoteStream);
      } else {
        console.warn('No remote stream in track event');
      }
    };

    this.peerConnection.onconnectionstatechange = () => {
      const state = this.peerConnection!.connectionState;
      console.log('P2P Connection state:', state);

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
        case 'failed':
          this.updateState('failed');
          this.attemptReconnect();
          break;
        case 'closed':
          this.updateState('ended');
          break;
      }
    };

    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        this.sendSignalingMessage({
          type: 'ice-candidate',
          candidate: event.candidate
        });
      }
    };

    this.peerConnection.onnegotiationneeded = async () => {
      try {
        console.log('🔄 Negotiation needed, creating offer...');

        this.makingOffer = true;

        await this.peerConnection!.setLocalDescription();

        console.log('📤 Sending renegotiation offer...');
        this.sendSignalingMessage({
          type: 'offer',
          offer: this.peerConnection!.localDescription
        });

        console.log('✅ Renegotiation offer sent');
      } catch (error) {
        console.error('❌ Failed to handle negotiation needed:', error);
      } finally {
        this.makingOffer = false;
      }
    };

    this.setupDataChannel();
  }

  private setupDataChannel(): void {
    if (!this.peerConnection) return;

    if (this.isInitiator) {
      this.dataChannel = this.peerConnection.createDataChannel('messages', {
        ordered: true
      });
      this.setupDataChannelHandlers(this.dataChannel);
    }

    this.peerConnection.ondatachannel = (event) => {
      const channel = event.channel;
      this.dataChannel = channel;
      this.setupDataChannelHandlers(channel);
    };
  }

  private setupDataChannelHandlers(channel: RTCDataChannel): void {
    channel.onopen = () => {
      console.log('P2P Data channel opened');
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
      console.error('P2P Data channel error:', error);
    };
  }

  private handleDataChannelMessage(data: any): void {
    switch (data.type) {
      case 'chat-message':
        const message: P2PMessage = {
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

  private async startConnection(): Promise<void> {
    if (!this.peerConnection) {
      console.warn('No peer connection available for startConnection');
      return;
    }

    if (this.isConnecting || this.connectionStarted) {
      console.log('⏸️ Connection already in progress, skipping duplicate attempt');
      return;
    }

    if (this.peerConnection.signalingState !== 'stable') {
      console.log(`⏸️ Invalid signaling state for connection: ${this.peerConnection.signalingState}`);
      return;
    }

    this.isConnecting = true;
    this.connectionStarted = true;

    try {
      console.log('🚀 Creating P2P offer...');

      this.makingOffer = true;

      const offer = await this.peerConnection.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true
      });

      console.log('📝 Setting local description...');
      await this.peerConnection.setLocalDescription(offer);

      console.log('📤 Sending offer to remote peer...');
      this.sendSignalingMessage({
        type: 'offer',
        offer: offer
      });

      console.log('✅ P2P offer sent successfully');

    } catch (error) {
      console.error('Failed to create P2P offer:', error);
      this.isConnecting = false;
      this.connectionStarted = false;
      this.callbacks.onError(`Failed to start connection: ${error}`);
    } finally {
      this.makingOffer = false;

      setTimeout(() => {
        this.isConnecting = false;
      }, 2000);
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
          console.error('Failed to get P2P stats:', error);
        }
      }
    }, 3000);
  }

  private stopStatsMonitoring(): void {
    if (this.statsInterval) {
      clearInterval(this.statsInterval);
      this.statsInterval = null;
    }
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
    });

    let quality: P2PConnectionQuality = 'good';
    if (latency > 400 || packetLoss > 8) {
      quality = 'poor';
    } else if (latency > 250 || packetLoss > 4) {
      quality = 'fair';
    } else if (latency < 100 && packetLoss < 1) {
      quality = 'excellent';
    }

    this.connectionStats = {
      bandwidth,
      latency,
      packetLoss,
      quality,
      resolution,
      frameRate
    };

    const realTimeStats: RealTimeStats = {
      latency,
      packetLoss,
      bandwidth,
      frameRate,
      resolution,
      quality,
      timestamp: Date.now()
    };
    this.qualityLogger.recordStats(realTimeStats);

    this.callbacks.onQualityChange(quality, this.connectionStats);
  }

  private updateState(state: P2PConnectionState): void {
    this.connectionState = state;
    this.callbacks.onStateChange(state);
  }

  private async attemptReconnect(): Promise<void> {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      this.updateState('failed');
      this.callbacks.onError('Connection failed. Mobile networks can be challenging for video calls. Try switching between WiFi and mobile data.');
      return;
    }

    this.reconnectAttempts++;
    this.qualityLogger.recordRecoveryAttempt();
    this.updateState('reconnecting');

    const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const timeout = isMobile ? 2000 : 3000 * this.reconnectAttempts;

    setTimeout(async () => {
      try {
        if (this.peerConnection) {
          this.peerConnection.close();
          this.peerConnection = null;
        }

        this.resetConnectionState();

        await this.setupPeerConnection();

        if (this.isInitiator) {
          await this.startConnection();
        }
      } catch (error) {
        console.error('P2P reconnection failed:', error);
        this.attemptReconnect();
      }
    }, timeout);
  }

  toggleAudio(): boolean {
    console.log('P2P audio toggle requested, localStream available:', !!this.localStream);

    if (this.localStream) {
      const audioTrack = this.localStream.getAudioTracks()[0];
      if (audioTrack) {
        const wasEnabled = audioTrack.enabled;
        audioTrack.enabled = !audioTrack.enabled;

        console.log('P2P audio track toggled:', wasEnabled, '→', audioTrack.enabled);

        this.sendDataChannelMessage({
          type: 'audio-toggle',
          muted: !audioTrack.enabled
        });

        return !audioTrack.enabled;
      } else {
        console.warn('No audio track available for P2P toggle');
      }
    } else {
      console.warn('No local stream available for P2P audio toggle');
    }
    return false;
  }

  toggleVideo(): boolean {
    console.log('P2P video toggle requested, localStream available:', !!this.localStream);

    if (this.localStream) {
      const videoTrack = this.localStream.getVideoTracks()[0];
      if (videoTrack) {
        const wasEnabled = videoTrack.enabled;
        videoTrack.enabled = !videoTrack.enabled;

        console.log('P2P video track toggled:', wasEnabled, '→', videoTrack.enabled);

        this.sendDataChannelMessage({
          type: 'video-toggle',
          enabled: videoTrack.enabled
        });

        return !videoTrack.enabled;
      } else {
        console.warn('No video track available for P2P toggle');
      }
    } else {
      console.warn('No local stream available for P2P video toggle');
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

    this.callbacks.onMessage({
      id: message.id,
      userId: 'current-user',
      userName: message.userName,
      content: message.content,
      timestamp: new Date(),
      type: 'text' as const
    });
  }

  private sendDataChannelMessage(message: any): void {
    if (this.dataChannel && this.dataChannel.readyState === 'open') {
      try {
        this.dataChannel.send(JSON.stringify(message));
      } catch (error) {
        console.error('Failed to send P2P data channel message:', error);
      }
    }
  }

  async reconnect(): Promise<void> {
    this.reconnectAttempts = 0;
    this.resetConnectionState();
    await this.initialize();
  }

  private async handleQualityChange(profile: VideoQualityProfile, conditions: NetworkConditions): Promise<void> {
    if (!this.localStream || !this.peerConnection || !this.qualityService) return;

    try {
      console.log(`🔄 Adapting video quality to ${profile.name} (${profile.resolution.width}x${profile.resolution.height})`);

      const newConstraints = this.qualityService.getVideoConstraints();

      const videoTrack = this.localStream.getVideoTracks()[0];
      if (videoTrack) {
        try {
          await videoTrack.applyConstraints(newConstraints.video);
          console.log('✅ Applied new video constraints:', {
            resolution: `${profile.resolution.width}x${profile.resolution.height}`,
            frameRate: profile.frameRate.ideal
          });
        } catch (constraintError) {
          console.warn('Failed to apply video constraints, trying fallback:', constraintError);
          const fallbackConstraints = {
            width: { ideal: profile.resolution.width },
            height: { ideal: profile.resolution.height }
          };
          await videoTrack.applyConstraints(fallbackConstraints);
        }
      }

      const qualityMap = {
        'excellent': 'excellent' as const,
        'good': 'good' as const,
        'fair': 'fair' as const,
        'poor': 'poor' as const
      };

      this.connectionStats.quality = qualityMap[profile.name] || 'good';
      this.callbacks.onQualityChange(this.connectionStats.quality, this.connectionStats);

    } catch (error) {
      console.warn('Failed to apply quality change:', error);
    }
  }

  async endCall(): Promise<void> {
    console.log('Ending P2P call...');
    this.stopStatsMonitoring();

    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
    }

    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }

    if (this.signalingProvider) {
      await this.signalingProvider.disconnect();
    }

    if (this.dataChannel) {
      this.dataChannel.close();
      this.dataChannel = null;
    }

    this.resetConnectionState();
    this.updateState('ended');

    await this.qualityLogger.endSession();
    console.log('P2P call ended.');
  }

  private resetConnectionState(): void {
    console.log('🔄 Resetting P2P connection state');
    this.isConnecting = false;
    this.connectionStarted = false;
    this.hasRemoteDescription = false;
    this.pendingCandidates = [];
  }

  getConnectionState(): P2PConnectionState {
    return this.connectionState;
  }

  getConnectionStats(): P2PConnectionStats {
    return this.connectionStats;
  }

  static checkSupport(): boolean {
    const hasWebRTC = !!(
      window.RTCPeerConnection &&
      navigator.mediaDevices &&
      navigator.mediaDevices.getUserMedia
    );

    console.log('P2P WebRTC Support Check:', {
      RTCPeerConnection: !!window.RTCPeerConnection,
      mediaDevices: !!navigator.mediaDevices,
      getUserMedia: !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia),
      overall: hasWebRTC
    });

    return hasWebRTC;
  }
}