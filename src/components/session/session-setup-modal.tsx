/**
 * Session Setup Modal - Overlay for camera/mic testing
 * Appears on top of session page while it initializes in background
 */

"use client";

import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { 
  Camera, 
  Mic, 
  VideoOff, 
  CheckCircle, 
  AlertCircle,
  ArrowRight,
  X
} from "lucide-react";
import { cn } from "@/lib/utils";
import { DeviceOrientationService, DeviceVideoMetadata, OrientationCallbacks } from "@/lib/device-orientation-service";

interface SetupState {
  hasCamera: boolean;
  hasMicrophone: boolean;
  cameraPermission: 'granted' | 'denied' | 'prompt' | 'checking';
  microphonePermission: 'granted' | 'denied' | 'prompt' | 'checking';
  audioEnabled: boolean;
  videoEnabled: boolean;
}

interface SessionSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onJoin: (preferences: {
    audioEnabled: boolean;
    videoEnabled: boolean;
    selectedCamera?: string;
    selectedMicrophone?: string;
  }) => void;
  topic: {
    title: string;
    start_time: string;
  };
  sessionReady: boolean;
}

export function SessionSetupModal({ 
  isOpen, 
  onClose, 
  onJoin, 
  topic, 
  sessionReady 
}: SessionSetupModalProps) {
  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const orientationServiceRef = useRef<DeviceOrientationService | null>(null);

  // State
  const [setupState, setSetupState] = useState<SetupState>({
    hasCamera: false,
    hasMicrophone: false,
    cameraPermission: 'checking',
    microphonePermission: 'checking',
    audioEnabled: true,
    videoEnabled: true,
  });
  const [audioLevel, setAudioLevel] = useState(0);
  const [deviceMetadata, setDeviceMetadata] = useState<DeviceVideoMetadata | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'good' | 'fair' | 'poor'>('checking');

  // Initialize devices and orientation service when modal opens
  useEffect(() => {
    if (isOpen) {
      initializeDevices();
      initializeOrientationService();
      checkConnectionQuality();
    }
    return () => {
      cleanup();
    };
  }, [isOpen]);

  const initializeOrientationService = () => {
    const callbacks: OrientationCallbacks = {
      onOrientationChange: (metadata: DeviceVideoMetadata) => {
        console.log('📱 Preview camera orientation changed:', metadata);
        setDeviceMetadata(metadata);
      },
      onRemoteOrientationChange: () => {
        // Not needed for preview
      }
    };

    orientationServiceRef.current = new DeviceOrientationService(callbacks);
    orientationServiceRef.current.startListening();
  };

  // Simple connection quality check for users (non-technical)
  const checkConnectionQuality = async () => {
    setConnectionStatus('checking');
    
    try {
      // Simple network test - just check if we can reach our API
      const startTime = performance.now();
      const response = await fetch('/api/health', { 
        method: 'HEAD',
        cache: 'no-cache'
      });
      const latency = performance.now() - startTime;
      
      // Simple quality assessment based on response time
      if (response.ok) {
        if (latency < 150) {
          setConnectionStatus('good');
        } else if (latency < 400) {
          setConnectionStatus('fair');
        } else {
          setConnectionStatus('poor');
        }
      } else {
        setConnectionStatus('poor');
      }
    } catch (error) {
      console.log('Connection check failed (this is normal):', error);
      setConnectionStatus('fair'); // Default to fair if test fails
    }
  };

  const initializeDevices = async () => {
    try {
      // Check if we're in a secure context
      const isSecureContext = window.isSecureContext || 
        location.protocol === 'https:' || 
        location.hostname === 'localhost';

      if (!isSecureContext) {
        setSetupState(prev => ({
          ...prev,
          cameraPermission: 'denied',
          microphonePermission: 'denied'
        }));
        return;
      }

      // Get available devices
      const deviceList = await navigator.mediaDevices.enumerateDevices();
      const hasCamera = deviceList.some(d => d.kind === 'videoinput');
      const hasMicrophone = deviceList.some(d => d.kind === 'audioinput');

      setSetupState(prev => ({
        ...prev,
        hasCamera,
        hasMicrophone,
      }));

      // Test permissions
      await testPermissions(hasCamera, hasMicrophone);

    } catch (error) {
      console.error('Failed to initialize devices:', error);
    }
  };

  const testPermissions = async (hasCamera: boolean, hasMicrophone: boolean) => {
    try {
      setSetupState(prev => ({
        ...prev,
        cameraPermission: 'checking',
        microphonePermission: 'checking'
      }));

      // Request permissions with graceful fallback
      let stream: MediaStream | null = null;
      
      try {
        // Try both video and audio first
        stream = await navigator.mediaDevices.getUserMedia({
          video: hasCamera,
          audio: hasMicrophone
        });
        
        setSetupState(prev => ({
          ...prev,
          cameraPermission: hasCamera ? 'granted' : 'prompt',
          microphonePermission: hasMicrophone ? 'granted' : 'prompt'
        }));
        
      } catch (error: any) {
        console.log('Full permission request failed, trying audio only:', error);
        
        // Fallback: try audio only
        try {
          if (hasMicrophone) {
            stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            setSetupState(prev => ({
              ...prev,
              cameraPermission: 'denied',
              microphonePermission: 'granted'
            }));
          }
        } catch (audioError) {
          console.log('Audio permission also failed:', audioError);
          setSetupState(prev => ({
            ...prev,
            cameraPermission: 'denied',
            microphonePermission: 'denied'
          }));
        }
      }

      // Set up preview if we got a stream
      if (stream) {
        if (hasCamera && videoRef.current && stream.getVideoTracks().length > 0) {
          videoRef.current.srcObject = stream;
          streamRef.current = stream;
          
          // Update orientation service with video stream metadata
          if (orientationServiceRef.current) {
            orientationServiceRef.current.updateVideoStreamMetadata(stream);
          }
        }

        if (hasMicrophone && stream.getAudioTracks().length > 0) {
          startAudioLevelMonitoring(stream);
        }
      }

    } catch (error: any) {
      console.error('Permission test completely failed:', error);
      setSetupState(prev => ({
        ...prev,
        cameraPermission: 'denied',
        microphonePermission: 'denied'
      }));
    }
  };

  const startAudioLevelMonitoring = (stream: MediaStream) => {
    try {
      const audioContext = new AudioContext();
      const analyser = audioContext.createAnalyser();
      
      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);
      
      analyser.fftSize = 256;
      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const updateAudioLevel = () => {
        if (analyser) {
          analyser.getByteFrequencyData(dataArray);
          const average = dataArray.reduce((a, b) => a + b) / bufferLength;
          setAudioLevel(average / 255 * 100);
          requestAnimationFrame(updateAudioLevel);
        }
      };

      updateAudioLevel();
    } catch (error) {
      console.error('Failed to start audio monitoring:', error);
    }
  };

  const cleanup = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    if (orientationServiceRef.current) {
      orientationServiceRef.current.stopListening();
      orientationServiceRef.current = null;
    }
  };

  const handleJoin = () => {
    const preferences = {
      audioEnabled: setupState.audioEnabled,
      videoEnabled: setupState.videoEnabled,
    };
    
    cleanup();
    onJoin(preferences);
  };

  const canJoin = setupState.cameraPermission !== 'denied' && setupState.microphonePermission !== 'denied';

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl shadow-2xl">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl">Ready to Join?</CardTitle>
              <p className="text-sm text-gray-600 mt-1">Test your camera and microphone</p>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
          
          {/* Session Info */}
          <div className="space-y-2">
            <div className="flex items-center gap-4 text-sm text-gray-600 bg-gray-50 px-4 py-2 rounded-lg">
              <span className="font-medium">{topic.title}</span>
              <span>•</span>
              <span>{new Date(topic.start_time).toLocaleTimeString()}</span>
            </div>
            <p className="text-xs text-gray-500 text-center">
              Preview shows how you'll appear to others in the session
            </p>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Video Preview - Matches Session Page Styling */}
          <div className="aspect-video bg-gray-900 rounded-lg overflow-hidden relative max-w-md mx-auto">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={cn(
                "w-full h-full object-cover",
                // Apply same orientation-aware styling as session page
                deviceMetadata?.preferredDisplayMode === 'contain' ? 'object-contain' : 'object-cover'
              )}
            />
            
            {!setupState.videoEnabled && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
                <VideoOff className="w-8 h-8 text-gray-400" />
              </div>
            )}
            
            {setupState.cameraPermission === 'denied' && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-800 text-white text-center p-4">
                <div>
                  <AlertCircle className="w-6 h-6 mx-auto mb-2 text-red-400" />
                  <p className="text-xs">Camera access needed</p>
                </div>
              </div>
            )}
            
            {/* Device Orientation Indicator */}
            {deviceMetadata && (
              <div className="absolute top-2 left-2">
                <Badge variant="secondary" className="text-xs bg-black/50 text-white border-0">
                  {deviceMetadata.deviceType} • {deviceMetadata.orientation}
                </Badge>
              </div>
            )}

            {/* Audio Level Overlay */}
            {setupState.audioEnabled && audioLevel > 10 && (
              <div className="absolute bottom-2 left-2 right-2">
                <div className="w-full bg-black/30 rounded-full h-1 overflow-hidden">
                  <div 
                    className="h-full bg-green-400 transition-all duration-100 rounded-full"
                    style={{ width: `${Math.min(audioLevel, 100)}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Simple Controls */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Camera className="w-4 h-4 text-gray-600" />
                <span className="text-sm font-medium">Camera</span>
              </div>
              <Switch
                checked={setupState.videoEnabled}
                onCheckedChange={(checked) => 
                  setSetupState(prev => ({ ...prev, videoEnabled: checked }))
                }
                disabled={setupState.cameraPermission === 'denied'}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Mic className="w-4 h-4 text-gray-600" />
                <span className="text-sm font-medium">Microphone</span>
              </div>
              <Switch
                checked={setupState.audioEnabled}
                onCheckedChange={(checked) => 
                  setSetupState(prev => ({ ...prev, audioEnabled: checked }))
                }
                disabled={setupState.microphonePermission === 'denied'}
              />
            </div>
          </div>

          {/* Connection Status */}
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2">
              <div className={cn(
                "w-2 h-2 rounded-full",
                connectionStatus === 'checking' && "bg-gray-400 animate-pulse",
                connectionStatus === 'good' && "bg-green-500",
                connectionStatus === 'fair' && "bg-yellow-500",
                connectionStatus === 'poor' && "bg-red-500"
              )} />
              <span className="text-sm font-medium">
                {connectionStatus === 'checking' && 'Checking connection...'}
                {connectionStatus === 'good' && 'Great connection'}
                {connectionStatus === 'fair' && 'Good connection'}
                {connectionStatus === 'poor' && 'Slow connection'}
              </span>
            </div>
            {connectionStatus === 'poor' && (
              <span className="text-xs text-gray-500">Video quality may be reduced</span>
            )}
          </div>

          {/* Status */}
          <div>
            {canJoin ? (
              <div className="flex items-center gap-2 text-green-700 bg-green-50 p-3 rounded-lg">
                <CheckCircle className="w-4 h-4" />
                <span className="text-sm font-medium">Ready to join!</span>
                {sessionReady && (
                  <Badge variant="secondary" className="ml-auto text-xs">
                    Session Ready
                  </Badge>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2 text-amber-700 bg-amber-50 p-3 rounded-lg">
                <AlertCircle className="w-4 h-4" />
                <span className="text-sm font-medium">
                  Please allow camera and microphone access
                </span>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Cancel
            </Button>
            
            <Button
              onClick={handleJoin}
              disabled={!canJoin}
              className="flex-2 bg-gradient-to-r from-rose-500 to-teal-500 hover:from-rose-600 hover:to-teal-600 disabled:from-gray-400 disabled:to-gray-500"
            >
              {!canJoin ? (
                "Allow Access First"
              ) : (
                <>
                  Join Session
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </div>

          {/* Permissions Help - Only show if needed */}
          {(setupState.cameraPermission === 'denied' || setupState.microphonePermission === 'denied') && (
            <div className="border-red-200 bg-red-50 p-4 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-red-800 mb-1">
                    Camera/Microphone Access Required
                  </h3>
                  <p className="text-red-700 text-sm">
                    Click the camera icon in your browser's address bar and select "Allow"
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}