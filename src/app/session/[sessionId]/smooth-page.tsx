/**
 * New Smooth Session Page
 * Complete rewrite with Google Meet/Zoom-level experience
 */

"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { SmoothSessionUI } from '@/components/session/smooth-session-ui';
import { 
  SmoothSessionManager, 
  type SessionConfig, 
  type SessionCallbacks,
  type SessionState,
  type ConnectionQuality,
  type VideoService,
  type ConnectionStats
} from '@/lib/smooth-session-manager';
import { topicService } from '@/lib/supabase-services';

export default function SmoothSessionPage() {
  const { sessionId } = useParams();
  const { user, userProfile } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  // Session state
  const [sessionState, setSessionState] = useState<SessionState>('initializing');
  const [connectionQuality, setConnectionQuality] = useState<ConnectionQuality>('good');
  const [currentService, setCurrentService] = useState<VideoService>('webrtc');
  const [connectionStats, setConnectionStats] = useState<ConnectionStats>({
    bandwidth: 0,
    latency: 0,
    packetLoss: 0,
    quality: 'good',
    jitter: 0,
    resolution: 'unknown',
    frameRate: 0,
    audioLevel: 0
  });

  // UI state
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [notifications, setNotifications] = useState<string[]>([]);
  const [sessionDuration, setSessionDuration] = useState(0);
  const [otherUserName, setOtherUserName] = useState('Other User');
  const [topic, setTopic] = useState<any>(null);

  // Refs
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const sessionManagerRef = useRef<SmoothSessionManager | null>(null);
  const durationIntervalRef = useRef<NodeJS.Timeout>();

  // Session callbacks
  const sessionCallbacks: SessionCallbacks = {
    onStateChange: (state: SessionState) => {
      console.log('Session state changed:', state);
      setSessionState(state);
    },

    onQualityChange: (quality: ConnectionQuality, stats: ConnectionStats) => {
      setConnectionQuality(quality);
      setConnectionStats(stats);
    },

    onServiceChange: (service: VideoService, reason: string) => {
      setCurrentService(service);
      addNotification(`Switched to ${service}: ${reason}`);
    },

    onError: (error: string, recoverable: boolean) => {
      console.error('Session error:', error);
      toast({
        variant: 'destructive',
        title: 'Session Error',
        description: error
      });
      
      if (!recoverable) {
        setTimeout(() => {
          router.push('/dashboard');
        }, 3000);
      }
    },

    onNotification: (message: string, type: 'info' | 'warning' | 'error') => {
      addNotification(message);
      
      if (type === 'error') {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: message
        });
      } else if (type === 'warning') {
        toast({
          title: 'Warning',
          description: message
        });
      }
    },

    onRemoteStream: (stream: MediaStream) => {
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = stream;
      }
    },

    onLocalStream: (stream: MediaStream) => {
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
    }
  };

  // Add notification helper
  const addNotification = useCallback((message: string) => {
    setNotifications(prev => [...prev, message]);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
      setNotifications(prev => prev.slice(1));
    }, 5000);
  }, []);

  // Load session data
  useEffect(() => {
    if (!sessionId || !user?.uid) return;

    const loadSessionData = async () => {
      try {
        const topics = await topicService.getAllTopics();
        const currentTopic = topics.find((t) => t.id === sessionId);

        if (!currentTopic) {
          toast({
            variant: 'destructive',
            title: 'Session Not Found',
            description: 'This session may have been cancelled or does not exist.'
          });
          router.push('/dashboard');
          return;
        }

        // Check permissions
        const isAuthor = currentTopic.author_id === user.uid;
        const isParticipant = currentTopic.participants?.includes(user.uid) || false;
        
        if (!isAuthor && !isParticipant) {
          toast({
            variant: 'destructive',
            title: 'Access Denied',
            description: 'You don\'t have permission to join this session.'
          });
          router.push('/dashboard');
          return;
        }

        setTopic(currentTopic);

        // Find other user
        const allParticipants = [currentTopic.author_id, ...(currentTopic.participants || [])];
        const otherUserId = allParticipants.find(id => id !== user.uid);
        
        if (otherUserId) {
          // Get other user's name (simplified - you might want to fetch from users table)
          setOtherUserName(currentTopic.author.display_name || currentTopic.author.email || 'Other User');
        }

        // Initialize session manager
        const config: SessionConfig = {
          sessionId: sessionId as string,
          userId: user.uid,
          userName: userProfile?.display_name || user.email || 'You',
          otherUserId: otherUserId || '',
          otherUserName: otherUserName,
          preferredService: 'webrtc',
          fallbackServices: ['jitsi', 'google-meet'],
          maxRetries: 3
        };

        const manager = new SmoothSessionManager(config, sessionCallbacks);
        sessionManagerRef.current = manager;

        // Start the session
        await manager.initialize();

      } catch (error) {
        console.error('Error loading session:', error);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to load session data.'
        });
      }
    };

    loadSessionData();
  }, [sessionId, user?.uid, userProfile, router, toast]);

  // Session duration timer
  useEffect(() => {
    if (sessionState === 'connected') {
      durationIntervalRef.current = setInterval(() => {
        setSessionDuration(prev => prev + 1);
      }, 1000);
    } else {
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }
    }

    return () => {
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }
    };
  }, [sessionState]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return; // Don't trigger shortcuts when typing
      }

      switch (event.code) {
        case 'Space':
          event.preventDefault();
          handleToggleAudio();
          break;
        case 'KeyV':
          event.preventDefault();
          handleToggleVideo();
          break;
        case 'KeyF':
          event.preventDefault();
          if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
          } else {
            document.exitFullscreen();
          }
          break;
        case 'Escape':
          if (document.fullscreenElement) {
            document.exitFullscreen();
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, []);

  // Event handlers
  const handleToggleAudio = useCallback(() => {
    if (sessionManagerRef.current) {
      const newMutedState = sessionManagerRef.current.toggleAudio();
      setIsAudioMuted(newMutedState);
    }
  }, []);

  const handleToggleVideo = useCallback(() => {
    if (sessionManagerRef.current) {
      const newVideoOffState = sessionManagerRef.current.toggleVideo();
      setIsVideoOff(newVideoOffState);
    }
  }, []);

  const handleEndCall = useCallback(async () => {
    if (sessionManagerRef.current) {
      await sessionManagerRef.current.endSession();
    }
    router.push('/dashboard');
  }, [router]);

  const handleReconnect = useCallback(async () => {
    if (sessionManagerRef.current) {
      await sessionManagerRef.current.reconnect();
    }
  }, []);

  const handleOpenSettings = useCallback(() => {
    // TODO: Implement settings modal
    addNotification('Settings panel coming soon!');
  }, [addNotification]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (sessionManagerRef.current) {
        sessionManagerRef.current.endSession();
      }
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }
    };
  }, []);

  // Show loading state
  if (!topic || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black text-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>Loading session...</p>
        </div>
      </div>
    );
  }

  return (
    <SmoothSessionUI
      sessionState={sessionState}
      connectionQuality={connectionQuality}
      currentService={currentService}
      connectionStats={connectionStats}
      isAudioMuted={isAudioMuted}
      isVideoOff={isVideoOff}
      localVideoRef={localVideoRef}
      remoteVideoRef={remoteVideoRef}
      onToggleAudio={handleToggleAudio}
      onToggleVideo={handleToggleVideo}
      onEndCall={handleEndCall}
      onReconnect={handleReconnect}
      onOpenSettings={handleOpenSettings}
      notifications={notifications}
      otherUserName={otherUserName}
      sessionDuration={sessionDuration}
    />
  );
}