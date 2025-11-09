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
 * 
 * The browser automatically:
 * - Monitors network congestion in real-time
 * - Adjusts video bitrate, resolution, and framerate as needed
 * - Keeps calls alive by reducing quality instead of dropping connections
 * - Provides optimal user experience without manual intervention
 */

import 'webrtc-adapter'; // Cross-browser WebRTC compatibility
import { supabaseClient as supabase } from './supabase';
import { AdaptiveVideoQualityService, type VideoQualityProfile, type NetworkConditions } from './adaptive-video-quality';
import { SessionQualityLogger, type RealTimeStats } from './session-quality-logger';
import { meteredTURNService } from './metered-turn-service';

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
  metadata?: any; // For device orientation metadata
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
  private peerConnection: RTCPeerConnection | null = null;
  private localStream: MediaStream | null = null;
  private dataChannel: RTCDataChannel | null = null;
  private signalingChannel: any = null;
  private callbacks: P2PCallbacks;
  private sessionId: string;
  private userId: string;
  private userName: string;
  private otherUserId: string;
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
  private maxReconnectAttempts = 2; // Reduced for fallback service
  private isInitiator = false;
  private pendingCandidates: RTCIceCandidate[] = [];
  private hasRemoteDescription = false;
  private qualityService: AdaptiveVideoQualityService;
  private currentSender: RTCRtpSender | null = null;
  private isConnecting = false; // Prevent multiple connection attempts
  private connectionStarted = false; // Track if connection has been initiated
  private qualityLogger: SessionQualityLogger;
  
  // Perfect Negotiation Pattern
  private isPolite: boolean; // Polite peer yields during glare
  private makingOffer = false; // Track if we're currently making an offer
  private ignoreOffer = false; // Impolite peer ignores offers during glare

  constructor(
    sessionId: string,
    userId: string,
    userName: string,
    otherUserId: string,
    callbacks: P2PCallbacks
  ) {
    this.sessionId = sessionId;
    this.userId = userId;
    this.userName = userName;
    this.otherUserId = otherUserId;
    this.callbacks = callbacks;
    
    // Initialize adaptive quality service
    this.qualityService = AdaptiveVideoQualityService.getInstance();
    
    // Initialize session quality logger
    this.qualityLogger = new SessionQualityLogger(sessionId, userId, 'p2p');
    
    // Determine who initiates the call (lexicographically first user ID)
    this.isInitiator = userId < otherUserId;
    
    // Perfect Negotiation: Assign polite/impolite roles
    // Polite peer = lexicographically larger user ID (yields during glare)
    // Impolite peer = lexicographically smaller user ID (proceeds during glare)
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
      
      // Setup peer connection with simplified configuration
      await this.setupPeerConnection();
      
      // Start connection if initiator (but wait for other user to join)
      if (this.isInitiator) {
        console.log('Initiator waiting for other user to join...');
        // Connection will start when we receive 'user-joined' message
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
      // Check if we're on HTTPS or localhost (required for mobile camera access)
      const isSecureContext = window.isSecureContext || location.protocol === 'https:' || location.hostname === 'localhost';
      
      if (!isSecureContext) {
        throw new Error('Camera access requires HTTPS. Please use HTTPS or localhost for mobile testing.');
      }

      // Get adaptive constraints from quality service
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
      
      // Enhanced error handling for mobile
      const err = error as any;
      if (err.name === 'NotAllowedError') {
        throw new Error('Camera/microphone access denied. Please allow permissions and try again.');
      } else if (err.name === 'NotFoundError') {
        throw new Error('No camera/microphone found. Please check your device.');
      } else if (err.name === 'NotSecureError' || err.message?.includes('HTTPS')) {
        throw new Error('Camera access requires HTTPS. Please use: npm run dev:https');
      }
      
      // Try fallback constraints for mobile
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

  /**
   * Set optimal codec preferences for best quality and compatibility
   * Prioritizes: Opus (audio) and VP8/VP9 (video)
   * These codecs offer the best balance of compression, latency, and packet loss resilience
   */
  private setOptimalCodecPreferences(): void {
    if (!this.peerConnection) return;

    try {
      // Get all transceivers
      const transceivers = this.peerConnection.getTransceivers();
      
      transceivers.forEach(transceiver => {
        const { sender, receiver } = transceiver;
        const track = sender.track || receiver.track;
        
        if (!track) return;

        // Get supported codecs for this track type
        const capabilities = RTCRtpSender.getCapabilities(track.kind);
        if (!capabilities || !capabilities.codecs) return;

        let preferredCodecs: any[] = [];

        if (track.kind === 'audio') {
          // Audio: Prioritize Opus (best for voice, handles packet loss well)
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
          // Video: Prioritize VP9 > VP8 > H264
          // VP9: Best compression and quality
          // VP8: Good fallback, widely supported
          // H264: Compatibility fallback
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

        // Set codec preferences if we have any
        if (preferredCodecs.length > 0 && typeof transceiver.setCodecPreferences === 'function') {
          transceiver.setCodecPreferences(preferredCodecs);
          console.log(`✅ Codec preferences set for ${track.kind}:`, 
            preferredCodecs.slice(0, 3).map(c => c.mimeType).join(', ')
          );
        }
      });
    } catch (error) {
      // Codec preferences are a nice-to-have, not critical
      console.warn('⚠️ Could not set codec preferences (browser may not support):', error);
    }
  }

  private async setupPeerConnection(): Promise<void> {
    // Fetch dynamic TURN credentials from backend API
    // This is the SECURE way: credentials are generated on the server with secret keys
    const iceServers = await meteredTURNService.getAllICEServers();
    
    // Production-grade WebRTC configuration
    const configuration: RTCConfiguration = {
      iceServers, // Dynamic credentials from backend
      iceCandidatePoolSize: 10, // Increased for better mobile connectivity
      iceTransportPolicy: 'all', // Use all available transport methods
      bundlePolicy: 'max-bundle', // Bundle all media for better mobile performance
      rtcpMuxPolicy: 'require' // Required for mobile
    };

    console.log(`🔧 Creating RTCPeerConnection with ${iceServers.length} ICE servers`);
    this.peerConnection = new RTCPeerConnection(configuration);

    // Add local stream tracks
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => {
        this.peerConnection!.addTrack(track, this.localStream!);
      });
      
      // Set codec preferences after tracks are added (transceivers are now available)
      this.setOptimalCodecPreferences();
    }

    // Handle remote stream
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

    // Handle connection state changes
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

    // Handle ICE candidates
    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        this.sendSignalingMessage({
          type: 'ice-candidate',
          candidate: event.candidate
        });
      }
    };

    // Perfect Negotiation: Handle negotiation needed
    // This fires when tracks are added/removed or quality changes require renegotiation
    this.peerConnection.onnegotiationneeded = async () => {
      try {
        console.log('🔄 Negotiation needed, creating offer...');
        
        // Perfect Negotiation: Track that we're making an offer
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
        // Perfect Negotiation: Reset makingOffer flag
        this.makingOffer = false;
      }
    };

    // Setup data channel for messaging
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

  private async setupSignaling(): Promise<void> {
    console.log(`Setting up P2P signaling for session ${this.sessionId}, user ${this.userId} -> ${this.otherUserId}`);
    
    this.signalingChannel = supabase
      .channel(`p2p-session-${this.sessionId}`)
      .on('broadcast', { event: 'p2p-signal' }, (payload) => {
        console.log('📡 Received P2P signaling message:', {
          type: payload.payload.type,
          from: payload.payload.from,
          to: payload.payload.to,
          myUserId: this.userId,
          isForMe: payload.payload.to === this.userId || payload.payload.to === 'all',
          isFromOther: payload.payload.from !== this.userId
        });
        
        // Accept messages targeted to us OR broadcast messages
        if (payload.payload.from !== this.userId && 
            (payload.payload.to === this.userId || payload.payload.to === 'all')) {
          console.log('✅ Processing message for me');
          this.handleSignalingMessage(payload.payload);
        } else {
          console.log('⏭️ Ignoring message (not for me)', {
            fromMe: payload.payload.from === this.userId,
            targetedToMe: payload.payload.to === this.userId,
            isBroadcast: payload.payload.to === 'all'
          });
        }
      })
      .subscribe((status) => {
        console.log('P2P Signaling channel status:', status);
        if (status === 'SUBSCRIBED') {
          console.log('📢 Sending user-joined message to other user');
          // Send user joined message to let other peer know we're here
          this.sendSignalingMessage({
            type: 'user-joined',
            userInfo: {
              userId: this.userId,
              userName: this.userName
            }
          });
          
          // Also send a broadcast version in case targeting fails
          this.sendBroadcastMessage({
            type: 'user-joined',
            userInfo: {
              userId: this.userId,
              userName: this.userName
            }
          });
          
          // Also start a timeout to begin connection if we don't hear back
          setTimeout(() => {
            if (this.isInitiator && 
                this.peerConnection?.signalingState === 'stable' && 
                !this.connectionStarted && 
                !this.isConnecting) {
              console.log('⏰ Timeout reached, starting connection anyway (other user might be ready)');
              this.startConnection();
            }
          }, 5000); // Wait 5 seconds for other user (increased for bad networks)
        }
      });

    return new Promise((resolve) => {
      setTimeout(resolve, 1000); // Give more time for subscription
    });
  }

  private async handleSignalingMessage(message: any): Promise<void> {
    console.log('Handling P2P signaling message:', message.type, message);
    
    if (!this.peerConnection) {
      console.warn('No peer connection available for signaling message');
      return;
    }

    try {
      switch (message.type) {
        case 'user-joined':
          console.log('👋 Other user joined:', message.userInfo);
          // If we're the initiator and haven't started connection yet, start now
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
            
            // Perfect Negotiation: Handle glare
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
              // Polite peer: rollback pending offer
              await this.peerConnection.setLocalDescription({ type: 'rollback' } as RTCSessionDescriptionInit);
            }
            
            console.log('✅ Setting remote description from offer...');
            await this.peerConnection.setRemoteDescription(new RTCSessionDescription(message.offer));
            this.hasRemoteDescription = true;
            console.log('✅ Set remote description from offer successfully');
            
            // Process pending candidates
            for (const candidate of this.pendingCandidates) {
              try {
                await this.peerConnection.addIceCandidate(candidate);
                console.log('Added pending ICE candidate');
              } catch (error) {
                console.warn('Failed to add pending candidate:', error);
              }
            }
            this.pendingCandidates = [];
            
            // Create answer
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
            // Don't throw - let Perfect Negotiation retry
          }
          break;

        case 'answer':
          try {
            console.log('📨 Received answer, current signaling state:', this.peerConnection.signalingState);
            
            // Perfect Negotiation: Only process answer if we're expecting one
            if (this.peerConnection.signalingState === 'have-local-offer') {
              console.log('✅ Setting remote description from answer...');
              await this.peerConnection.setRemoteDescription(new RTCSessionDescription(message.answer));
              this.hasRemoteDescription = true;
              console.log('✅ Set remote description from answer successfully');
              
              // Process pending candidates
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
            // Don't throw - let Perfect Negotiation retry
          }
          break;

        case 'ice-candidate':
          if (this.hasRemoteDescription && this.peerConnection.remoteDescription) {
            try {
              await this.peerConnection.addIceCandidate(new RTCIceCandidate(message.candidate));
            } catch (error) {
              console.warn('Failed to add ICE candidate:', error);
            }
          } else {
            this.pendingCandidates.push(new RTCIceCandidate(message.candidate));
          }
          break;
      }
    } catch (error) {
      console.error('Error handling P2P signaling message:', error);
    }
  }

  private sendSignalingMessage(message: any): void {
    if (this.signalingChannel) {
      const payload = {
        ...message,
        from: this.userId,
        to: this.otherUserId,
        timestamp: Date.now()
      };
      
      console.log('📤 Sending P2P signaling message:', {
        type: message.type,
        from: this.userId,
        to: this.otherUserId
      });
      
      this.signalingChannel.send({
        type: 'broadcast',
        event: 'p2p-signal',
        payload
      });
    } else {
      console.error('❌ No signaling channel available');
    }
  }

  private sendBroadcastMessage(message: any): void {
    if (this.signalingChannel) {
      const payload = {
        ...message,
        from: this.userId,
        to: 'all', // Broadcast to all users in the session
        timestamp: Date.now()
      };
      
      console.log('📢 Broadcasting P2P message:', {
        type: message.type,
        from: this.userId,
        to: 'all'
      });
      
      this.signalingChannel.send({
        type: 'broadcast',
        event: 'p2p-signal',
        payload
      });
    }
  }

  private async startConnection(): Promise<void> {
    if (!this.peerConnection) {
      console.warn('No peer connection available for startConnection');
      return;
    }

    // Prevent multiple simultaneous connection attempts
    if (this.isConnecting || this.connectionStarted) {
      console.log('⏸️ Connection already in progress, skipping duplicate attempt');
      return;
    }

    // Check if we're in a valid state to start connection
    if (this.peerConnection.signalingState !== 'stable') {
      console.log(`⏸️ Invalid signaling state for connection: ${this.peerConnection.signalingState}`);
      return;
    }

    this.isConnecting = true;
    this.connectionStarted = true;

    try {
      console.log('🚀 Creating P2P offer...');
      
      // Perfect Negotiation: Track that we're making an offer
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
      // Perfect Negotiation: Reset makingOffer flag
      this.makingOffer = false;
      
      // Reset connecting flag after a delay
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
    }, 3000); // Less frequent for fallback service
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

    // Simplified quality determination
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

    // Log stats for post-call analysis
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
    this.qualityLogger.recordRecoveryAttempt(); // Log recovery attempt
    this.updateState('reconnecting');

    // Shorter timeout for mobile (mobile users are less patient)
    const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const timeout = isMobile ? 2000 : 3000 * this.reconnectAttempts;

    setTimeout(async () => {
      try {
        if (this.peerConnection) {
          this.peerConnection.close();
          this.peerConnection = null;
        }
        
        // Reset connection state for clean retry
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

  // Public methods
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
        
        // Return muted state (true = muted, false = unmuted)
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
        
        // Return off state (true = off, false = on)
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
    this.resetConnectionState(); // Reset state before reinitializing
    await this.initialize();
  }

  // Handle adaptive quality changes
  private async handleQualityChange(profile: VideoQualityProfile, conditions: NetworkConditions): Promise<void> {
    if (!this.localStream || !this.peerConnection || !this.qualityService) return;

    try {
      console.log(`🔄 Adapting video quality to ${profile.name} (${profile.resolution.width}x${profile.resolution.height})`);
      
      // Get new constraints
      const newConstraints = this.qualityService.getVideoConstraints();
      
      // Apply constraints to existing video track
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
          // Try with more relaxed constraints
          const fallbackConstraints = {
            width: { ideal: profile.resolution.width },
            height: { ideal: profile.resolution.height }
          };
          await videoTrack.applyConstraints(fallbackConstraints);
        }
      }

      // Update connection stats with proper type mapping
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
    this.updateState('ended');

    // Reset connection state flags
    this.isConnecting = false;
    this.connectionStarted = false;
    this.hasRemoteDescription = false;
    this.pendingCandidates = [];

    if (this.statsInterval) {
      clearInterval(this.statsInterval);
      this.statsInterval = null;
    }

    if (this.dataChannel) {
      this.dataChannel.close();
      this.dataChannel = null;
    }

    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }

    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
    }

    if (this.signalingChannel) {
      this.signalingChannel.unsubscribe();
      this.signalingChannel = null;
    }

    // End quality logging and save session summary
    await this.qualityLogger.endSession();
  }

  // Reset connection state for retry attempts
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

  // Static method to check P2P WebRTC support
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