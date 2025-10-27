/**
 * LiveKit Service
 * Clean, reliable video calling with LiveKit
 */

import { 
  Room, 
  RoomEvent, 
  Track,
  RemoteTrack,
  RemoteParticipant,
  LocalParticipant,
  ParticipantEvent,
  TrackEvent,
  ConnectionState,
  RoomConnectOptions,
  VideoPresets,
  TrackPublication
} from 'livekit-client';

export interface LiveKitConfig {
  serverUrl: string;
  roomName: string;
  participantName: string;
  token: string;
}

export interface LiveKitCallbacks {
  onConnected: () => void;
  onDisconnected: () => void;
  onParticipantJoined: (participant: RemoteParticipant) => void;
  onParticipantLeft: (participant: RemoteParticipant) => void;
  onTrackSubscribed: (track: RemoteTrack, participant: RemoteParticipant) => void;
  onTrackUnsubscribed: (track: RemoteTrack, participant: RemoteParticipant) => void;
  onError: (error: Error) => void;
  onConnectionStateChanged: (state: ConnectionState) => void;
}

export class LiveKitService {
  private room: Room | null = null;
  private config: LiveKitConfig;
  private callbacks: LiveKitCallbacks;
  private localVideoTrack: Track | null = null;
  private localAudioTrack: Track | null = null;
  private isConnected = false;

  constructor(config: LiveKitConfig, callbacks: LiveKitCallbacks) {
    this.config = config;
    this.callbacks = callbacks;
  }

  /**
   * Connect to the LiveKit room
   */
  async connect(): Promise<void> {
    try {
      this.room = new Room({
        // Optimize for 1-on-1 conversations
        adaptiveStream: true,
        dynacast: true,
        videoCaptureDefaults: {
          resolution: VideoPresets.h720.resolution,
          frameRate: 30,
        },
        publishDefaults: {
          videoSimulcastLayers: [VideoPresets.h540, VideoPresets.h720],
        },
      });

      this.setupRoomEventListeners();

      const connectOptions: RoomConnectOptions = {
        autoSubscribe: true,
      };

      await this.room.connect(this.config.serverUrl, this.config.token, connectOptions);
      
      this.isConnected = true;
      console.log('✅ Connected to LiveKit room:', this.config.roomName);
      
    } catch (error) {
      console.error('❌ Failed to connect to LiveKit:', error);
      this.callbacks.onError(error as Error);
      throw error;
    }
  }

  /**
   * Enable camera and microphone
   */
  async enableCameraAndMicrophone(): Promise<void> {
    if (!this.room) {
      throw new Error('Room not connected');
    }

    try {
      // Enable camera
      await this.room.localParticipant.enableCameraAndMicrophone();
      
      // Get references to local tracks
      this.localVideoTrack = this.room.localParticipant.getTrack(Track.Source.Camera)?.track || null;
      this.localAudioTrack = this.room.localParticipant.getTrack(Track.Source.Microphone)?.track || null;
      
      console.log('✅ Camera and microphone enabled');
    } catch (error) {
      console.error('❌ Failed to enable camera/microphone:', error);
      this.callbacks.onError(error as Error);
      throw error;
    }
  }

  /**
   * Toggle microphone mute
   */
  async toggleMicrophone(): Promise<boolean> {
    if (!this.room) return false;

    try {
      const audioTrack = this.room.localParticipant.getTrack(Track.Source.Microphone);
      if (audioTrack) {
        const isMuted = audioTrack.isMuted;
        await audioTrack.setMuted(!isMuted);
        return !isMuted; // Return new muted state
      }
      return false;
    } catch (error) {
      console.error('❌ Failed to toggle microphone:', error);
      return false;
    }
  }

  /**
   * Toggle camera on/off
   */
  async toggleCamera(): Promise<boolean> {
    if (!this.room) return false;

    try {
      const videoTrack = this.room.localParticipant.getTrack(Track.Source.Camera);
      if (videoTrack) {
        const isEnabled = videoTrack.isEnabled;
        await videoTrack.setEnabled(!isEnabled);
        return !isEnabled; // Return new enabled state
      }
      return false;
    } catch (error) {
      console.error('❌ Failed to toggle camera:', error);
      return false;
    }
  }

  /**
   * Get local video element
   */
  getLocalVideoElement(): HTMLVideoElement | null {
    if (!this.room) return null;
    
    const videoTrack = this.room.localParticipant.getTrack(Track.Source.Camera);
    if (videoTrack?.track) {
      const element = videoTrack.track.attach();
      return element as HTMLVideoElement;
    }
    return null;
  }

