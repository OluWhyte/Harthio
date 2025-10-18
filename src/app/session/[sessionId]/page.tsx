/**
 * Modern Session Page
 * Google Meet inspired video calling experience with messaging
 */

"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { HarthioSessionUI } from '@/components/session/harthio-session-ui';
import { 
  FixedWebRTCManager,
  type ConnectionState,
  type ConnectionQuality,
  type ConnectionStats,
  type Message,
  type WebRTCCallbacks
} from '@/lib/fixed-webrtc-manager';
import { JitsiService, type JitsiConfig, type JitsiCallbacks } from '@/lib/jitsi-service';
import { MessagingService, createMessagingService, type MessageCallback } from '@/lib/messaging-service';
import { topicService } from '@/lib/supabase-services';

export default function HarthioSessionPage() {
  const { sessionId } = useParams();
  const { user, userProfile } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  // Session state
  const [sessionState, setSessionState] = useState<ConnectionState>('initializing');
  const [connectionQuality, setConnectionQuality] = useState<ConnectionQuality>('good');
  const [connectionStats, setConnectionStats] = useState<ConnectionStats>({
    bandwidth: 0,
    latency: 0,
    packetLoss: 0,
    quality: 'good',
    resolution: 'unknown',
    frameRate: 0
  });

  // Audio/Video state
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isRemoteAudioMuted, setIsRemoteAudioMuted] = useState(false);
  const [isRemoteVideoOff, setIsRemoteVideoOff] = useState(false);

  // UI state
  const [notifications, setNotifications] = useState<string[]>([]);
  const [sessionDuration, setSessionDuration] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  
  // User info
  const [otherUserName, setOtherUserName] = useState('Other User');
  const [otherUserId, setOtherUserId] = useState('');
  const [topic, setTopic] = useState<any>(null);

  // Connection mode - Jitsi as primary
  const [connectionMode, setConnectionMode] = useState<'webrtc' | 'jitsi'>('jitsi');
  const [isJitsiReady, setIsJitsiReady] = useState(false);

  // Refs
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const webrtcManagerRef = useRef<FixedWebRTCManager | null>(null);
  const jitsiServiceRef = useRef<JitsiService | null>(null);
  const messagingServiceRef = useRef<MessagingService | null>(null);
  const durationIntervalRef = useRef<NodeJS.Timeout>();
  const countdownIntervalRef = useRef<NodeJS.Timeout>();

  // WebRTC callbacks
  const webrtcCallbacks: WebRTCCallbacks = {
    onStateChange: (state: ConnectionState) => {
      setSessionState(state);
      
      // Add system message for state changes
      if (state === 'connected') {
        addSystemMessage('Connected to the call');
      } else if (state === 'reconnecting') {
        addSystemMessage('Reconnecting...');
      } else if (state === 'failed') {
        addSystemMessage('Connection failed - you can switch to Jitsi Meet');
      }
    },

    onQualityChange: (quality: ConnectionQuality, stats: ConnectionStats) => {
      setConnectionQuality(quality);
      setConnectionStats(stats);
    },

    onLocalStream: (stream: MediaStream) => {
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
    },

    onRemoteStream: (stream: MediaStream) => {
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = stream;
      }
    },

    onMessage: (message: Message) => {
      setMessages(prev => [...prev, message]);
    },

    onError: (error: string) => {
      // Only show user-friendly errors
      if (error.includes('Camera/microphone')) {
        addNotification(error);
        toast({
          variant: 'destructive',
          title: 'Media Access Error',
          description: error
        });
      }
      // Don't show technical signaling errors to users
    },

    onRemoteAudioToggle: (muted: boolean) => {
      setIsRemoteAudioMuted(muted);
      addSystemMessage(`${otherUserName} ${muted ? 'muted' : 'unmuted'} their microphone`);
    },

    onRemoteVideoToggle: (enabled: boolean) => {
      setIsRemoteVideoOff(!enabled);
      addSystemMessage(`${otherUserName} turned ${enabled ? 'on' : 'off'} their camera`);
    }
  };

  // Independent messaging service callbacks
  const messagingCallbacks: MessageCallback = {
    onMessage: (message) => {
      setMessages(prev => [...prev, message]);
    },
    onUserTyping: (userId, isTyping) => {
      // Handle typing indicators if needed
    },
    onError: (error) => {
      addNotification(error);
    }
  };

  // Helper functions
  const addNotification = useCallback((message: string) => {
    setNotifications(prev => [...prev, message]);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
      setNotifications(prev => prev.slice(1));
    }, 5000);
  }, []);

  const addSystemMessage = useCallback((content: string) => {
    const systemMessage: Message = {
      id: Date.now().toString(),
      userId: 'system',
      userName: 'System',
      content,
      timestamp: new Date(),
      type: 'system'
    };
    setMessages(prev => [...prev, systemMessage]);
  }, []);

  // Load session data and initialize
  useEffect(() => {
    if (!sessionId || !user?.uid) return;
    
    let isComponentMounted = true;

    const loadSessionData = async () => {
      try {
        const topics = await topicService.getAllTopics();
        const currentTopic = topics.find((t) => t.id === sessionId);

        if (!isComponentMounted) return;

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
        const foundOtherUserId = allParticipants.find(id => id !== user.uid);
        
        if (foundOtherUserId) {
          setOtherUserId(foundOtherUserId);
          // Get other user's name from topic data
          const otherUserDisplayName = currentTopic.author_id === foundOtherUserId 
            ? (currentTopic.author?.display_name || currentTopic.author?.email || 'Other User')
            : 'Participant';
          setOtherUserName(otherUserDisplayName);
        }

        // Initialize independent messaging service (works regardless of video connection)
        if (isComponentMounted && !messagingServiceRef.current) {
          const messagingService = createMessagingService(
            sessionId as string,
            user.uid,
            userProfile?.display_name || 'You',
            messagingCallbacks
          );
          
          messagingServiceRef.current = messagingService;
          
          // Send initial system message
          setTimeout(() => {
            messagingService.sendSystemMessage(`${userProfile?.display_name || 'User'} joined the session`);
          }, 1000);
        }

        // Initialize Jitsi as primary connection method
        if (isComponentMounted && connectionMode === 'jitsi' && !jitsiServiceRef.current) {
          // Initialize Jitsi first
          const jitsiConfig: JitsiConfig = {
            roomName: `harthio-${sessionId}`,
            displayName: userProfile?.display_name || 'You',
            email: user.email || undefined,
          };

          const jitsiCallbacks: JitsiCallbacks = {
            onReady: () => {
              setIsJitsiReady(true);
              // Ready silently - no notification needed
            },
            onJoined: () => {
              setSessionState('connected');
              addSystemMessage('Connected via Jitsi Meet');
            },
            onLeft: () => {
              setSessionState('ended');
              router.push('/dashboard');
            },
            onError: (error) => {
              console.error('Jitsi error:', error);
              // Silent fallback to WebRTC - no user notification
              setConnectionMode('webrtc');
            },
            onMessage: (message) => {
              const chatMessage: Message = {
                id: Date.now().toString(),
                userId: message.from === (userProfile?.display_name || 'You') ? 'current-user' : 'other-user',
                userName: message.from,
                content: message.message,
                timestamp: new Date(),
                type: 'text'
              };
              setMessages(prev => [...prev, chatMessage]);
            }
          };

          const jitsiService = new JitsiService(jitsiConfig, jitsiCallbacks);
          jitsiServiceRef.current = jitsiService;

          try {
            await jitsiService.initialize('jitsi-container');
            addSystemMessage(`Joined session: ${currentTopic.title}`);
          } catch (error) {
            // Silent fallback to WebRTC
            setConnectionMode('webrtc');
          }
        }

        // Initialize WebRTC as fallback or when explicitly set
        if (isComponentMounted && connectionMode === 'webrtc' && !webrtcManagerRef.current) {
          const manager = new FixedWebRTCManager(
            sessionId as string,
            user.uid,
            userProfile?.display_name || 'You',
            foundOtherUserId || '',
            webrtcCallbacks
          );

          webrtcManagerRef.current = manager;

          try {
            await manager.initialize();
            addSystemMessage(`Joined session: ${currentTopic.title}`);
          } catch (error) {
            // Silent failure - connection will retry automatically
          }
        }

      } catch (error) {
        if (isComponentMounted) {
          toast({
            variant: 'destructive',
            title: 'Error',
            description: 'Failed to load session data.'
          });
        }
      }
    };

    loadSessionData();

    return () => {
      isComponentMounted = false;
    };
  }, [sessionId, user?.uid]); // Removed dependencies that cause re-runs

  // Session countdown timer - counts down to session end and redirects
  useEffect(() => {
    if (!topic) return;

    const updateCountdown = () => {
      const now = new Date().getTime();
      const endTime = new Date(topic.end_time).getTime();
      const remaining = Math.max(0, Math.floor((endTime - now) / 1000));
      
      setTimeRemaining(remaining);
      
      // Auto-redirect when session ends
      if (remaining === 0) {
        toast({
          title: 'Session Ended',
          description: 'The scheduled session time has ended.',
        });
        router.push('/dashboard');
      }
    };

    // Update immediately
    updateCountdown();
    
    // Update every second
    countdownIntervalRef.current = setInterval(updateCountdown, 1000);

    return () => {
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
    };
  }, [topic, router, toast]);

  // Session duration timer (for connected time)
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

  // Event handlers
  const handleToggleAudio = useCallback(() => {
    if (connectionMode === 'webrtc' && webrtcManagerRef.current) {
      const newMutedState = webrtcManagerRef.current.toggleAudio();
      setIsAudioMuted(newMutedState);
    } else if (connectionMode === 'jitsi' && jitsiServiceRef.current) {
      jitsiServiceRef.current.toggleAudio();
      setIsAudioMuted(!isAudioMuted);
    }
  }, [connectionMode, isAudioMuted]);

  const handleToggleVideo = useCallback(() => {
    if (connectionMode === 'webrtc' && webrtcManagerRef.current) {
      const newVideoOffState = webrtcManagerRef.current.toggleVideo();
      setIsVideoOff(newVideoOffState);
    } else if (connectionMode === 'jitsi' && jitsiServiceRef.current) {
      jitsiServiceRef.current.toggleVideo();
      setIsVideoOff(!isVideoOff);
    }
  }, [connectionMode, isVideoOff]);

  const handleEndCall = useCallback(async () => {
    if (connectionMode === 'webrtc' && webrtcManagerRef.current) {
      await webrtcManagerRef.current.endCall();
    } else if (connectionMode === 'jitsi' && jitsiServiceRef.current) {
      jitsiServiceRef.current.hangup();
    }
    router.push('/dashboard');
  }, [connectionMode, router]);

  const handleReconnect = useCallback(async () => {
    if (connectionMode === 'webrtc' && webrtcManagerRef.current) {
      await webrtcManagerRef.current.reconnect();
    }
    // Jitsi handles reconnection automatically
  }, [connectionMode]);

  const handleSendMessage = useCallback(async (message: string) => {
    // Use independent messaging service (works regardless of video connection status)
    if (messagingServiceRef.current) {
      try {
        await messagingServiceRef.current.sendMessage(message);
      } catch (error) {
        console.error('Failed to send message via messaging service:', error);
        addNotification('Failed to send message');
      }
    } else {
      // Fallback to video connection messaging if messaging service isn't available
      if (connectionMode === 'webrtc' && webrtcManagerRef.current) {
        webrtcManagerRef.current.sendMessage(message);
      } else if (connectionMode === 'jitsi' && jitsiServiceRef.current) {
        jitsiServiceRef.current.sendMessage(message);
      }
    }
  }, [connectionMode, addNotification]);

  const handleCopySessionLink = useCallback(() => {
    const link = `${window.location.origin}/session/${sessionId}`;
    navigator.clipboard.writeText(link).then(() => {
      addNotification('Session link copied to clipboard');
    }).catch(() => {
      addNotification('Failed to copy session link');
    });
  }, [sessionId, addNotification]);

  const handleSwitchToJitsi = useCallback(async () => {
    try {
      // Clean up WebRTC
      if (webrtcManagerRef.current) {
        await webrtcManagerRef.current.endCall();
        webrtcManagerRef.current = null;
      }

      setConnectionMode('jitsi');
      // Silent switch - no user notification needed

      // Initialize Jitsi
      const jitsiConfig: JitsiConfig = {
        roomName: `harthio-${sessionId}`,
        displayName: userProfile?.display_name || 'You',
        email: user?.email || undefined,
      };

      const jitsiCallbacks: JitsiCallbacks = {
        onReady: () => {
          setIsJitsiReady(true);
          // Ready silently - no notification needed
        },
        onJoined: () => {
          setSessionState('connected');
          addSystemMessage('Connected via Jitsi Meet');
        },
        onLeft: () => {
          setSessionState('ended');
          router.push('/dashboard');
        },
        onError: (error) => {
          console.error('Jitsi error:', error);
          // Silent error handling
        },
        onMessage: (message) => {
          const chatMessage: Message = {
            id: Date.now().toString(),
            userId: message.from === userProfile?.display_name ? 'current-user' : 'other-user',
            userName: message.from,
            content: message.message,
            timestamp: new Date(),
            type: 'text'
          };
          setMessages(prev => [...prev, chatMessage]);
        }
      };

      const jitsiService = new JitsiService(jitsiConfig, jitsiCallbacks);
      jitsiServiceRef.current = jitsiService;

      // Initialize Jitsi in a container
      await jitsiService.initialize('jitsi-container');

    } catch (error) {
      console.error('Failed to switch to Jitsi:', error);
      // Silent failure - will retry automatically
    }
  }, [sessionId, userProfile, user, router, addNotification, addSystemMessage]);

  const handleOpenSettings = useCallback(() => {
    addNotification('Settings panel coming soon!');
  }, [addNotification]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (webrtcManagerRef.current) {
        webrtcManagerRef.current.endCall();
      }
      if (jitsiServiceRef.current) {
        jitsiServiceRef.current.dispose();
      }
      if (messagingServiceRef.current) {
        messagingServiceRef.current.cleanup();
      }
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
    };
  }, []);

  // Add loading timeout
  useEffect(() => {
    const loadingTimeout = setTimeout(() => {
      if (!topic && user) {
        toast({
          variant: 'destructive',
          title: 'Loading Timeout',
          description: 'Session is taking too long to load. Please try again.'
        });
        router.push('/dashboard');
      }
    }, 10000); // 10 second timeout

    return () => clearTimeout(loadingTimeout);
  }, [topic, user, router, toast]);

  // Show loading state
  if (!topic || !user) {
    return (
      <div className="fixed inset-0 w-full h-full flex items-center justify-center bg-black text-white overflow-hidden box-border" style={{ width: '100vw', height: '100vh', maxWidth: '100vw', maxHeight: '100vh', margin: 0, padding: 0 }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-400 mx-auto mb-4"></div>
          <p className="text-rose-200">Loading session...</p>
          <p className="text-rose-300/60 text-sm mt-2">This may take a few moments</p>
        </div>
      </div>
    );
  }

  // Render Jitsi container when in Jitsi mode
  if (connectionMode === 'jitsi') {
    return (
      <div className="fixed inset-0 w-full h-full bg-black overflow-hidden box-border" style={{ width: '100vw', height: '100vh', maxWidth: '100vw', maxHeight: '100vh', margin: 0, padding: 0 }}>
        <div id="jitsi-container" className="w-full h-full" />
        {/* Overlay for notifications */}
        {notifications.length > 0 && (
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 space-y-2 z-50">
            {notifications.slice(-2).map((notification, index) => (
              <div
                key={index}
                className="bg-black/80 backdrop-blur-sm text-white px-4 py-2 rounded-lg shadow-lg"
              >
                {notification}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <HarthioSessionUI
      localVideoRef={localVideoRef}
      remoteVideoRef={remoteVideoRef}
      sessionState={sessionState}
      connectionQuality={connectionQuality}
      connectionStats={connectionStats}
      isAudioMuted={isAudioMuted}
      isVideoOff={isVideoOff}
      isRemoteAudioMuted={isRemoteAudioMuted}
      isRemoteVideoOff={isRemoteVideoOff}
      currentUserName={userProfile?.display_name || 'You'}
      otherUserName={otherUserName}
      sessionDuration={sessionDuration}
      timeRemaining={timeRemaining}
      sessionId={sessionId as string}
      onToggleAudio={handleToggleAudio}
      onToggleVideo={handleToggleVideo}
      onEndCall={handleEndCall}
      onReconnect={handleReconnect}
      onSendMessage={handleSendMessage}
      onSwitchToJitsi={handleSwitchToJitsi}
      messages={messages}
      notifications={notifications}
      onCopySessionLink={handleCopySessionLink}
      onOpenSettings={handleOpenSettings}
    />
  );
}