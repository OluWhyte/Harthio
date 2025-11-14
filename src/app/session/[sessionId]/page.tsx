/**
 * Modern Session Page with Daily.co + P2P WebRTC Fallback
 * Google Meet inspired video calling experience with messaging
 */

"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useCachedProfile } from "@/hooks/use-cached-profile";
import { HarthioSessionUI } from "@/components/session/harthio-session-ui";
import {
  VideoServiceManager,
  type VideoServiceType,
  type VideoConnectionState,
  type VideoConnectionQuality,
  type VideoConnectionStats,
  type VideoMessage,
  type VideoServiceCallbacks,
  type VideoServiceConfig,
} from "@/lib/video-service-manager";
import {
  MessagingService,
  createMessagingService,
  type MessageCallback,
  type Message as MessagingMessage,
} from "@/lib/messaging-service";
import { topicService, messageService } from "@/lib/supabase-services";
import { supabase } from "@/lib/supabase";
import { MobileConnectionHelper } from "@/lib/mobile-connection-helper";
import { VideoLayoutManager } from "@/lib/video-layout-manager";
import { DeviceVideoMetadata } from "@/lib/device-orientation-service";
import { SessionErrorBoundary } from "@/components/common/session-error-boundary";
import { SessionSetupModal } from "@/components/session/session-setup-modal";

// Local Message type for UI compatibility
interface Message {
  id: string;
  userId: string;
  userName: string;
  content: string;
  timestamp: Date;
  type: 'text' | 'system' | 'device-metadata';
  sessionId?: string;
  metadata?: any;
}

