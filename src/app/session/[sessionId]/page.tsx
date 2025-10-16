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
  MessageSquare,
  Send,
  X,
  Settings,
  Wifi,
  WifiOff,
  Signal,
  SignalHigh,
  SignalLow,
  Phone,
  Monitor,
  Maximize2,
  Minimize2,
  Volume2,
  VolumeX,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  ExternalLink
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { messageService, topicService } from "@/lib/supabase-services";
import { formatTimeRemaining } from "@/lib/time-utils";

// Enhanced WebRTC Manager with fallbacks
import { EnhancedWebRTCManager } from "@/lib/enhanced-webrtc-manager";
import { JitsiManager } from "@/lib/jitsi-manager";
import { ConnectionQualityMonitor } from "@/lib/connection-quality-monitor";
import { AudioProcessor } from "@/lib/audio-processor";
import { VideoProcessor } from "@/lib/video-processor";

// Types
interface SessionData {
  id: string;
  title: string;
  participants: string[];
  author: {
    userId: string;
    name: string;
  };
  endTime: Date;
}

interface Message {
  id: string;
  text: string;
  senderId: string;
  senderName: string;
  timestamp: Date;
}

type ConnectionState = 
  | "initializing" 
  | "connecting" 
  | "connected" 
  | "reconnecting" 
  | "failed" 
  | "ended";

type CallProvider = "webrtc" | "jitsi" | "google-meet" | "phone";

type ConnectionQuality = "excellent" | "good" | "fair" | "poor" | "critical";

interface CallStats {
  bitrate: number;
  packetLoss: number;
  latency: number;
  jitter: number;
  resolution: string;
  frameRate: number;
}

