/**
 * Modern Session Page
 * Google Meet inspired video calling experience with messaging
 */

"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
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
import { VideoServiceManager, type VideoServiceConfig, type VideoServiceCallbacks, type VideoProvider } from '@/lib/video-service-manager';
import { IntelligentVideoManager, type IntelligentVideoCallbacks, type ProviderPerformance } from '@/lib/intelligent-video-manager';
import { MessagingService, createMessagingService, type MessageCallback } from '@/lib/messaging-service';
import { CameraPreview } from '@/components/session/camera-preview';
import { SessionSettingsModal, type SessionSettings } from '@/components/session/session-settings-modal';
import { SessionSafetyDisclaimer } from '@/components/session/session-safety-disclaimer';
import { OrientationAdapter, type DeviceInfo } from '@/lib/migrate-to-simple-orientation';
import { mediaStreamController, type MediaState } from '@/lib/media-stream-controller';
import { topicService } from '@/lib/supabase-services';
import { EnhancedButton, CircularButton, ButtonGroup } from '@/components/ui/enhanced-button';
import { useEnhancedViewport } from '@/lib/enhanced-viewport';
import { useSmoothOrientation } from '@/lib/smooth-orientation';
import { SimpleDeviceManager, useSimpleDeviceShare, type SimpleDeviceShare } from '@/lib/simple-device-share';
import { useProviderMediaState } from '@/hooks/use-media-state';
import { useFastSession } from '@/hooks/use-fast-session';