function HarthioSessionPageContent() {
  const { sessionId } = useParams();
  const { user, userProfile } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  // Session state
  const [sessionState, setSessionState] =
    useState<VideoConnectionState>("initializing");
  const [connectionQuality, setConnectionQuality] =
    useState<VideoConnectionQuality>("good");
  const [connectionStats, setConnectionStats] = useState<VideoConnectionStats>({
    bandwidth: 0,
    latency: 0,
    packetLoss: 0,
    quality: "good",
    resolution: "unknown",
    frameRate: 0,
  });
  const [currentVideoService, setCurrentVideoService] =
    useState<VideoServiceType>("none");

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
  const [showSetupModal, setShowSetupModal] = useState(true); // Show setup modal on load
  const [sessionReady, setSessionReady] = useState(false); // Track if session is ready

  // User info
  const [otherUserName, setOtherUserName] = useState("Other User");
  const [otherUserId, setOtherUserId] = useState("");
  const [topic, setTopic] = useState<any>(null);

  // Refs
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const localContainerRef = useRef<HTMLDivElement>(null);
  const remoteContainerRef = useRef<HTMLDivElement>(null);
  const videoServiceManagerRef = useRef<VideoServiceManager | null>(null);
  const messagingServiceRef = useRef<MessagingService | null>(null);
  const videoLayoutManagerRef = useRef<VideoLayoutManager | null>(null);
  const durationIntervalRef = useRef<NodeJS.Timeout>();
  const countdownIntervalRef = useRef<NodeJS.Timeout>();

  // Video service callbacks
  const videoServiceCallbacks: VideoServiceCallbacks = {
    onStateChange: (state: VideoConnectionState) => {
      setSessionState(state);

      // User-friendly state messages with proper connection feedback
      if (state === "connected") {
        console.log('🎉 P2P connection established successfully!');
        addSystemMessage(`Connected to ${otherUserName}`, false);
      } else if (state === "connecting") {
        addSystemMessage("Connecting...", false);
      } else if (state === "reconnecting") {
        addSystemMessage("Reconnecting...", true);
      } else if (state === "failed") {
        addSystemMessage("Video connection failed. Chat is still working.", true);
      }
    },



    onLocalStream: (stream: MediaStream) => {
      console.log('📹 Local stream received:', {
        tracks: stream.getTracks().length,
        videoTracks: stream.getVideoTracks().length,
        audioTracks: stream.getAudioTracks().length,
        streamId: stream.id
      });
      
      if (localVideoRef.current) {
        // Check if this is a different stream to avoid unnecessary reloads
        const currentStream = localVideoRef.current.srcObject as MediaStream;
        if (currentStream && currentStream.id === stream.id) {
          console.log('📺 Same local stream, skipping reload');
          return;
        }
        
        localVideoRef.current.srcObject = stream;
        console.log('📺 Set local video source');
      }
    },

    onRemoteStream: (stream: MediaStream) => {
      console.log('🎥 Remote stream received:', {
        tracks: stream.getTracks().length,
        videoTracks: stream.getVideoTracks().length,
        audioTracks: stream.getAudioTracks().length,
        streamId: stream.id
      });
      
      if (remoteVideoRef.current) {
        // Check if this is a different stream OR if tracks changed
        const currentStream = remoteVideoRef.current.srcObject as MediaStream;
        const currentVideoTracks = currentStream?.getVideoTracks().length || 0;
        const newVideoTracks = stream.getVideoTracks().length;
        
        if (currentStream && currentStream.id === stream.id && currentVideoTracks === newVideoTracks) {
          console.log('📺 Same remote stream with same tracks, skipping reload');
          return;
        }
        
        if (currentStream && currentStream.id === stream.id && newVideoTracks > currentVideoTracks) {
          console.log('📺 Video track added to existing stream, updating...');
        }
        
        // Pause current video before setting new stream
        if (currentStream) {
          remoteVideoRef.current.pause();
        }
        
        remoteVideoRef.current.srcObject = stream;
        console.log('📺 Set remote video source');
        
        // Small delay before playing to ensure stream is ready
        setTimeout(() => {
          if (remoteVideoRef.current) {
            remoteVideoRef.current.play().then(() => {
              console.log('✅ Remote video playing successfully');
            }).catch(error => {
              console.error('❌ Failed to play remote video:', error);
            });
          }
        }, 100);
      } else {
        console.error('❌ Remote video ref not available');
      }
    },

    onMessage: (message: VideoMessage) => {
      // Convert VideoMessage to Message
      const convertedMessage: Message = {
        id: message.id,
        userId: message.userId,
        userName: message.userName,
        content: message.content,
        timestamp: new Date(message.timestamp),
        type: message.type,
        sessionId: sessionId as string,
        metadata: {}
      };
      setMessages((prev) => [...prev, convertedMessage]);
    },

    onConnectionStats: (stats: VideoConnectionStats) => {
      setConnectionStats(stats);
    },

    onError: (error: string, isRecoverable?: boolean) => {
      // Only show user-friendly errors
      if (
        error.includes("Camera/microphone") ||
        error.includes("access denied")
      ) {
        addNotification(error);
        toast({
          variant: "destructive",
          title: "Media Access Error",
          description: error,
        });
      } else if (error.includes("Video calling unavailable")) {
        addNotification("Video unavailable. Chat is still working.");
        toast({
          title: "Video Unavailable",
          description: "You can still communicate via chat.",
        });
      } else if (error.includes("Connection failed")) {
        if (isRecoverable) {
          addNotification("Reconnecting...");
        } else {
          addNotification("Connection failed. Chat is still available.");
          toast({
            title: "Connection Issue",
            description: "Having trouble with video? Chat is still working.",
          });
        }
      } else if (error.includes("Mobile networks") || error.includes("HTTPS")) {
        // Show mobile-specific guidance
        const connectionInfo = MobileConnectionHelper.detectMobileConnection();
        const guidance = MobileConnectionHelper.showMobileGuidance(connectionInfo);

        addNotification("Connection issues detected");
        toast({
          title: "Connection Help",
          description: "Try switching between WiFi and mobile data for better video quality.",
        });

        // Add guidance messages (filtered)
        guidance.slice(0, 2).forEach((message) => addSystemMessage(message, true));
      }
      // All other errors are handled silently with graceful fallback
    },








  };

  // Independent messaging service callbacks
  const messagingCallbacks: MessageCallback = {
    onMessage: (message: MessagingMessage) => {
      const convertedMessage: Message = {
        id: message.id,
        userId: message.userId,
        userName: message.userName,
        content: message.content,
        timestamp: message.timestamp,
        type: message.type as 'text' | 'system' | 'device-metadata',
        sessionId: message.sessionId,
        metadata: message.metadata
      };
      setMessages((prev) => [...prev, convertedMessage]);

      // Save message to database if it's a text message from a real user
      if (message.type === "text" && message.userId !== "system" && user?.uid) {
        // Map video message to database message format
        const dbMessage = {
          topic_id: sessionId as string,
          sender_id: message.userId, // This should be the actual user ID
          text: message.content,
        };

        // Save to database (fire and forget)
        messageService.sendMessage(dbMessage).catch((error) => {
          console.warn("Failed to save message to database:", error);
        });
      }
    },
    onUserTyping: (userId, isTyping) => {
      // Handle typing indicators if needed
    },
    onError: (error) => {
      addNotification(error);
    },
  };

  // Helper functions
  const addNotification = useCallback((message: string) => {
    setNotifications((prev) => [...prev, message]);

    // Auto-remove after 5 seconds
    setTimeout(() => {
      setNotifications((prev) => prev.slice(1));
    }, 5000);
  }, []);

  const addSystemMessage = useCallback(
    (content: string, showToUser: boolean = true) => {
      // Filter out technical messages that users don't need to see
      const technicalMessages = [
        "Connected via",
        "Switched from",
        "Reconnecting",
        "Connection failed",
        "Screen sharing",
        "video unavailable",
      ];

      const isTechnicalMessage = technicalMessages.some((tech) =>
        content.includes(tech)
      );

      // Only show user-relevant messages
      if (!showToUser || isTechnicalMessage) {
        return;
      }

      const systemMessage: Message = {
        id: Date.now().toString(),
        userId: "system",
        userName: "System",
        content,
        timestamp: new Date(),
        type: "system",
        sessionId: sessionId as string,
      };
      setMessages((prev) => [...prev, systemMessage]);
    },
    []
  );

  // Load session data and initialize
  useEffect(() => {
    if (!sessionId || !user?.uid) return;

    let isComponentMounted = true;
    let retryCount = 0;
    const maxRetries = 3;

    const loadSessionData = async () => {
      try {
        console.log(`Loading session data (attempt ${retryCount + 1}/${maxRetries + 1})...`);
        
        const topics = await topicService.getAllTopics();
        const currentTopic = topics.find((t) => t.id === sessionId);

        if (!isComponentMounted) return;

        if (!currentTopic) {
          if (retryCount < maxRetries) {
            retryCount++;
            console.log(`Session not found, retrying in 2 seconds... (${retryCount}/${maxRetries})`);
            setTimeout(loadSessionData, 2000);
            return;
          }
          
          toast({
            variant: "destructive",
            title: "Session Not Found",
            description:
              "This session may have been cancelled or does not exist.",
          });
          router.push("/dashboard");
          return;
        }

        // Check permissions
        const isAuthor = currentTopic.author_id === user.uid;
        const isParticipant =
          currentTopic.participants?.includes(user.uid) || false;

        if (!isAuthor && !isParticipant) {
          toast({
            variant: "destructive",
            title: "Access Denied",
            description: "You don't have permission to join this session.",
          });
          router.push("/dashboard");
          return;
        }

        setTopic(currentTopic);

        // Find other user
        const allParticipants = [
          currentTopic.author_id,
          ...(currentTopic.participants || []),
        ];
        const foundOtherUserId = allParticipants.find((id) => id !== user.uid);

        if (foundOtherUserId) {
          console.log('Found other user:', foundOtherUserId, 'Current user:', user.uid);
          setOtherUserId(foundOtherUserId);

          // Get other user's name from topic data - use proper names
          let otherUserDisplayName = "Other User";

          if (
            currentTopic.author_id === foundOtherUserId &&
            currentTopic.author
          ) {
            // Other user is the author - use author data
            const firstName = currentTopic.author.first_name;
            const lastName = currentTopic.author.last_name;

            if (firstName && lastName) {
              otherUserDisplayName = `${firstName} ${lastName}`;
            } else if (firstName) {
              otherUserDisplayName = firstName;
            } else {
              otherUserDisplayName =
                currentTopic.author.display_name ||
                currentTopic.author.email ||
                "Other User";
            }
            setOtherUserName(otherUserDisplayName);
          } else {
            // Other user is a participant - fetch their data
            const fetchParticipantName = async () => {
              try {
                // Use O(1) cached profile lookup - instant!
                const { profileCache } = await import('@/lib/profile-cache-service');
                const participantData = await profileCache.getProfile(foundOtherUserId);

                if (participantData) {
                  const firstName = participantData.first_name;
                  const lastName = participantData.last_name;

                  if (firstName && lastName) {
                    setOtherUserName(`${firstName} ${lastName}`);
                  } else if (firstName) {
                    setOtherUserName(firstName);
                  } else {
                    setOtherUserName(
                      participantData.display_name ||
                        participantData.email ||
                        "Other User"
                    );
                  }
                  console.log('✅ Using cached profile for participant:', foundOtherUserId);
                } else {
                  setOtherUserName("Other User");
                }
              } catch (error) {
                console.warn("Failed to fetch participant name:", error);
                setOtherUserName("Other User");
              }
            };

            fetchParticipantName();
          }
        } else {
          // No other user yet - set waiting state
          setOtherUserId("");
          setOtherUserName("Waiting for participant...");
          // Don't show waiting message - it's obvious from the UI
        }

        // Initialize independent messaging service (works regardless of video connection)
        if (isComponentMounted && !messagingServiceRef.current) {
          const messagingService = createMessagingService(
            sessionId as string,
            user.uid,
            userProfile?.display_name || "You",
            messagingCallbacks
          );

          messagingServiceRef.current = messagingService;

          // Don't send join messages - they're noisy and obvious
        }

        // Initialize unified video service with room management (in background while modal is shown)
        if (
          isComponentMounted &&
          !videoServiceManagerRef.current &&
          foundOtherUserId
        ) {
          
          // Background video service temporarily disabled to fix connection issues
          console.log('🔄 Background video service disabled, proceeding with normal initialization');

          console.log('🚀 Initializing video service with provider coordination...');
          
          // Helper function to wait for DOM element
          const waitForVideoContainer = () => {
            return new Promise<void>((resolve, reject) => {
              let attempts = 0;
              const maxAttempts = 50; // 5 seconds max wait
              
              const checkElement = () => {
                const container = document.getElementById("video-container");
                if (container) {
                  console.log('✅ Video container found in DOM');
                  resolve();
                } else if (attempts >= maxAttempts) {
                  console.error('❌ Video container not found after 5 seconds');
                  reject(new Error('Video container not found in DOM'));
                } else {
                  attempts++;
                  console.log(`⏳ Waiting for video container... (${attempts}/${maxAttempts})`);
                  setTimeout(checkElement, 100);
                }
              };
              checkElement();
            });
          };
          
          try {
            // Create video service config
            const videoConfig: VideoServiceConfig = {
              sessionId: sessionId as string,
              userId: user.uid,
              userName: userProfile?.display_name || "You",
              userEmail: user.email || undefined,
              otherUserId: foundOtherUserId,
            };

            console.log('🎥 Video service config:', {
              sessionId: sessionId as string,
              currentUser: user.uid,
              otherUser: foundOtherUserId
            });

            // Initialize video service manager with provider coordination
            const videoManager = new VideoServiceManager(
              videoConfig,
              videoServiceCallbacks
            );
            videoServiceManagerRef.current = videoManager;

            // Initialize video layout manager
            const layoutManager = new VideoLayoutManager({
              localVideoRef,
              remoteVideoRef,
              localContainerRef,
              remoteContainerRef
            });
            videoLayoutManagerRef.current = layoutManager;

            // Expose to window for debugging
            if (typeof window !== 'undefined') {
              (window as any).videoServiceManager = videoManager;
              (window as any).videoLayoutManager = layoutManager;
              console.log('🔧 Video services exposed to window for debugging');
            }

            // Initialize video manager with provider coordination
            console.log('🚀 Initializing video manager...');
            
            // Wait for DOM element to be available
            try {
              await waitForVideoContainer();
              await videoManager.initialize("video-container");
            } catch (domError) {
              console.error('❌ DOM container error:', domError);
              throw new Error('Video container not available - please refresh the page');
            }
            console.log('✅ Video manager initialized successfully');
            
            // Don't check service status immediately - P2P connections take time to establish
            // The onStateChange callback will handle UI updates when connection is ready
            console.log('🔄 P2P connection establishing... UI will update when ready');
            
            // Mark session as ready for the setup modal
            setSessionReady(true);
            
          } catch (error) {
            console.error("❌ Failed to initialize unified video service:", error);
            addNotification("Video connection failed, but chat is still available");
            
            // Try fallback initialization without unified room management
            try {
              console.log('🔄 Attempting fallback video initialization...');
              const fallbackConfig: VideoServiceConfig = {
                sessionId: sessionId as string,
                userId: user.uid,
                userName: userProfile?.display_name || "You",
                userEmail: user.email || undefined,
                otherUserId: foundOtherUserId,
              };
              
              const fallbackManager = new VideoServiceManager(
                fallbackConfig,
                videoServiceCallbacks
              );
              videoServiceManagerRef.current = fallbackManager;
              
              // Wait for DOM element before fallback initialization
              try {
                await waitForVideoContainer();
                await fallbackManager.initialize("video-container");
              } catch (domError) {
                console.error('❌ Fallback DOM container error:', domError);
                throw new Error('Video container not available for fallback - please refresh the page');
              }
              console.log('✅ Fallback video initialization successful');
              
            } catch (fallbackError) {
              console.error("❌ Fallback video initialization also failed:", fallbackError);
            }
          }
        } else if (!foundOtherUserId) {
          console.log('⏳ Waiting for another participant to join the session');
          addSystemMessage("Waiting for another participant to join...", true);
        }
      } catch (error) {
        console.error("Failed to load session data:", error);
        
        if (retryCount < maxRetries) {
          retryCount++;
          console.log(`Session loading failed, retrying in 2 seconds... (${retryCount}/${maxRetries})`);
          setTimeout(loadSessionData, 2000);
          return;
        }
        
        if (isComponentMounted) {
          toast({
            variant: "destructive",
            title: "Failed to Load Session",
            description: "Please try refreshing the page or return to dashboard.",
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
          title: "Session Ended",
          description: "The scheduled session time has ended.",
        });
        router.push("/dashboard");
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
    if (sessionState === "connected") {
      durationIntervalRef.current = setInterval(() => {
        setSessionDuration((prev) => prev + 1);
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
  const handleToggleAudio = useCallback(async () => {
    console.log('🎤 Audio toggle requested, videoServiceManager available:', !!videoServiceManagerRef.current);
    if (videoServiceManagerRef.current) {
      try {
        await videoServiceManagerRef.current.toggleAudio();
        console.log('🎤 Audio toggle completed');
        setIsAudioMuted(prev => !prev); // Toggle the state
      } catch (error) {
        console.error('❌ Audio toggle failed:', error);
      }
    } else {
      console.warn('⚠️ No video service manager available for audio toggle');
    }
  }, []);

  const handleToggleVideo = useCallback(async () => {
    console.log('📹 Video toggle requested, videoServiceManager available:', !!videoServiceManagerRef.current);
    if (videoServiceManagerRef.current) {
      try {
        await videoServiceManagerRef.current.toggleVideo();
        console.log('📹 Video toggle completed');
        setIsVideoOff(prev => !prev); // Toggle the state
      } catch (error) {
        console.error('❌ Video toggle failed:', error);
      }
    } else {
      console.warn('⚠️ No video service manager available for video toggle');
    }
  }, []);

  const handleEndCall = useCallback(async () => {
    if (videoServiceManagerRef.current) {
      await videoServiceManagerRef.current.endCall();
    }
    router.push("/dashboard");
  }, [router]);

  const handleReconnect = useCallback(async () => {
    // Reconnection is handled automatically by the provider coordinator
    console.log('🔄 Reconnection handled automatically by provider coordinator');
  }, []);

  const handleSendMessage = useCallback(
    async (message: string) => {
      // Use independent messaging service (works regardless of video connection status)
      if (messagingServiceRef.current) {
        try {
          await messagingServiceRef.current.sendMessage(message);
        } catch (error) {
          console.error("Failed to send message via messaging service:", error);
          addNotification("Failed to send message");
        }
      } else {
        // Video service messaging not available in simplified system
        console.warn("Messaging service not available");
        addNotification("Failed to send message");
      }
    },
    [addNotification]
  );

  const handleCopySessionLink = useCallback(() => {
    const link = `${window.location.origin}/session/${sessionId}`;
    navigator.clipboard
      .writeText(link)
      .then(() => {
        addNotification("Session link copied to clipboard");
      })
      .catch(() => {
        addNotification("Failed to copy session link");
      });
  }, [sessionId, addNotification]);

  const handleSwitchToOptimal = useCallback(async () => {
    // Provider switching is handled automatically by the provider coordinator
    console.log('🔄 Provider switching handled automatically by coordinator');
    addNotification("Connection optimization in progress...");
  }, [addNotification]);

  const handleStartScreenShare = useCallback(async () => {
    // Screen sharing removed as requested
    addNotification("Screen sharing not available");
  }, [addNotification]);

  const handleOpenSettings = useCallback(() => {
    addNotification("Settings panel coming soon!");
  }, [addNotification]);

  // Modal handlers
  const handleSetupModalClose = useCallback(() => {
    setShowSetupModal(false);
    router.push("/dashboard"); // Go back to dashboard if they cancel
  }, [router]);

  const handleSetupModalJoin = useCallback((preferences: {
    audioEnabled: boolean;
    videoEnabled: boolean;
  }) => {
    console.log('🎯 User preferences from setup:', preferences);
    
    // Apply user preferences
    setIsAudioMuted(!preferences.audioEnabled);
    setIsVideoOff(!preferences.videoEnabled);
    
    // Close modal and show session
    setShowSetupModal(false);
    
    // Mark session as ready for user
    setSessionReady(true);
    
    addSystemMessage("Joining session...", false);
  }, [addSystemMessage]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Cleanup video service (async but we can't await in cleanup)
      if (videoServiceManagerRef.current) {
        videoServiceManagerRef.current.endCall().catch(console.error);
      }
      
      // Cleanup video layout manager
      if (videoLayoutManagerRef.current) {
        videoLayoutManagerRef.current.resetLayouts();
      }
      

      
      // Cleanup messaging service (async but we can't await in cleanup)
      if (messagingServiceRef.current) {
        messagingServiceRef.current.cleanup().catch(console.error);
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
          variant: "destructive",
          title: "Loading Timeout",
          description: "Session is taking too long to load. Please try again.",
        });
        router.push("/dashboard");
      }
    }, 10000); // 10 second timeout

    return () => clearTimeout(loadingTimeout);
  }, [topic, user, router, toast]);

  // Show loading state with mobile HTTPS warning
  if (!topic || !user) {
    const isMobile = typeof window !== 'undefined' && /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const isHTTPS = typeof window !== 'undefined' && (window.location.protocol === 'https:' || window.location.hostname === 'localhost');
    
    return (
      <div
        className="fixed inset-0 w-full h-full flex items-center justify-center bg-black text-white overflow-hidden box-border"
        style={{
          width: "100vw",
          height: "100vh",
          maxWidth: "100vw",
          maxHeight: "100vh",
          margin: 0,
          padding: 0,
        }}
      >
        <div className="text-center max-w-md mx-auto p-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-400 mx-auto mb-4"></div>
          <p className="text-rose-200">Loading session...</p>
          <p className="text-rose-300/60 text-sm mt-2">
            This may take a few moments
          </p>
          
          {/* Mobile HTTPS Warning */}
          {isMobile && !isHTTPS && (
            <div className="mt-6 p-4 bg-amber-900/50 border border-amber-600 rounded-lg">
              <div className="flex items-center mb-2">
                <span className="text-amber-400 mr-2">⚠️</span>
                <span className="text-amber-200 font-semibold">Mobile Camera Access</span>
              </div>
              <p className="text-amber-100 text-sm">
                Mobile browsers require HTTPS for camera access. 
                If video doesn't work, please use the HTTPS development server.
              </p>
              <p className="text-amber-200 text-xs mt-2">
                Run: <code className="bg-black/30 px-1 rounded">npm run dev:https</code>
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Show Daily.co embedded interface if using Daily.co (currently disabled)
  if (currentVideoService === "p2p" && false) { // Daily.co not currently used
    return (
      <div
        className="fixed inset-0 w-full h-full bg-black overflow-hidden box-border"
        style={{
          width: "100vw",
          height: "100vh",
          maxWidth: "100vw",
          maxHeight: "100vh",
          margin: 0,
          padding: 0,
        }}
      >
        <div id="video-container" className="w-full h-full" />
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
        {/* Service indicator */}
        <div className="absolute top-4 right-4 z-50">
          <div className="bg-green-600/80 backdrop-blur-sm text-white px-3 py-1 rounded-full text-sm">
            {currentVideoService === "p2p"
              ? "P2P WebRTC"
              : "Video Service"}
          </div>
        </div>
      </div>
    );
  }

  // Show custom UI for P2P WebRTC or when video is unavailable
  return (
    <>
      {/* Hidden video container for Daily.co initialization */}
      <div id="video-container" className="hidden" />
      
      {/* Setup Modal - shows on top while session initializes in background */}
      <SessionSetupModal
        isOpen={showSetupModal}
        onClose={handleSetupModalClose}
        onJoin={handleSetupModalJoin}
        topic={topic}
        sessionReady={sessionReady}
      />
      
      <HarthioSessionUI
      localVideoRef={localVideoRef}
      remoteVideoRef={remoteVideoRef}
      localContainerRef={localContainerRef}
      remoteContainerRef={remoteContainerRef}
      sessionState={sessionState}
      connectionQuality={connectionQuality}
      connectionStats={connectionStats}
      isAudioMuted={isAudioMuted}
      isVideoOff={isVideoOff}
      isRemoteAudioMuted={isRemoteAudioMuted}
      isRemoteVideoOff={isRemoteVideoOff}
      currentUserName={userProfile?.display_name || "You"}
      currentUserId={user.uid}
      otherUserName={otherUserName}
      sessionDuration={sessionDuration}
      timeRemaining={timeRemaining}
      sessionId={sessionId as string}
      onToggleAudio={handleToggleAudio}
      onToggleVideo={handleToggleVideo}
      onEndCall={handleEndCall}
      onReconnect={handleReconnect}
      onSendMessage={handleSendMessage}
      onSwitchToOptimal={handleSwitchToOptimal}
      onStartScreenShare={handleStartScreenShare}
      messages={messages}
      notifications={notifications}
      onCopySessionLink={handleCopySessionLink}
      onOpenSettings={handleOpenSettings}
    />
    </>
  );
}

export default function HarthioSessionPage() {
  return (
    <SessionErrorBoundary>
      <HarthioSessionPageContent />
    </SessionErrorBoundary>
  );
}
