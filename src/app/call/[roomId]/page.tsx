/**
 * LiveKit Call Page
 * Clean, custom video calling interface
 */

'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { LiveKitService, type LiveKitConfig, type LiveKitCallbacks } from '@/lib/livekit-service';
import { RemoteParticipant, RemoteTrack, ConnectionState } from 'livekit-client';
import { Button } from '@/components/ui/button';
import { 
  Mic, 
  MicOff, 
  Video, 
  VideoOff, 
  Phone, 
  PhoneOff,
  Settings,
  Users,
  MessageSquare,
  Send,
  X
} from 'lucide-react';

export default function CallPage() {
  const { roomId } = useParams();
  const { user, userProfile } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  // State
  const [connectionState, setConnectionState] = useState<ConnectionState>(ConnectionState.Disconnected);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [participantCount, setParticipantCount] = useState(0);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Chat state
  const [showChat, setShowChat] = useState(false);
  const [messages, setMessages] = useState<Array<{
    id: string;
    userId: string;
    userName: string;
    content: string;
    timestamp: Date;
    type: 'text' | 'system';
  }>>([]);
  const [newMessage, setNewMessage] = useState('');

  // Refs
  const liveKitServiceRef = useRef<LiveKitService | null>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  // LiveKit callbacks
  const liveKitCallbacks: LiveKitCallbacks = {
    onConnected: () => {
      console.log('✅ Connected to call');
      setConnectionState(ConnectionState.Connected);
      setIsConnecting(false);
      toast({
        title: 'Connected',
        description: 'You\'re now in the call',
      });
    },

    onDisconnected: () => {
      console.log('📞 Disconnected from call');
      setConnectionState(ConnectionState.Disconnected);
      setParticipantCount(0);
    },

    onParticipantJoined: (participant: RemoteParticipant) => {
      console.log('👤 Participant joined:', participant.identity);
      setParticipantCount(prev => prev + 1);
      toast({
        title: 'Participant Joined',
        description: `${participant.name || 'Someone'} joined the call`,
      });
    },

    onParticipantLeft: (participant: RemoteParticipant) => {
      console.log('👤 Participant left:', participant.identity);
      setParticipantCount(prev => Math.max(0, prev - 1));
      toast({
        title: 'Participant Left',
        description: `${participant.name || 'Someone'} left the call`,
      });
    },

    onTrackSubscribed: (track: RemoteTrack, participant: RemoteParticipant) => {
      console.log('📹 Track subscribed:', track.kind);
      
      if (track.kind === 'video' && remoteVideoRef.current) {
        const element = track.attach();
        remoteVideoRef.current.srcObject = element.srcObject;
      }
    },

    onTrackUnsubscribed: (track: RemoteTrack, participant: RemoteParticipant) => {
      console.log('📹 Track unsubscribed:', track.kind);
      
      if (track.kind === 'video' && remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = null;
      }
    },

    onError: (error: Error) => {
      console.error('❌ LiveKit error:', error);
      setError(error.message);
      toast({
        variant: 'destructive',
        title: 'Call Error',
        description: error.message,
      });
    },

    onConnectionStateChanged: (state: ConnectionState) => {
      console.log('🔗 Connection state:', state);
      setConnectionState(state);
    },
  };

  // Initialize call
  const initializeCall = useCallback(async () => {
    if (!user || !userProfile || !roomId) return;

    setIsConnecting(true);
    setError(null);

    try {
      // Get LiveKit token
      const response = await fetch('/api/livekit/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId: roomId,
          participantName: userProfile.display_name || user.email || 'Anonymous',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to get call token');
      }

      const { token, serverUrl, participantName } = await response.json();

      // Initialize LiveKit service
      const config: LiveKitConfig = {
        serverUrl,
        roomName: roomId as string,
        participantName,
        token,
      };

      const service = new LiveKitService(config, liveKitCallbacks);
      liveKitServiceRef.current = service;

      // Connect to room
      await service.connect();
      
      // Enable camera and microphone
      await service.enableCameraAndMicrophone();

      // Attach local video
      const localVideoElement = service.getLocalVideoElement();
      if (localVideoElement && localVideoRef.current) {
        localVideoRef.current.srcObject = localVideoElement.srcObject;
      }

      // Update participant count
      setParticipantCount(service.getParticipantCount());

    } catch (error) {
      console.error('❌ Failed to initialize call:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to join call';
      setError(errorMessage);
      setIsConnecting(false);
      
      toast({
        variant: 'destructive',
        title: 'Connection Failed',
        description: errorMessage,
      });
    }
  }, [user, userProfile, roomId, liveKitCallbacks, toast]);

  // Toggle microphone
  const toggleMicrophone = useCallback(async () => {
    if (!liveKitServiceRef.current) return;

    try {
      const newMutedState = await liveKitServiceRef.current.toggleMicrophone();
      setIsAudioMuted(newMutedState);
    } catch (error) {
      console.error('Failed to toggle microphone:', error);
    }
  }, []);

  // Toggle camera
  const toggleCamera = useCallback(async () => {
    if (!liveKitServiceRef.current) return;

    try {
      const newEnabledState = await liveKitServiceRef.current.toggleCamera();
      setIsVideoOff(!newEnabledState);
    } catch (error) {
      console.error('Failed to toggle camera:', error);
    }
  }, []);

  // End call
  const endCall = useCallback(async () => {
    if (liveKitServiceRef.current) {
      await liveKitServiceRef.current.disconnect();
      liveKitServiceRef.current = null;
    }
    router.push('/dashboard');
  }, [router]);

  // Send message
  const sendMessage = useCallback(() => {
    if (!newMessage.trim() || !user) return;

    const message = {
      id: Date.now().toString(),
      userId: user.id,
      userName: userProfile?.display_name || user.email || 'You',
      content: newMessage.trim(),
      timestamp: new Date(),
      type: 'text' as const
    };

    setMessages(prev => [...prev, message]);
    setNewMessage('');

    // TODO: Send message through LiveKit data channel when implemented
    console.log('Message sent:', message);
  }, [newMessage, user, userProfile]);

  // Handle Enter key in chat
  const handleChatKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }, [sendMessage]);

  // Initialize on mount
  useEffect(() => {
    if (user && userProfile) {
      initializeCall();
    }

    return () => {
      // Cleanup on unmount
      if (liveKitServiceRef.current) {
        liveKitServiceRef.current.disconnect();
      }
    };
  }, [user, userProfile, initializeCall]);

  // Loading state
  if (!user || !userProfile) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !isConnecting) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-center max-w-md">
          <div className="text-red-400 text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold mb-4">Connection Failed</h1>
          <p className="text-gray-300 mb-6">{error}</p>
          <div className="space-x-4">
            <Button onClick={initializeCall} variant="outline">
              Try Again
            </Button>
            <Button onClick={() => router.push('/dashboard')}>
              Back to Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-gray-900">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <Users className="h-5 w-5" />
            <span className="text-sm">{participantCount} participant{participantCount !== 1 ? 's' : ''}</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${
              connectionState === ConnectionState.Connected ? 'bg-green-400' : 
              connectionState === ConnectionState.Connecting ? 'bg-yellow-400' : 
              'bg-red-400'
            }`} />
            <span className="text-sm capitalize">{connectionState}</span>
          </div>
        </div>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push('/dashboard')}
        >
          Back to Dashboard
        </Button>
      </div>

      {/* Video Area */}
      <div className="flex-1 relative">
        {/* Remote Video (Main) */}
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          muted={false}
          className="w-full h-full object-cover"
        />
        
        {/* Local Video (Picture-in-Picture) */}
        <div className="absolute top-4 right-4 w-48 h-36 bg-gray-800 rounded-lg overflow-hidden border-2 border-gray-600">
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
        </div>

        {/* Connecting Overlay */}
        {isConnecting && (
          <div className="absolute inset-0 bg-black bg-opacity-75 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
              <p className="text-xl">Connecting to call...</p>
            </div>
          </div>
        )}

        {/* No Remote Video Placeholder */}
        {connectionState === ConnectionState.Connected && participantCount === 1 && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
            <div className="text-center">
              <Users className="h-16 w-16 mx-auto mb-4 text-gray-400" />
              <p className="text-xl text-gray-300">Waiting for others to join...</p>
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="p-6 bg-gray-900">
        <div className="flex items-center justify-center space-x-6">
          {/* Microphone Toggle */}
          <Button
            onClick={toggleMicrophone}
            size="lg"
            variant={isAudioMuted ? "destructive" : "secondary"}
            className="rounded-full w-14 h-14"
          >
            {isAudioMuted ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
          </Button>

          {/* Camera Toggle */}
          <Button
            onClick={toggleCamera}
            size="lg"
            variant={isVideoOff ? "destructive" : "secondary"}
            className="rounded-full w-14 h-14"
          >
            {isVideoOff ? <VideoOff className="h-6 w-6" /> : <Video className="h-6 w-6" />}
          </Button>

          {/* Chat Toggle */}
          <Button
            onClick={() => setShowChat(!showChat)}
            size="lg"
            variant={showChat ? "default" : "secondary"}
            className="rounded-full w-14 h-14"
          >
            <MessageSquare className="h-6 w-6" />
          </Button>

          {/* End Call */}
          <Button
            onClick={endCall}
            size="lg"
            variant="destructive"
            className="rounded-full w-14 h-14"
          >
            <PhoneOff className="h-6 w-6" />
          </Button>
        </div>

        {/* Status Text */}
        <div className="text-center mt-4 text-sm text-gray-400">
          {connectionState === ConnectionState.Connected ? (
            participantCount > 1 ? 'In call' : 'Waiting for others'
          ) : (
            'Connecting...'
          )}
        </div>
      </div>

      {/* Chat Panel */}
      {showChat && (
        <div className="absolute right-0 top-0 bottom-0 w-80 bg-gray-800 border-l border-gray-700 flex flex-col">
          {/* Chat Header */}
          <div className="p-4 border-b border-gray-700 flex items-center justify-between">
            <h3 className="text-white font-semibold">Chat</h3>
            <Button
              onClick={() => setShowChat(false)}
              variant="ghost"
              size="sm"
              className="text-gray-400 hover:text-white"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 ? (
              <div className="text-center text-gray-400 text-sm">
                No messages yet. Start the conversation!
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.userId === user?.id ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs px-3 py-2 rounded-lg text-sm ${
                      message.userId === user?.id
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-700 text-gray-100'
                    }`}
                  >
                    {message.userId !== user?.id && (
                      <div className="text-xs text-gray-300 mb-1">
                        {message.userName}
                      </div>
                    )}
                    <div>{message.content}</div>
                    <div className="text-xs opacity-70 mt-1">
                      {message.timestamp.toLocaleTimeString([], { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Message Input */}
          <div className="p-4 border-t border-gray-700">
            <div className="flex space-x-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={handleChatKeyPress}
                placeholder="Type a message..."
                className="flex-1 px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none text-sm"
              />
              <Button
                onClick={sendMessage}
                disabled={!newMessage.trim()}
                size="sm"
                className="px-3"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}