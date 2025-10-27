/**
 * Fast Session Hook
 * Optimized session initialization with parallel operations
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { FastSessionInitializer, type FastInitConfig, type FastInitResult, type InitProgress } from '@/lib/fast-session-init';
import { useProviderMediaState } from '@/hooks/use-media-state';
import { useFastCamera } from '@/hooks/use-fast-camera';

export interface FastSessionConfig {
  sessionId: string;
  enableFastTrack?: boolean;
  skipSafetyDisclaimer?: boolean;
  skipCameraPreview?: boolean;
  autoJoin?: boolean;
  autoJoinDelay?: number; // milliseconds, 0 for immediate
}

export interface FastSessionState {
  // Session state
  sessionData: any;
  isLoading: boolean;
  error: string | null;
  
  // Initialization progress
  progress: InitProgress | null;
  initTime: number;
  usedFastTrack: boolean;
  
  // Session flow state
  showSafetyDisclaimer: boolean;
  showCameraPreview: boolean;
  isReadyToJoin: boolean;
  hasJoinedSession: boolean;
  
  // Connection state
  sessionState: 'initializing' | 'ready' | 'connecting' | 'connected' | 'failed' | 'ended';
  connectionOptimized: boolean;
  
  // Auto-join state
  autoJoinCountdown: number | null;
  canCancelAutoJoin: boolean;
}

export function useFastSession(config: FastSessionConfig) {
  const { user, userProfile } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  
  const [state, setState] = useState<FastSessionState>({
    sessionData: null,
    isLoading: true,
    error: null,
    progress: null,
    initTime: 0,
    usedFastTrack: false,
    showSafetyDisclaimer: false,
    showCameraPreview: false,
    isReadyToJoin: false,
    hasJoinedSession: false,
    sessionState: 'initializing',
    connectionOptimized: false,
    autoJoinCountdown: null,
    canCancelAutoJoin: true
  });
  
  // Refs for managers
  const videoManagerRef = useRef<any>(null);
  const messagingServiceRef = useRef<any>(null);
  const autoJoinTimeoutRef = useRef<NodeJS.Timeout>();
  const initResultRef = useRef<FastInitResult | null>(null);
  
  // Hooks
  const { mediaState, controls, setVideoManager } = useProviderMediaState();
  const fastCamera = useFastCamera({
    skipPreview: config.skipCameraPreview,
    enableFastTrack: config.enableFastTrack,
    userId: user?.uid,
    onStreamReady: (stream) => {
      console.log('📷 Fast camera ready, stream available');
      setState(prev => ({ ...prev, isReadyToJoin: true }));
    },
    onError: (error) => {
      console.error('📷 Fast camera error:', error);
      setState(prev => ({ ...prev, error }));
    }
  });
  
  /**
   * Handle initialization progress updates
   */
  const handleProgress = useCallback((progress: InitProgress) => {
    console.log(`🚀 Progress: ${progress.step} (${progress.progress}%) - ${progress.message}`);
    setState(prev => ({ ...prev, progress }));
  }, []);
  
  /**
   * Determine if we can skip safety disclaimer
   */
  const canSkipSafetyDisclaimer = useCallback((): boolean => {
    if (config.skipSafetyDisclaimer) return true;
    
    // Check if user has seen disclaimer recently
    try {
      const lastSeen = localStorage.getItem(`safety_disclaimer_${user?.uid}`);
      if (lastSeen) {
        const lastSeenTime = parseInt(lastSeen);
        const oneHourAgo = Date.now() - (60 * 60 * 1000);
        return lastSeenTime > oneHourAgo;
      }
    } catch (error) {
      console.warn('Failed to check safety disclaimer cache:', error);
    }
    
    return false;
  }, [config.skipSafetyDisclaimer, user?.uid]);
  
  /**
   * Mark safety disclaimer as seen
   */
  const markSafetyDisclaimerSeen = useCallback(() => {
    try {
      localStorage.setItem(`safety_disclaimer_${user?.uid}`, Date.now().toString());
    } catch (error) {
      console.warn('Failed to cache safety disclaimer:', error);
    }
  }, [user?.uid]);
  
  /**
   * Start fast initialization
   */
  const startFastInitialization = useCallback(async () => {
    if (!user || !userProfile) {
      console.log('🚀 Waiting for user authentication...');
      return;
    }
    
    console.log('🚀 Starting fast session initialization...');
    
    setState(prev => ({ 
      ...prev, 
      isLoading: true, 
      sessionState: 'initializing',
      error: null 
    }));
    
    try {
      const fastInitConfig: FastInitConfig = {
        sessionId: config.sessionId,
        userId: user.uid,
        userProfile,
        skipSafetyDisclaimer: canSkipSafetyDisclaimer(),
        skipCameraPreview: config.skipCameraPreview,
        enableFastTrack: config.enableFastTrack
      };
      
      const callbacks = {
        video: {
          onReady: () => console.log('🎥 Video manager ready'),
          onJoined: () => {
            setState(prev => ({ ...prev, sessionState: 'connected', hasJoinedSession: true }));
          },
          onLeft: () => {
            setState(prev => ({ ...prev, sessionState: 'ended' }));
            router.push('/dashboard');
          },
          onError: (error: string) => {
            console.error('🎥 Video error:', error);
            setState(prev => ({ ...prev, error }));
          },
          onMessage: () => {},
          onParticipantJoined: () => {},
          onParticipantLeft: () => {},
          onConnectionQualityChanged: () => {},
          onProviderChanged: () => {},
          onProviderPerformanceUpdate: () => {},
          onBackgroundSwitching: () => {},
          onRemoteDeviceInfo: () => {}
        },
        webrtc: {
          onStateChange: (state: any) => {
            setState(prev => ({ ...prev, sessionState: state }));
          },
          onQualityChange: () => {},
          onLocalStream: () => {},
          onRemoteStream: () => {},
          onMessage: () => {},
          onError: (error: string) => {
            console.error('🔗 WebRTC error:', error);
            setState(prev => ({ ...prev, error }));
          },
          onRemoteAudioToggle: () => {},
          onRemoteVideoToggle: () => {},
          onRemoteDeviceInfo: () => {}
        },
        messaging: {
          onMessage: () => {},
          onUserTyping: () => {},
          onError: (error: string) => {
            console.error('💬 Messaging error:', error);
          }
        },
        onProgress: handleProgress
      };
      
      const result = await FastSessionInitializer.initializeSession(fastInitConfig, callbacks);
      
      // Store result for later use
      initResultRef.current = result;
      
      // Set up video manager
      if (result.videoManager) {
        videoManagerRef.current = result.videoManager;
        setVideoManager(result.videoManager);
      }
      
      // Set up messaging service
      if (result.messagingService) {
        messagingServiceRef.current = result.messagingService;
      }
      
      setState(prev => ({
        ...prev,
        sessionData: result.sessionData,
        isLoading: false,
        sessionState: 'ready',
        connectionOptimized: true,
        initTime: result.initTime,
        usedFastTrack: result.usedFastTrack,
        showSafetyDisclaimer: !fastInitConfig.skipSafetyDisclaimer,
        showCameraPreview: !fastInitConfig.skipCameraPreview && !config.autoJoin
      }));
      
      // Auto-join logic
      if (config.autoJoin && result.cameraStream) {
        startAutoJoin();
      }
      
      console.log(`🚀 ✅ Fast initialization completed in ${result.initTime}ms (fast-track: ${result.usedFastTrack})`);
      
    } catch (error) {
      console.error('🚀 ❌ Fast initialization failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Initialization failed';
      
      setState(prev => ({
        ...prev,
        isLoading: false,
        sessionState: 'failed',
        error: errorMessage
      }));
      
      toast({
        variant: 'destructive',
        title: 'Session Error',
        description: errorMessage
      });
    }
  }, [user, userProfile, config, canSkipSafetyDisclaimer, handleProgress, setVideoManager, router, toast]);
  
  /**
   * Start auto-join countdown
   */
  const startAutoJoin = useCallback(() => {
    const delay = config.autoJoinDelay || 0;
    
    if (delay === 0) {
      // Join immediately
      joinSession();
      return;
    }
    
    // Start countdown
    let countdown = Math.ceil(delay / 1000);
    setState(prev => ({ ...prev, autoJoinCountdown: countdown, canCancelAutoJoin: true }));
    
    const countdownInterval = setInterval(() => {
      countdown -= 1;
      setState(prev => ({ ...prev, autoJoinCountdown: countdown }));
      
      if (countdown <= 0) {
        clearInterval(countdownInterval);
        setState(prev => ({ ...prev, autoJoinCountdown: null }));
        joinSession();
      }
    }, 1000);
    
    autoJoinTimeoutRef.current = countdownInterval;
  }, [config.autoJoinDelay]);
  
  /**
   * Cancel auto-join
   */
  const cancelAutoJoin = useCallback(() => {
    if (autoJoinTimeoutRef.current) {
      clearTimeout(autoJoinTimeoutRef.current);
      autoJoinTimeoutRef.current = undefined;
    }
    
    setState(prev => ({ 
      ...prev, 
      autoJoinCountdown: null, 
      canCancelAutoJoin: false,
      showCameraPreview: true 
    }));
  }, []);
  
  /**
   * Join session
   */
  const joinSession = useCallback(async () => {
    console.log('🚀 Joining session...');
    
    // Show safety disclaimer immediately if not already seen
    if (!canSkipSafetyDisclaimer()) {
      setState(prev => ({ 
        ...prev, 
        showSafetyDisclaimer: true,
        sessionState: 'connecting' // Start connecting in background
      }));
      return; // Safety disclaimer will handle the rest
    }
    
    setState(prev => ({ 
      ...prev, 
      hasJoinedSession: true, 
      sessionState: 'connecting',
      showCameraPreview: false,
      autoJoinCountdown: null
    }));
    
    try {
      if (videoManagerRef.current) {
        if ('initialize' in videoManagerRef.current) {
          await videoManagerRef.current.initialize('video-container');
        } else if ('initializeWithStream' in videoManagerRef.current && fastCamera.stream) {
          await videoManagerRef.current.initializeWithStream(fastCamera.stream);
        } else {
          await videoManagerRef.current.initialize();
        }
        
        console.log('🚀 ✅ Successfully joined session');
      } else {
        throw new Error('No video manager available');
      }
    } catch (error) {
      console.error('🚀 ❌ Failed to join session:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to join session';
      
      setState(prev => ({ 
        ...prev, 
        sessionState: 'failed', 
        error: errorMessage 
      }));
      
      toast({
        variant: 'destructive',
        title: 'Join Failed',
        description: errorMessage
      });
    }
  }, [fastCamera.stream, toast]);
  
  /**
   * Accept safety disclaimer
   */
  const acceptSafetyDisclaimer = useCallback(async () => {
    markSafetyDisclaimerSeen();
    setState(prev => ({ 
      ...prev, 
      showSafetyDisclaimer: false,
      hasJoinedSession: true,
      showCameraPreview: !config.autoJoin
    }));
    
    // Continue with actual session joining
    try {
      if (videoManagerRef.current) {
        if ('initialize' in videoManagerRef.current) {
          await videoManagerRef.current.initialize('video-container');
        } else if ('initializeWithStream' in videoManagerRef.current && fastCamera.stream) {
          await videoManagerRef.current.initializeWithStream(fastCamera.stream);
        } else {
          await videoManagerRef.current.initialize();
        }
        
        console.log('🚀 ✅ Successfully joined session after disclaimer');
      } else {
        throw new Error('No video manager available');
      }
    } catch (error) {
      console.error('🚀 ❌ Failed to join session after disclaimer:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to join session';
      
      setState(prev => ({ 
        ...prev, 
        sessionState: 'failed', 
        error: errorMessage 
      }));
      
      toast({
        variant: 'destructive',
        title: 'Connection Failed',
        description: errorMessage
      });
    }
    
    if (config.autoJoin) {
      startAutoJoin();
    }
  }, [markSafetyDisclaimerSeen, config.autoJoin, startAutoJoin, videoManagerRef, fastCamera.stream, toast]);
  
  /**
   * Decline safety disclaimer
   */
  const declineSafetyDisclaimer = useCallback(() => {
    router.push('/dashboard');
  }, [router]);
  
  /**
   * Go back to dashboard
   */
  const backToDashboard = useCallback(() => {
    // Cleanup
    if (autoJoinTimeoutRef.current) {
      clearTimeout(autoJoinTimeoutRef.current);
    }
    
    if (fastCamera.stream) {
      fastCamera.stream.getTracks().forEach(track => track.stop());
    }
    
    router.push('/dashboard');
  }, [fastCamera.stream, router]);
  
  // Initialize on mount
  useEffect(() => {
    startFastInitialization();
    
    return () => {
      // Cleanup on unmount
      if (autoJoinTimeoutRef.current) {
        clearTimeout(autoJoinTimeoutRef.current);
      }
    };
  }, [startFastInitialization]);
  
  return {
    // State
    ...state,
    
    // Camera state
    cameraStream: fastCamera.stream,
    cameraLoading: fastCamera.isLoading,
    cameraError: fastCamera.error,
    cameraInitTime: fastCamera.initTime,
    cameraUsedCache: fastCamera.usedCache,
    
    // Media controls
    mediaState,
    controls,
    
    // Actions
    joinSession,
    cancelAutoJoin,
    acceptSafetyDisclaimer,
    declineSafetyDisclaimer,
    backToDashboard,
    retryCamera: fastCamera.retryCamera,
    
    // Managers (for advanced usage)
    videoManager: videoManagerRef.current,
    messagingService: messagingServiceRef.current
  };
}