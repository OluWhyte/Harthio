/**
 * Modern Session UI - Google Meet Inspired
 * Responsive video calling interface with messaging
 */

"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Mic, MicOff, Video, VideoOff, PhoneOff, Settings, 
  MessageSquare, MoreVertical, Maximize2, Minimize2,
  Users, Clock, Signal, WifiOff, Volume2, VolumeX,
  Copy, Share2, Info, AlertTriangle,
  Loader2, X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { ZoomChatPanel } from './zoom-chat-panel';

interface Message {
  id: string;
  userId: string;
  userName: string;
  content: string;
  timestamp: Date;
  type: 'text' | 'system';
}

interface ConnectionStats {
  bandwidth: number;
  latency: number;
  packetLoss: number;
  quality: 'excellent' | 'good' | 'fair' | 'poor' | 'failed';
  resolution: string;
  frameRate: number;
}

interface ModernSessionUIProps {
  // Video refs
  localVideoRef: React.RefObject<HTMLVideoElement>;
  remoteVideoRef: React.RefObject<HTMLVideoElement>;
  
  // Session state
  sessionState: 'initializing' | 'connecting' | 'connected' | 'reconnecting' | 'failed' | 'ended';
  connectionQuality: 'excellent' | 'good' | 'fair' | 'poor' | 'failed';
  connectionStats: ConnectionStats;
  
  // Audio/Video state
  isAudioMuted: boolean;
  isVideoOff: boolean;
  isRemoteAudioMuted?: boolean;
  isRemoteVideoOff?: boolean;
  
  // User info
  currentUserName: string;
  currentUserId: string;
  otherUserName: string;
  sessionDuration: number;
  sessionId: string;
  
  // Event handlers
  onToggleAudio: () => void;
  onToggleVideo: () => void;
  onEndCall: () => void;
  onReconnect: () => void;
  onSendMessage: (message: string) => void;
  
  // Messages
  messages: Message[];
  
  // Optional props
  notifications?: string[];
  onCopySessionLink?: () => void;
  onOpenSettings?: () => void;
}

