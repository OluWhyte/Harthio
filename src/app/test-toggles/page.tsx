'use client';

import { useState, useRef, useEffect } from 'react';
import { VideoServiceManager, VideoServiceConfig, VideoServiceCallbacks } from '@/lib/video-service-manager';

export default function TestTogglesPage() {
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [currentService, setCurrentService] = useState<string>('none');
  const [logs, setLogs] = useState<string[]>([]);
  
  const videoServiceManagerRef = useRef<VideoServiceManager | null>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  const addLog = (message: string) => {
    console.log(message);
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const initializeVideoService = async () => {
    addLog('🚀 Initializing video service for toggle testing...');
    
    const config: VideoServiceConfig = {
      sessionId: 'test-toggles-123',
      userId: 'test-user-1',
      userName: 'Test User',
      userEmail: 'test@example.com',
      otherUserId: 'test-user-2'
    };

    const callbacks: VideoServiceCallbacks = {
      onStateChange: (state) => {
        addLog(`📊 State: ${state}`);
      },
      onConnectionStats: (stats) => {
        addLog(`📊 Quality: ${stats.quality}, Latency: ${stats.latency}ms`);
      },
      onLocalStream: (stream) => {
        addLog('📹 Local stream received');
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
          addLog('📹 Local stream attached to video element');
        }
      },
      onRemoteStream: (stream) => {
        addLog('🎥 Remote stream received');
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = stream;
          addLog('🎥 Remote stream attached to video element');
        }
      },
      onMessage: () => {},
      onError: (error) => {
        addLog(`❌ Error: ${error}`);
      }
    };

    const videoManager = new VideoServiceManager(config, callbacks);
    videoServiceManagerRef.current = videoManager;

    try {
      await videoManager.initialize();
      const service = videoManager.getCurrentService();
      setCurrentService(service);
      addLog(`✅ Video service initialized: ${service}`);
    } catch (error) {
      addLog(`❌ Failed to initialize: ${error}`);
    }
  };

  const testToggleAudio = async () => {
    addLog('🎤 Testing audio toggle...');
    if (videoServiceManagerRef.current) {
      try {
        const result = await videoServiceManagerRef.current.toggleAudio();
        setIsAudioMuted(result);
        addLog(`🎤 Audio toggle result: ${result ? 'muted' : 'unmuted'}`);
      } catch (error) {
        addLog(`❌ Audio toggle failed: ${error}`);
      }
    } else {
      addLog('❌ No video service manager available');
    }
  };

  const testToggleVideo = async () => {
    addLog('📹 Testing video toggle...');
    if (videoServiceManagerRef.current) {
      try {
        const result = await videoServiceManagerRef.current.toggleVideo();
        setIsVideoOff(result);
        addLog(`📹 Video toggle result: ${result ? 'off' : 'on'}`);
      } catch (error) {
        addLog(`❌ Video toggle failed: ${error}`);
      }
    } else {
      addLog('❌ No video service manager available');
    }
  };

  const getDebugInfo = () => {
    if (videoServiceManagerRef.current) {
      const status = videoServiceManagerRef.current.getDetailedStatus();
      addLog(`🔍 Debug info: ${JSON.stringify(status)}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Audio/Video Toggle Test</h1>
        
        {/* Status */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-gray-800 p-4 rounded">
            <h3 className="font-semibold mb-2">Current Service</h3>
            <div className="text-lg">{currentService}</div>
          </div>
          <div className="bg-gray-800 p-4 rounded">
            <h3 className="font-semibold mb-2">Audio State</h3>
            <div className={`text-lg ${isAudioMuted ? 'text-red-400' : 'text-green-400'}`}>
              {isAudioMuted ? 'Muted' : 'Unmuted'}
            </div>
          </div>
          <div className="bg-gray-800 p-4 rounded">
            <h3 className="font-semibold mb-2">Video State</h3>
            <div className={`text-lg ${isVideoOff ? 'text-red-400' : 'text-green-400'}`}>
              {isVideoOff ? 'Off' : 'On'}
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <button
            onClick={initializeVideoService}
            className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded"
          >
            Initialize Service
          </button>
          <button
            onClick={testToggleAudio}
            disabled={currentService === 'none'}
            className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 px-4 py-2 rounded"
          >
            Toggle Audio
          </button>
          <button
            onClick={testToggleVideo}
            disabled={currentService === 'none'}
            className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 px-4 py-2 rounded"
          >
            Toggle Video
          </button>
          <button
            onClick={getDebugInfo}
            className="bg-orange-600 hover:bg-orange-700 px-4 py-2 rounded"
          >
            Debug Info
          </button>
        </div>

        {/* Video Elements */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="bg-black rounded-lg overflow-hidden h-64">
            <h3 className="bg-gray-800 px-4 py-2 text-sm font-semibold">Local Video</h3>
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
          </div>
          <div className="bg-black rounded-lg overflow-hidden h-64">
            <h3 className="bg-gray-800 px-4 py-2 text-sm font-semibold">Remote Video</h3>
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        {/* Logs */}
        <div className="bg-black rounded-lg p-4">
          <h3 className="font-semibold mb-2">Debug Logs</h3>
          <div className="h-64 overflow-y-auto text-sm font-mono space-y-1">
            {logs.map((log, index) => (
              <div key={index} className="text-green-400">
                {log}
              </div>
            ))}
          </div>
        </div>

        <div className="mt-4 text-sm text-gray-400">
          <p>🎯 This page tests audio/video toggle functionality across different providers</p>
          <p>📊 Check the console and logs above to debug toggle issues</p>
        </div>
      </div>
    </div>
  );
}