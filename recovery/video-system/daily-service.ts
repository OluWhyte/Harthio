/**
 * Daily.co Video Calling Service
 * Alternative reliable video calling solution optimized for mobile networks
 */

declare global {
  interface Window {
    DailyIframe: any;
  }
}

export interface DailyConfig {
  roomName: string;
  displayName: string;
  email?: string;
  avatarUrl?: string;
}

export interface DailyCallbacks {
  onReady: () => void;
  onJoined: () => void;
  onLeft: () => void;
  onError: (error: any) => void;
  onMessage: (message: { from: string; message: string }) => void;
  onParticipantJoined: (participant: any) => void;
  onParticipantLeft: (participant: any) => void;
  onConnectionQualityChanged: (quality: string) => void;
  onRemoteDeviceInfo?: (deviceInfo: any) => void;
}

export class DailyService {
  private callFrame: any = null;
  private container: HTMLElement | null = null;
  private callbacks: DailyCallbacks;
  private config: DailyConfig;
  private roomUrl: string = '';
  private apiKey: string;

  constructor(config: DailyConfig, callbacks: DailyCallbacks) {
    this.config = config;
    this.callbacks = callbacks;
    this.apiKey = process.env.NEXT_PUBLIC_DAILY_API_KEY || '';
    
    console.log('📡 Daily: Initializing with API key:', this.apiKey ? 'Present' : 'Missing');
    
    if (!this.apiKey) {
      console.warn('Daily.co API key not found, falling back to public rooms');
      this.roomUrl = `https://harthio.daily.co/${config.roomName}`;
    }
  }

