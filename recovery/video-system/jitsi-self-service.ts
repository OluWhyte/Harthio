/**
 * Self-Hosted Jitsi Meet Integration Service
 * Uses your custom Jitsi server at session.harthio.com with coturn
 */

declare global {
  interface Window {
    JitsiMeetExternalAPI: any;
  }
}

export interface JitsiSelfConfig {
  roomName: string;
  displayName: string;
  email?: string;
  avatarUrl?: string;
}

export interface JitsiSelfCallbacks {
  onReady: () => void;
  onJoined: () => void;
  onLeft: () => void;
  onError: (error: any) => void;
  onMessage: (message: { from: string; message: string }) => void;
  onRemoteDeviceInfo?: (deviceInfo: any) => void;
}

export class JitsiSelfService {
  private api: any = null;
  private container: HTMLElement | null = null;
  private callbacks: JitsiSelfCallbacks;
  private config: JitsiSelfConfig;
  private customDomain: string;
  
  // Track state since Jitsi doesn't expose it easily
  private isAudioMuted: boolean = false;
  private isVideoOff: boolean = false;

  constructor(config: JitsiSelfConfig, callbacks: JitsiSelfCallbacks) {
    this.config = config;
    this.callbacks = callbacks;
    this.customDomain = process.env.NEXT_PUBLIC_JITSI_DOMAIN || "session.harthio.com";
  }

  async initialize(containerId: string): Promise<void> {
    try {
      console.log('📡 JitsiSelf: Starting initialization with custom domain:', this.customDomain);
      
      // Load Jitsi Meet API from your custom server
      console.log('📡 JitsiSelf: Loading custom Jitsi API...');
      await this.loadCustomJitsiAPI();
      console.log('📡 JitsiSelf: Custom Jitsi API loaded successfully');

      this.container = document.getElementById(containerId);
      if (!this.container) {
        throw new Error(`Container with id ${containerId} not found`);
      }
      console.log('📡 JitsiSelf: Container found, creating meeting...');

      // Configure Jitsi options for your self-hosted server
      const options = {
        roomName: this.config.roomName,
        width: '100%',
        height: '100%',
        parentNode: this.container,
        configOverwrite: {
          startWithAudioMuted: false,
          startWithVideoMuted: false,
          enableWelcomePage: false,
          enableClosePage: false,
          prejoinPageEnabled: false,
          disableInviteFunctions: true,
          doNotStoreRoom: true,
          disableDeepLinking: true,
          disableShortcuts: true,
          disableLocalVideoFlip: false,
          
          // Mobile network optimizations for Africa with your coturn server
          enableLayerSuspension: true,
          enableTcc: true,
          enableRemb: true,
          enableSimulcast: false, // Disable for mobile networks
          startBitrate: 800, // Lower starting bitrate for mobile
          minBitrate: 200, // Lower minimum for poor connections
          maxBitrate: 2500, // Cap max bitrate for mobile data
          
          // Audio optimizations
          enableOpusRed: true,
          opusMaxAverageBitrate: 32000, // Lower for mobile
          stereo: false, // Disable stereo for bandwidth
          
          // Video optimizations
          resolution: 360, // Start with lower resolution
          constraints: {
            video: {
              height: { ideal: 360, max: 720 },
              width: { ideal: 640, max: 1280 },
              frameRate: { ideal: 15, max: 30 } // Lower framerate for mobile
            }
          },
          
          // Connection optimizations with your coturn server
          useStunTurn: true,
          p2p: {
            enabled: true,
            stunServers: [
              { urls: `stun:${process.env.NEXT_PUBLIC_COTURN_SERVER}` },
              { urls: 'stun:stun.l.google.com:19302' },
              { urls: 'stun:stun1.l.google.com:19302' }
            ]
          },
          
          // Custom TURN server configuration
          iceServers: [
            {
              urls: `turn:${process.env.NEXT_PUBLIC_COTURN_SERVER}`,
              username: process.env.NEXT_PUBLIC_COTURN_USERNAME || 'harthio',
              credential: process.env.NEXT_PUBLIC_COTURN_SECRET
            },
            {
              urls: `stun:${process.env.NEXT_PUBLIC_COTURN_SERVER}`
            }
          ],
          
          remoteVideoMenu: {
            disableKick: true,
            disableGrantModerator: true,
            disablePrivateChat: true,
          },
          toolbarButtons: [
            'microphone',
            'camera',
            'hangup',
            'chat',
            'settings',
            'fullscreen'
          ],
          
          // Brand colors for your server
          brandingRoomAlias: 'Harthio Session',
          defaultRemoteDisplayName: 'Participant',
        },
        interfaceConfigOverwrite: {
          SHOW_JITSI_WATERMARK: false,
          SHOW_WATERMARK_FOR_GUESTS: false,
          SHOW_BRAND_WATERMARK: false,
          BRAND_WATERMARK_LINK: '',
          SHOW_POWERED_BY: false,
          DISPLAY_WELCOME_PAGE_CONTENT: false,
          DISPLAY_WELCOME_PAGE_TOOLBAR_ADDITIONAL_CONTENT: false,
          SHOW_CHROME_EXTENSION_BANNER: false,
          MOBILE_APP_PROMO: false,
          NATIVE_APP_NAME: 'Harthio',
          PROVIDER_NAME: 'Harthio',
          // Customize toolbar
          TOOLBAR_BUTTONS: [
            'microphone',
            'camera',
            'hangup',
            'chat',
            'settings',
            'fullscreen'
          ],
          // Hide unnecessary elements
          SETTINGS_SECTIONS: ['devices', 'language'],
          VIDEO_LAYOUT_FIT: 'both',
          filmStripOnly: false,
          VERTICAL_FILMSTRIP: true,
        },
        userInfo: {
          displayName: this.config.displayName,
          email: this.config.email,
          avatarUrl: this.config.avatarUrl,
        }
      };

      // Create Jitsi Meet API instance with your custom domain
      this.api = new window.JitsiMeetExternalAPI(this.customDomain, options);

      // Setup event listeners
      this.setupEventListeners();

    } catch (error) {
      console.error('Failed to initialize JitsiSelf:', error);
      this.callbacks.onError(error);
    }
  }

