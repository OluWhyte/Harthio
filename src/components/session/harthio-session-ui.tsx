/**
 * Harthio Session UI - Brand-aligned video calling interface
 */

"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Mic, MicOff, Video, VideoOff, PhoneOff, Settings, 
  MessageSquare, Send, MoreVertical, Maximize2, Minimize2,
  Users, Clock, Signal, WifiOff, Copy, Info, AlertTriangle,
  Loader2, X, Monitor
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { SessionContainer } from '@/components/harthio/session-container';
import { ModernChatPanel } from '@/components/harthio/modern-chat-panel';
import { type Message as MessagePanelMessage } from '@/hooks/use-message-panel';
import { useScreenDimensions } from '@/hooks/use-screen-dimensions';

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

interface HarthioSessionUIProps {
  localVideoRef: React.RefObject<HTMLVideoElement>;
  remoteVideoRef: React.RefObject<HTMLVideoElement>;
  sessionState: 'initializing' | 'connecting' | 'connected' | 'reconnecting' | 'failed' | 'ended';
  connectionQuality: 'excellent' | 'good' | 'fair' | 'poor' | 'failed';
  connectionStats: ConnectionStats;
  isAudioMuted: boolean;
  isVideoOff: boolean;
  isRemoteAudioMuted?: boolean;
  isRemoteVideoOff?: boolean;
  currentUserName: string;
  otherUserName: string;
  sessionDuration: number;
  timeRemaining?: number | null;
  sessionId: string;
  onToggleAudio: () => void;
  onToggleVideo: () => void;
  onEndCall: () => void;
  onReconnect: () => void;
  onSendMessage: (message: string) => void;
  onSwitchToJitsi?: () => void;
  messages: Message[];
  notifications?: string[];
  onCopySessionLink?: () => void;
  onOpenSettings?: () => void;
}