export default function HarthioSessionPage() {
  const { sessionId } = useParams();
  const { user, userProfile } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  // Fast session initialization
  const fastSession = useFastSession({
    sessionId: sessionId as string,
    enableFastTrack: true,
    skipSafetyDisclaimer: false, // Keep safety disclaimer for now
    skipCameraPreview: false,    // Keep camera preview for now
    autoJoin: true,
    autoJoinDelay: 3000 // 3 second countdown
  });

  // Enhanced viewport for mobile optimization (removed duplicate - using the one below)

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

  // Remote user's media state (we still track this separately)
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

  // Video provider management
  const [currentProvider, setCurrentProvider] = useState<VideoProvider | null>(null);
  const [isVideoReady, setIsVideoReady] = useState(false);
  const [providerSwitchReason, setProviderSwitchReason] = useState<string>('');
  const [isInitializingVideo, setIsInitializingVideo] = useState(false);
  const [isPreInitializing, setIsPreInitializing] = useState(false);
  const [preInitializationComplete, setPreInitializationComplete] = useState(false);
  
  // Intelligent video management
  const [providerPerformance, setProviderPerformance] = useState<ProviderPerformance[]>([]);
  const [isBackgroundSwitching, setIsBackgroundSwitching] = useState(false);
  const [backgroundSwitchInfo, setBackgroundSwitchInfo] = useState<string>('');
  
  // Camera preview state
  const [showSafetyDisclaimer, setShowSafetyDisclaimer] = useState(false);
  const [showCameraPreview, setShowCameraPreview] = useState(false);
  const [userStream, setUserStream] = useState<MediaStream | null>(null);
  const [isReadyToJoin, setIsReadyToJoin] = useState(false);
  const [hasJoinedSession, setHasJoinedSession] = useState(false);
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo | null>(null);
  const [remoteDeviceInfo, setRemoteDeviceInfo] = useState<DeviceInfo | null>(null);
  
  // Auto-join functionality
  const [autoJoinEnabled, setAutoJoinEnabled] = useState(true);
  const [connectionOptimized, setConnectionOptimized] = useState(false);
  const [autoJoinCountdown, setAutoJoinCountdown] = useState<number | null>(null);
  const autoJoinTimeoutRef = useRef<NodeJS.Timeout>();

  // Enhanced viewport and device handling
  const { viewport, touchTargetConfig, safeZones, cssProperties } = useEnhancedViewport();
  const orientationState = useSmoothOrientation();
  const deviceShare = useSimpleDeviceShare();

  // Unified media state management with video provider integration
  const { mediaState, controls, setVideoManager } = useProviderMediaState();
  
  // No more sessionMediaState needed - using unified media state

  // Send device info to remote user
  const sendDeviceInfoToRemote = useCallback(() => {
    const currentDeviceInfo = OrientationAdapter.getDeviceInfo();
    console.log('📱 Session: Attempting to send device info:', currentDeviceInfo);
    
    if (intelligentVideoManagerRef.current) {
      console.log('📱 Session: Using intelligent video manager');
      const manager = intelligentVideoManagerRef.current.getCurrentManager();
      const managerType = manager?.constructor?.name || 'Unknown';
      console.log('📱 Session: Current manager type:', managerType);
      
      if (manager && 'sendDeviceInfo' in manager) {
        console.log('📱 Session: Manager supports sendDeviceInfo, sending...');
        (manager as any).sendDeviceInfo(currentDeviceInfo);
        console.log('📱 Session: Device info sent via', managerType);
      } else {
        console.warn('📱 Session: Manager does not support sendDeviceInfo:', manager);
      }
    } else if (webrtcManagerRef.current) {
      console.log('📱 Session: Using WebRTC manager fallback');
      webrtcManagerRef.current.sendDeviceInfo(currentDeviceInfo);
      console.log('📱 Session: Device info sent via WebRTC manager');
    } else {
      console.error('📱 Session: No video manager available to send device info');
    }
  }, []);
  const [showSettings, setShowSettings] = useState(false);
  const [sessionSettings, setSessionSettings] = useState<SessionSettings>({
    audioVolume: 80,
    videoQuality: 'auto',
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true,
    defaultAudioMuted: false,
    defaultVideoOff: false
  });

  // Refs
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const webrtcManagerRef = useRef<FixedWebRTCManager | null>(null);
  const videoServiceManagerRef = useRef<VideoServiceManager | null>(null);
  const intelligentVideoManagerRef = useRef<IntelligentVideoManager | null>(null);
  const messagingServiceRef = useRef<MessagingService | null>(null);
  const durationIntervalRef = useRef<NodeJS.Timeout>();
  const countdownIntervalRef = useRef<NodeJS.Timeout>();





  // Set video manager reference when video services are initialized
  useEffect(() => {
    if (intelligentVideoManagerRef.current) {
      console.log('📱 Session: Setting IntelligentVideoManager for media state');
      setVideoManager(intelligentVideoManagerRef.current);
    } else if (webrtcManagerRef.current) {
      console.log('📱 Session: Setting WebRTCManager for media state');
      setVideoManager(webrtcManagerRef.current);
    }
  }, [setVideoManager]);

  // Listen for orientation changes and send updated device info
  useEffect(() => {
    const handleOrientationChange = () => {
      console.log('📱 Session: Orientation changed, updating device info');
      const newDeviceInfo = OrientationAdapter.getDeviceInfo();
      setDeviceInfo(newDeviceInfo);
      
      // Send updated device info to remote user after a short delay
      setTimeout(() => {
        sendDeviceInfoToRemote();
      }, 500);
    };

    // Listen for orientation change events
    window.addEventListener('orientationchange', handleOrientationChange);
    window.addEventListener('resize', handleOrientationChange);

    return () => {
      window.removeEventListener('orientationchange', handleOrientationChange);
      window.removeEventListener('resize', handleOrientationChange);
    };
  }, [sendDeviceInfoToRemote]);

  // WebRTC callbacks
  const webrtcCallbacks: WebRTCCallbacks = {
    onStateChange: (state: ConnectionState) => {
      setSessionState(state);
      
      // Add system message for state changes
      if (state === 'connected') {
        addSystemMessage('Connected to the call');
        
        // Send device info to remote user when connection is established
        sendDeviceInfoToRemote();
        
        // Send device info again after a short delay to ensure it's received
        setTimeout(sendDeviceInfoToRemote, 2000);
        
        // Send device info periodically to handle any missed transmissions
        const deviceInfoInterval = setInterval(sendDeviceInfoToRemote, 10000);
        
        // Clean up interval when component unmounts
        return () => clearInterval(deviceInfoInterval);
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
    },

    onRemoteDeviceInfo: (deviceInfo: DeviceInfo) => {
      console.log('📱 Session: Received remote device info (WebRTC):', deviceInfo);
      console.log('📱 Session: Setting remote device info state');
      setRemoteDeviceInfo(deviceInfo);
      console.log('📱 Session: Remote device info state updated');
    }
  };

  // Intelligent video service callbacks
  const intelligentVideoCallbacks: IntelligentVideoCallbacks = {
    onReady: () => {
      setIsVideoReady(true);
    },
    onJoined: () => {
      // Only hide preview and connect if user has actually joined the session
      if (hasJoinedSession) {
        setSessionState('connected');
        setShowCameraPreview(false);
        addSystemMessage('Connected to video call');
        
        // Set initial mute states to match what user had in camera preview
        if (intelligentVideoManagerRef.current) {
          setTimeout(async () => {
            try {
              // Get current state from MediaStreamController
              const currentState = mediaStreamController.getState();
              console.log(`🔧 Setting initial mute states from camera preview: audio=${currentState.isAudioMuted}, video=${currentState.isVideoOff}`);
              await intelligentVideoManagerRef.current?.setInitialMuteStates(currentState.isAudioMuted, currentState.isVideoOff);
              console.log(`✅ Successfully applied initial mute states`);
              
              // The MediaStreamController will handle state synchronization automatically
              console.log(`🔧 MediaStreamController will handle state synchronization`);
            } catch (error) {
              console.error('❌ Failed to set initial mute states:', error);
              
              // Add a system message to confirm the states using current MediaStreamController state
              const currentState = mediaStreamController.getState();
              addSystemMessage(`Joined with ${currentState.isAudioMuted ? 'muted' : 'unmuted'} microphone and ${currentState.isVideoOff ? 'off' : 'on'} camera`);
            }
          }, 1000); // Give the service a moment to fully initialize
        }
      }
    },
    onLeft: () => {
      setSessionState('ended');
      router.push('/dashboard');
    },
    onError: (error, provider) => {
      console.error(`Video provider ${provider} error:`, error);
      
      // If all providers failed and we need WebRTC fallback
      if (provider === 'webrtc' && error.message.includes('WebRTC fallback needed')) {
        // Initialize WebRTC as fallback
        const initWebRTCFallback = async () => {
          try {
            const manager = new FixedWebRTCManager(
              sessionId as string,
              user?.uid || '',
              userProfile?.display_name || 'You',
              otherUserId || '',
              webrtcCallbacks
            );

            webrtcManagerRef.current = manager;
            setCurrentProvider('webrtc');

            if (userStream) {
              await manager.initializeWithStream(userStream);
            } else {
              await manager.initialize();
            }
            setShowCameraPreview(false);
            addSystemMessage('Connected to video call');
          } catch (webrtcError) {
            addSystemMessage('Unable to establish video connection. You can still use messaging.');
            setSessionState('failed');
          }
        };

        initWebRTCFallback();
      }
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
      
      // Update otherUserName if this message is from the other user and we don't have their name yet
      if (message.from !== (userProfile?.display_name || 'You') && 
          (otherUserName === 'Session Participant' || otherUserName === 'Other User')) {
        setOtherUserName(message.from);
      }
      
      setMessages(prev => [...prev, chatMessage]);
    },
    onParticipantJoined: (participant) => {
      addSystemMessage(`${participant.user_name || 'Someone'} joined the call`);
    },
    onParticipantLeft: (participant) => {
      addSystemMessage(`${participant.user_name || 'Someone'} left the call`);
    },
    onConnectionQualityChanged: (quality) => {
      // Update connection quality indicator
      setConnectionQuality(quality as any);
    },
    onProviderChanged: (provider, reason) => {
      setCurrentProvider(provider);
      setProviderSwitchReason(reason);
      setIsInitializingVideo(false);
      
      // Only show technical details in development mode
      if (process.env.NODE_ENV === 'development') {
        const providerNames = {
          'jitsi-public': 'Jitsi Meet',
          'daily': 'Daily.co',
          'jitsi-self': 'Harthio Video',
          'webrtc': 'Direct Connection'
        };
        addSystemMessage(`[DEV] Switched to ${providerNames[provider]} (${reason})`);
      }
      // In production: Don't show any provider switching messages to users
      // The connection just works seamlessly in the background
    },
    // Intelligent video manager specific callbacks
    onProviderPerformanceUpdate: (performance) => {
      setProviderPerformance(performance);
    },
    onBackgroundSwitching: (fromProvider, toProvider, reason) => {
      setIsBackgroundSwitching(true);
      setBackgroundSwitchInfo(`Switching from ${fromProvider} to ${toProvider}: ${reason}`);
      
      // Clear the switching indicator after a few seconds
      setTimeout(() => {
        setIsBackgroundSwitching(false);
        setBackgroundSwitchInfo('');
      }, 3000);
      
      // Only show technical details in development
      if (process.env.NODE_ENV === 'development') {
        addSystemMessage(`[DEV] Auto-switched: ${fromProvider} → ${toProvider} (${reason})`);
      }
      // In production: Background switching is completely invisible to users
      // They just get a seamless, high-quality connection
    },
    onRemoteDeviceInfo: (deviceInfo: DeviceInfo) => {
      console.log('📱 Session: Received remote device info (Intelligent):', deviceInfo);
      console.log('📱 Session: Setting remote device info state via intelligent manager');
      setRemoteDeviceInfo(deviceInfo);
      console.log('📱 Session: Remote device info state updated via intelligent manager');
    }
  };

  // Independent messaging service callbacks
  const messagingCallbacks: MessageCallback = {
    onMessage: (message) => {
      // Update otherUserName if this message is from the other user and we don't have their name yet
      if (message.userId !== user?.uid && 
          (otherUserName === 'Session Participant' || otherUserName === 'Other User')) {
        setOtherUserName(message.userName);
      }
      
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

  const addSystemMessage = useCallback((content: string, forceShow = false) => {
    // Filter out technical messages that users don't need to see
    // Keep: participant join/leave, remote user actions, session topic
    const technicalMessages = [
      'Preparing video connection in background',
      'Video connection ready',
      'Switched to',
      'Automatically switched to better provider',
      'Chat connected',
      'Device info sent',
      'Sending device info',
      'Camera ready - you can see yourself',
      'Joining session',
      'Connected to video call',
      'Connected to the call',
      'Reconnecting',
      'Connection failed',
      'Connection method changed',
      'Optimizing connection quality',
      'Connection quality improved',
      'Settings updated',
      'Joined with',
      'Unable to establish video connection',
      'Camera error',
      '[DEV]' // Hide all development messages from production users
    ];
    
    // Don't show technical messages unless forced or in development
    if (!forceShow && process.env.NODE_ENV !== 'development') {
      const isTechnical = technicalMessages.some(tech => content.includes(tech));
      if (isTechnical) {
        console.log('📱 System (hidden):', content);
        return; // Don't show to user
      }
    }
    
    // Make messages more user-friendly
    let userFriendlyContent = content;
    
    // Replace technical messages with user-friendly ones
    if (content.includes('Connection quality improved')) {
      // Silent - no toast notification for connection optimization
      return;
    } else if (content.includes('Optimizing connection quality')) {
      // Silent - no toast notification for connection optimization
      return;
    } else if (content.includes('Connected to the call')) {
      userFriendlyContent = '🎉 You\'re now connected!';
    } else if (content.includes('Reconnecting')) {
      userFriendlyContent = '🔄 Reconnecting...';
    } else if (content.includes('Connection failed')) {
      userFriendlyContent = '⚠️ Connection issue - you can still chat';
    } else if (content.includes('joined the session')) {
      userFriendlyContent = content.replace('joined the session', 'joined');
    } else if (content.includes('muted their microphone')) {
      userFriendlyContent = content.replace('muted their microphone', 'muted their mic');
    } else if (content.includes('unmuted their microphone')) {
      userFriendlyContent = content.replace('unmuted their microphone', 'unmuted their mic');
    } else if (content.includes('turned off their camera')) {
      userFriendlyContent = content.replace('turned off their camera', 'turned off camera');
    } else if (content.includes('turned on their camera')) {
      userFriendlyContent = content.replace('turned on their camera', 'turned on camera');
    }
    
    const systemMessage: Message = {
      id: `sys_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId: 'system',
      userName: 'System',
      content: userFriendlyContent,
      timestamp: new Date(),
      type: 'system'
    };
    setMessages(prev => [...prev, systemMessage]);
  }, []);

  // Camera preview handlers
  // Background initialization of video services
  const preInitializeVideoServices = useCallback(async () => {
    if (isPreInitializing || preInitializationComplete || !user || !userProfile) {
      return;
    }

    setIsPreInitializing(true);
    // Only show technical messages in development
    if (process.env.NODE_ENV === 'development') {
      addSystemMessage('[DEV] Preparing video connection in background...');
    }

    try {
      const videoConfig: VideoServiceConfig = {
        sessionId: sessionId as string,
        displayName: userProfile?.display_name || 'You',
        email: user?.email || undefined,
        avatarUrl: userProfile?.avatar_url || undefined
      };

      const intelligentVideoManager = new IntelligentVideoManager(videoConfig, intelligentVideoCallbacks);
      intelligentVideoManagerRef.current = intelligentVideoManager;

      // Wait a bit for the DOM to be ready, then try to initialize
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Only test providers in background, don't actually initialize
      await intelligentVideoManager.testProvidersOnly();
      
      setPreInitializationComplete(true);
      setConnectionOptimized(true);
      
      // Only show technical readiness messages in development
      if (process.env.NODE_ENV === 'development') {
        addSystemMessage('[DEV] Video connection ready! You can join instantly.');
      }
    } catch (error) {
      console.log('Background video initialization failed, will use WebRTC fallback:', error);
      // Don't show error to user - this is background initialization
      // The join handler will handle WebRTC fallback gracefully
      setPreInitializationComplete(true);
      setConnectionOptimized(true); // Still allow auto-join with fallback
    } finally {
      setIsPreInitializing(false);
    }
  }, [isPreInitializing, preInitializationComplete, user, userProfile, sessionId, intelligentVideoCallbacks, addSystemMessage]);

  const handleCameraReady = useCallback((stream: MediaStream) => {
    setUserStream(stream);
    setIsReadyToJoin(true);
    addSystemMessage('Camera ready - you can see yourself!');
    
    // Get device info for adaptive video handling
    const currentDeviceInfo = OrientationAdapter.getDeviceInfo();
    setDeviceInfo(currentDeviceInfo);
    
    // The MediaStreamController should already be managing this stream from the camera preview
    // Just ensure the stream is properly set (camera preview should have already done this)
    console.log('📱 Session: Camera ready, stream tracks:', {
      audio: stream.getAudioTracks().length,
      video: stream.getVideoTracks().length,
      audioEnabled: stream.getAudioTracks()[0]?.enabled,
      videoEnabled: stream.getVideoTracks()[0]?.enabled
    });
    
    // Also set the local video ref if available
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = stream;
    }

    // Start background video service initialization
    setTimeout(() => {
      preInitializeVideoServices();
    }, 1000); // Give user a moment to see their camera first
  }, [addSystemMessage, preInitializeVideoServices]);

  // Auto-join logic when connection is optimized
  useEffect(() => {
    if (connectionOptimized && autoJoinEnabled && isReadyToJoin && !hasJoinedSession && showCameraPreview) {
      // Start countdown for auto-join
      let countdown = 3;
      setAutoJoinCountdown(countdown);
      
      const countdownInterval = setInterval(() => {
        countdown -= 1;
        setAutoJoinCountdown(countdown);
        
        if (countdown <= 0) {
          clearInterval(countdownInterval);
          setAutoJoinCountdown(null);
          if (autoJoinEnabled) { // Check again in case user disabled it
            handleJoinSession();
          }
        }
      }, 1000);
      
      autoJoinTimeoutRef.current = countdownInterval;
      
      return () => {
        clearInterval(countdownInterval);
        setAutoJoinCountdown(null);
      };
    }
  }, [connectionOptimized, autoJoinEnabled, isReadyToJoin, hasJoinedSession, showCameraPreview]);

  // Cancel auto-join handler
  const handleCancelAutoJoin = useCallback(() => {
    setAutoJoinEnabled(false);
    setAutoJoinCountdown(null);
    if (autoJoinTimeoutRef.current) {
      clearTimeout(autoJoinTimeoutRef.current);
    }
  }, []);

  // Join session handler - uses pre-initialized services if available
  const handleJoinSession = useCallback(async () => {
    setHasJoinedSession(true);
    setSessionState('connecting');
    
    // Always initialize messaging service when joining (independent of video)
    if (!messagingServiceRef.current && user) {
      try {
        const messagingService = createMessagingService(sessionId as string, user.uid, userProfile?.display_name || 'You', messagingCallbacks);
        messagingServiceRef.current = messagingService;
        // Only show technical messages in development
        if (process.env.NODE_ENV === 'development') {
          addSystemMessage('Chat connected');
        }
      } catch (error) {
        console.error('Failed to initialize messaging:', error);
      }
    }
    
    // Check if we have tested providers in background
    if (preInitializationComplete && intelligentVideoManagerRef.current) {
      // Providers are tested, now initialize with the best one
      addSystemMessage('Joining session...');
      setIsInitializingVideo(true);
      
      try {
        console.log('🎯 Session: Using pre-tested providers, initializing IntelligentVideoManager');
        // Now actually initialize the video services
        await intelligentVideoManagerRef.current.initialize('video-container');
        setShowCameraPreview(false);
        setIsInitializingVideo(false);
        
        // Send device info immediately after connection
        if (deviceInfo) {
          console.log('📱 Session: Sending initial device info after video connection');
          handleDeviceInfo(deviceInfo);
        }
        
        return;
      } catch (error) {
        console.error('❌ Session: Failed to initialize with tested providers:', error);
        addSystemMessage('Video provider failed, trying fallback...');
        // Fall through to normal initialization
      }
    }

    // Fallback to normal initialization if pre-initialization didn't work
    setIsInitializingVideo(true);
    addSystemMessage('Joining session...');

    try {
      if (!intelligentVideoManagerRef.current) {
        console.log('🎯 Session: Creating new IntelligentVideoManager');
        const videoConfig: VideoServiceConfig = {
          sessionId: sessionId as string,
          displayName: userProfile?.display_name || 'You',
          email: user?.email || undefined,
          avatarUrl: userProfile?.avatar_url || undefined
        };

        const intelligentVideoManager = new IntelligentVideoManager(videoConfig, intelligentVideoCallbacks);
        intelligentVideoManagerRef.current = intelligentVideoManager;
        
        // Set video manager for unified media state
        setVideoManager(intelligentVideoManager);

        // Wait a bit for the DOM to be ready
        await new Promise(resolve => setTimeout(resolve, 100));
        console.log('🎯 Session: Initializing IntelligentVideoManager with video-container');
        await intelligentVideoManager.initialize('video-container');
        
        // Send device info immediately after connection
        if (deviceInfo) {
          console.log('📱 Session: Sending initial device info after video connection');
          handleDeviceInfo(deviceInfo);
        }
      }
    } catch (error) {
      console.error('❌ Session: Failed to join session with IntelligentVideoManager:', error);
      addSystemMessage('Video providers failed, using WebRTC fallback...');
      
      // Fallback to WebRTC
      const manager = new FixedWebRTCManager(
        sessionId as string,
        user?.uid || '',
        userProfile?.display_name || 'You',
        otherUserId || '',
        webrtcCallbacks
      );

      webrtcManagerRef.current = manager;
      setCurrentProvider('webrtc');
      setIsInitializingVideo(false);
      
      // Set video manager for unified media state
      setVideoManager(manager);

      try {
        if (userStream) {
          await manager.initializeWithStream(userStream);
        } else {
          await manager.initialize();
        }
        setShowCameraPreview(false);
        addSystemMessage('Connected to video call');
        
        // Send device info immediately after WebRTC connection
        if (deviceInfo) {
          console.log('📱 Session: Sending initial device info after WebRTC connection');
          handleDeviceInfo(deviceInfo);
        }
      } catch (webrtcError) {
        addSystemMessage('Unable to establish video connection. Please check your internet connection.');
        setSessionState('failed');
        setIsInitializingVideo(false);
      }
    }
  }, [userStream, sessionId, userProfile, user, otherUserId, intelligentVideoCallbacks, webrtcCallbacks, addSystemMessage, addNotification]);

  const handleCameraError = useCallback((error: string) => {
    addSystemMessage(`Camera error: ${error}`);
    addNotification('Please allow camera access to join the session');
  }, [addSystemMessage, addNotification]);

  const handleDeviceInfo = useCallback((deviceInfo: DeviceInfo) => {
    console.log('📱 Session: handleDeviceInfo called with:', {
      orientation: deviceInfo.orientation,
      screenSize: `${deviceInfo.screenWidth}x${deviceInfo.screenHeight}`,
      deviceType: deviceInfo.isMobile ? 'mobile' : deviceInfo.isTablet ? 'tablet' : 'desktop',
      timestamp: new Date().toISOString()
    });
    
    setDeviceInfo(deviceInfo);
    
    // Send device info to remote user - try multiple managers
    let deviceInfoSent = false;
    
    // Try IntelligentVideoManager first (preferred)
    if (intelligentVideoManagerRef.current) {
      const manager = intelligentVideoManagerRef.current.getCurrentManager();
      if (manager && 'sendDeviceInfo' in manager) {
        console.log('📱 Session: Sending device info via IntelligentVideoManager');
        (manager as any).sendDeviceInfo(deviceInfo);
        deviceInfoSent = true;
      }
    }
    
    // Try VideoServiceManager if available
    if (!deviceInfoSent && videoServiceManagerRef.current) {
      console.log('📱 Session: Sending device info via VideoServiceManager');
      videoServiceManagerRef.current.sendDeviceInfo(deviceInfo);
      deviceInfoSent = true;
    }
    
    // Try WebRTC manager as fallback
    if (!deviceInfoSent && webrtcManagerRef.current) {
      console.log('📱 Session: Sending device info via WebRTC fallback');
      webrtcManagerRef.current.sendDeviceInfo(deviceInfo);
      deviceInfoSent = true;
    }
    
    if (!deviceInfoSent) {
      console.warn('📱 Session: No video manager available to send device info');
    } else {
      console.log('📱 Session: Device info sent successfully');
    }
  }, []);



  // Back to dashboard handler
  const handleBackToDashboard = useCallback(() => {
    // Clean up camera stream
    if (userStream) {
      userStream.getTracks().forEach(track => track.stop());
      setUserStream(null);
    }
    
    // Navigate back to dashboard
    router.push('/dashboard');
  }, [userStream, router]);

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
            ? (currentTopic.author?.display_name || currentTopic.author?.email || 'Session Author')
            : 'Session Participant';
          setOtherUserName(otherUserDisplayName);
        }



        // Show safety disclaimer first before camera preview
        setShowSafetyDisclaimer(true);
        
        // Start background connection setup (user won't see this)
        setTimeout(() => {
          // Initialize independent messaging service in background
          if (isComponentMounted && !messagingServiceRef.current) {
            const messagingService = createMessagingService(
              sessionId as string,
              user.uid,
              userProfile?.display_name || 'You',
              messagingCallbacks
            );
            
            messagingServiceRef.current = messagingService;
          }
        }, 1000);
        
        addSystemMessage(`📋 Session: ${currentTopic.title}`, true);

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

  // Event handlers - now using unified media state
  const handleToggleAudio = useCallback(async () => {
    console.log(`🎤 Session: handleToggleAudio called`);
    console.log(`🎤 Current state: isAudioMuted=${mediaState.isAudioMuted}`);
    
    // Use unified media controls that work with all video providers
    await controls.toggleAudio();
    // Don't show system message for own actions - user can see the UI state
  }, [mediaState.isAudioMuted, controls]);

  const handleToggleVideo = useCallback(async () => {
    console.log(`📹 Session: handleToggleVideo called`);
    console.log(`📹 Current state: isVideoOff=${mediaState.isVideoOff}`);
    
    // Use unified media controls that work with all video providers
    await controls.toggleVideo();
    // Don't show system message for own actions - user can see the UI state
  }, [mediaState.isVideoOff, controls]);

  const handleEndCall = useCallback(async () => {
    if (intelligentVideoManagerRef.current) {
      intelligentVideoManagerRef.current.hangup();
    } else if (webrtcManagerRef.current) {
      await webrtcManagerRef.current.endCall();
    }
    router.push('/dashboard');
  }, [router]);

  const handleReconnect = useCallback(async () => {
    if (intelligentVideoManagerRef.current) {
      await intelligentVideoManagerRef.current.retry();
    } else if (webrtcManagerRef.current) {
      await webrtcManagerRef.current.reconnect();
    }
  }, []);

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
      if (intelligentVideoManagerRef.current) {
        intelligentVideoManagerRef.current.sendMessage(message);
      } else if (webrtcManagerRef.current) {
        webrtcManagerRef.current.sendMessage(message);
      }
    }
  }, [addNotification]);

  const handleCopySessionLink = useCallback(() => {
    const link = `${window.location.origin}/session/${sessionId}`;
    navigator.clipboard.writeText(link).then(() => {
      addNotification('Session link copied to clipboard');
    }).catch(() => {
      addNotification('Failed to copy session link');
    });
  }, [sessionId, addNotification]);

  const handleSwitchProvider = useCallback(async (provider: VideoProvider) => {
    try {
      if (intelligentVideoManagerRef.current) {
        await intelligentVideoManagerRef.current.switchToProvider(provider);
        // Only show technical details in development
        if (process.env.NODE_ENV === 'development') {
          addSystemMessage(`[DEV] Manually switched to ${provider}`);
        }
        // In production: Provider switching is invisible to users
      }
    } catch (error) {
      console.error(`Failed to switch to ${provider}:`, error);
      // Only show technical errors in development
      if (process.env.NODE_ENV === 'development') {
        addNotification(`[DEV] Failed to switch to ${provider}`);
      } else {
        addNotification('Connection adjustment failed');
      }
    }
  }, [addSystemMessage, addNotification]);

  // Legacy handler for backward compatibility
  const handleSwitchToJitsi = useCallback(async () => {
    await handleSwitchProvider('jitsi-public');
  }, [handleSwitchProvider]);

  const handleOpenSettings = useCallback(() => {
    setShowSettings(true);
  }, []);

  const handleApplySettings = useCallback(async (newSettings: SessionSettings) => {
    setSessionSettings(newSettings);
    
    // Apply default mute states if user wants them using unified controls
    if (newSettings.defaultAudioMuted !== mediaState.isAudioMuted) {
      await controls.setAudioMuted(newSettings.defaultAudioMuted);
    }
    if (newSettings.defaultVideoOff !== mediaState.isVideoOff) {
      await controls.setVideoOff(newSettings.defaultVideoOff);
    }
    
    addSystemMessage('Settings updated');
  }, [mediaState.isAudioMuted, mediaState.isVideoOff, controls, addSystemMessage]);

  // Safety disclaimer handlers
  const handleAcceptDisclaimer = useCallback(() => {
    setShowSafetyDisclaimer(false);
    setShowCameraPreview(true);
    setIsReadyToJoin(true);
    // Only show essential session info, not camera setup instructions
    // addSystemMessage('🎥 Welcome! Set up your camera and join when ready.', true);
  }, [addSystemMessage]);

  const handleDeclineDisclaimer = useCallback(() => {
    // User declined, go back to dashboard
    router.push('/dashboard');
  }, [router]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intelligentVideoManagerRef.current) {
        intelligentVideoManagerRef.current.dispose();
      }
      if (webrtcManagerRef.current) {
        webrtcManagerRef.current.endCall();
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
      if (autoJoinTimeoutRef.current) {
        clearTimeout(autoJoinTimeoutRef.current);
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

  // Show safety disclaimer first
  if (showSafetyDisclaimer) {
    return (
      <>
        <SessionSafetyDisclaimer
          isOpen={showSafetyDisclaimer}
          onAccept={handleAcceptDisclaimer}
          onDecline={handleDeclineDisclaimer}
          sessionTitle={topic?.title}
        />
        {/* Background loading indicator (subtle) */}
        <div className="fixed inset-0 bg-black flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-400/30 mx-auto mb-2"></div>
            <p className="text-rose-200/50 text-sm">Preparing session...</p>
          </div>
        </div>
      </>
    );
  }

  // Show camera preview and join interface
  if (showCameraPreview && sessionState !== 'connected') {
    return (
      <div 
        className="fixed inset-0 w-full h-full bg-black text-white overflow-hidden"
        style={cssProperties}
      >
        {/* Enhanced Top Navigation with Safe Area */}
        <div 
          className="absolute left-4 z-50"
          style={{ top: `${safeZones.top + 8}px` }}
        >
          <EnhancedButton
            onClick={fastSession.backToDashboard}
            variant="ghost"
            touchTarget="medium"
            safeArea={true}
            className="text-white hover:bg-white/10"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="hidden sm:inline">Back</span>
          </EnhancedButton>
        </div>

        <div 
          className="h-full flex flex-col px-4"
          style={{ 
            paddingTop: `${safeZones.top + 60}px`,
            paddingBottom: `${safeZones.bottom + 80}px`, // Increased bottom padding for mobile nav
            minHeight: `calc(100vh - ${safeZones.top + safeZones.bottom + 140}px)` // Ensure content fits
          }}
        >
          {/* Enhanced Camera Preview Section */}
          <div className="flex justify-center mb-4">
            <div 
              className="w-full max-w-sm"
              style={{
                maxWidth: window.innerWidth < 400 ? '280px' : 
                         window.innerWidth < 600 ? '320px' : '400px'
              }}
            >
              <CameraPreview 
                onStreamReady={handleCameraReady}
                onError={handleCameraError}
                onDeviceInfo={handleDeviceInfo}
                className="w-full"
                connectionOptimized={connectionOptimized}
              />
            </div>
          </div>
          
          {/* Action Section - All content below camera */}
          <div className="flex-1 flex flex-col justify-center px-3 sm:px-4 min-h-0">
            <div className="text-center space-y-3 max-w-sm mx-auto">
              
              {/* Session Info - Compact */}
              <div className="space-y-1">
                <h2 className="text-sm font-semibold text-white leading-tight">
                  {topic?.title || 'Session'}
                </h2>
                <p className="text-gray-400 text-xs leading-tight">
                  Use video/audio buttons above to adjust preferences
                </p>
              </div>

              {/* Technical status removed from user interface - available in admin panel */}

              {/* Connection Status (only show when connecting) */}
              {hasJoinedSession && (
                <div className="flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-rose-400"></div>
                  <p className="text-gray-300 text-xs">
                    {sessionState === 'connecting' && 'Connecting...'}
                    {sessionState === 'reconnecting' && 'Reconnecting...'}
                    {sessionState === 'failed' && 'Connection failed...'}
                  </p>
                </div>
              )}

              {/* Provider info removed from user interface */}

              {/* Auto-join status and controls */}
              {connectionOptimized && autoJoinEnabled && autoJoinCountdown !== null && (
                <div className="bg-green-900/30 border border-green-600/30 rounded-lg p-3 mb-4">
                  <div className="text-center">
                    <p className="text-green-400 text-sm font-medium mb-2">
                      🚀 Connection optimized! Auto-joining in {autoJoinCountdown}s
                    </p>
                    <EnhancedButton
                      onClick={handleCancelAutoJoin}
                      variant="outline"
                      touchTarget="compact"
                      className="bg-transparent border-green-600/50 text-green-400 hover:bg-green-900/50 text-xs"
                    >
                      Cancel Auto-join
                    </EnhancedButton>
                  </div>
                </div>
              )}

              {/* Connection status indicator */}
              {/* Connection optimization runs silently in background */}

              {/* Enhanced Action Buttons */}
              {!hasJoinedSession && (
                <>
                  <ButtonGroup>
                    <EnhancedButton
                      onClick={fastSession.backToDashboard}
                      variant="outline"
                      touchTarget="auto"
                      safeArea={true}
                      className="bg-transparent border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-white"
                    >
                      Back
                    </EnhancedButton>
                    
                    <EnhancedButton
                      onClick={handleJoinSession}
                      touchTarget="auto"
                      safeArea={true}
                      haptic={true}
                      className={connectionOptimized 
                        ? "bg-green-600 hover:bg-green-700 text-white" 
                        : "bg-rose-600 hover:bg-rose-700 text-white"
                      }
                    >
                      {connectionOptimized ? "Join Session (Optimized)" : "Join Session"}
                    </EnhancedButton>
                  </ButtonGroup>
                  
                  {/* Auto-join toggle */}
                  <div className="flex items-center justify-center gap-2 mt-2">
                    <label className="flex items-center gap-2 text-xs text-gray-400 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={autoJoinEnabled}
                        onChange={(e) => setAutoJoinEnabled(e.target.checked)}
                        className="w-3 h-3 text-rose-600 bg-gray-700 border-gray-600 rounded focus:ring-rose-500 focus:ring-2"
                      />
                      Auto-join when connection is ready
                    </label>
                  </div>
                </>
              )}

              {/* Enhanced Cancel button when connecting */}
              {hasJoinedSession && sessionState === 'connecting' && (
                <EnhancedButton
                  onClick={fastSession.backToDashboard}
                  variant="outline"
                  touchTarget="medium"
                  safeArea={true}
                  className="bg-transparent border-gray-600 text-gray-400 hover:bg-gray-800"
                >
                  Cancel
                </EnhancedButton>
              )}
            </div>
          </div>

          {/* Notifications */}
          {notifications.length > 0 && (
            <div className="absolute top-4 left-1/2 transform -translate-x-1/2 space-y-2 z-50 w-full max-w-xs px-4">
              {notifications.slice(-2).map((notification, index) => (
                <div
                  key={index}
                  className="bg-black/80 backdrop-blur-sm text-white px-3 py-2 rounded-lg shadow-lg text-sm text-center"
                >
                  {notification}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Render video container when using managed video services, initializing, or pre-initializing
  if (isInitializingVideo || isPreInitializing || (currentProvider && currentProvider !== 'webrtc')) {
    return (
      <div className="fixed inset-0 w-full h-full bg-black overflow-hidden box-border" style={{ width: '100vw', height: '100vh', maxWidth: '100vw', maxHeight: '100vh', margin: 0, padding: 0 }}>
        <div id="video-container" className="w-full h-full" />
        
        {/* Loading indicator when initializing */}
        {isInitializingVideo && !currentProvider && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <div className="text-white text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
              <p>Connecting to video service...</p>
            </div>
          </div>
        )}
        
        {/* Provider indicator removed from user interface */}

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

        {/* Developer Tools - Only visible in development */}
        {process.env.NODE_ENV === 'development' && (
          <div className="absolute bottom-4 left-4 z-50">
            <details className="bg-black/80 rounded p-2">
              <summary className="text-white text-xs cursor-pointer mb-2">🔧 Dev Tools</summary>
              <div className="flex gap-2">
                <button
                  onClick={() => handleSwitchProvider('jitsi-public')}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded text-xs"
                  title="Switch to Jitsi Meet"
                >
                  Jitsi
                </button>
                <button
                  onClick={() => handleSwitchProvider('daily')}
                  className="bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded text-xs"
                  title="Switch to Daily.co"
                >
                  Daily
                </button>
                <div className="text-white text-xs ml-2">
                  Current: {currentProvider || 'None'}
                </div>
              </div>
            </details>
          </div>
        )}
      </div>
    );
  }



  return (
    <>
      <HarthioSessionUI
        localVideoRef={localVideoRef}
        remoteVideoRef={remoteVideoRef}
        sessionState={sessionState}
        connectionQuality={connectionQuality}
        connectionStats={connectionStats}
        isAudioMuted={mediaState.isAudioMuted}
        isVideoOff={mediaState.isVideoOff}
        isRemoteAudioMuted={isRemoteAudioMuted}
        isRemoteVideoOff={isRemoteVideoOff}
        currentUserName={userProfile?.display_name || 'You'}
        currentUserId={user?.uid}
        otherUserName={otherUserName}
        sessionDuration={sessionDuration}
        timeRemaining={timeRemaining}
        sessionId={sessionId as string}
        sessionTitle={topic?.title}
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
        currentProvider={currentProvider}
        onSwitchProvider={handleSwitchProvider}
        userStream={userStream}
        deviceInfo={deviceInfo}
        remoteDeviceInfo={remoteDeviceInfo}
        onSendDeviceInfo={sendDeviceInfoToRemote}
      />
      
      {/* Session Settings Modal */}
      <SessionSettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        onApplySettings={handleApplySettings}
      />
    </>
  );
}