/**
 * Smooth Session UI Components
 * Google Meet/Zoom-inspired interface for Harthio sessions
 */

"use client";

import React, { useState, useEffect, useRef } from 'react';
import { 
  Mic, MicOff, Video, VideoOff, PhoneOff, Settings, 
  Wifi, WifiOff, Signal, Users, MessageSquare, 
  Maximize2, Minimize2, Volume2, VolumeX, MoreVertical,
  AlertTriangle, CheckCircle, Clock, Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import type { 
  ConnectionQuality, 
  SessionState, 
  VideoService, 
  ConnectionStats 
} from '@/lib/smooth-session-manager';

interface SmoothSessionUIProps {
  sessionState: SessionState;
  connectionQuality: ConnectionQuality;
  currentService: VideoService;
  connectionStats: ConnectionStats;
  isAudioMuted: boolean;
  isVideoOff: boolean;
  localVideoRef: React.RefObject<HTMLVideoElement>;
  remoteVideoRef: React.RefObject<HTMLVideoElement>;
  onToggleAudio: () => void;
  onToggleVideo: () => void;
  onEndCall: () => void;
  onReconnect: () => void;
  onOpenSettings: () => void;
  notifications: string[];
  otherUserName: string;
  sessionDuration: number;
}

export function SmoothSessionUI({
  sessionState,
  connectionQuality,
  currentService,
  connectionStats,
  isAudioMuted,
  isVideoOff,
  localVideoRef,
  remoteVideoRef,
  onToggleAudio,
  onToggleVideo,
  onEndCall,
  onReconnect,
  onOpenSettings,
  notifications,
  otherUserName,
  sessionDuration
}: SmoothSessionUIProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [showStats, setShowStats] = useState(false);
  const controlsTimeoutRef = useRef<NodeJS.Timeout>();

  // Auto-hide controls after inactivity
  useEffect(() => {
    const resetControlsTimeout = () => {
      setShowControls(true);
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    };

    const handleMouseMove = () => resetControlsTimeout();
    const handleKeyPress = () => resetControlsTimeout();

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('keydown', handleKeyPress);
    resetControlsTimeout();

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('keydown', handleKeyPress);
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, []);

  const getQualityColor = (quality: ConnectionQuality) => {
    switch (quality) {
      case 'excellent': return 'text-green-500';
      case 'good': return 'text-blue-500';
      case 'fair': return 'text-yellow-500';
      case 'poor': return 'text-orange-500';
      case 'failed': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  const getQualityIcon = (quality: ConnectionQuality) => {
    switch (quality) {
      case 'excellent': return <Signal className="w-4 h-4" />;
      case 'good': return <Signal className="w-4 h-4" />;
      case 'fair': return <Wifi className="w-4 h-4" />;
      case 'poor': return <WifiOff className="w-4 h-4" />;
      case 'failed': return <AlertTriangle className="w-4 h-4" />;
      default: return <Wifi className="w-4 h-4" />;
    }
  };

  const getStateMessage = (state: SessionState) => {
    switch (state) {
      case 'initializing': return 'Setting up your session...';
      case 'connecting': return 'Connecting to your call...';
      case 'connected': return 'Connected';
      case 'reconnecting': return 'Reconnecting...';
      case 'failed': return 'Connection failed';
      case 'ended': return 'Call ended';
      default: return 'Unknown state';
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden">
      {/* Background Video (Remote User) */}
      <div className="absolute inset-0">
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          muted={false}
          className="w-full h-full object-cover"
        />
        
        {/* Remote user placeholder when no video */}
        {(!remoteVideoRef.current?.srcObject || sessionState !== 'connected') && (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-blue-900 to-purple-900">
            <div className="text-center text-white">
              <div className="w-32 h-32 mx-auto mb-4 rounded-full bg-white/20 flex items-center justify-center">
                <Users className="w-16 h-16" />
              </div>
              <h2 className="text-2xl font-semibold mb-2">{otherUserName}</h2>
              <p className="text-white/80">{getStateMessage(sessionState)}</p>
              {sessionState === 'connecting' && (
                <Loader2 className="w-6 h-6 animate-spin mx-auto mt-4" />
              )}
            </div>
          </div>
        )}
      </div>

      {/* Local Video (Picture-in-Picture) */}
      <div className="absolute top-4 right-4 w-48 h-36 rounded-lg overflow-hidden bg-gray-900 border-2 border-white/20 shadow-lg">
        <video
          ref={localVideoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover"
        />
        {isVideoOff && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
            <VideoOff className="w-8 h-8 text-white" />
          </div>
        )}
        {isAudioMuted && (
          <div className="absolute top-2 left-2">
            <MicOff className="w-4 h-4 text-red-500" />
          </div>
        )}
      </div>

      {/* Top Bar */}
      <div className={cn(
        "absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/50 to-transparent transition-opacity duration-300",
        showControls ? "opacity-100" : "opacity-0"
      )}>
        <div className="flex items-center justify-between">
          {/* Session Info */}
          <div className="flex items-center space-x-4">
            <Badge variant="secondary" className="bg-black/50 text-white">
              <Clock className="w-3 h-3 mr-1" />
              {formatDuration(sessionDuration)}
            </Badge>
            
            {/* Connection Quality */}
            <div className={cn("flex items-center space-x-1", getQualityColor(connectionQuality))}>
              {getQualityIcon(connectionQuality)}
              <span className="text-sm font-medium capitalize">{connectionQuality}</span>
            </div>

            {/* Service Badge */}
            <Badge variant="outline" className="bg-black/50 text-white border-white/20">
              {currentService.toUpperCase()}
            </Badge>
          </div>

          {/* Top Right Controls */}
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowStats(!showStats)}
              className="text-white hover:bg-white/20"
            >
              <MoreVertical className="w-4 h-4" />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleFullscreen}
              className="text-white hover:bg-white/20"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Connection Stats Panel */}
      {showStats && (
        <div className="absolute top-16 right-4 bg-black/80 backdrop-blur-sm rounded-lg p-4 text-white text-sm min-w-64">
          <h3 className="font-semibold mb-3">Connection Statistics</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Bandwidth:</span>
              <span>{connectionStats.bandwidth} kbps</span>
            </div>
            <div className="flex justify-between">
              <span>Latency:</span>
              <span>{connectionStats.latency} ms</span>
            </div>
            <div className="flex justify-between">
              <span>Packet Loss:</span>
              <span>{connectionStats.packetLoss.toFixed(1)}%</span>
            </div>
            <div className="flex justify-between">
              <span>Resolution:</span>
              <span>{connectionStats.resolution}</span>
            </div>
            <div className="flex justify-between">
              <span>Frame Rate:</span>
              <span>{connectionStats.frameRate} fps</span>
            </div>
          </div>
        </div>
      )}

      {/* Notifications */}
      {notifications.length > 0 && (
        <div className="absolute top-20 left-1/2 transform -translate-x-1/2 space-y-2">
          {notifications.map((notification, index) => (
            <div
              key={index}
              className="bg-black/80 backdrop-blur-sm text-white px-4 py-2 rounded-lg shadow-lg"
            >
              {notification}
            </div>
          ))}
        </div>
      )}

      {/* Bottom Controls */}
      <div className={cn(
        "absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/50 to-transparent transition-opacity duration-300",
        showControls ? "opacity-100" : "opacity-0"
      )}>
        <div className="flex items-center justify-center space-x-4">
          {/* Audio Toggle */}
          <Button
            variant={isAudioMuted ? "destructive" : "secondary"}
            size="lg"
            onClick={onToggleAudio}
            className="rounded-full w-14 h-14 bg-black/50 hover:bg-black/80 border border-white/20"
          >
            {isAudioMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
          </Button>

          {/* Video Toggle */}
          <Button
            variant={isVideoOff ? "destructive" : "secondary"}
            size="lg"
            onClick={onToggleVideo}
            className="rounded-full w-14 h-14 bg-black/50 hover:bg-black/80 border border-white/20"
          >
            {isVideoOff ? <VideoOff className="w-6 h-6" /> : <Video className="w-6 h-6" />}
          </Button>

          {/* End Call */}
          <Button
            variant="destructive"
            size="lg"
            onClick={onEndCall}
            className="rounded-full w-14 h-14"
          >
            <PhoneOff className="w-6 h-6" />
          </Button>

          {/* Settings */}
          <Button
            variant="secondary"
            size="lg"
            onClick={onOpenSettings}
            className="rounded-full w-14 h-14 bg-black/50 hover:bg-black/80 border border-white/20"
          >
            <Settings className="w-6 h-6" />
          </Button>

          {/* Reconnect (only show when needed) */}
          {(sessionState === 'failed' || connectionQuality === 'failed') && (
            <Button
              variant="outline"
              size="lg"
              onClick={onReconnect}
              className="rounded-full w-14 h-14 bg-black/50 hover:bg-black/80 border border-white/20"
            >
              <Loader2 className="w-6 h-6 animate-spin" />
            </Button>
          )}
        </div>

        {/* Connection Status Bar */}
        {connectionQuality === 'poor' || connectionQuality === 'failed' && (
          <div className="mt-4 flex items-center justify-center">
            <div className="bg-yellow-500/20 border border-yellow-500/50 rounded-lg px-4 py-2 flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-yellow-500" />
              <span className="text-yellow-100 text-sm">
                {connectionQuality === 'failed' 
                  ? 'Connection lost - trying to reconnect...' 
                  : 'Poor connection - adjusting quality...'}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Keyboard Shortcuts Hint */}
      <div className="absolute bottom-4 left-4 text-white/60 text-xs">
        <div>Space: Toggle mute • V: Toggle video • F: Fullscreen</div>
      </div>
    </div>
  );
}