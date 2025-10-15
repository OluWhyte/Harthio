// ============================================================================
// WEBRTC CONNECTION MANAGER
// ============================================================================
// Handles peer-to-peer video calling with multiple TURN server fallbacks
// Uses Supabase real-time for signaling between participants
// ============================================================================

import { generateTurnCredentials, validateWebRTCConfig } from './crypto-utils';
import { SignalingService, type SignalingMessage } from './signaling-service';
import { PresenceService } from './presence-service';
import { mobileOptimizer } from './mobile-optimizations';

// WebRTC connection states
export type ConnectionState = 'loading' | 'waiting' | 'connecting' | 'connected' | 'reconnecting' | 'failed' | 'disconnected';

// Remove duplicate interface - using the one from signaling-service

// Detect if running on mobile device
function isMobileDevice(): boolean {
  if (typeof navigator === 'undefined') return false;
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
    // Parse server to handle cases where port is already included
    const serverParts = config.coturnServer.split(':');
    const serverHost = serverParts[0];
    const serverPort = serverParts[1] || '3478'; // Default to 3478 if no port specified
    
    servers.push(
      {
        urls: `turn:${serverHost}:${serverPort}`,
        username: turnCreds.username,
        credential: turnCreds.credential
      },
      {
        urls: `turn:${serverHost}:${serverPort}?transport=tcp`,
        username: turnCreds.username,
        credential: turnCreds.credential
      },
      // Also try TLS port if different from main port
      ...(serverPort !== '5349' ? [{
        urls: `turn:${serverHost}:5349`,
        username: turnCreds.username,
        credential: turnCreds.credential
      },
      {
        urls: `turn:${serverHost}:5349?transport=tcp`,
        username: turnCreds.username,
        credential: turnCreds.credential
      }] : [])
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
  private lastStateChange: number = 0;
  private isCleaningUp: boolean = false;

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

  // Initialize WebRTC connection with improved error handling and performance
  async initialize(localStream: MediaStream): Promise<void> {
    try {
      this.localStream = localStream;
      this.onConnectionStateChange('connecting');
      
      // Use Promise.allSettled for non-blocking parallel initialization
      const initPromises = [
        this.presenceService.joinSession().catch(err => {
          console.warn('Presence service failed, continuing without it:', err);
          return null;
        }),
        this.createPeerConnection()
      ];
      
      await Promise.allSettled(initPromises);
      
      // Setup presence after peer connection is ready
      this.setupPresence();
      
      // Add local stream to peer connection with error handling
      if (this.peerConnection && this.localStream) {
        this.localStream.getTracks().forEach(track => {
          try {
            if (this.peerConnection && this.localStream) {
              this.peerConnection.addTrack(track, this.localStream);
            }
          } catch (trackError) {
            console.warn('Failed to add track:', trackError);
          }
        });
      }
      
      // Setup signaling
      this.setupSignaling();
      
      // Non-blocking user notification
      this.signalingService.sendUserJoined(this.remoteUserId, this.userName)
        .catch(err => console.warn('Failed to send user joined notification:', err));
      
      // Start connection process with delay for mobile stability
      if (this.isInitiator) {
        // Small delay for mobile devices to ensure everything is ready
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        const delay = isMobile ? 1000 : 500;
        
        setTimeout(() => {
          this.createOffer().catch(err => {
            console.error('Failed to create initial offer:', err);
            this.onError('Failed to start connection');
          });
        }, delay);
      }
      
      // Use optimized timeout from mobile optimizer
      const baseTimeout = 30000;
      const timeoutDuration = mobileOptimizer.getOptimizedTimeout(baseTimeout);
      this.connectionTimeout = setTimeout(() => {
        if (this.peerConnection?.connectionState !== 'connected') {
          this.handleConnectionTimeout();
        }
      }, timeoutDuration);
      
    } catch (error) {
      console.error('Failed to initialize WebRTC:', error);
      this.onError('Failed to initialize video connection');
      this.onConnectionStateChange('failed');
    }
  }

  // Create RTCPeerConnection with proper configuration and mobile optimizations
  private async createPeerConnection(): Promise<void> {
    const iceServers = await getIceServers(this.userId, this.sessionId);
    const isMobile = isMobileDevice();
    const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
    
    // Check if we're on localhost for testing
    const isLocalhost = typeof window !== 'undefined' && (
      window.location.hostname === 'localhost' || 
      window.location.hostname.startsWith('192.168.') ||
      window.location.hostname.startsWith('10.') ||
      window.location.hostname.startsWith('172.')
    );
    
    // Get optimized configuration from mobile optimizer
    const optimizedConfig = mobileOptimizer.getOptimizedWebRTCConfig();
    
    const peerConfig: RTCConfiguration = {
      iceServers,
      iceTransportPolicy: 'all',
      ...optimizedConfig,
      // Override with mobile-specific settings
      ...(isIOS && {
        sdpSemantics: 'unified-plan'
      }),
      // Mobile-specific optimizations
      ...(isMobile && !isIOS && {
        sdpSemantics: 'unified-plan'
      })
    };
    
    this.peerConnection = new RTCPeerConnection(peerConfig);

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

    // Handle connection state changes with improved mobile handling
    this.peerConnection.onconnectionstatechange = () => {
      const state = this.peerConnection?.connectionState;
      console.log('Connection state changed:', state);
      
      // Prevent rapid state changes from causing issues
      if (this.lastStateChange && Date.now() - this.lastStateChange < 1000) {
        console.log('Throttling rapid state change');
        return;
      }
      this.lastStateChange = Date.now();
      
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
          const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
          const waitTime = isIOS ? 8000 : (isMobile ? 5000 : 3000); // Wait longer on iOS
          
          // Use requestIdleCallback if available for better performance
          const scheduleCheck = (callback: () => void) => {
            if ('requestIdleCallback' in window) {
              requestIdleCallback(callback, { timeout: waitTime });
            } else {
              setTimeout(callback, waitTime);
            }
          };
          
          scheduleCheck(() => {
            if (this.peerConnection?.connectionState === 'disconnected') {
              this.onConnectionStateChange('waiting');
              this.onUserNotification?.('Connection lost. Waiting for participant to rejoin...');
            }
          });
          break;
        case 'failed':
          console.log('Connection failed, attempting recovery...');
          this.onConnectionStateChange('waiting');
          this.onUserNotification?.('Connection failed. Preparing for reconnection...');
          // Use non-blocking recovery
          setTimeout(() => this.handleUserLeft(), 100);
          break;
        case 'closed':
          this.onConnectionStateChange('waiting');
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

  // Clean up resources with improved error handling and performance
  async cleanup(): Promise<void> {
    if (this.isCleaningUp) {
      console.log('Cleanup already in progress, skipping...');
      return;
    }
    
    this.isCleaningUp = true;
    console.log('Cleaning up WebRTC resources');
    
    // Clear timeout first to prevent any pending operations
    if (this.connectionTimeout) {
      clearTimeout(this.connectionTimeout);
      this.connectionTimeout = null;
    }
    
    // Parallel cleanup for better performance
    const cleanupPromises = [];
    
    // Non-blocking user notification
    if (this.signalingService) {
      cleanupPromises.push(
        this.signalingService.sendUserLeft(this.remoteUserId, this.userName)
          .catch(error => console.warn('Failed to send user left notification:', error))
      );
    }
    
    // Cleanup presence service
    if (this.presenceService) {
      cleanupPromises.push(
        this.presenceService.cleanup()
          .catch(error => console.warn('Failed to cleanup presence service:', error))
      );
    }
    
    // Close peer connection immediately
    if (this.peerConnection) {
      try {
        this.peerConnection.close();
      } catch (error) {
        console.warn('Error closing peer connection:', error);
      }
      this.peerConnection = null;
    }
    
    // Stop local stream tracks
    if (this.localStream) {
      try {
        this.localStream.getTracks().forEach(track => {
          try {
            track.stop();
          } catch (error) {
            console.warn('Error stopping track:', error);
          }
        });
      } catch (error) {
        console.warn('Error stopping local stream:', error);
      }
      this.localStream = null;
    }
    
    // Unsubscribe from signaling
    if (this.signalingService) {
      try {
        this.signalingService.unsubscribe();
      } catch (error) {
        console.warn('Error unsubscribing from signaling:', error);
      }
    }
    
    // Wait for async cleanup operations with timeout
    try {
      await Promise.race([
        Promise.allSettled(cleanupPromises),
        new Promise(resolve => setTimeout(resolve, 3000)) // 3 second timeout
      ]);
    } catch (error) {
      console.warn('Cleanup operations timed out or failed:', error);
    }
    
    this.isCleaningUp = false;
    console.log('WebRTC cleanup completed');
  }

  // Get connection statistics (for debugging)
  async getConnectionStats(): Promise<RTCStatsReport | null> {
    if (this.peerConnection) {
      return await this.peerConnection.getStats();
    }
    return null;
  }
}