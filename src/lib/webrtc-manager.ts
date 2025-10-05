// ============================================================================
// WEBRTC CONNECTION MANAGER
// ============================================================================
// Handles peer-to-peer video calling with multiple TURN server fallbacks
// Uses Supabase real-time for signaling between participants
// ============================================================================

import { generateTurnCredentials, validateWebRTCConfig } from './crypto-utils';
import { SignalingService, type SignalingMessage } from './signaling-service';
import { PresenceService } from './presence-service';

// WebRTC connection states
export type ConnectionState = 'loading' | 'waiting' | 'connecting' | 'connected' | 'reconnecting' | 'failed' | 'disconnected';

// Remove duplicate interface - using the one from signaling-service

// Detect if running on mobile device
function isMobileDevice(): boolean {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

// ICE server configuration optimized for mobile localhost testing
async function getIceServers(userId: string, sessionId: string): Promise<RTCIceServer[]> {
  const config = validateWebRTCConfig();
  const turnCreds = config.coturnSecret ? 
    await generateTurnCredentials(userId, sessionId, config.coturnSecret) : 
    null;
  
  // Check if we're on localhost/local network for testing
  const isLocalhost = typeof window !== 'undefined' && (
    window.location.hostname === 'localhost' || 
    window.location.hostname.startsWith('192.168.') ||
    window.location.hostname.startsWith('10.') ||
    window.location.hostname.startsWith('172.')
  );
  
  const servers: RTCIceServer[] = [
    // Google STUN servers (always available, work well for localhost testing)
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ];

  // For localhost testing, prioritize reliable TURN servers
  if (isLocalhost) {
    // Add reliable TURN servers for localhost mobile testing
    servers.push(
      // OpenRelay TURN servers (very reliable for testing)
      {
        urls: 'turn:openrelay.metered.ca:80',
        username: 'openrelayproject',
        credential: 'openrelayproject'
      },
      {
        urls: 'turn:openrelay.metered.ca:443',
        username: 'openrelayproject',
        credential: 'openrelayproject'
      },
      {
        urls: 'turn:openrelay.metered.ca:80?transport=tcp',
        username: 'openrelayproject',
        credential: 'openrelayproject'
      },
      {
        urls: 'turn:openrelay.metered.ca:443?transport=tcp',
        username: 'openrelayproject',
        credential: 'openrelayproject'
      },
      
      // Backup TURN servers
      {
        urls: 'turn:relay.backups.cz',
        username: 'webrtc',
        credential: 'webrtc'
      },
      {
        urls: 'turn:relay.backups.cz:443',
        username: 'webrtc',
        credential: 'webrtc'
      }
    );
  } else {
    // Production TURN servers
    servers.push(
      // Primary: Free Google TURN servers (most reliable for mobile)
      {
        urls: 'turn:142.250.82.127:19305?transport=udp',
        username: 'webrtc',
        credential: 'turnserver'
      },
      {
        urls: 'turn:142.250.82.127:19305?transport=tcp',
        username: 'webrtc',
        credential: 'turnserver'
      },
      
      // Secondary: OpenRelay TURN servers
      {
        urls: 'turn:openrelay.metered.ca:80',
        username: 'openrelayproject',
        credential: 'openrelayproject'
      },
      {
        urls: 'turn:openrelay.metered.ca:443',
        username: 'openrelayproject',
        credential: 'openrelayproject'
      },
      {
        urls: 'turn:openrelay.metered.ca:80?transport=tcp',
        username: 'openrelayproject',
        credential: 'openrelayproject'
      },
      {
        urls: 'turn:openrelay.metered.ca:443?transport=tcp',
        username: 'openrelayproject',
        credential: 'openrelayproject'
      },
      
      // Additional free TURN servers for better mobile support
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
      {
        urls: 'turn:relay.backups.cz:80?transport=tcp',
        username: 'webrtc',
        credential: 'webrtc'
      }
    );
  }

  // Add your COTURN server if configured (works for both localhost and production)
  if (config.coturnServer && turnCreds) {
    servers.push(
      {
        urls: `turn:${config.coturnServer}:3478`,
        username: turnCreds.username,
        credential: turnCreds.credential
      },
      {
        urls: `turn:${config.coturnServer}:3478?transport=tcp`,
        username: turnCreds.username,
        credential: turnCreds.credential
      },
      {
        urls: `turn:${config.coturnServer}:5349`,
        username: turnCreds.username,
        credential: turnCreds.credential
      },
      {
        urls: `turn:${config.coturnServer}:5349?transport=tcp`,
        username: turnCreds.username,
        credential: turnCreds.credential
      }
    );
  }

  return servers;
}

export class WebRTCManager {
  private peerConnection: RTCPeerConnection | null = null;
  private localStream: MediaStream | null = null;
  private signalingService: SignalingService;
  private presenceService: PresenceService;
  private isInitiator: boolean = false;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 3;
  private connectionTimeout: NodeJS.Timeout | null = null;

  constructor(
    private sessionId: string,
    private userId: string,
    private remoteUserId: string,
    private userName: string,
    private onRemoteStream: (stream: MediaStream) => void,
    private onConnectionStateChange: (state: ConnectionState) => void,
    private onError: (error: string) => void,
    private onUserNotification?: (message: string) => void
  ) {
    // Determine who initiates the connection (user with smaller ID)
    this.isInitiator = this.userId < this.remoteUserId;
    this.signalingService = new SignalingService(sessionId, userId);
    this.presenceService = new PresenceService(sessionId, userId);
    console.log(`WebRTC Manager initialized. Initiator: ${this.isInitiator}`);
  }

  // Initialize WebRTC connection
  async initialize(localStream: MediaStream): Promise<void> {
    try {
      this.localStream = localStream;
      this.onConnectionStateChange('connecting');
      
      // Join session and setup presence
      await this.presenceService.joinSession();
      this.setupPresence();
      
      // Create peer connection with ICE servers
      await this.createPeerConnection();
      
      // Add local stream to peer connection
      this.localStream.getTracks().forEach(track => {
        if (this.peerConnection && this.localStream) {
          this.peerConnection.addTrack(track, this.localStream);
        }
      });
      
      // Setup signaling
      this.setupSignaling();
      
      // Notify other user that we joined
      await this.signalingService.sendUserJoined(this.remoteUserId, this.userName);
      
      // Start connection process
      if (this.isInitiator) {
        await this.createOffer();
      }
      
      // Set connection timeout
      this.connectionTimeout = setTimeout(() => {
        if (this.peerConnection?.connectionState !== 'connected') {
          this.handleConnectionTimeout();
        }
      }, 30000); // 30 second timeout
      
    } catch (error) {
      console.error('Failed to initialize WebRTC:', error);
      this.onError('Failed to initialize video connection');
      this.onConnectionStateChange('failed');
    }
  }

  // Create RTCPeerConnection with proper configuration
  private async createPeerConnection(): Promise<void> {
    const iceServers = await getIceServers(this.userId, this.sessionId);
    const isMobile = isMobileDevice();
    
    // Check if we're on localhost for testing
    const isLocalhost = typeof window !== 'undefined' && (
      window.location.hostname === 'localhost' || 
      window.location.hostname.startsWith('192.168.') ||
      window.location.hostname.startsWith('10.') ||
      window.location.hostname.startsWith('172.')
    );
    
    this.peerConnection = new RTCPeerConnection({
      iceServers,
      iceCandidatePoolSize: isMobile ? (isLocalhost ? 5 : 3) : 10, // More candidates for localhost testing
      bundlePolicy: 'max-bundle',
      rtcpMuxPolicy: 'require',
      iceTransportPolicy: 'all', // Allow both STUN and TURN
      // Mobile-specific optimizations
      ...(isMobile && {
        sdpSemantics: 'unified-plan'
      })
    });

    // Handle remote stream
    this.peerConnection.ontrack = (event) => {
      console.log('Received remote stream');
      const [remoteStream] = event.streams;
      this.onRemoteStream(remoteStream);
    };

    // Handle ICE candidates
    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        this.sendSignalingMessage('ice-candidate', event.candidate.toJSON());
      }
    };

    // Handle connection state changes
    this.peerConnection.onconnectionstatechange = () => {
      const state = this.peerConnection?.connectionState;
      console.log('Connection state changed:', state);
      
      switch (state) {
        case 'connected':
          this.onConnectionStateChange('connected');
          this.reconnectAttempts = 0;
          if (this.connectionTimeout) {
            clearTimeout(this.connectionTimeout);
            this.connectionTimeout = null;
          }
          this.onUserNotification?.('Connected successfully!');
          break;
        case 'connecting':
          this.onConnectionStateChange('connecting');
          break;
        case 'disconnected':
          // Don't immediately show error - might be temporary
          console.log('Connection disconnected, monitoring for recovery...');
          const isMobile = isMobileDevice();
          const waitTime = isMobile ? 5000 : 3000; // Wait longer on mobile
          
          setTimeout(() => {
            if (this.peerConnection?.connectionState === 'disconnected') {
              this.onConnectionStateChange('waiting'); // Show waiting instead of error
              this.onUserNotification?.('Connection lost. Waiting for participant to rejoin...');
            }
          }, waitTime);
          break;
        case 'failed':
          console.log('Connection failed, attempting recovery...');
          this.onConnectionStateChange('waiting'); // Show waiting for rejoin
          this.onUserNotification?.('Connection failed. Preparing for reconnection...');
          this.handleUserLeft(); // Prepare for rejoin
          break;
        case 'closed':
          this.onConnectionStateChange('waiting'); // Show waiting instead of disconnected
          break;
      }
    };

    // Handle ICE connection state changes
    this.peerConnection.oniceconnectionstatechange = () => {
      const state = this.peerConnection?.iceConnectionState;
      console.log('ICE connection state:', state);
      
      if (state === 'failed' && this.reconnectAttempts < this.maxReconnectAttempts) {
        this.attemptReconnection();
      }
    };
  }

  // Setup signaling channel via Supabase real-time
  private setupSignaling(): void {
    this.signalingService.subscribe((message) => {
      this.handleSignalingMessage(message);
    });
  }

  // Setup presence monitoring
  private setupPresence(): void {
    this.presenceService.subscribeToPresence((event) => {
      console.log('Presence event:', event);
      
      if (event.user_id !== this.userId) {
        if (event.status === 'active') {
          this.onUserNotification?.(`User joined the session`);
          // If we're in waiting state and someone joins, prepare for connection
          if (this.peerConnection?.connectionState === 'closed' || !this.peerConnection) {
            this.prepareForReconnection().catch(error => {
              console.error('Failed to prepare for reconnection:', error);
            });
          }
        } else if (event.status === 'left') {
          this.onUserNotification?.(`User left the session`);
          // Reset to waiting state for potential rejoin
          this.onConnectionStateChange('waiting');
          this.handleUserLeft();
        }
      }
    });
  }

  // Handle when remote user leaves
  private handleUserLeft(): void {
    console.log('Handling user left scenario');
    
    // Close current peer connection
    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }
    
    // Clear any connection timeout
    if (this.connectionTimeout) {
      clearTimeout(this.connectionTimeout);
      this.connectionTimeout = null;
    }
    
    // Reset reconnection attempts
    this.reconnectAttempts = 0;
    
    // Prepare for potential rejoin by recreating peer connection
    this.prepareForReconnection().catch(error => {
      console.error('Failed to prepare for reconnection:', error);
    });
  }

  // Prepare for reconnection when user might rejoin
  private async prepareForReconnection(): Promise<void> {
    console.log('Preparing for potential reconnection');
    
    if (!this.localStream) {
      console.warn('No local stream available for reconnection');
      return;
    }
    
    // Create new peer connection
    await this.createPeerConnection();
    
    // Re-add local stream
    this.localStream.getTracks().forEach(track => {
      if (this.peerConnection && this.localStream) {
        this.peerConnection.addTrack(track, this.localStream);
      }
    });
    
    // If we're the initiator, create new offer
    if (this.isInitiator) {
      setTimeout(() => {
        this.createOffer().catch(error => {
          console.error('Failed to create offer for reconnection:', error);
        });
      }, 1000); // Small delay to ensure everything is set up
    }
  }

  // Send signaling message via signaling service
  private async sendSignalingMessage(type: SignalingMessage['type'], data: any): Promise<void> {
    try {
      await this.signalingService.sendMessage(this.remoteUserId, type, data);
    } catch (error) {
      console.error('Error sending signaling message:', error);
      this.onError('Failed to send connection data');
    }
  }

  // Handle incoming signaling messages
  private async handleSignalingMessage(message: SignalingMessage): Promise<void> {
    try {
      console.log('Received signaling message:', message.type);
      
      switch (message.type) {
        case 'offer':
          await this.handleOffer(message.data);
          break;
        case 'answer':
          await this.handleAnswer(message.data);
          break;
        case 'ice-candidate':
          await this.handleIceCandidate(message.data);
          break;
        case 'connection-state':
          console.log('Remote connection state:', message.data.state);
          break;
        case 'user-joined':
          console.log('User joined:', message.data.userName);
          this.onUserNotification?.(`${message.data.userName} joined the call`);
          break;
        case 'user-left':
          console.log('User left:', message.data.userName);
          this.onUserNotification?.(`${message.data.userName} left the call`);
          // Reset to waiting state instead of disconnected
          this.onConnectionStateChange('waiting');
          // Clean up peer connection to prepare for potential rejoin
          if (this.peerConnection) {
            this.peerConnection.close();
            this.peerConnection = null;
          }
          break;
      }
    } catch (error) {
      console.error('Error handling signaling message:', error);
    }
  }

  // Create and send offer (initiator only)
  private async createOffer(): Promise<void> {
    if (!this.peerConnection) return;
    
    try {
      const isMobile = isMobileDevice();
      
      const offer = await this.peerConnection.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true,
        // Mobile-specific constraints
        ...(isMobile && {
          voiceActivityDetection: true,
          iceRestart: false
        })
      });
      
      await this.peerConnection.setLocalDescription(offer);
      
      await this.sendSignalingMessage('offer', offer);
      
      console.log('Offer created and sent');
    } catch (error) {
      console.error('Failed to create offer:', error);
      this.onError('Failed to create connection offer');
    }
  }

  // Handle incoming offer (non-initiator)
  private async handleOffer(offer: RTCSessionDescriptionInit): Promise<void> {
    if (!this.peerConnection) return;
    
    try {
      await this.peerConnection.setRemoteDescription(offer);
      
      const answer = await this.peerConnection.createAnswer();
      await this.peerConnection.setLocalDescription(answer);
      
      await this.sendSignalingMessage('answer', answer);
      
      console.log('Answer created and sent');
    } catch (error) {
      console.error('Failed to handle offer:', error);
      this.onError('Failed to handle connection offer');
    }
  }

  // Handle incoming answer (initiator only)
  private async handleAnswer(answer: RTCSessionDescriptionInit): Promise<void> {
    if (!this.peerConnection) return;
    
    try {
      await this.peerConnection.setRemoteDescription(answer);
      console.log('Answer received and processed');
    } catch (error) {
      console.error('Failed to handle answer:', error);
      this.onError('Failed to handle connection answer');
    }
  }

  // Handle incoming ICE candidate
  private async handleIceCandidate(candidate: RTCIceCandidateInit): Promise<void> {
    if (!this.peerConnection) return;
    
    try {
      await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
      console.log('ICE candidate added');
    } catch (error) {
      console.error('Failed to add ICE candidate:', error);
    }
  }

  // Handle connection timeout
  private handleConnectionTimeout(): void {
    console.log('Connection timeout, attempting reconnection');
    this.attemptReconnection();
  }

  // Attempt to reconnect
  private async attemptReconnection(): Promise<void> {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      this.onConnectionStateChange('failed');
      this.onError('Connection failed after multiple attempts');
      return;
    }

    this.reconnectAttempts++;
    this.onConnectionStateChange('reconnecting');
    
    console.log(`Reconnection attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);
    
    // Close existing connection
    this.peerConnection?.close();
    
    // Wait a bit before reconnecting
    setTimeout(async () => {
      if (this.localStream) {
        await this.createPeerConnection();
        
        // Re-add local stream
        this.localStream.getTracks().forEach(track => {
          if (this.peerConnection && this.localStream) {
            this.peerConnection.addTrack(track, this.localStream);
          }
        });
        
        // Restart connection process
        if (this.isInitiator) {
          await this.createOffer();
        }
      }
    }, 2000 * this.reconnectAttempts); // Exponential backoff
  }

  // Toggle audio mute
  toggleAudio(muted: boolean): void {
    if (this.localStream) {
      this.localStream.getAudioTracks().forEach(track => {
        track.enabled = !muted;
      });
    }
  }

  // Toggle video
  toggleVideo(enabled: boolean): void {
    if (this.localStream) {
      this.localStream.getVideoTracks().forEach(track => {
        track.enabled = enabled;
      });
    }
  }

  // Clean up resources
  async cleanup(): Promise<void> {
    console.log('Cleaning up WebRTC resources');
    
    // Notify other user that we're leaving
    try {
      await this.signalingService.sendUserLeft(this.remoteUserId, this.userName);
    } catch (error) {
      console.error('Failed to send user left notification:', error);
    }
    
    if (this.connectionTimeout) {
      clearTimeout(this.connectionTimeout);
      this.connectionTimeout = null;
    }
    
    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }
    
    this.signalingService.unsubscribe();
    await this.presenceService.cleanup();
    
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
    }
  }

  // Get connection statistics (for debugging)
  async getConnectionStats(): Promise<RTCStatsReport | null> {
    if (this.peerConnection) {
      return await this.peerConnection.getStats();
    }
    return null;
  }
}