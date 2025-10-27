/**
 * Fast Camera Initialization Hook
 * Optimized camera setup with smart constraints and caching
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { mediaStreamController, type MediaState } from '@/lib/media-stream-controller';
import { OrientationAdapter, type DeviceInfo } from '@/lib/migrate-to-simple-orientation';

export interface FastCameraConfig {
  skipPreview?: boolean;
  enableFastTrack?: boolean;
  userId?: string;
  onStreamReady?: (stream: MediaStream) => void;
  onError?: (error: string) => void;
  onDeviceInfo?: (deviceInfo: DeviceInfo) => void;
}

export interface FastCameraState {
  stream: MediaStream | null;
  isLoading: boolean;
  error: string | null;
  deviceInfo: DeviceInfo | null;
  initTime: number;
  usedCache: boolean;
}

export function useFastCamera(config: FastCameraConfig = {}) {
  const [state, setState] = useState<FastCameraState>({
    stream: null,
    isLoading: true,
    error: null,
    deviceInfo: null,
    initTime: 0,
    usedCache: false
  });
  
  const initStartTime = useRef<number>(0);
  const constraintsCache = useRef<Map<string, MediaStreamConstraints>>(new Map());
  
  /**
   * Get optimal constraints based on device and browser
   */
  const getOptimalConstraints = useCallback((): MediaStreamConstraints => {
    const userAgent = navigator.userAgent;
    const isChrome = userAgent.includes('Chrome');
    const isSafari = userAgent.includes('Safari') && !isChrome;
    const isFirefox = userAgent.includes('Firefox');
    const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
    const isIOS = /iPad|iPhone|iPod/.test(userAgent);
    
    // Device-specific optimizations
    if (isMobile) {
      if (isIOS) {
        // iOS Safari optimizations
        return {
          video: {
            facingMode: 'user',
            width: { ideal: 640, max: 1280 },
            height: { ideal: 480, max: 720 },
            frameRate: { ideal: 24, max: 30 }
          },
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
            sampleRate: 16000
          }
        };
      } else {
        // Android optimizations
        return {
          video: {
            facingMode: 'user',
            width: { ideal: 720, max: 1280 },
            height: { ideal: 480, max: 720 },
            frameRate: { ideal: 30 }
          },
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          }
        };
      }
    } else {
      // Desktop optimizations
      return {
        video: {
          width: { ideal: 1280, max: 1920 },
          height: { ideal: 720, max: 1080 },
          frameRate: { ideal: 30 }
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      };
    }
  }, []);
  
  /**
   * Get cached constraints for user
   */
  const getCachedConstraints = useCallback((userId: string): MediaStreamConstraints | null => {
    const cached = constraintsCache.current.get(userId);
    return cached || null;
  }, []);
  
  /**
   * Cache successful constraints
   */
  const cacheConstraints = useCallback((userId: string, constraints: MediaStreamConstraints) => {
    constraintsCache.current.set(userId, constraints);
    
    // Also store in localStorage for persistence
    try {
      localStorage.setItem(`camera_constraints_${userId}`, JSON.stringify(constraints));
    } catch (error) {
      console.warn('Failed to cache constraints in localStorage:', error);
    }
  }, []);
  
  /**
   * Load cached constraints from localStorage
   */
  const loadCachedConstraints = useCallback((userId: string): MediaStreamConstraints | null => {
    try {
      const cached = localStorage.getItem(`camera_constraints_${userId}`);
      if (cached) {
        const constraints = JSON.parse(cached);
        constraintsCache.current.set(userId, constraints);
        return constraints;
      }
    } catch (error) {
      console.warn('Failed to load cached constraints:', error);
    }
    return null;
  }, []);
  
  /**
   * Fast camera initialization
   */
  const initializeCamera = useCallback(async () => {
    if (config.skipPreview) {
      setState(prev => ({ ...prev, isLoading: false }));
      return;
    }
    
    initStartTime.current = Date.now();
    
    setState(prev => ({ 
      ...prev, 
      isLoading: true, 
      error: null 
    }));
    
    try {
      let mediaStream: MediaStream;
      let usedCache = false;
      
      // Try cached constraints first (fastest path)
      if (config.userId && config.enableFastTrack) {
        const cachedConstraints = loadCachedConstraints(config.userId) || getCachedConstraints(config.userId);
        
        if (cachedConstraints) {
          try {
            console.log('📷 Trying cached constraints...');
            mediaStream = await navigator.mediaDevices.getUserMedia(cachedConstraints);
            usedCache = true;
            console.log('📷 ✅ Camera initialized with cached constraints');
          } catch (cacheError) {
            console.log('📷 Cached constraints failed, trying optimal constraints');
          }
        }
      }
      
      // If cached constraints failed or not available, use optimal constraints
      if (!mediaStream!) {
        const optimalConstraints = getOptimalConstraints();
        console.log('📷 Using optimal constraints:', optimalConstraints);
        mediaStream = await navigator.mediaDevices.getUserMedia(optimalConstraints);
        
        // Cache successful constraints
        if (config.userId) {
          cacheConstraints(config.userId, optimalConstraints);
        }
        
        console.log('📷 ✅ Camera initialized with optimal constraints');
      }
      
      // Get device info
      const deviceInfo = OrientationAdapter.getDeviceInfo();
      
      // Set up media stream controller
      mediaStreamController.setStream(mediaStream);
      
      const initTime = Date.now() - initStartTime.current;
      
      setState(prev => ({
        ...prev,
        stream: mediaStream,
        deviceInfo,
        isLoading: false,
        error: null,
        initTime,
        usedCache
      }));
      
      // Notify callbacks
      config.onStreamReady?.(mediaStream);
      config.onDeviceInfo?.(deviceInfo);
      
      console.log(`📷 ✅ Fast camera initialization completed in ${initTime}ms (cached: ${usedCache})`);
      
    } catch (error) {
      const initTime = Date.now() - initStartTime.current;
      const errorMessage = error instanceof Error ? error.message : 'Camera access failed';
      
      console.error('📷 ❌ Camera initialization failed:', errorMessage);
      
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
        initTime
      }));
      
      config.onError?.(errorMessage);
    }
  }, [config, getOptimalConstraints, getCachedConstraints, cacheConstraints, loadCachedConstraints]);
  
  /**
   * Retry camera initialization
   */
  const retryCamera = useCallback(async () => {
    // Clear any existing stream
    if (state.stream) {
      state.stream.getTracks().forEach(track => track.stop());
    }
    
    // Clear cached constraints for this user to force fresh attempt
    if (config.userId) {
      constraintsCache.current.delete(config.userId);
      try {
        localStorage.removeItem(`camera_constraints_${config.userId}`);
      } catch (error) {
        console.warn('Failed to clear cached constraints:', error);
      }
    }
    
    await initializeCamera();
  }, [state.stream, config.userId, initializeCamera]);
  
  /**
   * Check if camera permissions are likely available
   */
  const checkPermissions = useCallback(async (): Promise<boolean> => {
    if (!navigator.permissions) {
      return true; // Assume available if permissions API not supported
    }
    
    try {
      const cameraPermission = await navigator.permissions.query({ name: 'camera' as PermissionName });
      const micPermission = await navigator.permissions.query({ name: 'microphone' as PermissionName });
      
      return cameraPermission.state !== 'denied' && micPermission.state !== 'denied';
    } catch (error) {
      console.warn('Permission check failed:', error);
      return true; // Assume available if check fails
    }
  }, []);
  
  // Initialize camera on mount
  useEffect(() => {
    let mounted = true;
    
    const init = async () => {
      // Quick permission check first
      const hasPermissions = await checkPermissions();
      
      if (!hasPermissions) {
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: 'Camera and microphone permissions are required'
        }));
        return;
      }
      
      if (mounted) {
        await initializeCamera();
      }
    };
    
    init();
    
    return () => {
      mounted = false;
      // Cleanup stream on unmount
      if (state.stream) {
        state.stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [initializeCamera, checkPermissions]);
  
  return {
    ...state,
    retryCamera,
    checkPermissions
  };
}