export default function SessionPage() {
  const { sessionId } = useParams();
  const { user, userProfile } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  // Core state
  const [sessionData, setSessionData] = useState<SessionData | null>(null);
  const [connectionState, setConnectionState] = useState<ConnectionState>("initializing");
  const [currentProvider, setCurrentProvider] = useState<CallProvider>("webrtc");
  const [connectionQuality, setConnectionQuality] = useState<ConnectionQuality>("excellent");
  const [callStats, setCallStats] = useState<CallStats | null>(null);
  
  // Media state
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  
  // UI state
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [isReconnecting, setIsReconnecting] = useState(false);
  
  // Chat state
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [unreadCount, setUnreadCount] = useState(0);
  
  // Timer state
  const [timeRemaining, setTimeRemaining] = useState<string | null>(null);
  const [callDuration, setCallDuration] = useState<string>("00:00");
  
  // Refs
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const webrtcManagerRef = useRef<EnhancedWebRTCManager | null>(null);
  const jitsiManagerRef = useRef<JitsiManager | null>(null);
  const qualityMonitorRef = useRef<ConnectionQualityMonitor | null>(null);
  const audioProcessorRef = useRef<AudioProcessor | null>(null);
  const videoProcessorRef = useRef<VideoProcessor | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const callStartTimeRef = useRef<Date | null>(null);

  // Initialize session and load data
  useEffect(() => {
    if (!sessionId || !user?.uid) return;

    const initializeSession = async () => {
      try {
        setConnectionState("initializing");
        
        // Load session data
        const topics = await topicService.getAllTopics();
        const topic = topics.find((t) => t.id === sessionId);
        
        if (!topic) {
          toast({
            variant: "destructive",
            title: "Session Not Found",
            description: "This session may have been cancelled or does not exist.",
          });
          router.push("/dashboard");
          return;
        }

        // Validate permissions
        const isAuthor = topic.author_id === user.uid;
        const isParticipant = topic.participants?.includes(user.uid) || false;
        
        if (!isAuthor && !isParticipant) {
          toast({
            variant: "destructive",
            title: "Access Denied",
            description: "You don't have permission to join this session.",
          });
          router.push("/dashboard");
          return;
        }

        // Check if session has ended
        const sessionEndTime = new Date(topic.end_time);
        if (new Date() > sessionEndTime) {
          toast({
            variant: "destructive",
            title: "Session Ended",
            description: "This session has already ended.",
          });
          router.push("/dashboard");
          return;
        }

        const sessionInfo: SessionData = {
          id: topic.id,
          title: topic.title,
          participants: topic.participants || [],
          author: {
            userId: topic.author.id,
            name: topic.author.display_name || topic.author.email,
          },
          endTime: sessionEndTime,
        };

        setSessionData(sessionInfo);
        
        // Load messages
        const supabaseMessages = await messageService.getTopicMessages(sessionId as string);
        const convertedMessages: Message[] = supabaseMessages.map((msg) => ({
          id: msg.id,
          text: msg.text,
          senderId: msg.sender_id,
          senderName: msg.sender.display_name || msg.sender.email,
          timestamp: new Date(msg.created_at),
        }));
        setMessages(convertedMessages);

        // Subscribe to new messages
        messageService.subscribeToMessages(
          sessionId as string,
          (payload) => {
            if (payload.eventType === "INSERT" && payload.new) {
              const newMsg: Message = {
                id: payload.new.id,
                text: payload.new.text,
                senderId: payload.new.sender_id,
                senderName: payload.new.sender?.display_name || payload.new.sender?.email || "Unknown",
                timestamp: new Date(payload.new.created_at),
              };
              setMessages((prev) => [...prev, newMsg]);
              
              // Update unread count if chat is closed
              if (!showChat && payload.new.sender_id !== user.uid) {
                setUnreadCount(prev => prev + 1);
              }
            }
          }
        );

        // Initialize call
        await initializeCall(sessionInfo);
        
      } catch (error) {
        console.error("Failed to initialize session:", error);
        toast({
          variant: "destructive",
          title: "Initialization Failed",
          description: "Failed to load session. Please try refreshing.",
        });
      }
    };

    initializeSession();
  }, [sessionId, user?.uid, router, toast, showChat]);

  // Initialize call with fallback providers
  const initializeCall = async (session: SessionData) => {
    try {
      setConnectionState("connecting");
      callStartTimeRef.current = new Date();
      
      // Find other participant
      const allParticipants = [session.author.userId, ...session.participants];
      const otherParticipant = allParticipants.find(id => id !== user!.uid);
      
      if (!otherParticipant) {
        setConnectionState("failed");
        toast({
          variant: "destructive",
          title: "No Participant",
          description: "Waiting for another participant to join...",
        });
        return;
      }

      // Try WebRTC first
      const success = await tryWebRTCConnection(session, otherParticipant);
      if (!success) {
        // Fallback to Jitsi
        await tryJitsiConnection(session);
      }
      
    } catch (error) {
      console.error("Call initialization failed:", error);
      await handleConnectionFailure();
    }
  };

  // WebRTC connection attempt
  const tryWebRTCConnection = async (session: SessionData, otherParticipant: string): Promise<boolean> => {
    try {
      // Get user media with optimizations
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280, max: 1920 },
          height: { ideal: 720, max: 1080 },
          frameRate: { ideal: 30, max: 60 },
          facingMode: "user"
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 48000
        }
      });

      setLocalStream(stream);
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      // Initialize enhanced WebRTC manager
      const webrtcManager = new EnhancedWebRTCManager({
        sessionId: session.id,
        userId: user!.uid,
        otherUserId: otherParticipant,
        userName: userProfile?.display_name || user!.email || "Unknown User",
        onRemoteStream: (remoteStream) => {
          setRemoteStream(remoteStream);
          if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = remoteStream;
          }
        },
        onConnectionStateChange: (state) => {
          setConnectionState(state);
          if (state === "connected") {
            setCurrentProvider("webrtc");
            startQualityMonitoring();
          }
        },
        onConnectionQualityChange: (quality) => {
          setConnectionQuality(quality);
        },
        onStatsUpdate: (stats) => {
          setCallStats(stats);
        },
        onError: (error) => {
          console.error("WebRTC error:", error);
          toast({
            variant: "destructive",
            title: "Connection Issue",
            description: error,
          });
        }
      });

      webrtcManagerRef.current = webrtcManager;
      await webrtcManager.initialize(stream);
      
      return true;
    } catch (error) {
      console.error("WebRTC connection failed:", error);
      return false;
    }
  };

  // Jitsi fallback connection
  const tryJitsiConnection = async (session: SessionData) => {
    try {
      toast({
        title: "Switching to Backup",
        description: "Using Jitsi Meet for better connectivity...",
      });

      const jitsiManager = new JitsiManager({
        roomName: `harthio-${session.id}`,
        userName: userProfile?.display_name || user!.email || "Unknown User",
        onConnectionStateChange: (state) => {
          setConnectionState(state);
          if (state === "connected") {
            setCurrentProvider("jitsi");
          }
        },
        onError: (error) => {
          console.error("Jitsi error:", error);
          handleConnectionFailure();
        }
      });

      jitsiManagerRef.current = jitsiManager;
      await jitsiManager.initialize();
      
    } catch (error) {
      console.error("Jitsi connection failed:", error);
      await handleConnectionFailure();
    }
  };

  // Handle connection failure with more fallbacks
  const handleConnectionFailure = async () => {
    setConnectionState("failed");
    
    toast({
      variant: "destructive",
      title: "Connection Failed",
      description: "Would you like to try alternative calling methods?",
      action: (
        <div className="flex gap-2">
          <Button size="sm" onClick={openGoogleMeet}>
            Google Meet
          </Button>
          <Button size="sm" variant="outline" onClick={showPhoneOption}>
            Phone
          </Button>
        </div>
      ),
    });
  };

  // Google Meet fallback
  const openGoogleMeet = () => {
    const meetUrl = `https://meet.google.com/new`;
    window.open(meetUrl, '_blank');
    setCurrentProvider("google-meet");
    
    toast({
      title: "Google Meet Opened",
      description: "Share the meeting link with the other participant.",
    });
  };

  // Phone fallback option
  const showPhoneOption = () => {
    toast({
      title: "Phone Backup",
      description: "Contact support for phone bridge: support@harthio.com",
    });
    setCurrentProvider("phone");
  };

  // Start quality monitoring
  const startQualityMonitoring = () => {
    if (!webrtcManagerRef.current) return;

    const qualityMonitor = new ConnectionQualityMonitor({
      webrtcManager: webrtcManagerRef.current,
      onQualityChange: (quality) => {
        setConnectionQuality(quality);
        
        // Auto-adjust quality based on connection
        if (quality === "poor" || quality === "critical") {
          handlePoorConnection();
        }
      },
      onStatsUpdate: (stats) => {
        setCallStats(stats);
      }
    });

    qualityMonitorRef.current = qualityMonitor;
    qualityMonitor.start();
  };

  // Handle poor connection
  const handlePoorConnection = async () => {
    if (!webrtcManagerRef.current) return;

    try {
      // Try to improve connection
      await webrtcManagerRef.current.optimizeForPoorConnection();
      
      toast({
        title: "Optimizing Connection",
        description: "Adjusting quality for better stability...",
      });
    } catch (error) {
      console.error("Failed to optimize connection:", error);
      
      // Offer fallback
      toast({
        variant: "destructive",
        title: "Poor Connection",
        description: "Would you like to switch to audio-only mode?",
        action: (
          <Button size="sm" onClick={switchToAudioOnly}>
            Audio Only
          </Button>
        ),
      });
    }
  };

  // Switch to audio-only mode
  const switchToAudioOnly = async () => {
    if (!webrtcManagerRef.current) return;
    
    try {
      await webrtcManagerRef.current.switchToAudioOnly();
      setIsVideoOff(true);
      
      toast({
        title: "Audio-Only Mode",
        description: "Video disabled to improve connection quality.",
      });
    } catch (error) {
      console.error("Failed to switch to audio-only:", error);
    }
  };

  // Media controls
  const toggleMute = useCallback(async () => {
    if (!localStream) return;

    const audioTracks = localStream.getAudioTracks();
    const newMutedState = !isMuted;
    
    audioTracks.forEach(track => {
      track.enabled = !newMutedState;
    });
    
    setIsMuted(newMutedState);
    
    // Update WebRTC manager
    if (webrtcManagerRef.current) {
      await webrtcManagerRef.current.toggleAudio(!newMutedState);
    }
    
    // Audio feedback
    if (audioProcessorRef.current) {
      audioProcessorRef.current.playFeedbackSound(newMutedState ? 'mute' : 'unmute');
    }
  }, [isMuted, localStream]);

  const toggleVideo = useCallback(async () => {
    if (!localStream) return;

    const videoTracks = localStream.getVideoTracks();
    const newVideoState = !isVideoOff;
    
    videoTracks.forEach(track => {
      track.enabled = !newVideoState;
    });
    
    setIsVideoOff(newVideoState);
    
    // Update WebRTC manager
    if (webrtcManagerRef.current) {
      await webrtcManagerRef.current.toggleVideo(!newVideoState);
    }
  }, [isVideoOff, localStream]);

  const toggleSpeaker = useCallback(() => {
    if (!remoteVideoRef.current) return;
    
    const newSpeakerState = !isSpeakerOn;
    remoteVideoRef.current.muted = !newSpeakerState;
    setIsSpeakerOn(newSpeakerState);
  }, [isSpeakerOn]);

  // End call
  const endCall = useCallback(async () => {
    try {
      // Cleanup all connections
      if (webrtcManagerRef.current) {
        await webrtcManagerRef.current.cleanup();
      }
      
      if (jitsiManagerRef.current) {
        await jitsiManagerRef.current.cleanup();
      }
      
      if (qualityMonitorRef.current) {
        qualityMonitorRef.current.stop();
      }
      
      // Stop local stream
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
      
      setConnectionState("ended");
      
      // Navigate back
      router.push("/dashboard");
      
    } catch (error) {
      console.error("Error ending call:", error);
      router.push("/dashboard");
    }
  }, [localStream, router]);

  // Chat functions
  const sendMessage = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user || !sessionId) return;

    const messageText = newMessage.trim();
    setNewMessage("");

    try {
      await messageService.sendMessage({
        topic_id: sessionId as string,
        sender_id: user.uid,
        text: messageText,
      });
    } catch (error) {
      console.error("Failed to send message:", error);
      setNewMessage(messageText); // Restore message on error
      toast({
        variant: "destructive",
        title: "Message Failed",
        description: "Failed to send message. Please try again.",
      });
    }
  }, [newMessage, user, sessionId, toast]);

  const toggleChat = () => {
    setShowChat(!showChat);
    if (!showChat) {
      setUnreadCount(0);
    }
  };

  // Timer effects
  useEffect(() => {
    if (!sessionData?.endTime) return;

    const timer = setInterval(() => {
      const remaining = formatTimeRemaining(sessionData.endTime);
      setTimeRemaining(remaining);
      
      if (remaining === "00:00") {
        endCall();
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [sessionData?.endTime, endCall]);

  useEffect(() => {
    if (!callStartTimeRef.current) return;

    const timer = setInterval(() => {
      const now = new Date();
      const diff = now.getTime() - callStartTimeRef.current!.getTime();
      const minutes = Math.floor(diff / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);
      setCallDuration(`${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
    }, 1000);

    return () => clearInterval(timer);
  }, [connectionState]);

  // Scroll chat to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      
      switch (e.key) {
        case ' ':
          e.preventDefault();
          toggleMute();
          break;
        case 'v':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            toggleVideo();
          }
          break;
        case 'c':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            toggleChat();
          }
          break;
        case 'Escape':
          if (isFullscreen) {
            setIsFullscreen(false);
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [toggleMute, toggleVideo, toggleChat, isFullscreen]);

  // Connection quality indicator
  const getQualityIcon = () => {
    switch (connectionQuality) {
      case "excellent":
        return <Signal className="w-4 h-4 text-green-500" />;
      case "good":
        return <SignalHigh className="w-4 h-4 text-green-400" />;
      case "fair":
        return <SignalLow className="w-4 h-4 text-yellow-500" />;
      case "poor":
        return <Wifi className="w-4 h-4 text-orange-500" />;
      case "critical":
        return <WifiOff className="w-4 h-4 text-red-500" />;
    }
  };

  // Loading state
  if (!sessionData || connectionState === "initializing") {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">Initializing Session</h2>
          <p className="text-gray-400">Setting up your call...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn(
      "min-h-screen bg-gray-900 relative overflow-hidden",
      isFullscreen && "fixed inset-0 z-50"
    )}>
      {/* Main video area */}
      <div className="relative w-full h-screen">
        {/* Remote video (main) */}
        <div className="absolute inset-0">
          {remoteStream ? (
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gray-800 flex items-center justify-center">
              <div className="text-center">
                <div className="w-24 h-24 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-semibold text-white">
                    {sessionData.author.userId === user?.uid 
                      ? sessionData.participants[0]?.charAt(0).toUpperCase() || "P"
                      : sessionData.author.name.charAt(0).toUpperCase()
                    }
                  </span>
                </div>
                <p className="text-white text-lg">
                  {connectionState === "connecting" ? "Connecting..." : "Waiting for participant"}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Local video (picture-in-picture) */}
        <div className="absolute top-4 right-4 w-48 h-36 bg-gray-800 rounded-lg overflow-hidden border-2 border-gray-600">
          {localStream && !isVideoOff ? (
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gray-700 flex items-center justify-center">
              <div className="w-12 h-12 bg-gray-600 rounded-full flex items-center justify-center">
                <span className="text-lg font-semibold text-white">
                  {userProfile?.display_name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || "Y"}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Top bar with session info */}
        <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/50 to-transparent p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-white font-semibold">{sessionData.title}</h1>
              <div className="flex items-center space-x-2 text-sm text-gray-300">
                {getQualityIcon()}
                <span className="capitalize">{connectionQuality}</span>
                {currentProvider !== "webrtc" && (
                  <span className="px-2 py-1 bg-blue-600 rounded text-xs">
                    {currentProvider.toUpperCase()}
                  </span>
                )}
              </div>
            </div>
            
            <div className="flex items-center space-x-4 text-white">
              <span className="text-sm">{callDuration}</span>
              {timeRemaining && (
                <span className="text-sm text-yellow-400">
                  Ends in {timeRemaining}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Bottom controls */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-6">
          <div className="flex items-center justify-center space-x-4">
            {/* Mute button */}
            <Button
              onClick={toggleMute}
              variant={isMuted ? "destructive" : "secondary"}
              size="lg"
              className="rounded-full w-14 h-14"
            >
              {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
            </Button>

            {/* Video button */}
            <Button
              onClick={toggleVideo}
              variant={isVideoOff ? "destructive" : "secondary"}
              size="lg"
              className="rounded-full w-14 h-14"
            >
              {isVideoOff ? <VideoOff className="w-6 h-6" /> : <Video className="w-6 h-6" />}
            </Button>

            {/* End call button */}
            <Button
              onClick={endCall}
              variant="destructive"
              size="lg"
              className="rounded-full w-16 h-16"
            >
              <PhoneOff className="w-7 h-7" />
            </Button>

            {/* Speaker button */}
            <Button
              onClick={toggleSpeaker}
              variant={isSpeakerOn ? "secondary" : "outline"}
              size="lg"
              className="rounded-full w-14 h-14"
            >
              {isSpeakerOn ? <Volume2 className="w-6 h-6" /> : <VolumeX className="w-6 h-6" />}
            </Button>

            {/* Chat button */}
            <Button
              onClick={toggleChat}
              variant="secondary"
              size="lg"
              className="rounded-full w-14 h-14 relative"
            >
              <MessageSquare className="w-6 h-6" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </Button>

            {/* Settings button */}
            <Button
              onClick={() => setShowSettings(!showSettings)}
              variant="secondary"
              size="lg"
              className="rounded-full w-14 h-14"
            >
              <Settings className="w-6 h-6" />
            </Button>
          </div>
        </div>

        {/* Connection status overlay */}
        {(connectionState === "connecting" || connectionState === "reconnecting") && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <div className="bg-gray-800 rounded-lg p-6 text-center">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-4" />
              <h3 className="text-white font-semibold mb-2">
                {connectionState === "connecting" ? "Connecting..." : "Reconnecting..."}
              </h3>
              <p className="text-gray-400">
                {connectionState === "connecting" 
                  ? "Establishing secure connection" 
                  : "Restoring connection"
                }
              </p>
            </div>
          </div>
        )}

        {/* Failed connection overlay */}
        {connectionState === "failed" && (
          <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
            <div className="bg-gray-800 rounded-lg p-8 text-center max-w-md">
              <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-white font-semibold mb-4">Connection Failed</h3>
              <p className="text-gray-400 mb-6">
                We're having trouble connecting. Try these alternatives:
              </p>
              <div className="space-y-3">
                <Button onClick={() => initializeCall(sessionData)} className="w-full">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Try Again
                </Button>
                <Button onClick={openGoogleMeet} variant="outline" className="w-full">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Use Google Meet
                </Button>
                <Button onClick={showPhoneOption} variant="outline" className="w-full">
                  <Phone className="w-4 h-4 mr-2" />
                  Phone Bridge
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Chat sidebar */}
      {showChat && (
        <div className="fixed right-0 top-0 h-full w-80 bg-gray-800 border-l border-gray-700 flex flex-col z-40">
          {/* Chat header */}
          <div className="p-4 border-b border-gray-700 flex items-center justify-between">
            <h3 className="text-white font-semibold">Chat</h3>
            <Button
              onClick={toggleChat}
              variant="ghost"
              size="sm"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "flex",
                  message.senderId === user?.uid ? "justify-end" : "justify-start"
                )}
              >
                <div
                  className={cn(
                    "max-w-xs px-3 py-2 rounded-lg text-sm",
                    message.senderId === user?.uid
                      ? "bg-blue-600 text-white"
                      : "bg-gray-700 text-gray-100"
                  )}
                >
                  <p className="font-medium text-xs opacity-75 mb-1">
                    {message.senderName}
                  </p>
                  <p>{message.text}</p>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Message input */}
          <form onSubmit={sendMessage} className="p-4 border-t border-gray-700">
            <div className="flex space-x-2">
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 bg-gray-700 border-gray-600 text-white"
              />
              <Button type="submit" size="sm">
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Settings panel */}
      {showSettings && (
        <div className="fixed left-4 bottom-20 bg-gray-800 rounded-lg p-4 border border-gray-700 z-40">
          <div className="space-y-4 min-w-64">
            <h3 className="text-white font-semibold">Call Settings</h3>
            
            {/* Connection info */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Provider:</span>
                <span className="text-white capitalize">{currentProvider}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Quality:</span>
                <span className="text-white capitalize">{connectionQuality}</span>
              </div>
              {callStats && (
                <>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Resolution:</span>
                    <span className="text-white">{callStats.resolution}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Bitrate:</span>
                    <span className="text-white">{Math.round(callStats.bitrate / 1000)}kbps</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Latency:</span>
                    <span className="text-white">{callStats.latency}ms</span>
                  </div>
                </>
              )}
            </div>

            {/* Quick actions */}
            <div className="space-y-2">
              <Button
                onClick={switchToAudioOnly}
                variant="outline"
                size="sm"
                className="w-full"
              >
                Switch to Audio Only
              </Button>
              <Button
                onClick={() => setShowStats(!showStats)}
                variant="outline"
                size="sm"
                className="w-full"
              >
                {showStats ? "Hide" : "Show"} Stats
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Stats overlay */}
      {showStats && callStats && (
        <div className="fixed top-20 left-4 bg-black/70 rounded-lg p-4 text-white text-sm font-mono z-40">
          <div className="space-y-1">
            <div>Resolution: {callStats.resolution}</div>
            <div>Frame Rate: {callStats.frameRate}fps</div>
            <div>Bitrate: {Math.round(callStats.bitrate / 1000)}kbps</div>
            <div>Packet Loss: {callStats.packetLoss.toFixed(2)}%</div>
            <div>Latency: {callStats.latency}ms</div>
            <div>Jitter: {callStats.jitter}ms</div>
          </div>
        </div>
      )}
    </div>
  );
}