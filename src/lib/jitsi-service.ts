// ============================================================================
// JITSI MEET SERVICE
// ============================================================================
// Handles Jitsi Meet integration for video calling
// Provides primary video calling functionality with WebRTC as fallback
// ============================================================================

import { generateJitsiJWT } from './crypto-utils';

export interface JitsiConfig {
  domain: string;
  roomName: string;
  jwt?: string;
  userInfo: {
    displayName: string;
    email?: string;
    avatarURL?: string;
  };
  configOverwrite?: Record<string, any>;
  interfaceConfigOverwrite?: Record<string, any>;
}

export interface JitsiCallbacks {
  onReady?: () => void;
  onJoined?: () => void;
  onLeft?: () => void;
  onError?: (error: any) => void;
  onParticipantJoined?: (participant: any) => void;
  onParticipantLeft?: (participant: any) => void;
  onConnectionFailed?: () => void;
}

export type JitsiConnectionState = 
  | 'initializing' 
  | 'connecting' 
  | 'connected' 
  | 'disconnected' 
  | 'failed';

// Validate Jitsi configuration from environment
function validateJitsiConfig() {
  const domain = process.env.NEXT_PUBLIC_JITSI_DOMAIN;
  const jwtAppId = process.env.NEXT_PUBLIC_JITSI_JWT_APP_ID;
  const jwtSecret = process.env.NEXT_PUBLIC_JITSI_JWT_SECRET;

  if (!domain) {
    throw new Error('NEXT_PUBLIC_JITSI_DOMAIN is required');
  }

  return {
    domain,
    jwtAppId,
    jwtSecret,
    useJWT: !!(jwtAppId && jwtSecret)
  };
}

export class JitsiService {
  private api: any = null;
  private config: JitsiConfig;
  private callbacks: JitsiCallbacks;
  private connectionState: JitsiConnectionState = 'initializing';
  private container: HTMLElement | null = null;

  constructor(config: JitsiConfig, callbacks: JitsiCallbacks = {}) {
    this.config = config;
    this.callbacks = callbacks;
  }

  // Initialize Jitsi Meet
  async initialize(containerElement: HTMLElement): Promise<void> {
    try {
      this.container = containerElement;
      this.connectionState = 'connecting';

      // Load Jitsi Meet API if not already loaded
      await this.loadJitsiAPI();

      // Create Jitsi configuration
      const jitsiConfig = this.createJitsiConfig();

      // Initialize Jitsi Meet API
      this.api = new (window as any).JitsiMeetExternalAPI(
        this.config.domain,
        {
          roomName: this.config.roomName,
          parentNode: containerElement,
          jwt: this.config.jwt,
          configOverwrite: jitsiConfig.configOverwrite,
          interfaceConfigOverwrite: jitsiConfig.interfaceConfigOverwrite,
          userInfo: this.config.userInfo
        }
      );

      // Setup event listeners
      this.setupEventListeners();

      console.log('Jitsi Meet initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Jitsi Meet:', error);
      this.connectionState = 'failed';
      this.callbacks.onError?.(error);
      throw error;
    }
  }

  // Load Jitsi Meet External API
  private async loadJitsiAPI(): Promise<void> {
    return new Promise((resolve, reject) => {
      // Check if already loaded
      if ((window as any).JitsiMeetExternalAPI) {
        resolve();
        return;
      }

      // Create script element
      const script = document.createElement('script');
      script.src = `https://${this.config.domain}/external_api.js`;
      script.async = true;
      
      script.onload = () => {
        console.log('Jitsi Meet API loaded');
        resolve();
      };
      
      script.onerror = (error) => {
        console.error('Failed to load Jitsi Meet API:', error);
        reject(new Error('Failed to load Jitsi Meet API'));
      };

      document.head.appendChild(script);
    });
  }

  // Create Jitsi configuration
  private createJitsiConfig() {
    const baseConfig = {
      configOverwrite: {
        // Audio/Video settings
        startWithAudioMuted: false,
        startWithVideoMuted: false,
        
        // UI customization
        prejoinPageEnabled: false,
        disableInviteFunctions: true,
        
        // Mobile optimizations
        disableDeepLinking: true,
        enableWelcomePage: false,
        
        // Security
        enableLobbyChat: false,
        
        // Performance
        resolution: 720,
        constraints: {
          video: {
            height: { ideal: 720, max: 1080, min: 240 },
            width: { ideal: 1280, max: 1920, min: 320 }
          }
        },
        
        // Disable features not needed
        disableRemoteMute: true,
        remoteVideoMenu: {
          disableKick: true,
          disableGrantModerator: true
        },
        
        ...this.config.configOverwrite
      },
      
      interfaceConfigOverwrite: {
        // Toolbar customization
        TOOLBAR_BUTTONS: [
          'microphone', 'camera', 'hangup', 'chat', 'settings'
        ],
        
        // Hide elements
        SHOW_JITSI_WATERMARK: false,
        SHOW_WATERMARK_FOR_GUESTS: false,
        SHOW_BRAND_WATERMARK: false,
        BRAND_WATERMARK_LINK: '',
        
        // Mobile UI
        MOBILE_APP_PROMO: false,
        
        ...this.config.interfaceConfigOverwrite
      }
    };

    return baseConfig;
  }

