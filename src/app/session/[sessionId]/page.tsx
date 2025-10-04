"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Loader2,
  PhoneOff,
  Mic,
  MicOff,
  Video,
  VideoOff,
  Users,
  Clock,
  MessageSquare,
  Send,
  X,
  WifiOff,
  Signal,
  SignalHigh,
  SignalLow,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { messageService, topicService, dbUtils } from "@/lib/supabase-services";
import { WebRTCManager, type ConnectionState } from "@/lib/webrtc-manager";
import { realtimeManager } from "@/lib/realtime-manager";
import { formatTimeRemaining } from "@/lib/time-utils";
import { PublicProfileDialog } from "@/components/harthio/public-profile-dialog";
import { 
  getUserMediaWithFallback, 
  checkMediaSupport, 
  getMediaErrorMessage,
  requestMediaPermissions 
} from "@/lib/media-utils";

// Mock data, as Firebase is removed
interface TopicData {
  title: string;
  participants: string[];
  author: {
    userId: string;
    name: string;
  };
  endTime: Date;
  [key: string]: any;
}

interface Message {
  id: string;
  text: string;
  senderId: string;
  senderName: string;
  timestamp: Date;
}

// Remove old type, using ConnectionState from WebRTCManager now

export default function SessionPage() {
  const { sessionId } = useParams();
  const { user, userProfile, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [topic, setTopic] = useState<TopicData | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<string | null>(null);
  const [isEnding, setIsEnding] = useState(false);
  const [connectionState, setConnectionState] =
    useState<ConnectionState>("loading");
  const [connectionQuality, setConnectionQuality] = useState<
    "good" | "fair" | "poor"
  >("good");
  const [notifications, setNotifications] = useState<string[]>([]);

  const [position, setPosition] = useState({ x: 20, y: 20 });
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const initialPosRef = useRef({ x: 20, y: 20 });

  const [isPortrait, setIsPortrait] = useState<boolean>(true);
  const draggableRef = useRef<HTMLDivElement>(null);

  const localStreamRef = useRef<MediaStream | null>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const webrtcManagerRef = useRef<WebRTCManager | null>(null);

  const [isChatOpen, setIsChatOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [remoteAspectRatio, setRemoteAspectRatio] = useState<number | null>(
    null
  );
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [mediaError, setMediaError] = useState<string | null>(null);
  const shouldShowRemoteVideo = connectionState === "connected" && remoteStream;

  // WebRTC cleanup function
  const cleanup = useCallback(async () => {
    console.log("Cleaning up session resources");

    // Cleanup WebRTC manager
    if (webrtcManagerRef.current) {
      await webrtcManagerRef.current.cleanup();
      webrtcManagerRef.current = null;
    }

    // Stop local stream
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }

    // Clear remote stream
    setRemoteStream(null);
  }, []);

  // Retry media access function
  const retryMediaAccess = useCallback(async () => {
    if (!user?.uid || !topic) return;

    console.log("Retrying media access...");
    setConnectionState("loading");
    setMediaError(null);

    try {
      // Check media support again
      const mediaSupport = checkMediaSupport();
      if (!mediaSupport.supported) {
        setMediaError(mediaSupport.error!);
        setConnectionState("failed");
        return;
      }

      // Try to get media with fallbacks
      const stream = await getUserMediaWithFallback({
        preferredWidth: 1280,
        preferredHeight: 720,
        preferredFrameRate: 30,
        facingMode: 'user'
      });

      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      // Find other participant and setup WebRTC
      const allSessionParticipants = [topic.author.userId, ...topic.participants];
      const otherParticipant = allSessionParticipants.find(
        (id) => id !== user.uid
      );
      
      if (!otherParticipant) {
        setConnectionState("waiting");
        return;
      }

      // Initialize WebRTC connection
      const webrtcManager = new WebRTCManager(
        sessionId as string,
        user.uid,
        otherParticipant,
        userProfile?.display_name || user.email || "Unknown User",
        (remoteStream) => {
          console.log("Remote stream received");
          setRemoteStream(remoteStream);
          if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = remoteStream;
          }
        },
        (state) => {
          console.log("Connection state changed:", state);
          setConnectionState(state);
        },
        (error) => {
          console.error("WebRTC error:", error);
          toast({
            variant: "destructive",
            title: "Connection Error",
            description: error,
          });
        },
        (notification) => {
          console.log("User notification:", notification);
          setNotifications((prev) => [...prev, notification]);
          toast({
            title: "Session Update",
            description: notification,
          });
          setTimeout(() => setNotifications((prev) => prev.slice(1)), 5000);
        }
      );

      webrtcManagerRef.current = webrtcManager;
      await webrtcManager.initialize(stream);

    } catch (error: any) {
      console.error("Failed to retry media access:", error);
      const errorMessage = getMediaErrorMessage(error);
      setMediaError(errorMessage);
      setConnectionState("failed");
      toast({
        variant: "destructive",
        title: "Media Access Failed",
        description: errorMessage,
      });
    }
  }, [user, topic, sessionId, userProfile, toast]);

  // Retry connection function
  const retryConnection = useCallback(async () => {
    if (!user?.uid || !topic) return;

    console.log("Retrying connection...");
    setConnectionState("connecting");

    // Cleanup existing connection
    if (webrtcManagerRef.current) {
      await webrtcManagerRef.current.cleanup();
      webrtcManagerRef.current = null;
    }

    // Find other participant
    const allSessionParticipants = [topic.author.userId, ...topic.participants];
    const otherParticipant = allSessionParticipants.find((id) => id !== user.uid);
    if (!otherParticipant) {
      setConnectionState("waiting");
      return;
    }

    // Restart WebRTC with existing local stream
    if (localStreamRef.current) {
      const webrtcManager = new WebRTCManager(
        sessionId as string,
        user.uid,
        otherParticipant,
        userProfile?.display_name || user.email || "Unknown User",
        (remoteStream) => {
          setRemoteStream(remoteStream);
          if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = remoteStream;
          }
        },
        (state) => setConnectionState(state),
        (error) => {
          toast({
            variant: "destructive",
            title: "Connection Error",
            description: error,
          });
        },
        (notification) => {
          setNotifications((prev) => [...prev, notification]);
          toast({
            title: "Session Update",
            description: notification,
          });
          setTimeout(() => setNotifications((prev) => prev.slice(1)), 5000);
        }
      );

      webrtcManagerRef.current = webrtcManager;
      await webrtcManager.initialize(localStreamRef.current);
    }
  }, [user, topic, sessionId, userProfile, toast]);

  const handleEndCall = useCallback(async () => {
    if (isEnding) return;
    setIsEnding(true);
    await cleanup();
    router.push("/dashboard");
  }, [router, isEnding, cleanup]);

  // Setup local media stream and WebRTC connection
  useEffect(() => {
    let isMounted = true;

    async function setupMediaAndWebRTC() {
      if (!user?.uid || !topic) return;

      try {
        setConnectionState("loading");

        // Check media support first
        const mediaSupport = checkMediaSupport();
        if (!mediaSupport.supported) {
          toast({
            variant: "destructive",
            title: "Media Not Supported",
            description: mediaSupport.error,
          });
          handleEndCall();
          return;
        }

        // Use improved media acquisition with fallbacks
        const stream = await getUserMediaWithFallback({
          preferredWidth: 1280,
          preferredHeight: 720,
          preferredFrameRate: 30,
          facingMode: 'user'
        });

        if (!isMounted) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        localStreamRef.current = stream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }

        // Find the other participant (could be author or approved participant)
        const allSessionParticipants = [topic.author.userId, ...topic.participants];
        const otherParticipant = allSessionParticipants.find(
          (id) => id !== user.uid
        );
        if (!otherParticipant) {
          setConnectionState("waiting");
          console.log("No other participant found, waiting...");
          return;
        }

        console.log("Found other participant:", otherParticipant);

        // Initialize WebRTC connection
        const webrtcManager = new WebRTCManager(
          sessionId as string,
          user.uid,
          otherParticipant,
          userProfile?.display_name || user.email || "Unknown User",
          (remoteStream) => {
            console.log("Remote stream received");
            setRemoteStream(remoteStream);
            if (remoteVideoRef.current) {
              remoteVideoRef.current.srcObject = remoteStream;
            }
          },
          (state) => {
            console.log("Connection state changed:", state);
            setConnectionState(state);
          },
          (error) => {
            console.error("WebRTC error:", error);
            toast({
              variant: "destructive",
              title: "Connection Error",
              description: error,
            });
          },
          (notification) => {
            console.log("User notification:", notification);
            setNotifications((prev) => [...prev, notification]);
            toast({
              title: "Session Update",
              description: notification,
            });

            // Auto-remove notification after 5 seconds
            setTimeout(() => {
              setNotifications((prev) => prev.slice(1));
            }, 5000);
          }
        );

        webrtcManagerRef.current = webrtcManager;
        await webrtcManager.initialize(stream);
      } catch (error: any) {
        console.error("Failed to setup WebRTC:", error);
        if (isMounted) {
          const errorMessage = getMediaErrorMessage(error);
          toast({
            variant: "destructive",
            title: "Media Access Error",
            description: errorMessage,
          });
          
          // Don't immediately end call - show error and let user retry
          setConnectionState("failed");
        }
      }
    }

    setupMediaAndWebRTC();

    return () => {
      isMounted = false;
    };
  }, [user?.uid, topic, sessionId, handleEndCall, toast]);

  // Load topic data and messages from Supabase
  useEffect(() => {
    if (!sessionId || !user?.uid) return;

    const loadSessionData = async () => {
      try {
        // Load topic data
        const topics = await topicService.getAllTopics();
        const currentTopic = topics.find((t) => t.id === sessionId);

        if (currentTopic) {
          // Check if user has permission to join this session (must be author or approved participant)
          const isAuthor = currentTopic.author_id === user.uid;
          const isApprovedParticipant = currentTopic.participants?.includes(user.uid) || false;
          
          if (!isAuthor && !isApprovedParticipant) {
            toast({
              variant: "destructive",
              title: "Access Denied",
              description: "You don't have permission to join this session. Only the host and approved participants can join.",
            });
            router.push('/dashboard');
            return;
          }

          // Check if session has enough participants (need at least 1 approved participant + author)
          const approvedParticipants = currentTopic.participants?.length || 0;
          if (approvedParticipants < 1) {
            toast({
              variant: "destructive",
              title: "Session Not Ready",
              description: "This session doesn't have enough participants yet. At least one participant must be approved to start the session.",
            });
            router.push('/dashboard');
            return;
          }

          const topicData: TopicData = {
            title: currentTopic.title,
            participants: currentTopic.participants,
            author: {
              userId: currentTopic.author.id,
              name:
                currentTopic.author.display_name || currentTopic.author.email,
            },
            endTime: new Date(currentTopic.end_time),
          };
          setTopic(topicData);
        } else {
          // Session not found (might have been cancelled)
          toast({
            variant: "destructive",
            title: "Session Not Found",
            description: "This session may have been cancelled or does not exist.",
          });
          router.push('/dashboard');
          return;
        }

        // Load messages
        const supabaseMessages = await messageService.getTopicMessages(
          sessionId as string
        );
        const convertedMessages: Message[] = supabaseMessages.map((msg) => ({
          id: msg.id,
          text: msg.text,
          senderId: msg.sender_id,
          senderName: msg.sender.display_name || msg.sender.email,
          timestamp: new Date(msg.created_at),
        }));
        setMessages(convertedMessages);

        // Subscribe to new messages
        const subscription = messageService.subscribeToMessages(
          sessionId as string,
          (payload) => {
            if (payload.eventType === "INSERT" && payload.new) {
              const convertedMessage: Message = {
                id: payload.new.id,
                text: payload.new.text,
                senderId: payload.new.sender_id,
                senderName:
                  payload.new.sender?.display_name ||
                  payload.new.sender?.email ||
                  "Unknown User",
                timestamp: new Date(payload.new.created_at),
              };
              setMessages((prev) => [...prev, convertedMessage]);
            }
          }
        );

        return () => {
          subscription.unsubscribe();
        };
      } catch (error) {
        console.error("Error loading session data:", error);
        toast({
          title: "Error",
          description: "Failed to load session data.",
          variant: "destructive",
        });
      }
    };

    loadSessionData();
  }, [sessionId, user?.uid, userProfile, cleanup, toast]);

  // Timer effect with real-time updates
  useEffect(() => {
    if (!topic?.endTime) return;

    const timer = setInterval(() => {
      const remaining = formatTimeRemaining(topic.endTime);
      if (remaining === "00:00") {
        clearInterval(timer);
        setTimeRemaining("00:00");
        if (!isEnding) handleEndCall();
      } else {
        setTimeRemaining(remaining);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [topic, handleEndCall, isEnding]);

  // Real-time subscriptions for session updates
  useEffect(() => {
    if (!sessionId) return;

    // Subscribe to topic changes (participant updates, etc.)
    const topicChannelId = realtimeManager.subscribeToTopics((payload) => {
      if (payload.new?.id === sessionId) {
        console.log("Session topic updated:", payload);

        // Check if participants changed (someone joined/left)
        const oldParticipants: string[] = payload.old?.participants || [];
        const newParticipants: string[] = payload.new?.participants || [];

        if (newParticipants.length !== oldParticipants.length) {
          console.log("Participants changed:", {
            old: oldParticipants,
            new: newParticipants,
          });

          // If someone new joined and we're in waiting state, try to connect
          if (
            newParticipants.length > oldParticipants.length &&
            connectionState === "waiting"
          ) {
            console.log(
              "New participant detected, attempting to establish connection..."
            );

            // Find the new participant
            const newParticipant = newParticipants.find(
              (id: string) => !oldParticipants.includes(id) && id !== user?.uid
            );

            if (
              newParticipant &&
              localStreamRef.current &&
              !webrtcManagerRef.current
            ) {
              console.log(
                "Setting up WebRTC with new participant:",
                newParticipant
              );

              // Create new WebRTC manager for the new participant
              const webrtcManager = new WebRTCManager(
                sessionId as string,
                user!.uid,
                newParticipant,
                userProfile?.display_name || user!.email || "Unknown User",
                (remoteStream) => {
                  console.log("Remote stream received from new participant");
                  setRemoteStream(remoteStream);
                  if (remoteVideoRef.current) {
                    remoteVideoRef.current.srcObject = remoteStream;
                  }
                },
                (state) => {
                  console.log(
                    "Connection state changed with new participant:",
                    state
                  );
                  setConnectionState(state);
                },
                (error) => {
                  console.error("WebRTC error with new participant:", error);
                  toast({
                    variant: "destructive",
                    title: "Connection Error",
                    description: error,
                  });
                },
                (notification) => {
                  console.log("User notification:", notification);
                  setNotifications((prev) => [...prev, notification]);
                  toast({
                    title: "Session Update",
                    description: notification,
                  });

                  setTimeout(() => {
                    setNotifications((prev) => prev.slice(1));
                  }, 5000);
                }
              );

              webrtcManagerRef.current = webrtcManager;
              webrtcManager.initialize(localStreamRef.current);
            }
          }
        }

        // Refetch topic data to get latest participants, etc.
        const refetchTopic = async () => {
          try {
            const topics = await topicService.getAllTopics();
            const currentTopic = topics.find((t) => t.id === sessionId);
            if (currentTopic) {
              const topicData: TopicData = {
                title: currentTopic.title,
                participants: currentTopic.participants,
                author: {
                  userId: currentTopic.author.id,
                  name:
                    currentTopic.author.display_name ||
                    currentTopic.author.email,
                },
                endTime: new Date(currentTopic.end_time),
              };
              setTopic(topicData);
            }
          } catch (error) {
            console.error("Error refetching topic:", error);
          }
        };
        refetchTopic();
      }
    }, { filter: `id=eq.${sessionId}` });

    // Subscribe to presence changes
    const presenceChannelId = realtimeManager.subscribeToPresence((payload) => {
      if (payload.new?.session_id === sessionId) {
        console.log("Session presence updated:", payload);
        // Handle user join/leave notifications here if needed
      }
    }, sessionId as string);

    return () => {
      realtimeManager.unsubscribe(topicChannelId);
      realtimeManager.unsubscribe(presenceChannelId);
    };
  }, [sessionId]);

  // UI effects (chat scroll, viewport, draggable)
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const handleResize = () => {
      const doc = document.documentElement;
      doc.style.setProperty("--app-height", `${window.innerHeight}px`);
      setIsPortrait(window.innerHeight > window.innerWidth);
    };
    handleResize(); // Initial call
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const constrainPosition = useCallback((newPos: { x: number; y: number }) => {
    if (!draggableRef.current) return newPos;
    const bounds = draggableRef.current.getBoundingClientRect();
    const maxX = window.innerWidth - bounds.width - 10;
    const maxY = window.innerHeight - bounds.height - 10;
    return {
      x: Math.max(10, Math.min(newPos.x, maxX)),
      y: Math.max(10, Math.min(newPos.y, maxY)),
    };
  }, []);

  const handleDragMove = useCallback(
    (e: MouseEvent | TouchEvent) => {
      if (!isDraggingRef.current) return;
      const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
      const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
      const dx = clientX - dragStartRef.current.x;
      const dy = clientY - dragStartRef.current.y;
      const newPos = {
        x: initialPosRef.current.x + dx,
        y: initialPosRef.current.y + dy,
      };
      setPosition(constrainPosition(newPos));
    },
    [constrainPosition]
  );

  const handleDragEnd = useCallback(() => {
    isDraggingRef.current = false;
    initialPosRef.current = position;
    window.removeEventListener("mousemove", handleDragMove);
    window.removeEventListener("mouseup", handleDragEnd);
    window.removeEventListener("touchmove", handleDragMove);
    window.removeEventListener("touchend", handleDragEnd);
  }, [position, handleDragMove]);

  const handleDragStart = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      e.preventDefault();
      isDraggingRef.current = true;
      const clientX =
        "touches" in e ? e.nativeEvent.touches[0].clientX : e.clientX;
      const clientY =
        "touches" in e ? e.nativeEvent.touches[0].clientY : e.clientY;
      dragStartRef.current = { x: clientX, y: clientY };
      window.addEventListener("mousemove", handleDragMove);
      window.addEventListener("mouseup", handleDragEnd);
      window.addEventListener("touchmove", handleDragMove);
      window.addEventListener("touchend", handleDragEnd);
    },
    [handleDragMove, handleDragEnd]
  );

  const toggleMute = () => {
    const newMutedState = !isMuted;
    setIsMuted(newMutedState);

    // Update local stream
    localStreamRef.current?.getAudioTracks().forEach((track) => {
      track.enabled = !newMutedState;
    });

    // Update WebRTC manager
    webrtcManagerRef.current?.toggleAudio(newMutedState);
  };

  const toggleVideo = () => {
    const newVideoState = !isVideoOff;
    setIsVideoOff(newVideoState);

    // Update local stream
    localStreamRef.current?.getVideoTracks().forEach((track) => {
      track.enabled = !newVideoState;
    });

    // Update WebRTC manager
    webrtcManagerRef.current?.toggleVideo(!newVideoState);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user || !sessionId) return;

    try {
      await messageService.sendMessage({
        topic_id: sessionId as string,
        sender_id: user.uid,
        text: newMessage,
      });
      setNewMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
      toast({
        title: "Error",
        description: "Failed to send message.",
        variant: "destructive",
      });
    }
  };

  const getConnectionStatusMessage = () => {
    if (mediaError) {
      return mediaError;
    }
    
    switch (connectionState) {
      case "loading":
        return "Loading session...";
      case "waiting":
        return "Waiting for participant to join...";
      case "connecting":
        return "Connecting to participant...";
      case "reconnecting":
        return "Reconnecting...";
      case "failed":
        return mediaError || "Connection failed. Please try again.";
      case "disconnected":
        return "Waiting for participant to join...";
      default:
        return null;
    }
  };

  const statusMessage = getConnectionStatusMessage();
  const showRetryButton = connectionState === "failed" || mediaError;

  // Connection quality monitoring
  useEffect(() => {
    if (connectionState === "connected" && webrtcManagerRef.current) {
      const interval = setInterval(async () => {
        const stats = await webrtcManagerRef.current?.getConnectionStats();
        if (stats) {
          // Analyze connection quality based on stats
          // This is a simplified implementation
          let quality: "good" | "fair" | "poor" = "good";

          stats.forEach((report) => {
            if (report.type === "inbound-rtp" && report.kind === "video") {
              const packetsLost = report.packetsLost || 0;
              const packetsReceived = report.packetsReceived || 1;
              const lossRate = packetsLost / (packetsLost + packetsReceived);

              if (lossRate > 0.05) quality = "poor";
              else if (lossRate > 0.02) quality = "fair";
            }
          });

          setConnectionQuality(quality);
        }
      }, 5000); // Check every 5 seconds

      return () => clearInterval(interval);
    }
  }, [connectionState]);

  // Handle remote video metadata
  useEffect(() => {
    const videoElement = remoteVideoRef.current;
    if (!videoElement || !remoteStream) return;

    const handleLoadedMetadata = () => {
      const aspectRatio = videoElement.videoWidth / videoElement.videoHeight;
      setRemoteAspectRatio(aspectRatio);
    };

    videoElement.addEventListener("loadedmetadata", handleLoadedMetadata);

    return () => {
      videoElement.removeEventListener("loadedmetadata", handleLoadedMetadata);
    };
  }, [remoteStream]);

  if (authLoading || !topic) {
    return (
      <div className="flex h-[var(--app-height,100vh)] w-full items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div
      style={{ height: "var(--app-height, 100vh)" }}
      className="w-full bg-black text-white flex flex-col relative overflow-hidden outline-none"
      tabIndex={-1}
    >
      {/* Notifications */}
      {notifications.length > 0 && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-30 space-y-2">
          {notifications.map((notification, index) => (
            <div
              key={index}
              className="bg-black/80 text-white px-4 py-2 rounded-lg text-sm animate-in slide-in-from-top"
            >
              {notification}
            </div>
          ))}
        </div>
      )}

      <header className="absolute top-0 left-0 right-0 z-20 p-2 sm:p-3 md:p-4 flex flex-col sm:flex-row sm:justify-between sm:items-start bg-gradient-to-b from-black/70 to-transparent">
        <div className="bg-black/50 p-2 rounded-lg w-full sm:w-auto">
          <h1 className="text-xs sm:text-sm md:text-lg font-bold leading-tight break-words sm:truncate sm:max-w-[50vw] md:max-w-[60vw]">
            {topic?.title || "Loading session..."}
          </h1>
          {topic && (
            <div className="flex items-center justify-between sm:justify-start gap-2 sm:gap-3 text-xs sm:text-sm text-neutral-300 mt-1 sm:mt-2">
              <div className="flex items-center gap-1 sm:gap-2">
                <Users className="h-3 w-3 sm:h-4 sm:w-4" />
                <span>{topic.participants.length}</span>
              </div>
              {timeRemaining && (
                <div className="flex items-center gap-1 sm:gap-2 font-mono">
                  <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span>{timeRemaining}</span>
                </div>
              )}
              {connectionState === "connected" && (
                <div className="flex items-center gap-1 sm:gap-2">
                  {connectionQuality === "good" && (
                    <SignalHigh className="h-3 w-3 sm:h-4 sm:w-4 text-green-400" />
                  )}
                  {connectionQuality === "fair" && (
                    <Signal className="h-3 w-3 sm:h-4 sm:w-4 text-yellow-400" />
                  )}
                  {connectionQuality === "poor" && (
                    <SignalLow className="h-3 w-3 sm:h-4 sm:w-4 text-red-400" />
                  )}
                  <span className="text-xs">
                    {connectionQuality === "good" && "HD"}
                    {connectionQuality === "fair" && "SD"}
                    {connectionQuality === "poor" && "Low"}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Participant Info */}
        {topic && connectionState === "connected" && (
          <div className="bg-black/50 p-2 rounded-lg mt-2 sm:mt-0">
            <div className="text-xs text-gray-300">
              <span>With: </span>
              {topic.participants
                .filter((participantId) => participantId !== user?.uid)
                .map((participantId) => (
                  <PublicProfileDialog
                    key={participantId}
                    userId={participantId}
                  >
                    <span className="text-white hover:underline cursor-pointer">
                      Participant
                    </span>
                  </PublicProfileDialog>
                ))}
            </div>
          </div>
        )}
      </header>

      <main className="flex-1 relative">
        <video
          ref={remoteVideoRef}
          className={cn(
            "w-full h-full",
            remoteAspectRatio && remoteAspectRatio < 1
              ? "object-contain"
              : "object-cover",
            shouldShowRemoteVideo ? "visible" : "invisible"
          )}
          autoPlay
          playsInline
        />

        {statusMessage && !shouldShowRemoteVideo && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 text-white p-2 sm:p-4 text-center">
            {connectionState === "connecting" ||
            connectionState === "loading" ||
            connectionState === "reconnecting" ? (
              <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 md:h-10 md:w-10 animate-spin mb-2 sm:mb-3" />
            ) : connectionState === "failed" ? (
              <X className="h-6 w-6 sm:h-8 sm:w-8 md:h-10 md:w-10 mb-2 sm:mb-3 text-red-400" />
            ) : connectionState === "waiting" ? (
              <Users className="h-6 w-6 sm:h-8 sm:w-8 md:h-10 md:w-10 mb-2 sm:mb-3 text-blue-400" />
            ) : (
              <WifiOff className="h-6 w-6 sm:h-8 sm:w-8 md:h-10 md:w-10 mb-2 sm:mb-3" />
            )}
            <p className="text-sm sm:text-base md:text-lg">{statusMessage}</p>

            {connectionState === "waiting" && (
              <div className="mt-4 text-xs sm:text-sm text-gray-300">
                <p>Share the session link with someone to start the call</p>
                <div className="flex gap-2 mt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-white border-white hover:bg-white hover:text-black"
                    onClick={() => {
                      navigator.clipboard.writeText(window.location.href);
                      toast({
                        title: "Link Copied",
                        description: "Session link copied to clipboard",
                      });
                    }}
                  >
                    Copy Link
                  </Button>
                  {topic?.participants && topic.participants.length > 1 && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-white border-white hover:bg-white hover:text-black"
                      onClick={retryConnection}
                    >
                      Retry Connection
                    </Button>
                  )}
                </div>
              </div>
            )}

            {connectionState === "failed" && (
              <div className="mt-4 flex flex-col gap-2 items-center">
                {mediaError ? (
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-white border-white hover:bg-white hover:text-black"
                    onClick={retryMediaAccess}
                  >
                    Retry Media Access
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-white border-white hover:bg-white hover:text-black"
                    onClick={retryConnection}
                  >
                    Retry Connection
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  className="text-white border-white hover:bg-white hover:text-black"
                  onClick={() => window.location.reload()}
                >
                  Refresh Page
                </Button>
              </div>
            )}
          </div>
        )}

        <div
          ref={draggableRef}
          style={{ top: `${position.y}px`, left: `${position.x}px` }}
          className={cn(
            "absolute cursor-move overflow-hidden shadow-2xl border-2 border-white/50 z-10 rounded-lg",
            isPortrait
              ? "w-[40vw] h-auto aspect-[9/16] max-w-[200px]"
              : "w-[30vw] h-auto aspect-video max-w-[420px]"
          )}
          onMouseDown={handleDragStart}
          onTouchStart={handleDragStart}
        >
          <video
            ref={localVideoRef}
            className="w-full h-full object-cover"
            autoPlay
            playsInline
            muted
          />
        </div>
      </main>

      <div
        className={cn(
          "fixed right-0 flex flex-col bg-white/90 backdrop-blur-sm text-black shadow-lg border-l border-neutral-200 rounded-l-lg transition-transform duration-300 ease-in-out z-30",
          "top-[80px] bottom-[80px] w-[90vw] max-w-[400px] sm:w-[360px]",
          isChatOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        <div className="flex justify-between items-center p-2 sm:p-3 border-b bg-neutral-100/90 rounded-tl-lg">
          <h2 className="text-base sm:text-lg font-bold px-2">Chat</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsChatOpen(false)}
            className="h-8 w-8 text-neutral-600 hover:text-red-500"
          >
            <X className="h-4 w-4 sm:h-5 sm:w-5" />
            <span className="sr-only">Close chat</span>
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto p-2 sm:p-3 space-y-3 bg-neutral-50/90">
          {messages.map((message) => {
            const isSender = message.senderId === user?.uid;
            return (
              <div
                key={message.id}
                className={cn(
                  "flex w-full",
                  isSender ? "justify-end" : "justify-start"
                )}
              >
                <div
                  className={cn(
                    "p-2 sm:p-3 rounded-lg max-w-[80%] break-words text-sm sm:text-base",
                    isSender
                      ? "bg-primary text-primary-foreground rounded-br-none"
                      : "bg-neutral-200 text-neutral-800 rounded-bl-none"
                  )}
                >
                  {!isSender && (
                    <p className="text-xs font-bold text-neutral-500 mb-1">
                      {message.senderName}
                    </p>
                  )}
                  <p>{message.text}</p>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>
        <div className="p-2 sm:p-3 border-t bg-white/90 rounded-bl-lg">
          <form
            onSubmit={handleSendMessage}
            className="flex items-center gap-2"
          >
            <Input
              type="text"
              placeholder="Type a message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              className="flex-1 text-sm sm:text-base bg-white"
            />
            <Button type="submit" size="icon" disabled={!newMessage.trim()}>
              <Send className="h-4 w-4 sm:h-5 sm:w-5" />
            </Button>
          </form>
        </div>
      </div>

      <footer className="absolute bottom-0 left-0 right-0 z-20 p-2 sm:p-3 md:p-4 flex-shrink-0 bg-gradient-to-t from-black/70 to-transparent">
        <div className="flex justify-center items-center gap-2 sm:gap-3 md:gap-4">
          <Button
            variant={isMuted ? "destructive" : "secondary"}
            size="icon"
            onClick={toggleMute}
            className="rounded-full h-10 w-10 sm:h-12 sm:w-12 md:h-14 md:w-14 bg-black/50 hover:bg-black/80 text-white"
          >
            {isMuted ? (
              <MicOff className="h-4 w-4 sm:h-5 sm:w-5" />
            ) : (
              <Mic className="h-4 w-4 sm:h-5 sm:w-5" />
            )}
          </Button>
          <Button
            variant="secondary"
            size="icon"
            onClick={() => setIsChatOpen(!isChatOpen)}
            className="rounded-full h-10 w-10 sm:h-12 sm:w-12 md:h-14 md:w-14 bg-black/50 hover:bg-black/80 text-white"
          >
            <MessageSquare className="h-4 w-4 sm:h-5 sm:w-5" />
          </Button>
          <Button
            variant={isVideoOff ? "destructive" : "secondary"}
            size="icon"
            onClick={toggleVideo}
            className="rounded-full h-10 w-10 sm:h-12 sm:w-12 md:h-14 md:w-14 bg-black/50 hover:bg-black/80 text-white"
          >
            {isVideoOff ? (
              <VideoOff className="h-4 w-4 sm:h-5 sm:w-5" />
            ) : (
              <Video className="h-4 w-4 sm:h-5 sm:w-5" />
            )}
          </Button>
          <Button
            variant="destructive"
            size="icon"
            onClick={handleEndCall}
            className="rounded-full h-10 w-10 sm:h-12 sm:w-12 md:h-14 md:w-14"
            disabled={isEnding}
          >
            {isEnding ? (
              <Loader2 className="animate-spin" />
            ) : (
              <PhoneOff className="h-4 w-4 sm:h-5 sm:w-5" />
            )}
          </Button>
        </div>
      </footer>
    </div>
  );
}
