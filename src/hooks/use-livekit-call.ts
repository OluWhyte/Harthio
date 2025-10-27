/**
 * LiveKit Call Hook
 * Simplified hook for managing LiveKit video calls
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { LiveKitService, type LiveKitConfig, type LiveKitCallbacks } from '@/lib/livekit-service';
import { RemoteParticipant, RemoteTrack, ConnectionState } from 'livekit-client';

export interface UseLiveKitCallConfig {
  roomId: string;
  autoConnect?: boolean;
}

export interface LiveKitCallState {
  // Connection state
  connectionState: ConnectionState;
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
  
  // Participants
  participantCount: number;
  remoteParticipants: RemoteParticipant[];
  
  // Media state
  isAudioMuted: boolean;
  isVideoOff: boolean;
  
  // Video elements
  localVideoElement: HTMLVideoElement | null;
  remoteVideoElement: HTMLVideoElement | null;
}

export interface LiveKitCallActions {
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  toggleMicrophone: () => Promise<void>;
  toggleCamera: () => Promise<void>;
  retry: () => Promise<void>;
}

export function useLiveKitCall(config: UseLiveKitCallConfig) {
  const { user, userProfile } = useAuth();
  const { toast } = useToast();
  
  // State
  const [state, setState] = useState<LiveKitCallState>({
    connectionState: ConnectionState.Disconnected,
    isConnected: false,
    isConnecting: false,
    error: null,
    participantCount: 0,
    remoteParticipants: [],
    isAudioMuted: false,
    isVideoOff: false,
    localVideoElement: null,
    remoteVideoElement: null,
  });

  // Refs
  const liveKitServiceRef = useRef<LiveKitService | null>(null);
  const remoteParticipantsRef = useRef<RemoteParticipant[]>([]);

  // LiveKit callbacks
  const liveKitCallbacks: LiveKitCallbacks = {
    onConnected: () => {
      console.log('✅ Connected to LiveKit room');
      setState(prev => ({
        ...prev,
        connectionState: ConnectionState.Connected,
        isConnected: true,
        isConnecting: false,
        error: null,
      }));
      
      toast({
        title: 'Connected',
        description: 'Successfully joined the call',
      });
    },

    onDisconnected: () => {
      console.log('📞 Disconnected from LiveKit room');
      setState(prev => ({
        ...prev,
        connectionState: ConnectionState.Disconnected,
        isConnected: false,
        isConnecting: false,
        participantCount: 0,
        remoteParticipants: [],
        localVideoElement: null,
        remoteVideoElement: null,
      }));
      
      remoteParticipantsRef.current = [];
    },

    onParticipantJoined: (participant: RemoteParticipant) => {
      console.log('👤 Participant joined:', participant.identity);
      
      remoteParticipantsRef.current.push(participant);
      
      setState(prev => ({
        ...prev,
        participantCount: prev.participantCount + 1,
        remoteParticipants: [...remoteParticipantsRef.current],
      }));
      
      toast({
        title: 'Participant Joined',
        description: `${participant.name || 'Someone'} joined the call`,
      });
    },

    onParticipantLeft: (participant: RemoteParticipant) => {
      console.log('👤 Participant left:', participant.identity);
      
      remoteParticipantsRef.current = remoteParticipantsRef.current.filter(
        p => p.identity !== participant.identity
      );
      
      setState(prev => ({
        ...prev,
        participantCount: Math.max(0, prev.participantCount - 1),
        remoteParticipants: [...remoteParticipantsRef.current],
      }));
      
      toast({
        title: 'Participant Left',
        description: `${participant.name || 'Someone'} left the call`,
      });
    },

    onTrackSubscribed: (track: RemoteTrack, participant: RemoteParticipant) => {
      console.log('📹 Track subscribed:', track.kind, 'from', participant.identity);
      
      if (track.kind === 'video') {
        const element = track.attach() as HTMLVideoElement;
        setState(prev => ({
          ...prev,
          remoteVideoElement: element,
        }));
      }
    },

    onTrackUnsubscribed: (track: RemoteTrack, participant: RemoteParticipant) => {
      console.log('📹 Track unsubscribed:', track.kind, 'from', participant.identity);
      
      if (track.kind === 'video') {
        setState(prev => ({
          ...prev,
          remoteVideoElement: null,
        }));
      }
    },

    onError: (error: Error) => {
      console.error('❌ LiveKit error:', error);
      setState(prev => ({
        ...prev,
        error: error.message,
        isConnecting: false,
      }));
      
      toast({
        variant: 'destructive',
        title: 'Call Error',
        description: error.message,
      });
    },

    onConnectionStateChanged: (connectionState: ConnectionState) => {
      console.log('🔗 Connection state changed:', connectionState);
      setState(prev => ({
        ...prev,
        connectionState,
        isConnected: connectionState === ConnectionState.Connected,
        isConnecting: connectionState === ConnectionState.Connecting,
      }));
    },
  };

  // Connect to call
  const connect = useCallback(async () => {
    if (!user || !userProfile) {
      throw new Error('User not authenticated');
    }

    setState(prev => ({ ...prev, isConnecting: true, error: null }));

    try {
      // Get LiveKit token
      const response = await fetch('/api/livekit/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId: config.roomId,
          participantName: userProfile.display_name || user.email || 'Anonymous',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to get call token');
      }

      const { token, serverUrl, participantName } = await response.json();

      // Initialize LiveKit service
      const liveKitConfig: LiveKitConfig = {
        serverUrl,
        roomName: config.roomId,
        participantName,
        token,
      };

      const service = new LiveKitService(liveKitConfig, liveKitCallbacks);
      liveKitServiceRef.current = service;

      // Connect to room
      await service.connect();
      
      // Enable camera and microphone
      await service.enableCameraAndMicrophone();

      // Get local video element
      const localVideoElement = service.getLocalVideoElement();
      setState(prev => ({
        ...prev,
        localVideoElement,
        participantCount: service.getParticipantCount(),
      }));

    } catch (error) {
      console.error('❌ Failed to connect to call:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to join call';
      
      setState(prev => ({
        ...prev,
        error: errorMessage,
        isConnecting: false,
      }));
      
      throw error;
    }
  }, [user, userProfile, config.roomId, liveKitCallbacks]);

  // Disconnect from call
  const disconnect = useCallback(async () => {
    if (liveKitServiceRef.current) {
      await liveKitServiceRef.current.disconnect();
      liveKitServiceRef.current = null;
    }
  }, []);

  // Toggle microphone
  const toggleMicrophone = useCallback(async () => {
    if (!liveKitServiceRef.current) return;

    try {
      const newMutedState = await liveKitServiceRef.current.toggleMicrophone();
      setState(prev => ({ ...prev, isAudioMuted: newMutedState }));
    } catch (error) {
      console.error('Failed to toggle microphone:', error);
    }
  }, []);

  // Toggle camera
  const toggleCamera = useCallback(async () => {
    if (!liveKitServiceRef.current) return;

    try {
      const newEnabledState = await liveKitServiceRef.current.toggleCamera();
      setState(prev => ({ ...prev, isVideoOff: !newEnabledState }));
    } catch (error) {
      console.error('Failed to toggle camera:', error);
    }
  }, []);

  // Retry connection
  const retry = useCallback(async () => {
    await disconnect();
    await connect();
  }, [disconnect, connect]);

  // Auto-connect if enabled
  useEffect(() => {
    if (config.autoConnect && user && userProfile) {
      connect().catch(console.error);
    }

    return () => {
      // Cleanup on unmount
      if (liveKitServiceRef.current) {
        liveKitServiceRef.current.disconnect();
      }
    };
  }, [config.autoConnect, user, userProfile, connect]);

  // Update media states periodically
  useEffect(() => {
    if (!liveKitServiceRef.current || !state.isConnected) return;

    const updateStates = () => {
      const currentStates = liveKitServiceRef.current?.getCurrentStates();
      if (currentStates) {
        setState(prev => ({
          ...prev,
          isAudioMuted: currentStates.isAudioMuted,
          isVideoOff: currentStates.isVideoOff,
        }));
      }
    };

    const interval = setInterval(updateStates, 1000);
    return () => clearInterval(interval);
  }, [state.isConnected]);

  const actions: LiveKitCallActions = {
    connect,
    disconnect,
    toggleMicrophone,
    toggleCamera,
    retry,
  };

  return {
    state,
    actions,
    service: liveKitServiceRef.current,
  };
}