  // Setup Jitsi event listeners
  private setupEventListeners(): void {
    if (!this.api) return;

    // Ready event
    this.api.addEventListener('videoConferenceJoined', () => {
      console.log('Jitsi: Conference joined');
      this.connectionState = 'connected';
      this.callbacks.onReady?.();
      this.callbacks.onJoined?.();
    });

    // Left event
    this.api.addEventListener('videoConferenceLeft', () => {
      console.log('Jitsi: Conference left');
      this.connectionState = 'disconnected';
      this.callbacks.onLeft?.();
    });

    // Participant events
    this.api.addEventListener('participantJoined', (participant: any) => {
      console.log('Jitsi: Participant joined', participant);
      this.callbacks.onParticipantJoined?.(participant);
    });

    this.api.addEventListener('participantLeft', (participant: any) => {
      console.log('Jitsi: Participant left', participant);
      this.callbacks.onParticipantLeft?.(participant);
    });

    // Error events
    this.api.addEventListener('connectionFailed', () => {
      console.error('Jitsi: Connection failed');
      this.connectionState = 'failed';
      this.callbacks.onConnectionFailed?.();
    });

    // Ready state
    this.api.addEventListener('readyToClose', () => {
      console.log('Jitsi: Ready to close');
    });
  }

  // Generate room name for session
  static generateRoomName(sessionId: string): string {
    // Create a clean room name from session ID
    return `harthio-session-${sessionId}`;
  }

  // Generate JWT token for authenticated Jitsi
  static async generateJWT(
    sessionId: string, 
    userId: string, 
    userInfo: { displayName: string; email?: string }
  ): Promise<string | undefined> {
    try {
      const config = validateJitsiConfig();
      
      if (!config.useJWT) {
        return undefined;
      }

      const roomName = JitsiService.generateRoomName(sessionId);
      
      return await generateJitsiJWT({
        appId: config.jwtAppId!,
        secret: config.jwtSecret!,
        roomName,
        userId,
        userInfo
      });
    } catch (error) {
      console.warn('Failed to generate Jitsi JWT:', error);
      return undefined;
    }
  }

  // Check if Jitsi is available
  static async checkAvailability(domain?: string): Promise<boolean> {
    try {
      const testDomain = domain || process.env.NEXT_PUBLIC_JITSI_DOMAIN || 'meet.jit.si';
      
      // Try to fetch the Jitsi domain
      const response = await fetch(`https://${testDomain}/config.js`, {
        method: 'HEAD',
        mode: 'no-cors'
      });
      
      return true; // If no error, Jitsi is available
    } catch (error) {
      console.warn('Jitsi availability check failed:', error);
      return false;
    }
  }

  // Control methods
  toggleAudio(): void {
    this.api?.executeCommand('toggleAudio');
  }

  toggleVideo(): void {
    this.api?.executeCommand('toggleVideo');
  }

  hangup(): void {
    this.api?.executeCommand('hangup');
  }

  // Get connection state
  getConnectionState(): JitsiConnectionState {
    return this.connectionState;
  }

  // Get participant count
  getParticipantCount(): number {
    return this.api?.getNumberOfParticipants() || 0;
  }

  // Cleanup
  dispose(): void {
    if (this.api) {
      this.api.dispose();
      this.api = null;
    }
    this.connectionState = 'disconnected';
    
    // Clean up container
    if (this.container) {
      this.container.innerHTML = '';
    }
  }
}

// Create Jitsi configuration for a session
export async function createJitsiConfig(
  sessionId: string,
  userId: string,
  userInfo: { displayName: string; email?: string; avatarURL?: string }
): Promise<JitsiConfig> {
  const config = validateJitsiConfig();
  const roomName = JitsiService.generateRoomName(sessionId);
  
  // Generate JWT if configured
  const jwt = await JitsiService.generateJWT(sessionId, userId, userInfo);

  return {
    domain: config.domain,
    roomName,
    jwt,
    userInfo,
    configOverwrite: {
      // Harthio-specific configuration
      startWithAudioMuted: false,
      startWithVideoMuted: false,
      prejoinPageEnabled: false,
      disableInviteFunctions: true,
      enableLobbyChat: false,
      
      // Branding
      defaultLocalDisplayName: userInfo.displayName,
      defaultRemoteDisplayName: 'Participant',
      
      // Security for private sessions
      enableLobby: false, // Direct join for approved participants
      requireDisplayName: true
    },
    interfaceConfigOverwrite: {
      SHOW_JITSI_WATERMARK: false,
      SHOW_WATERMARK_FOR_GUESTS: false,
      SHOW_BRAND_WATERMARK: false,
      MOBILE_APP_PROMO: false,
      
      // Simplified toolbar for Harthio
      TOOLBAR_BUTTONS: [
        'microphone', 'camera', 'hangup', 'chat', 'settings'
      ]
    }
  };
}