export function HarthioSessionUI(props: HarthioSessionUIProps) {
  const {
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
    otherUserName,
    sessionDuration,
    timeRemaining,
    sessionId,
    onToggleAudio,
    onToggleVideo,
    onEndCall,
    onReconnect,
    onSendMessage,
    onSwitchToJitsi,
    messages,
    notifications = [],
    onCopySessionLink,
    onOpenSettings
  } = props;

  // UI State
  const [showControls, setShowControls] = useState(true);
  const [showChat, setShowChat] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [unreadMessages, setUnreadMessages] = useState(0);
  
  // Refs
  const controlsTimeoutRef = useRef<NodeJS.Timeout>();

  // Get screen dimensions for responsive sizing
  const screen = useScreenDimensions();

  // Convert session messages to MessagePanel format
  const convertedMessages: MessagePanelMessage[] = messages.map(msg => ({
    id: msg.id,
    content: msg.content,
    sender: msg.type === 'system' ? 'System' : msg.userName,
    timestamp: msg.timestamp,
    isOwn: msg.userId === 'current-user' && msg.type !== 'system'
  }));

  // Auto-hide controls - only on desktop
  useEffect(() => {
    // Don't auto-hide on mobile devices
    if (screen.deviceType === 'phone' || screen.deviceType === 'tablet') {
      setShowControls(true);
      return;
    }

    const resetTimeout = () => {
      setShowControls(true);
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
      controlsTimeoutRef.current = setTimeout(() => {
        if (!showChat && !showStats) setShowControls(false);
      }, 4000);
    };

    const handleActivity = () => resetTimeout();
    document.addEventListener('mousemove', handleActivity);
    document.addEventListener('keydown', handleActivity);
    document.addEventListener('touchstart', handleActivity);
    resetTimeout();

    return () => {
      document.removeEventListener('mousemove', handleActivity);
      document.removeEventListener('keydown', handleActivity);
      document.removeEventListener('touchstart', handleActivity);
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    };
  }, [showChat, showStats, screen.deviceType]);

  // Message handling
  useEffect(() => {
    if (!showChat && messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.userId !== 'current-user') {
        setUnreadMessages(prev => prev + 1);
      }
    }
  }, [messages, showChat]);

  useEffect(() => {
    if (showChat) setUnreadMessages(0);
  }, [showChat]);

  // Keyboard shortcuts - only on desktop
  useEffect(() => {
    if (screen.deviceType !== 'desktop') return;
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLInputElement) return;
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
      }
    };
    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [showChat, onToggleAudio, onToggleVideo, screen.deviceType]);



  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatTimeRemaining = (seconds: number) => {
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
      case 'excellent': return 'text-teal-400';
      case 'good': return 'text-teal-300';
      case 'fair': return 'text-yellow-400';
      case 'poor': return 'text-orange-400';
      case 'failed': return 'text-red-400';
      default: return 'text-gray-400';
    }
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
      <SessionContainer>
        {/* Main Video Area - Takes full container */}
        <div className="flex-1 relative w-full h-full">
          {/* Remote Video */}
          <div className="absolute inset-0 w-full h-full">
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
            
            {/* Remote user placeholder with brand colors */}
            {(sessionState !== 'connected' || isRemoteVideoOff) && (
              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-rose-900 via-rose-800 to-teal-900">
                <div className="text-center text-white">
                  <div className="w-24 h-24 sm:w-32 sm:h-32 mx-auto mb-4 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border-2 border-rose-400/30">
                    {isRemoteVideoOff ? (
                      <VideoOff className="w-8 h-8 sm:w-12 sm:h-12 text-rose-200" />
                    ) : (
                      <Users className="w-8 h-8 sm:w-12 sm:h-12 text-rose-200" />
                    )}
                  </div>
                  <h2 className="text-lg sm:text-2xl font-semibold mb-2 text-rose-100">{otherUserName}</h2>
                  <p className="text-rose-200/80 text-sm sm:text-base">{getStateMessage(sessionState)}</p>
                  {sessionState === 'connecting' && (
                    <Loader2 className="w-5 h-5 sm:w-6 sm:h-6 animate-spin mx-auto mt-4 text-rose-300" />
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
          <div 
            className={cn(
              "absolute rounded-lg overflow-hidden bg-gray-900 border-2 border-rose-400/30 shadow-2xl transition-all duration-300",
              screen.deviceType === 'phone' ? "bottom-20 right-4 w-32 h-40" : "top-4 right-4 w-64 h-48"
            )}
          >
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
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

        {/* Modern Chat Panel */}
        <ModernChatPanel
          isOpen={showChat}
          onToggle={() => setShowChat(!showChat)}
          messages={convertedMessages}
          onSendMessage={onSendMessage}
          otherUserName={otherUserName}
          otherUserInitials={otherUserName.split(' ').map(n => n[0]).join('').toUpperCase()}
        />

        {/* Top Bar */}
        <div className={cn(
          "absolute top-0 left-0 right-0 p-4 transition-all duration-300 z-40",
          showControls ? "opacity-100" : "opacity-0 pointer-events-none"
        )}>
          <div className="flex items-center justify-between">
            {/* Left: Session Info */}
            <div className="flex items-center space-x-4">
              <Badge variant="secondary" className="bg-black/50 text-white border-rose-400/30">
                <Clock className="w-3 h-3 mr-1" />
                {timeRemaining !== null && timeRemaining !== undefined ? (
                  <span className={timeRemaining < 300 ? 'text-red-300' : ''}>
                    {formatTimeRemaining(timeRemaining)} left
                  </span>
                ) : (
                  formatDuration(sessionDuration)
                )}
              </Badge>
              
              <div className={cn("flex items-center space-x-1", getConnectionColor(connectionQuality))}>
                <Signal className="w-4 h-4" />
                <span className="text-sm font-medium capitalize hidden sm:inline">
                  {connectionQuality}
                </span>
              </div>
            </div>

            {/* Right: Controls */}
            <div className="flex items-center space-x-2">
              {connectionQuality === 'failed' && onSwitchToJitsi && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={onSwitchToJitsi}
                      className="text-white hover:bg-white/20 bg-teal-600/80"
                    >
                      <Monitor className="w-4 h-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Switch to Jitsi</TooltipContent>
                </Tooltip>
              )}

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
            </div>
          </div>
        )}

        {/* Notifications */}
        {notifications.length > 0 && (
          <div className="absolute top-20 left-1/2 transform -translate-x-1/2 space-y-2 z-50">
            {notifications.slice(-2).map((notification, index) => (
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
        <div 
          className={cn(
            "absolute left-0 right-0 transition-all duration-300 z-40 session-controls",
            showControls ? "opacity-100" : "opacity-0 pointer-events-none"
          )}
          style={{ 
            // Position above browser UI - calculate safe area based on screen height
            bottom: screen.deviceType === 'phone' ? 
              `${Math.max(80, screen.height * 0.12)}px` : // 12% of screen height or 80px minimum
              screen.deviceType === 'tablet' ? 
                `${Math.max(60, screen.height * 0.08)}px` : // 8% of screen height or 60px minimum
                '0px', // Desktop - no browser UI at bottom
            padding: `${screen.padding}px`,
            paddingBottom: `${Math.max(screen.padding, 20)}px`
          }}
        >
          <div 
            className="flex items-center justify-center"
            style={{ gap: `${screen.spacing}px` }}
          >
            {/* Audio Toggle */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={isAudioMuted ? "destructive" : "secondary"}
                  onClick={onToggleAudio}
                  className={cn(
                    "rounded-full border border-rose-400/30 touch-manipulation flex items-center justify-center",
                    isAudioMuted 
                      ? "bg-red-500 hover:bg-red-600" 
                      : "bg-black/50 hover:bg-black/80 text-white"
                  )}
                  style={{
                    width: `${screen.buttonSize}px`,
                    height: `${screen.buttonSize}px`,
                    minWidth: `${screen.buttonSize}px`,
                    minHeight: `${screen.buttonSize}px`
                  }}
                >
                  {isAudioMuted ? (
                    <MicOff style={{ width: `${screen.iconSize}px`, height: `${screen.iconSize}px` }} />
                  ) : (
                    <Mic style={{ width: `${screen.iconSize}px`, height: `${screen.iconSize}px` }} />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {isAudioMuted ? 'Unmute' : 'Mute'}
              </TooltipContent>
            </Tooltip>

            {/* Video Toggle */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={isVideoOff ? "destructive" : "secondary"}
                  onClick={onToggleVideo}
                  className={cn(
                    "rounded-full border border-rose-400/30 touch-manipulation flex items-center justify-center",
                    isVideoOff 
                      ? "bg-red-500 hover:bg-red-600" 
                      : "bg-black/50 hover:bg-black/80 text-white"
                  )}
                  style={{
                    width: `${screen.buttonSize}px`,
                    height: `${screen.buttonSize}px`,
                    minWidth: `${screen.buttonSize}px`,
                    minHeight: `${screen.buttonSize}px`
                  }}
                >
                  {isVideoOff ? (
                    <VideoOff style={{ width: `${screen.iconSize}px`, height: `${screen.iconSize}px` }} />
                  ) : (
                    <Video style={{ width: `${screen.iconSize}px`, height: `${screen.iconSize}px` }} />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {isVideoOff ? 'Turn on camera' : 'Turn off camera'}
              </TooltipContent>
            </Tooltip>

            {/* End Call */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="destructive"
                  onClick={onEndCall}
                  className="rounded-full bg-red-500 hover:bg-red-600 touch-manipulation flex items-center justify-center"
                  style={{
                    width: `${Math.max(screen.buttonSize, 56)}px`, // Ensure minimum size for safety
                    height: `${Math.max(screen.buttonSize, 56)}px`,
                    minWidth: `${Math.max(screen.buttonSize, 56)}px`,
                    minHeight: `${Math.max(screen.buttonSize, 56)}px`
                  }}
                >
                  <PhoneOff style={{ width: `${screen.iconSize}px`, height: `${screen.iconSize}px` }} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>End call</TooltipContent>
            </Tooltip>

            {/* Chat Toggle */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="secondary"
                  onClick={() => setShowChat(!showChat)}
                  className={cn(
                    "rounded-full border border-rose-400/30 relative text-white transition-all duration-200 touch-manipulation flex items-center justify-center",
                    showChat 
                      ? "bg-gradient-to-r from-rose-500 to-teal-500 hover:from-rose-600 hover:to-teal-600" 
                      : "bg-black/50 hover:bg-black/80"
                  )}
                  style={{
                    width: `${screen.buttonSize}px`,
                    height: `${screen.buttonSize}px`,
                    minWidth: `${screen.buttonSize}px`,
                    minHeight: `${screen.buttonSize}px`
                  }}
                >
                  <MessageSquare style={{ width: `${screen.iconSize}px`, height: `${screen.iconSize}px` }} />
                  {unreadMessages > 0 && (
                    <Badge className="absolute -top-1 -right-1 w-5 h-5 p-0 flex items-center justify-center text-xs bg-rose-500">
                      {unreadMessages > 9 ? '9+' : unreadMessages}
                    </Badge>
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {showChat ? 'Hide chat' : 'Show chat'}
              </TooltipContent>
            </Tooltip>

            {/* Reconnect */}
            {(sessionState === 'failed' || connectionQuality === 'failed') && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    onClick={onReconnect}
                    className="rounded-full bg-black/50 hover:bg-black/80 border border-rose-400/30 text-white touch-manipulation flex items-center justify-center"
                    style={{
                      width: `${screen.buttonSize}px`,
                      height: `${screen.buttonSize}px`,
                      minWidth: `${screen.buttonSize}px`,
                      minHeight: `${screen.buttonSize}px`
                    }}
                  >
                    <Loader2 
                      className="animate-spin"
                      style={{ width: `${screen.iconSize}px`, height: `${screen.iconSize}px` }}
                    />
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
        {screen.deviceType === 'desktop' && (
          <div className="absolute bottom-4 left-4 text-white/60 text-xs">
            <div>Space: Mute • V: Video • C: Chat</div>
          </div>
        )}
      </SessionContainer>
    </TooltipProvider>
  );
}