export function ModernSessionUI({
  localVideoRef,
  remoteVideoRef,
  sessionState,
  connectionQuality,
  connectionStats,
  isAudioMuted,
  isVideoOff,
  isRemoteAudioMuted = false,
  isRemoteVideoOff = false,
  currentUserName,
  currentUserId,
  otherUserName,
  sessionDuration,
  sessionId,
  onToggleAudio,
  onToggleVideo,
  onEndCall,
  onReconnect,
  onSendMessage,
  messages,
  notifications = [],
  onCopySessionLink,
  onOpenSettings
}: ModernSessionUIProps) {
  // UI State
  const [showControls, setShowControls] = useState(true);
  const [showChat, setShowChat] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  
  // Refs
  const controlsTimeoutRef = useRef<NodeJS.Timeout>();

  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Auto-hide controls
  useEffect(() => {
    const resetControlsTimeout = () => {
      setShowControls(true);
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
      controlsTimeoutRef.current = setTimeout(() => {
        if (!showChat && !showStats) {
          setShowControls(false);
        }
      }, 4000);
    };

    const handleActivity = () => resetControlsTimeout();
    
    document.addEventListener('mousemove', handleActivity);
    document.addEventListener('keydown', handleActivity);
    document.addEventListener('click', handleActivity);
    
    resetControlsTimeout();

    return () => {
      document.removeEventListener('mousemove', handleActivity);
      document.removeEventListener('keydown', handleActivity);
      document.removeEventListener('click', handleActivity);
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, [showChat, showStats]);

  // Track unread messages
  useEffect(() => {
    if (!showChat && messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.userId !== currentUserId) {
        setUnreadMessages(prev => prev + 1);
      }
    }
  }, [messages, showChat]);

  // Reset unread count when chat is opened
  useEffect(() => {
    if (showChat) {
      setUnreadMessages(0);
    }
  }, [showChat]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return;
      }

      switch (event.code) {
        case 'Space':
          event.preventDefault();
          onToggleAudio();
          break;
        case 'KeyV':
          event.preventDefault();
          onToggleVideo();
          break;
        case 'KeyC':
          event.preventDefault();
          setShowChat(!showChat);
          break;
        case 'KeyF':
          event.preventDefault();
          toggleFullscreen();
          break;
        case 'Escape':
          if (document.fullscreenElement) {
            document.exitFullscreen();
          } else if (showChat) {
            setShowChat(false);
          } else if (showStats) {
            setShowStats(false);
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [showChat, showStats, onToggleAudio, onToggleVideo]);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  }, []);



  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getConnectionColor = (quality: string) => {
    switch (quality) {
      case 'excellent': return 'text-green-400';
      case 'good': return 'text-blue-400';
      case 'fair': return 'text-yellow-400';
      case 'poor': return 'text-orange-400';
      case 'failed': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getConnectionIcon = (quality: string) => {
    if (quality === 'failed') return <WifiOff className="w-4 h-4" />;
    return <Signal className="w-4 h-4" />;
  };

  const getStateMessage = (state: string) => {
    switch (state) {
      case 'initializing': return 'Setting up your session...';
      case 'connecting': return 'Connecting...';
      case 'connected': return 'Connected';
      case 'reconnecting': return 'Reconnecting...';
      case 'failed': return 'Connection failed';
      case 'ended': return 'Call ended';
      default: return 'Unknown state';
    }
  };

  return (
    <TooltipProvider>
      <div className="relative w-full h-screen bg-black overflow-hidden">
        {/* Main Video Area - Fixed, no shifting */}
        <div className="absolute inset-0">
          {/* Remote Video */}
          <div className="relative w-full h-full">
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
            
            {/* Remote user placeholder */}
            {(sessionState !== 'connected' || isRemoteVideoOff) && (
              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900">
                <div className="text-center text-white">
                  <div className="w-24 h-24 sm:w-32 sm:h-32 mx-auto mb-4 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                    {isRemoteVideoOff ? (
                      <VideoOff className="w-8 h-8 sm:w-12 sm:h-12" />
                    ) : (
                      <Users className="w-8 h-8 sm:w-12 sm:h-12" />
                    )}
                  </div>
                  <h2 className="text-lg sm:text-2xl font-semibold mb-2">{otherUserName}</h2>
                  <p className="text-white/80 text-sm sm:text-base">{getStateMessage(sessionState)}</p>
                  {sessionState === 'connecting' && (
                    <Loader2 className="w-5 h-5 sm:w-6 sm:h-6 animate-spin mx-auto mt-4" />
                  )}
                </div>
              </div>
            )}

            {/* Remote user audio indicator */}
            {isRemoteAudioMuted && sessionState === 'connected' && (
              <div className="absolute top-4 left-4">
                <div className="bg-red-500 rounded-full p-2">
                  <MicOff className="w-4 h-4 text-white" />
                </div>
              </div>
            )}
          </div>

          {/* Local Video (Picture-in-Picture) */}
          <div className={cn(
            "absolute rounded-lg overflow-hidden bg-gray-900 border-2 border-white/20 shadow-2xl",
            isMobile ? "bottom-20 right-4 w-32 h-40" : "top-4 right-4 w-64 h-48"
          )}>
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              muted
              className="w-full h-full object-cover"
            />
            {isVideoOff && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
                <VideoOff className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
              </div>
            )}
            {isAudioMuted && (
              <div className="absolute top-1 left-1 sm:top-2 sm:left-2">
                <div className="bg-red-500 rounded-full p-1">
                  <MicOff className="w-2 h-2 sm:w-3 sm:h-3 text-white" />
                </div>
              </div>
            )}
            
            {/* Local video label */}
            <div className="absolute bottom-1 left-1 right-1 bg-black/50 rounded text-white text-xs text-center py-1">
              You
            </div>
          </div>
        </div>

        {/* Zoom-Style Chat Panel */}
        <ZoomChatPanel
          messages={messages}
          onSendMessage={onSendMessage}
          currentUserId={currentUserId}
          currentUserName={currentUserName}
          isOpen={showChat}
          onClose={() => setShowChat(false)}
          isMobile={isMobile}
          participantCount={2}
        />

        {/* Top Bar */}
        <div className={cn(
          "absolute top-0 left-0 right-0 p-3 sm:p-4 transition-opacity duration-300 z-40",
          showControls ? "opacity-100" : "opacity-0 pointer-events-none"
        )}>
          <div className="flex items-center justify-between">
            {/* Left: Session Info */}
            <div className="flex items-center space-x-2 sm:space-x-4">
              <Badge variant="secondary" className="bg-black/50 text-white border-white/20">
                <Clock className="w-3 h-3 mr-1" />
                {formatDuration(sessionDuration)}
              </Badge>
              
              <div className={cn("flex items-center space-x-1", getConnectionColor(connectionQuality))}>
                {getConnectionIcon(connectionQuality)}
                <span className="text-xs sm:text-sm font-medium capitalize hidden sm:inline">
                  {connectionQuality}
                </span>
              </div>
            </div>

            {/* Right: Controls */}
            <div className="flex items-center space-x-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowStats(!showStats)}
                    className="text-white hover:bg-white/20"
                  >
                    <Info className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Connection info</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={toggleFullscreen}
                    className="text-white hover:bg-white/20"
                  >
                    {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
                </TooltipContent>
              </Tooltip>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-white hover:bg-white/20"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {onCopySessionLink && (
                    <DropdownMenuItem onClick={onCopySessionLink}>
                      <Copy className="w-4 h-4 mr-2" />
                      Copy session link
                    </DropdownMenuItem>
                  )}
                  {onOpenSettings && (
                    <DropdownMenuItem onClick={onOpenSettings}>
                      <Settings className="w-4 h-4 mr-2" />
                      Settings
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        {/* Connection Stats Panel */}
        {showStats && (
          <div className="absolute top-16 right-4 bg-black/90 backdrop-blur-sm rounded-lg p-4 text-white text-sm min-w-64 z-50">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold">Connection Stats</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowStats(false)}
                className="text-white hover:bg-white/20 h-6 w-6 p-0"
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Quality:</span>
                <span className={cn("capitalize", getConnectionColor(connectionQuality))}>
                  {connectionQuality}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Resolution:</span>
                <span>{connectionStats.resolution}</span>
              </div>
              <div className="flex justify-between">
                <span>Frame Rate:</span>
                <span>{connectionStats.frameRate} fps</span>
              </div>
              <div className="flex justify-between">
                <span>Latency:</span>
                <span>{connectionStats.latency} ms</span>
              </div>
              <div className="flex justify-between">
                <span>Packet Loss:</span>
                <span>{connectionStats.packetLoss.toFixed(1)}%</span>
              </div>
            </div>
          </div>
        )}

        {/* Notifications */}
        {notifications.length > 0 && (
          <div className="absolute top-20 left-1/2 transform -translate-x-1/2 space-y-2 z-50">
            {notifications.map((notification, index) => (
              <div
                key={index}
                className="bg-black/80 backdrop-blur-sm text-white px-4 py-2 rounded-lg shadow-lg max-w-sm text-center"
              >
                {notification}
              </div>
            ))}
          </div>
        )}

        {/* Bottom Controls */}
        <div className={cn(
          "absolute bottom-0 left-0 right-0 p-4 sm:p-6 transition-opacity duration-300 z-40",
          showControls ? "opacity-100" : "opacity-0 pointer-events-none"
        )}>
          <div className="flex items-center justify-center space-x-3 sm:space-x-4">
            {/* Audio Toggle */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={isAudioMuted ? "destructive" : "secondary"}
                  size={isMobile ? "default" : "lg"}
                  onClick={onToggleAudio}
                  className={cn(
                    "rounded-full bg-black/50 hover:bg-black/80 border border-white/20",
                    isMobile ? "w-12 h-12" : "w-14 h-14"
                  )}
                >
                  {isAudioMuted ? (
                    <MicOff className={cn(isMobile ? "w-5 h-5" : "w-6 h-6")} />
                  ) : (
                    <Mic className={cn(isMobile ? "w-5 h-5" : "w-6 h-6")} />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {isAudioMuted ? 'Unmute' : 'Mute'} (Space)
              </TooltipContent>
            </Tooltip>

            {/* Video Toggle */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={isVideoOff ? "destructive" : "secondary"}
                  size={isMobile ? "default" : "lg"}
                  onClick={onToggleVideo}
                  className={cn(
                    "rounded-full bg-black/50 hover:bg-black/80 border border-white/20",
                    isMobile ? "w-12 h-12" : "w-14 h-14"
                  )}
                >
                  {isVideoOff ? (
                    <VideoOff className={cn(isMobile ? "w-5 h-5" : "w-6 h-6")} />
                  ) : (
                    <Video className={cn(isMobile ? "w-5 h-5" : "w-6 h-6")} />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {isVideoOff ? 'Turn on camera' : 'Turn off camera'} (V)
              </TooltipContent>
            </Tooltip>

            {/* End Call */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="destructive"
                  size={isMobile ? "default" : "lg"}
                  onClick={onEndCall}
                  className={cn(
                    "rounded-full",
                    isMobile ? "w-12 h-12" : "w-14 h-14"
                  )}
                >
                  <PhoneOff className={cn(isMobile ? "w-5 h-5" : "w-6 h-6")} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>End call</TooltipContent>
            </Tooltip>

            {/* Chat Toggle */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="secondary"
                  size={isMobile ? "default" : "lg"}
                  onClick={() => setShowChat(!showChat)}
                  className={cn(
                    "rounded-full bg-black/50 hover:bg-black/80 border border-white/20 relative",
                    isMobile ? "w-12 h-12" : "w-14 h-14"
                  )}
                >
                  <MessageSquare className={cn(isMobile ? "w-5 h-5" : "w-6 h-6")} />
                  {unreadMessages > 0 && (
                    <Badge className="absolute -top-1 -right-1 w-5 h-5 p-0 flex items-center justify-center text-xs bg-red-500 animate-pulse">
                      {unreadMessages > 9 ? '9+' : unreadMessages}
                    </Badge>
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {showChat ? 'Hide chat' : 'Show chat'} (C)
                {unreadMessages > 0 && (
                  <div className="text-xs text-gray-300 mt-1">
                    {unreadMessages} unread
                  </div>
                )}
              </TooltipContent>
            </Tooltip>

            {/* Reconnect (only show when needed) */}
            {(sessionState === 'failed' || connectionQuality === 'failed') && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size={isMobile ? "default" : "lg"}
                    onClick={onReconnect}
                    className={cn(
                      "rounded-full bg-black/50 hover:bg-black/80 border border-white/20",
                      isMobile ? "w-12 h-12" : "w-14 h-14"
                    )}
                  >
                    <Loader2 className={cn(isMobile ? "w-5 h-5" : "w-6 h-6", "animate-spin")} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Reconnect</TooltipContent>
              </Tooltip>
            )}
          </div>

          {/* Connection Status */}
          {(connectionQuality === 'poor' || connectionQuality === 'failed') && (
            <div className="mt-4 flex items-center justify-center">
              <div className="bg-yellow-500/20 border border-yellow-500/50 rounded-lg px-4 py-2 flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 text-yellow-400" />
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
        {!isMobile && (
          <div className="absolute bottom-4 left-4 text-white/60 text-xs">
            <div>Space: Mute • V: Video • C: Chat • F: Fullscreen</div>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}