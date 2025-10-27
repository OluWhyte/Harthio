/**
 * Media Stream Controller
 * Unified control system for audio/video that works across camera preview and session
 */

export class MediaStreamController {
  private stream: MediaStream | null = null;
  private listeners: Set<(state: MediaState) => void> = new Set();

  /**
   * Get the current stream (for internal use by video services)
   */
  getCurrentStream(): MediaStream | null {
    return this.stream;
  }

  constructor() {
    // Bind methods to preserve 'this' context
    this.toggleAudio = this.toggleAudio.bind(this);
    this.toggleVideo = this.toggleVideo.bind(this);
    this.getState = this.getState.bind(this);
    this.setStream = this.setStream.bind(this);
  }

  /**
   * Set the media stream to control
   */
  setStream(stream: MediaStream | null): void {
    console.log('🎛️ MediaStreamController: Setting stream', !!stream);
    this.stream = stream;
    
    // Notify listeners of initial state
    if (stream) {
      this.notifyListeners();
    }
  }

  /**
   * Get current media state
   */
  getState(): MediaState {
    if (!this.stream) {
      return {
        isAudioMuted: false,
        isVideoOff: false,
        hasAudio: false,
        hasVideo: false
      };
    }

    const audioTrack = this.stream.getAudioTracks()[0];
    const videoTrack = this.stream.getVideoTracks()[0];

    return {
      isAudioMuted: audioTrack ? !audioTrack.enabled : false,
      isVideoOff: videoTrack ? !videoTrack.enabled : false,
      hasAudio: !!audioTrack,
      hasVideo: !!videoTrack
    };
  }

  /**
   * Toggle audio mute state
   */
  toggleAudio(): boolean {
    console.log('🎤 MediaStreamController: toggleAudio called');
    
    if (!this.stream) {
      console.warn('🎤 No stream available');
      return false;
    }

    const audioTrack = this.stream.getAudioTracks()[0];
    if (!audioTrack) {
      console.warn('🎤 No audio track available');
      return false;
    }

    // Toggle the track
    audioTrack.enabled = !audioTrack.enabled;
    const isMuted = !audioTrack.enabled;
    
    console.log(`🎤 Audio toggled to muted: ${isMuted}`);
    
    // Notify listeners
    this.notifyListeners();
    
    return isMuted;
  }

  /**
   * Toggle video on/off state
   */
  toggleVideo(): boolean {
    console.log('📹 MediaStreamController: toggleVideo called');
    
    if (!this.stream) {
      console.warn('📹 No stream available');
      return false;
    }

    const videoTrack = this.stream.getVideoTracks()[0];
    if (!videoTrack) {
      console.warn('📹 No video track available');
      return false;
    }

    // Toggle the track
    videoTrack.enabled = !videoTrack.enabled;
    const isVideoOff = !videoTrack.enabled;
    
    console.log(`📹 Video toggled to off: ${isVideoOff}`);
    
    // Notify listeners
    this.notifyListeners();
    
    return isVideoOff;
  }

  /**
   * Set audio mute state directly
   */
  setAudioMuted(muted: boolean): boolean {
    console.log(`🎤 MediaStreamController: setAudioMuted(${muted})`);
    
    if (!this.stream) {
      console.warn('🎤 No stream available');
      return false;
    }

    const audioTrack = this.stream.getAudioTracks()[0];
    if (!audioTrack) {
      console.warn('🎤 No audio track available');
      return false;
    }

    audioTrack.enabled = !muted;
    console.log(`🎤 Audio set to muted: ${muted}`);
    
    // Notify listeners
    this.notifyListeners();
    
    return muted;
  }

  /**
   * Set video off state directly
   */
  setVideoOff(videoOff: boolean): boolean {
    console.log(`📹 MediaStreamController: setVideoOff(${videoOff})`);
    
    if (!this.stream) {
      console.warn('📹 No stream available');
      return false;
    }

    const videoTrack = this.stream.getVideoTracks()[0];
    if (!videoTrack) {
      console.warn('📹 No video track available');
      return false;
    }

    videoTrack.enabled = !videoOff;
    console.log(`📹 Video set to off: ${videoOff}`);
    
    // Notify listeners
    this.notifyListeners();
    
    return videoOff;
  }

  /**
   * Subscribe to state changes
   */
  subscribe(listener: (state: MediaState) => void): () => void {
    this.listeners.add(listener);
    
    // Immediately notify with current state
    if (this.stream) {
      listener(this.getState());
    }
    
    // Return unsubscribe function
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Notify all listeners of state change
   */
  private notifyListeners(): void {
    const state = this.getState();
    console.log('🎛️ MediaStreamController: Notifying listeners', state);
    
    this.listeners.forEach(listener => {
      try {
        listener(state);
      } catch (error) {
        console.error('Error in media state listener:', error);
      }
    });
  }

  /**
   * Cleanup
   */
  dispose(): void {
    console.log('🎛️ MediaStreamController: Disposing');
    this.listeners.clear();
    this.stream = null;
  }
}

export interface MediaState {
  isAudioMuted: boolean;
  isVideoOff: boolean;
  hasAudio: boolean;
  hasVideo: boolean;
}

// Global instance
export const mediaStreamController = new MediaStreamController();