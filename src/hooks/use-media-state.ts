/**
 * Unified Media State Hook
 * Single source of truth for media state across all components
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { mediaStreamController, type MediaState } from '@/lib/media-stream-controller';

export interface MediaControls {
  toggleAudio: () => Promise<boolean>;
  toggleVideo: () => Promise<boolean>;
  setAudioMuted: (muted: boolean) => Promise<boolean>;
  setVideoOff: (videoOff: boolean) => Promise<boolean>;
}

export interface MediaStateHook {
  mediaState: MediaState;
  controls: MediaControls;
  isLoading: boolean;
  error: string | null;
}

/**
 * Unified media state hook that works with all video providers
 */
export function useMediaState(): MediaStateHook {
  const [mediaState, setMediaState] = useState<MediaState>({
    isAudioMuted: false,
    isVideoOff: false,
    hasAudio: false,
    hasVideo: false
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Keep track of current video manager for provider-specific controls
  const currentVideoManagerRef = useRef<any>(null);

  // Subscribe to MediaStreamController changes
  useEffect(() => {
    const unsubscribe = mediaStreamController.subscribe((newState) => {
      console.log('🎛️ useMediaState: Media state updated', newState);
      setMediaState(newState);
    });

    // Get initial state
    const initialState = mediaStreamController.getState();
    if (initialState.hasAudio || initialState.hasVideo) {
      setMediaState(initialState);
    }

    return unsubscribe;
  }, []);

  // Set current video manager reference (called by session components)
  const setVideoManager = useCallback((manager: any) => {
    console.log('🎛️ useMediaState: Setting video manager', manager?.constructor?.name);
    currentVideoManagerRef.current = manager;
  }, []);

  // Unified toggle audio that works with all providers
  const toggleAudio = useCallback(async (): Promise<boolean> => {
    console.log('🎤 useMediaState: toggleAudio called');
    setIsLoading(true);
    setError(null);

    try {
      let result: boolean | undefined;

      // Try video manager first (for provider-specific handling)
      if (currentVideoManagerRef.current) {
        const manager = currentVideoManagerRef.current;
        console.log('🎤 Using video manager:', manager.constructor?.name);

        if ('toggleAudio' in manager && typeof manager.toggleAudio === 'function') {
          result = await manager.toggleAudio();
          console.log('🎤 Video manager toggleAudio result:', result);
        }
      }

      // Fallback to MediaStreamController if video manager doesn't handle it
      if (result === undefined) {
        console.log('🎤 Falling back to MediaStreamController');
        result = mediaStreamController.toggleAudio();
      }

      console.log('🎤 Final toggleAudio result:', result);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to toggle audio';
      console.error('🎤 toggleAudio error:', errorMessage);
      setError(errorMessage);
      return mediaState.isAudioMuted; // Return current state on error
    } finally {
      setIsLoading(false);
    }
  }, [mediaState.isAudioMuted]);

  // Unified toggle video that works with all providers
  const toggleVideo = useCallback(async (): Promise<boolean> => {
    console.log('📹 useMediaState: toggleVideo called');
    setIsLoading(true);
    setError(null);

    try {
      let result: boolean | undefined;

      // Try video manager first (for provider-specific handling)
      if (currentVideoManagerRef.current) {
        const manager = currentVideoManagerRef.current;
        console.log('📹 Using video manager:', manager.constructor?.name);

        if ('toggleVideo' in manager && typeof manager.toggleVideo === 'function') {
          result = await manager.toggleVideo();
          console.log('📹 Video manager toggleVideo result:', result);
        }
      }

      // Fallback to MediaStreamController if video manager doesn't handle it
      if (result === undefined) {
        console.log('📹 Falling back to MediaStreamController');
        result = mediaStreamController.toggleVideo();
      }

      console.log('📹 Final toggleVideo result:', result);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to toggle video';
      console.error('📹 toggleVideo error:', errorMessage);
      setError(errorMessage);
      return mediaState.isVideoOff; // Return current state on error
    } finally {
      setIsLoading(false);
    }
  }, [mediaState.isVideoOff]);

  // Set audio muted state directly
  const setAudioMuted = useCallback(async (muted: boolean): Promise<boolean> => {
    console.log('🎤 useMediaState: setAudioMuted called with:', muted);
    setIsLoading(true);
    setError(null);

    try {
      let result: boolean | undefined;

      // Try video manager first
      if (currentVideoManagerRef.current) {
        const manager = currentVideoManagerRef.current;
        
        // Check for setInitialMuteStates method (used during initialization)
        if ('setInitialMuteStates' in manager && typeof manager.setInitialMuteStates === 'function') {
          console.log('🎤 Using setInitialMuteStates method');
          await manager.setInitialMuteStates(muted, mediaState.isVideoOff);
          result = muted;
        }
        // Check for direct setAudioMuted method
        else if ('setAudioMuted' in manager && typeof manager.setAudioMuted === 'function') {
          console.log('🎤 Using setAudioMuted method');
          result = await manager.setAudioMuted(muted);
        }
        // Fallback to toggle if current state doesn't match desired state
        else if ('toggleAudio' in manager && mediaState.isAudioMuted !== muted) {
          console.log('🎤 Using toggleAudio to reach desired state');
          result = await manager.toggleAudio();
        }
      }

      // Fallback to MediaStreamController
      if (result === undefined) {
        console.log('🎤 Falling back to MediaStreamController setAudioMuted');
        result = mediaStreamController.setAudioMuted(muted);
      }

      console.log('🎤 Final setAudioMuted result:', result);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to set audio muted';
      console.error('🎤 setAudioMuted error:', errorMessage);
      setError(errorMessage);
      return mediaState.isAudioMuted;
    } finally {
      setIsLoading(false);
    }
  }, [mediaState.isAudioMuted, mediaState.isVideoOff]);

  // Set video off state directly
  const setVideoOff = useCallback(async (videoOff: boolean): Promise<boolean> => {
    console.log('📹 useMediaState: setVideoOff called with:', videoOff);
    setIsLoading(true);
    setError(null);

    try {
      let result: boolean | undefined;

      // Try video manager first
      if (currentVideoManagerRef.current) {
        const manager = currentVideoManagerRef.current;
        
        // Check for setInitialMuteStates method (used during initialization)
        if ('setInitialMuteStates' in manager && typeof manager.setInitialMuteStates === 'function') {
          console.log('📹 Using setInitialMuteStates method');
          await manager.setInitialMuteStates(mediaState.isAudioMuted, videoOff);
          result = videoOff;
        }
        // Check for direct setVideoOff method
        else if ('setVideoOff' in manager && typeof manager.setVideoOff === 'function') {
          console.log('📹 Using setVideoOff method');
          result = await manager.setVideoOff(videoOff);
        }
        // Fallback to toggle if current state doesn't match desired state
        else if ('toggleVideo' in manager && mediaState.isVideoOff !== videoOff) {
          console.log('📹 Using toggleVideo to reach desired state');
          result = await manager.toggleVideo();
        }
      }

      // Fallback to MediaStreamController
      if (result === undefined) {
        console.log('📹 Falling back to MediaStreamController setVideoOff');
        result = mediaStreamController.setVideoOff(videoOff);
      }

      console.log('📹 Final setVideoOff result:', result);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to set video off';
      console.error('📹 setVideoOff error:', errorMessage);
      setError(errorMessage);
      return mediaState.isVideoOff;
    } finally {
      setIsLoading(false);
    }
  }, [mediaState.isAudioMuted, mediaState.isVideoOff]);

  const controls: MediaControls = {
    toggleAudio,
    toggleVideo,
    setAudioMuted,
    setVideoOff
  };

  return {
    mediaState,
    controls,
    isLoading,
    error,
    // Internal method for setting video manager reference
    setVideoManager
  } as MediaStateHook & { setVideoManager: (manager: any) => void };
}

/**
 * Provider-specific media state hook for components that need video manager integration
 */
export function useProviderMediaState(videoManager?: any): MediaStateHook & { setVideoManager: (manager: any) => void } {
  const mediaStateHook = useMediaState() as MediaStateHook & { setVideoManager: (manager: any) => void };

  // Set video manager when provided
  useEffect(() => {
    if (videoManager) {
      mediaStateHook.setVideoManager(videoManager);
    }
  }, [videoManager, mediaStateHook]);

  return mediaStateHook;
}

/**
 * Simple media state hook for components that only need basic controls
 */
export function useSimpleMediaState(): Omit<MediaStateHook, 'setVideoManager'> {
  const { setVideoManager, ...rest } = useMediaState() as MediaStateHook & { setVideoManager: (manager: any) => void };
  return rest;
}