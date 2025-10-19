/**
 * Jitsi Meet Integration Service
 * Fallback video calling solution
 */

declare global {
  interface Window {
    JitsiMeetExternalAPI: any;
  }
}

export interface JitsiConfig {
  roomName: string;
  displayName: string;
  email?: string;
  avatarUrl?: string;
}

export interface JitsiCallbacks {
  onReady: () => void;
  onJoined: () => void;
  onLeft: () => void;
  onError: (error: any) => void;
  onMessage: (message: { from: string; message: string }) => void;
}

export class JitsiService {
  private api: any = null;
  private container: HTMLElement | null = null;
  private callbacks: JitsiCallbacks;
  private config: JitsiConfig;

  constructor(config: JitsiConfig, callbacks: JitsiCallbacks) {
    this.config = config;
    this.callbacks = callbacks;
  }

  async initialize(containerId: string): Promise<void> {
    try {
      // Load Jitsi Meet API if not already loaded
      await this.loadJitsiAPI();

      this.container = document.getElementById(containerId);
      if (!this.container) {
        throw new Error(`Container with id ${containerId} not found`);
      }

      // Configure Jitsi options
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
          // Brand colors
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

      // Create Jitsi Meet API instance - use your custom domain
      const jitsiDomain = process.env.NEXT_PUBLIC_JITSI_DOMAIN || 'meet.jit.si';
      this.api = new window.JitsiMeetExternalAPI(jitsiDomain, options);

      // Setup event listeners
      this.setupEventListeners();

    } catch (error) {
      console.error('Failed to initialize Jitsi:', error);
      this.callbacks.onError(error);
    }
  }

  private async loadJitsiAPI(): Promise<void> {
    return new Promise((resolve, reject) => {
      // Check if already loaded
      if (window.JitsiMeetExternalAPI) {
        resolve();
        return;
      }

      // Create script element - use your custom domain
      const script = document.createElement('script');
      const jitsiDomain = process.env.NEXT_PUBLIC_JITSI_DOMAIN || 'meet.jit.si';
      script.src = `https://${jitsiDomain}/external_api.js`;
      script.async = true;
      
      script.onload = () => {
        if (window.JitsiMeetExternalAPI) {
          resolve();
        } else {
          reject(new Error('Failed to load Jitsi API'));
        }
      };
      
      script.onerror = () => {
        reject(new Error('Failed to load Jitsi API script'));
      };

      document.head.appendChild(script);
    });
  }

  private setupEventListeners(): void {
    if (!this.api) return;

    // Ready event
    this.api.addEventListener('videoConferenceJoined', () => {
      console.log('Jitsi conference joined');
      this.callbacks.onJoined();
    });

    // Left event
    this.api.addEventListener('videoConferenceLeft', () => {
      console.log('Jitsi conference left');
      this.callbacks.onLeft();
    });

    // Ready event
    this.api.addEventListener('readyToClose', () => {
      console.log('Jitsi ready to close');
      this.callbacks.onReady();
    });

    // Error events
    this.api.addEventListener('errorOccurred', (error: any) => {
      console.error('Jitsi error:', error);
      this.callbacks.onError(error);
    });

    // Chat message events
    this.api.addEventListener('incomingMessage', (message: any) => {
      this.callbacks.onMessage({
        from: message.from,
        message: message.message
      });
    });

    // Participant events
    this.api.addEventListener('participantJoined', (participant: any) => {
      console.log('Participant joined:', participant);
    });

    this.api.addEventListener('participantLeft', (participant: any) => {
      console.log('Participant left:', participant);
    });
  }

  // Public methods
  sendMessage(message: string): void {
    if (this.api) {
      this.api.executeCommand('sendChatMessage', message);
    }
  }

  toggleAudio(): void {
    if (this.api) {
      this.api.executeCommand('toggleAudio');
    }
  }

  toggleVideo(): void {
    if (this.api) {
      this.api.executeCommand('toggleVideo');
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
}