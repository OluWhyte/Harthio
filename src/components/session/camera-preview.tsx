/**
 * Camera Preview Component
 * Shows user's camera immediately when joining a session
 */

"use client";

import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Video, VideoOff, Mic, MicOff, Settings } from 'lucide-react';
import { OrientationAdapter, type DeviceInfo } from '@/lib/migrate-to-simple-orientation';
import { mediaStreamController, type MediaState } from '@/lib/media-stream-controller';
import { EnhancedButton, CircularButton, ButtonGroup } from '@/components/ui/enhanced-button';
import { useEnhancedViewport } from '@/lib/enhanced-viewport';
import { useSmoothOrientation } from '@/lib/smooth-orientation';
import { SimpleDeviceManager, useSimpleDeviceShare } from '@/lib/simple-device-share';
import { useSimpleMediaState } from '@/hooks/use-media-state';

interface CameraPreviewProps {
  onStreamReady?: (stream: MediaStream) => void;
  onError?: (error: string) => void;
  onDeviceInfo?: (deviceInfo: DeviceInfo) => void;
  className?: string;
  // Connection optimization status
  connectionOptimized?: boolean;
  // Simplified props - no more external state syncing needed
}

export function CameraPreview({ 
  onStreamReady, 
  onError, 
  onDeviceInfo, 
  className,
  connectionOptimized = false
}: CameraPreviewProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo | null>(null);

  // Enhanced viewport and orientation handling
  const { viewport, touchTargetConfig, safeZones, cssProperties } = useEnhancedViewport();
  const orientationState = useSmoothOrientation({
    preserveVideoStream: true,
    enableSmoothTransitions: true
  });
  const deviceShare = useSimpleDeviceShare();

  // Unified media state management
  const { mediaState, controls } = useSimpleMediaState();

  // Media state is now managed by useSimpleMediaState hook
  // No manual subscriptions or external state syncing needed

  // Initialize camera on mount with enhanced orientation handling
  useEffect(() => {
    // Get initial device info using new system
    const initialDeviceInfo = OrientationAdapter.getDeviceInfo();
    setDeviceInfo(initialDeviceInfo);
    onDeviceInfo?.(initialDeviceInfo);
    
    // Check if getUserMedia is available
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setError('Camera access not supported in this browser');
      setIsLoading(false);
      return;
    }
    
    // Check for available devices
    navigator.mediaDevices.enumerateDevices()
      .then(devices => {
        const videoDevices = devices.filter(device => device.kind === 'videoinput');
        const audioDevices = devices.filter(device => device.kind === 'audioinput');
        
        if (videoDevices.length === 0) {
          setError('No camera found. Please connect a camera and refresh the page.');
          setIsLoading(false);
          return;
        }
        
        initializeCamera();
      })
      .catch(err => {
        console.warn('📷 Could not enumerate devices:', err);
        // Still try to initialize camera
        initializeCamera();
      });
    
    return () => {
      // Cleanup on unmount
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Handle smooth orientation changes without camera reinitialization
  useEffect(() => {
    if (orientationState.isTransitioning) {
      console.log('📱 Orientation transitioning, preserving camera stream');
      return;
    }

    // Update device info when orientation stabilizes
    const newDeviceInfo = OrientationAdapter.getDeviceInfo();
    setDeviceInfo(newDeviceInfo);
    onDeviceInfo?.(newDeviceInfo);
  }, [orientationState.current.orientation, orientationState.isTransitioning, onDeviceInfo]);

  const initializeCamera = async () => {
    try {
      setIsLoading(true);
      setError(null);

      let mediaStream: MediaStream;

      try {
        // Use smooth orientation constraints that work across orientations
        const constraints = orientationState.getVideoConstraints();
        console.log('📷 Using smooth orientation constraints:', constraints);
        mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      } catch (orientationError) {
        console.warn('📷 Orientation constraints failed, trying adaptive constraints:', orientationError);
        
        // Fallback to adaptive constraints
        try {
          const constraints = OrientationAdapter.getMediaConstraints(deviceInfo);
          mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
        } catch (adaptiveError) {
          console.warn('📷 Adaptive constraints failed, trying basic constraints:', adaptiveError);
          
          // Final fallback - basic constraints
          const basicConstraints: MediaStreamConstraints = {
            video: {
              facingMode: 'user',
              width: { ideal: 640 },
              height: { ideal: 480 }
            },
            audio: {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true
            }
          };
          
          mediaStream = await navigator.mediaDevices.getUserMedia(basicConstraints);
        }
      }

      setStream(mediaStream);
      
      // Set video element source
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }

      // Register stream with controller
      mediaStreamController.setStream(mediaStream);
      
      // Log initial state for debugging
      const initialState = mediaStreamController.getState();
      // Camera initialized successfully

      // Get actual video dimensions and update device info
      setTimeout(() => {
        if (videoRef.current) {
          const video = videoRef.current;
          const videoWidth = video.videoWidth;
          const videoHeight = video.videoHeight;
          const containerRect = video.getBoundingClientRect();
          
          // Video dimensions captured
          
          // Get fresh device info (don't override orientation with video dimensions)
          const freshDeviceInfo = OrientationAdapter.getDeviceInfo();
          
          // Update device info with actual video dimensions but keep the detected orientation
          const updatedDeviceInfo = {
            ...freshDeviceInfo, // Use fresh device info for accurate orientation
            videoWidth,
            videoHeight,
            containerWidth: containerRect.width,
            containerHeight: containerRect.height
          };
          
          // Device info updated with video dimensions
          setDeviceInfo(updatedDeviceInfo);
          onDeviceInfo?.(updatedDeviceInfo);
        }
      }, 1000); // Wait for video to load

      // Notify parent component
      if (onStreamReady) {
        onStreamReady(mediaStream);
      }

      setIsLoading(false);
      // Camera setup complete
    } catch (err) {
      console.error('📷 Camera initialization failed:', err);
      let errorMessage = 'Failed to access camera';
      
      if (err instanceof Error) {
        if (err.name === 'NotAllowedError') {
          errorMessage = 'Camera access denied. Please allow camera and microphone access.';
        } else if (err.name === 'NotFoundError') {
          errorMessage = 'No camera found. Please connect a camera and try again.';
        } else if (err.name === 'NotReadableError') {
          errorMessage = 'Camera is being used by another application.';
        } else {
          errorMessage = err.message;
        }
      }
      
      setError(errorMessage);
      setIsLoading(false);
      
      if (onError) {
        onError(errorMessage);
      }
    }
  };

  // Remove reinitializeCamera - we now preserve streams during orientation changes

  const toggleVideo = async () => {
    console.log('📷 CameraPreview: toggleVideo called');
    await controls.toggleVideo();
  };

  const toggleAudio = async () => {
    console.log('📷 CameraPreview: toggleAudio called');
    await controls.toggleAudio();
  };

  const checkPermissions = async () => {
    try {
      // Check camera permission
      const cameraPermission = await navigator.permissions.query({ name: 'camera' as PermissionName });
      const micPermission = await navigator.permissions.query({ name: 'microphone' as PermissionName });
      
      console.log('📷 Camera permission:', cameraPermission.state);
      console.log('🎤 Microphone permission:', micPermission.state);
      
      if (cameraPermission.state === 'denied') {
        setError('Camera access denied. Please enable camera access in your browser settings.');
        return false;
      }
      
      if (micPermission.state === 'denied') {
        setError('Microphone access denied. Please enable microphone access in your browser settings.');
        return false;
      }
      
      return true;
    } catch (err) {
      console.log('📷 Permission check not supported, proceeding with camera access');
      return true;
    }
  };

  const retryCamera = async () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    
    // Check permissions first
    const hasPermissions = await checkPermissions();
    if (hasPermissions) {
      initializeCamera();
    }
  };

  if (error) {
    const aspectRatio = deviceInfo ? 
      OrientationAdapter.getAspectRatioClass(deviceInfo) : 
      { className: 'aspect-video w-full' };
      
    return (
      <div 
        className={`w-full ${className}`}
        style={cssProperties}
      >
        <div 
          className={`relative bg-black rounded-lg overflow-hidden ${aspectRatio.className} flex items-center justify-center ${orientationState.getContainerClasses()}`}
          style={{
            ...aspectRatio.style,
            transform: orientationState.getTransitionTransform()
          }}
        >
          <div className="text-center space-y-4 p-6">
            <div className="text-red-500">
              <VideoOff className="h-12 w-12 mx-auto mb-3" />
              <p className="font-medium text-base text-white">Camera Access Failed</p>
              <p className="text-sm text-gray-300 mt-2">{error}</p>
            </div>
            
            <div className="space-y-3">
              <EnhancedButton 
                onClick={retryCamera} 
                variant="outline" 
                touchTarget="medium"
                safeArea={true}
              >
                Try Again
              </EnhancedButton>
              <p className="text-xs text-gray-400">
                Make sure to allow camera and microphone access
              </p>
            </div>
          </div>

          {/* Enhanced controls with proper touch targets */}
          <div 
            className="absolute left-1/2 transform -translate-x-1/2"
            style={{ bottom: `${safeZones.bottom + 16}px` }}
          >
            <ButtonGroup>
              <CircularButton
                onClick={retryCamera}
                variant="destructive"
                icon={<VideoOff className="w-5 h-5" />}
                touchTarget="medium"
              />
              
              <CircularButton
                onClick={retryCamera}
                variant="destructive"
                icon={<MicOff className="w-5 h-5" />}
                touchTarget="medium"
              />
            </ButtonGroup>
          </div>
        </div>
        
        <p className="text-center text-sm text-gray-300 mt-3">
          Camera access is required to join the session
        </p>
      </div>
    );
  }

  // Get adaptive aspect ratio class and style
  const aspectRatio = deviceInfo ? 
    OrientationAdapter.getAspectRatioClass(deviceInfo) : 
    { className: 'aspect-video w-full' };
  
  const deviceDisplayName = deviceInfo ? 
    OrientationAdapter.getDeviceDisplayName(deviceInfo) : 
    'Unknown Device';

  return (
    <div 
      className={`w-full ${className}`}
      style={cssProperties}
    >
      {/* Enhanced Video Preview Container */}
      <div 
        className={`relative bg-black rounded-lg overflow-hidden ${aspectRatio.className} ${orientationState.getContainerClasses()}`}
        style={{
          ...aspectRatio.style,
          transform: orientationState.getTransitionTransform(),
          minHeight: `${Math.min(viewport.availableHeight * 0.4, 300)}px`,
          maxHeight: `${viewport.availableHeight * 0.6}px`
        }}
      >
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover transition-transform duration-300"
          style={{ 
            transform: `scaleX(-1) ${orientationState.getTransitionTransform()}` // Mirror + orientation
          }}
        />
        
        {/* Loading Overlay */}
        {isLoading && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <div className="text-white text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
              <p className="text-sm">Accessing camera...</p>
            </div>
          </div>
        )}

        {/* Video Off Overlay */}
        {mediaState.isVideoOff && !isLoading && (
          <div className="absolute inset-0 bg-gray-900 flex items-center justify-center">
            <div className="text-white text-center">
              <VideoOff className="h-12 w-12 mx-auto mb-2" />
              <p className="text-sm">Camera is off</p>
            </div>
          </div>
        )}

        {/* Enhanced Controls with Safe Area */}
        <div 
          className="absolute left-1/2 transform -translate-x-1/2"
          style={{ bottom: `${safeZones.bottom + touchTargetConfig.spacing}px` }}
        >
          <ButtonGroup>
            <CircularButton
              onClick={toggleVideo}
              variant={!mediaState.isVideoOff ? "secondary" : "destructive"}
              icon={!mediaState.isVideoOff ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
              touchTarget="auto"
              haptic={true}
            />
            
            <CircularButton
              onClick={toggleAudio}
              variant={!mediaState.isAudioMuted ? "secondary" : "destructive"}
              icon={!mediaState.isAudioMuted ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
              touchTarget="auto"
              haptic={true}
            />
          </ButtonGroup>
        </div>

        {/* Enhanced Status Indicator */}
        <div 
          className="absolute right-4"
          style={{ top: `${safeZones.top + 8}px` }}
        >
          <div className="bg-black/50 text-white px-2 py-1 rounded text-xs flex items-center gap-1">
            <div className={`w-2 h-2 rounded-full ${
              connectionOptimized 
                ? 'bg-green-400 animate-pulse' 
                : 'bg-blue-400 animate-spin'
            }`}></div>
            <span className="hidden sm:inline">
              {connectionOptimized ? 'Ready' : 'Preview'}
            </span>
            <span className="sm:hidden">
              {connectionOptimized ? '✅' : '📱'}
            </span>
          </div>
        </div>
        
        {/* Enhanced Device Info */}
        <div 
          className="absolute left-4"
          style={{ top: `${safeZones.top + 8}px` }}
        >
          <div className="bg-black/50 text-white px-2 py-1 rounded text-xs">
            {deviceDisplayName}
            {deviceShare && (
              <div className="text-xs opacity-75">
                {deviceShare.aspectRatio} • {deviceShare.viewportSize}
              </div>
            )}
          </div>
        </div>

        {/* Orientation Transition Indicator */}
        {orientationState.isTransitioning && (
          <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
            <div className="bg-black/80 text-white px-3 py-2 rounded-lg text-sm">
              Adjusting orientation...
            </div>
          </div>
        )}
      </div>
    </div>
  );
}