  private async loadCustomJitsiAPI(): Promise<void> {
    return new Promise((resolve, reject) => {
      // Check if already loaded
      if (window.JitsiMeetExternalAPI) {
        resolve();
        return;
      }

      // Create script element for your custom server
      const script = document.createElement('script');
      script.src = `https://${this.customDomain}/external_api.js`;
      script.async = true;
      
      script.onload = () => {
        if (window.JitsiMeetExternalAPI) {
          console.log('✅ JitsiSelf: Custom Jitsi API loaded from', this.customDomain);
          resolve();
        } else {
          reject(new Error('Failed to load custom Jitsi API'));
        }
      };
      
      script.onerror = () => {
        console.error('❌ JitsiSelf: Failed to load from', this.customDomain);
        reject(new Error(`Failed to load custom Jitsi API from ${this.customDomain}`));
      };

      document.head.appendChild(script);
    });
  }

  private setupEventListeners(): void {
    if (!this.api) return;

    // Ready event
    this.api.addEventListener('videoConferenceJoined', () => {
      console.log('JitsiSelf conference joined');
      this.callbacks.onJoined();
    });

    // Left event
    this.api.addEventListener('videoConferenceLeft', () => {
      console.log('JitsiSelf conference left');
      this.callbacks.onLeft();
    });

    // Ready event
    this.api.addEventListener('readyToClose', () => {
      console.log('JitsiSelf ready to close');
      this.callbacks.onReady();
    });

    // Error events
    this.api.addEventListener('errorOccurred', (error: any) => {
      console.error('JitsiSelf error:', error);
      this.callbacks.onError(error);
    });

    // Chat message events
    this.api.addEventListener('incomingMessage', (message: any) => {
      this.callbacks.onMessage({
        from: message.from,
        message: message.message
      });
    });

    // Device info messages via endpoint text messages
    this.api.addEventListener('endpointTextMessageReceived', (event: any) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'device-info' && data.deviceInfo) {
          console.log('📱 JitsiSelf: Received device info from remote user:', data.deviceInfo);
          this.callbacks.onRemoteDeviceInfo?.(data.deviceInfo);
        }
      } catch (error) {
        console.warn('📱 JitsiSelf: Failed to parse endpoint text message:', error);
      }
    });

    // Participant events
    this.api.addEventListener('participantJoined', (participant: any) => {
      console.log('JitsiSelf participant joined:', participant);
    });

    this.api.addEventListener('participantLeft', (participant: any) => {
      console.log('JitsiSelf participant left:', participant);
    });
  }

  // Public methods
  sendMessage(message: string): void {
    if (this.api) {
      this.api.executeCommand('sendChatMessage', message);
    }
  }

  async toggleAudio(): Promise<boolean> {
    console.log('🎤 JitsiSelfService: toggleAudio called');
    if (this.api) {
      this.api.executeCommand('toggleAudio');
      console.log('🎤 JitsiSelf toggleAudio command executed');
      
      // Toggle our tracked state
      this.isAudioMuted = !this.isAudioMuted;
      
      console.log(`🎤 JitsiSelf audio state toggled to muted: ${this.isAudioMuted}`);
      return this.isAudioMuted;
    } else {
      console.warn('🎤 JitsiSelf API not available for toggleAudio');
      return this.isAudioMuted;
    }
  }

  async toggleVideo(): Promise<boolean> {
    console.log('📹 JitsiSelfService: toggleVideo called');
    if (this.api) {
      this.api.executeCommand('toggleVideo');
      console.log('📹 JitsiSelf toggleVideo command executed');
      
      // Toggle our tracked state
      this.isVideoOff = !this.isVideoOff;
      
      console.log(`📹 JitsiSelf video state toggled to off: ${this.isVideoOff}`);
      return this.isVideoOff;
    } else {
      console.warn('📹 JitsiSelf API not available for toggleVideo');
      return this.isVideoOff;
    }
  }

  // Get current audio/video states (using our tracked state)
  getCurrentStates(): { isAudioMuted: boolean; isVideoOff: boolean } {
    console.log(`🔧 JitsiSelfService: getCurrentStates called - audio muted: ${this.isAudioMuted}, video off: ${this.isVideoOff}`);
    return {
      isAudioMuted: this.isAudioMuted,
      isVideoOff: this.isVideoOff
    };
  }

  // Set initial mute states
  setInitialMuteStates(audioMuted: boolean, videoOff: boolean): void {
    console.log(`🔧 JitsiSelfService: Setting initial states - audio muted: ${audioMuted}, video off: ${videoOff}`);
    
    // Update our tracked state
    this.isAudioMuted = audioMuted;
    this.isVideoOff = videoOff;
    
    if (this.api) {
      // Jitsi Meet API commands for setting specific states
      // We'll use a timeout to ensure the API is fully ready
      setTimeout(() => {
        if (this.api) {
          // Set audio state - Jitsi has specific mute/unmute commands
          if (audioMuted) {
            this.api.executeCommand('muteAudio');
          } else {
            this.api.executeCommand('unmuteAudio');
          }
          
          // Set video state - for video we need to check if we want it off
          // Jitsi typically starts with video on, so we only need to turn it off if requested
          if (videoOff) {
            // We'll assume video starts on and toggle it off
            this.api.executeCommand('toggleVideo');
          }
          // If videoOff is false, we assume Jitsi starts with video on (which is typical)
        }
      }, 500); // Small delay to ensure API is ready
    }
  }

  hangup(): void {
    if (this.api) {
      this.api.executeCommand('hangup');
    }
  }

  setDisplayName(name: string): void {
    if (this.api) {
      this.api.executeCommand('displayName', name);
    }
  }

  getParticipants(): Promise<any[]> {
    return new Promise((resolve) => {
      if (this.api) {
        this.api.getParticipantsInfo().then((participants: any[]) => {
          resolve(participants);
        });
      } else {
        resolve([]);
      }
    });
  }

  dispose(): void {
    if (this.api) {
      this.api.dispose();
      this.api = null;
    }
    
    if (this.container) {
      this.container.innerHTML = '';
    }
  }

  isConnected(): boolean {
    return this.api !== null;
  }

  // Get connection quality (simplified for Jitsi)
  getConnectionStats(): Promise<any> {
    return new Promise((resolve) => {
      if (this.api) {
        // Jitsi doesn't expose detailed stats easily, return mock data
        resolve({
          bandwidth: 1000,
          latency: 50,
          packetLoss: 0,
          quality: 'good',
          resolution: '720p',
          frameRate: 30
        });
      } else {
        resolve({
          bandwidth: 0,
          latency: 0,
          packetLoss: 0,
          quality: 'failed',
          resolution: 'unknown',
          frameRate: 0
        });
      }
    });
  }

  // Send device info via Jitsi data channel (if available)
  sendDeviceInfo(deviceInfo: any): void {
    if (this.api) {
      try {
        // Jitsi Meet doesn't have a direct data channel API like Daily.co
        // We could potentially use the chat feature or custom commands
        // For now, we'll use a custom command approach
        this.api.executeCommand('sendEndpointTextMessage', '', JSON.stringify({
          type: 'device-info',
          deviceInfo: deviceInfo
        }));
      } catch (error) {
        console.error('Failed to send device info via JitsiSelf:', error);
      }
    }
  }
}