  async initialize(containerId: string): Promise<void> {
    try {
      console.log('📡 Daily: Starting initialization...');
      console.log('📡 Daily: API Key available:', !!this.apiKey);
      
      // Load Daily.co API if not already loaded
      console.log('📡 Daily: Loading Daily API...');
      await this.loadDailyAPI();
      console.log('📡 Daily: Daily API loaded successfully');

      // Create room if we have API key, otherwise use public room
      if (this.apiKey && !this.roomUrl) {
        console.log('📡 Daily: Creating room with API key...');
        this.roomUrl = await this.createRoom();
        console.log('📡 Daily: Room created:', this.roomUrl);
      } else {
        console.log('📡 Daily: Using fallback room URL:', this.roomUrl);
      }

      this.container = document.getElementById(containerId);
      if (!this.container) {
        throw new Error(`Container with id ${containerId} not found`);
      }

      // Configure Daily options optimized for mobile networks
      const dailyConfig = {
        url: this.roomUrl,
        showLeaveButton: true,
        showFullscreenButton: true,
        showLocalVideo: true,
        showParticipantsBar: true,
        
        // Mobile network optimizations
        videoSource: {
          width: { ideal: 640, max: 1280 },
          height: { ideal: 360, max: 720 },
          frameRate: { ideal: 15, max: 30 }
        },
        
        // Audio optimizations for mobile
        audioSource: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 16000 // Lower sample rate for mobile
        },
        
        // Bandwidth management
        bandwidth: {
          kbs: 1500, // Cap at 1.5 Mbps for mobile data
          trackConstraints: {
            video: {
              maxBitrate: 1000000, // 1 Mbps max for video
              scaleResolutionDownBy: 1
            },
            audio: {
              maxBitrate: 64000 // 64 kbps for audio
            }
          }
        },
        
        // UI customization
        theme: {
          colors: {
            accent: '#e11d48', // Harthio rose color
            accentText: '#ffffff',
            background: '#000000',
            backgroundAccent: '#1f2937',
            baseText: '#ffffff',
            border: '#374151',
            mainAreaBg: '#000000',
            mainAreaBgAccent: '#111827',
            mainAreaText: '#ffffff',
            supportiveText: '#9ca3af'
          }
        },
        
        userName: this.config.displayName,
        userData: {
          email: this.config.email,
          avatarUrl: this.config.avatarUrl
        }
      };

      // Create Daily call frame
      this.callFrame = window.DailyIframe.createFrame(this.container, dailyConfig);

      // Setup event listeners
      this.setupEventListeners();

      // Join the call
      await this.callFrame.join();

    } catch (error) {
      console.error('Failed to initialize Daily:', error);
      this.callbacks.onError(error);
    }
  }

  private async createRoom(): Promise<string> {
    try {
      const response = await fetch('https://api.daily.co/v1/rooms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          name: `harthio-${this.config.roomName}`,
          privacy: 'private',
          properties: {
            max_participants: 10,
            enable_chat: true,
            enable_screenshare: true,
            enable_recording: 'cloud',
            start_video_off: false,
            start_audio_off: false,
            // Mobile optimizations
            exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60), // 24 hour expiry
            eject_at_room_exp: true,
            enable_network_ui: true,
            enable_prejoin_ui: false
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to create Daily room: ${response.statusText}`);
      }

      const room = await response.json();
      console.log('Created Daily room:', room.name);
      return room.url;
    } catch (error) {
      console.error('Failed to create Daily room:', error);
      // Fallback to public room
      return `https://harthio.daily.co/${this.config.roomName}`;
    }
  }

  private async loadDailyAPI(): Promise<void> {
    return new Promise((resolve, reject) => {
      // Check if already loaded
      if (window.DailyIframe) {
        resolve();
        return;
      }

      // Create script element
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/@daily-co/daily-js';
      script.async = true;
      
      script.onload = () => {
        if (window.DailyIframe) {
          resolve();
        } else {
          reject(new Error('Failed to load Daily API'));
        }
      };
      
      script.onerror = () => {
        reject(new Error('Failed to load Daily API script'));
      };

      document.head.appendChild(script);
    });
  }

  private setupEventListeners(): void {
    if (!this.callFrame) return;

    // Joined event
    this.callFrame.on('joined-meeting', () => {
      console.log('Daily meeting joined');
      this.callbacks.onJoined();
    });

    // Left event
    this.callFrame.on('left-meeting', () => {
      console.log('Daily meeting left');
      this.callbacks.onLeft();
    });

    // Ready event
    this.callFrame.on('loaded', () => {
      console.log('Daily frame loaded');
      this.callbacks.onReady();
    });

    // Error events
    this.callFrame.on('error', (error: any) => {
      console.error('Daily error:', error);
      this.callbacks.onError(error);
    });

    // Participant events
    this.callFrame.on('participant-joined', (event: any) => {
      console.log('Participant joined:', event.participant);
      this.callbacks.onParticipantJoined(event.participant);
    });

    this.callFrame.on('participant-left', (event: any) => {
      console.log('Participant left:', event.participant);
      this.callbacks.onParticipantLeft(event.participant);
    });

    // Participant updates (including audio/video state changes)
    this.callFrame.on('participant-updated', (event: any) => {
      console.log('Participant updated:', event.participant);
      
      // Check if this is the local participant
      if (event.participant && event.participant.local) {
        const participant = event.participant;
        
        // Notify about audio state changes
        if (participant.audio !== undefined) {
          console.log(`🎤 Daily local audio state changed: ${participant.audio}`);
          // We can add a callback for this if needed
        }
        
        // Notify about video state changes  
        if (participant.video !== undefined) {
          console.log(`📹 Daily local video state changed: ${participant.video}`);
          // We can add a callback for this if needed
        }
      }
    });

    // Connection quality
    this.callFrame.on('network-quality-change', (event: any) => {
      const quality = event.quality || 'good';
      this.callbacks.onConnectionQualityChanged(quality);
    });

    // Chat messages and device info (if supported)
    this.callFrame.on('app-message', (event: any) => {
      if (event.data && event.data.type === 'chat') {
        this.callbacks.onMessage({
          from: event.fromId,
          message: event.data.message
        });
      } else if (event.data && event.data.type === 'device-info') {
        this.callbacks.onRemoteDeviceInfo?.(event.data.deviceInfo);
      }
    });
  }

  // Public methods
  sendMessage(message: string): void {
    if (this.callFrame) {
      this.callFrame.sendAppMessage({
        type: 'chat',
        message: message,
        from: this.config.displayName
      });
    }
  }

  async toggleAudio(): Promise<boolean> {
    console.log('🎤 DailyService: toggleAudio called');
    if (this.callFrame) {
      const currentState = this.callFrame.localAudio();
      console.log(`🎤 Daily audio current state: ${currentState}, toggling to: ${!currentState}`);
      
      await this.callFrame.setLocalAudio(!currentState);
      
      // Return the new muted state (opposite of audio enabled state)
      const newAudioState = this.callFrame.localAudio();
      const isMuted = !newAudioState;
      console.log(`🎤 Daily audio toggled, new muted state: ${isMuted}`);
      return isMuted;
    } else {
      console.warn('🎤 Daily call frame not available for toggleAudio');
      return false;
    }
  }

  async toggleVideo(): Promise<boolean> {
    console.log('📹 DailyService: toggleVideo called');
    if (this.callFrame) {
      const currentState = this.callFrame.localVideo();
      console.log(`📹 Daily video current state: ${currentState}, toggling to: ${!currentState}`);
      
      await this.callFrame.setLocalVideo(!currentState);
      
      // Return the new video off state (opposite of video enabled state)
      const newVideoState = this.callFrame.localVideo();
      const isVideoOff = !newVideoState;
      console.log(`📹 Daily video toggled, new video off state: ${isVideoOff}`);
      return isVideoOff;
    } else {
      console.warn('📹 Daily call frame not available for toggleVideo');
      return false;
    }
  }

  // Get current audio/video states
  getCurrentStates(): { isAudioMuted: boolean; isVideoOff: boolean } {
    if (this.callFrame) {
      const audioEnabled = this.callFrame.localAudio();
      const videoEnabled = this.callFrame.localVideo();
      
      return {
        isAudioMuted: !audioEnabled,
        isVideoOff: !videoEnabled
      };
    }
    
    return {
      isAudioMuted: false,
      isVideoOff: false
    };
  }

  // Set initial mute states
  async setInitialMuteStates(audioMuted: boolean, videoOff: boolean): Promise<void> {
    console.log(`🔧 DailyService: Setting initial states - audio muted: ${audioMuted}, video off: ${videoOff}`);
    if (this.callFrame) {
      const promises = [];
      promises.push(this.callFrame.setLocalAudio(!audioMuted));
      promises.push(this.callFrame.setLocalVideo(!videoOff));
      await Promise.all(promises);
    }
  }

  hangup(): void {
    if (this.callFrame) {
      this.callFrame.leave();
    }
  }

  setDisplayName(name: string): void {
    if (this.callFrame) {
      this.callFrame.setUserName(name);
    }
  }

  getParticipants(): any[] {
    if (this.callFrame) {
      return Object.values(this.callFrame.participants());
    }
    return [];
  }

  dispose(): void {
    if (this.callFrame) {
      this.callFrame.destroy();
      this.callFrame = null;
    }
    
    if (this.container) {
      this.container.innerHTML = '';
    }

    // Clean up room if we created it
    if (this.apiKey && this.roomUrl && !this.roomUrl.includes('harthio.daily.co')) {
      this.deleteRoom().catch(console.error);
    }
  }

  private async deleteRoom(): Promise<void> {
    try {
      const roomName = this.roomUrl.split('/').pop();
      if (!roomName) return;

      const response = await fetch(`https://api.daily.co/v1/rooms/${roomName}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        }
      });

      if (response.ok) {
        console.log('Deleted Daily room:', roomName);
      }
    } catch (error) {
      console.error('Failed to delete Daily room:', error);
    }
  }

  isConnected(): boolean {
    return this.callFrame !== null && this.callFrame.meetingState() === 'joined-meeting';
  }

  // Get connection quality
  getConnectionStats(): Promise<any> {
    return new Promise((resolve) => {
      if (this.callFrame) {
        const stats = this.callFrame.getNetworkStats();
        resolve({
          bandwidth: stats.stats?.bandwidth || 1000,
          latency: stats.stats?.rtt || 50,
          packetLoss: stats.stats?.packetLoss || 0,
          quality: stats.quality || 'good',
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

  // Daily-specific methods
  async startScreenShare(): Promise<void> {
    if (this.callFrame) {
      await this.callFrame.startScreenShare();
    }
  }

  async stopScreenShare(): Promise<void> {
    if (this.callFrame) {
      await this.callFrame.stopScreenShare();
    }
  }

  async startRecording(): Promise<void> {
    if (this.callFrame) {
      await this.callFrame.startRecording();
    }
  }

  async stopRecording(): Promise<void> {
    if (this.callFrame) {
      await this.callFrame.stopRecording();
    }
  }

  // Get detailed network stats for debugging
  async getDetailedStats(): Promise<any> {
    if (this.callFrame) {
      return await this.callFrame.getNetworkStats();
    }
    return null;
  }

  // Static utility methods for room management
  static async createTemporaryRoom(roomName: string, apiKey?: string): Promise<string> {
    if (!apiKey) {
      return `https://harthio.daily.co/${roomName}`;
    }

    try {
      const response = await fetch('https://api.daily.co/v1/rooms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          name: `harthio-temp-${roomName}-${Date.now()}`,
          privacy: 'private',
          properties: {
            max_participants: 10,
            exp: Math.floor(Date.now() / 1000) + (2 * 60 * 60), // 2 hour expiry
            eject_at_room_exp: true,
            enable_chat: true,
            enable_screenshare: true
          }
        })
      });

      if (response.ok) {
        const room = await response.json();
        return room.url;
      }
    } catch (error) {
      console.error('Failed to create temporary Daily room:', error);
    }

    // Fallback to public room
    return `https://harthio.daily.co/${roomName}`;
  }

  static async listRooms(apiKey: string): Promise<any[]> {
    try {
      const response = await fetch('https://api.daily.co/v1/rooms', {
        headers: {
          'Authorization': `Bearer ${apiKey}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        return data.data || [];
      }
    } catch (error) {
      console.error('Failed to list Daily rooms:', error);
    }
    return [];
  }

  // Send device info to other participants via app message
  sendDeviceInfo(deviceInfo: any): void {
    if (this.callFrame) {
      try {
        this.callFrame.sendAppMessage({
          type: 'device-info',
          deviceInfo: deviceInfo
        }, '*');
      } catch (error) {
        console.error('Failed to send device info via Daily:', error);
      }
    }
  }
}