  /**
   * Get remote video element
   */
  getRemoteVideoElement(): HTMLVideoElement | null {
    if (!this.room) return null;
    
    const remoteParticipants = Array.from(this.room.participants.values());
    if (remoteParticipants.length === 0) return null;
    
    const remoteParticipant = remoteParticipants[0]; // Get first (and likely only) remote participant
    const videoTrack = remoteParticipant.getTrack(Track.Source.Camera);
    
    if (videoTrack?.track) {
      const element = videoTrack.track.attach();
      return element as HTMLVideoElement;
    }
    return null;
  }

  /**
   * Get connection state
   */
  getConnectionState(): ConnectionState {
    return this.room?.state || ConnectionState.Disconnected;
  }

  /**
   * Get participant count
   */
  getParticipantCount(): number {
    if (!this.room) return 0;
    return this.room.participants.size + 1; // +1 for local participant
  }

  /**
   * Disconnect from room
   */
  async disconnect(): Promise<void> {
    if (this.room) {
      await this.room.disconnect();
      this.room = null;
      this.isConnected = false;
      console.log('✅ Disconnected from LiveKit room');
    }
  }

  /**
   * Setup room event listeners
   */
  private setupRoomEventListeners(): void {
    if (!this.room) return;

    // Connection events
    this.room.on(RoomEvent.Connected, () => {
      console.log('🔗 Room connected');
      this.callbacks.onConnected();
    });

    this.room.on(RoomEvent.Disconnected, () => {
      console.log('🔌 Room disconnected');
      this.isConnected = false;
      this.callbacks.onDisconnected();
    });

    // Participant events
    this.room.on(RoomEvent.ParticipantConnected, (participant: RemoteParticipant) => {
      console.log('👤 Participant joined:', participant.identity);
      this.callbacks.onParticipantJoined(participant);
      this.setupParticipantEventListeners(participant);
    });

    this.room.on(RoomEvent.ParticipantDisconnected, (participant: RemoteParticipant) => {
      console.log('👤 Participant left:', participant.identity);
      this.callbacks.onParticipantLeft(participant);
    });

    // Track events
    this.room.on(RoomEvent.TrackSubscribed, (track: RemoteTrack, publication: TrackPublication, participant: RemoteParticipant) => {
      console.log('📹 Track subscribed:', track.kind, 'from', participant.identity);
      this.callbacks.onTrackSubscribed(track, participant);
    });

    this.room.on(RoomEvent.TrackUnsubscribed, (track: RemoteTrack, publication: TrackPublication, participant: RemoteParticipant) => {
      console.log('📹 Track unsubscribed:', track.kind, 'from', participant.identity);
      this.callbacks.onTrackUnsubscribed(track, participant);
    });

    // Connection state changes
    this.room.on(RoomEvent.ConnectionStateChanged, (state: ConnectionState) => {
      console.log('🔗 Connection state changed:', state);
      this.callbacks.onConnectionStateChanged(state);
    });

    // Error handling
    this.room.on(RoomEvent.Disconnected, (reason?: string) => {
      if (reason) {
        console.error('❌ Room disconnected with reason:', reason);
        this.callbacks.onError(new Error(`Disconnected: ${reason}`));
      }
    });
  }

  /**
   * Setup participant event listeners
   */
  private setupParticipantEventListeners(participant: RemoteParticipant): void {
    participant.on(ParticipantEvent.TrackMuted, (publication: TrackPublication) => {
      console.log('🔇 Track muted:', publication.kind, 'from', participant.identity);
    });

    participant.on(ParticipantEvent.TrackUnmuted, (publication: TrackPublication) => {
      console.log('🔊 Track unmuted:', publication.kind, 'from', participant.identity);
    });
  }

  /**
   * Get current mute states
   */
  getCurrentStates(): { isAudioMuted: boolean; isVideoOff: boolean } {
    if (!this.room) {
      return { isAudioMuted: false, isVideoOff: false };
    }

    const audioTrack = this.room.localParticipant.getTrack(Track.Source.Microphone);
    const videoTrack = this.room.localParticipant.getTrack(Track.Source.Camera);

    return {
      isAudioMuted: audioTrack?.isMuted || false,
      isVideoOff: !videoTrack?.isEnabled || false
    };
  }

  /**
   * Check if connected
   */
  isRoomConnected(): boolean {
    return this.isConnected && this.room?.state === ConnectionState.Connected;
  }
}