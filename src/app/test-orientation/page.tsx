'use client';

import { useState, useRef, useEffect } from 'react';
import { DeviceOrientationService, DeviceVideoMetadata } from '@/lib/device-orientation-service';
import { VideoLayoutManager } from '@/lib/video-layout-manager';

export default function TestOrientationPage() {
  const [localMetadata, setLocalMetadata] = useState<DeviceVideoMetadata | null>(null);
  const [remoteMetadata, setRemoteMetadata] = useState<DeviceVideoMetadata | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const localContainerRef = useRef<HTMLDivElement>(null);
  const remoteContainerRef = useRef<HTMLDivElement>(null);
  
  const orientationServiceRef = useRef<DeviceOrientationService | null>(null);
  const layoutManagerRef = useRef<VideoLayoutManager | null>(null);

  const addLog = (message: string) => {
    console.log(message);
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  useEffect(() => {
    // Initialize services
    const orientationService = new DeviceOrientationService({
      onOrientationChange: (metadata) => {
        addLog(`📱 Local orientation: ${metadata.deviceType} ${metadata.orientation} (${metadata.videoWidth}x${metadata.videoHeight})`);
        setLocalMetadata(metadata);
        layoutManagerRef.current?.updateLocalMetadata(metadata);
      },
      onRemoteOrientationChange: (metadata) => {
        addLog(`📱 Remote orientation: ${metadata.deviceType} ${metadata.orientation} (${metadata.videoWidth}x${metadata.videoHeight})`);
        setRemoteMetadata(metadata);
        layoutManagerRef.current?.updateRemoteMetadata(metadata);
      }
    });

    const layoutManager = new VideoLayoutManager({
      localVideoRef,
      remoteVideoRef,
      localContainerRef,
      remoteContainerRef
    });

    orientationServiceRef.current = orientationService;
    layoutManagerRef.current = layoutManager;

    // Start monitoring
    orientationService.startListening();
    addLog('🚀 Orientation monitoring started');

    return () => {
      orientationService.stopListening();
      addLog('🛑 Orientation monitoring stopped');
    };
  }, []);

  const simulateRemoteOrientation = (deviceType: 'mobile' | 'tablet' | 'desktop', orientation: 'portrait' | 'landscape') => {
    const mockMetadata: DeviceVideoMetadata = {
      videoWidth: orientation === 'portrait' ? 720 : 1280,
      videoHeight: orientation === 'portrait' ? 1280 : 720,
      videoAspectRatio: orientation === 'portrait' ? 0.5625 : 1.7778,
      deviceType,
      orientation,
      screenWidth: orientation === 'portrait' ? 375 : 812,
      screenHeight: orientation === 'portrait' ? 812 : 375,
      screenAspectRatio: orientation === 'portrait' ? 0.4619 : 2.1653,
      preferredDisplayMode: deviceType === 'mobile' && orientation === 'portrait' ? 'contain' : 'cover',
      timestamp: Date.now()
    };

    orientationServiceRef.current?.handleRemoteMetadata(mockMetadata);
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: 1280, height: 720 }, 
        audio: false 
      });
      
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
        addLog('📹 Local camera started');
        
        // Update orientation service with video stream
        orientationServiceRef.current?.updateVideoStreamMetadata(stream);
      }
    } catch (error) {
      addLog(`❌ Camera error: ${error}`);
    }
  };

  const simulateRemoteVideo = () => {
    // Create a colored canvas as fake remote video
    const canvas = document.createElement('canvas');
    canvas.width = 1280;
    canvas.height = 720;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#e11d48';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = 'white';
      ctx.font = '48px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('Remote User', canvas.width / 2, canvas.height / 2);
    }
    
    const stream = canvas.captureStream();
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = stream;
      addLog('🎥 Remote video simulated');
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Device Orientation Test</h1>
        
        {/* Controls */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <button
            onClick={startCamera}
            className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded"
          >
            Start Camera
          </button>
          <button
            onClick={simulateRemoteVideo}
            className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded"
          >
            Simulate Remote
          </button>
          <button
            onClick={() => simulateRemoteOrientation('mobile', 'portrait')}
            className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded text-sm"
          >
            Remote: Mobile Portrait
          </button>
          <button
            onClick={() => simulateRemoteOrientation('desktop', 'landscape')}
            className="bg-orange-600 hover:bg-orange-700 px-4 py-2 rounded text-sm"
          >
            Remote: Desktop Landscape
          </button>
        </div>

        {/* Status */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="bg-gray-800 p-4 rounded">
            <h3 className="font-semibold mb-2">Local Device</h3>
            {localMetadata ? (
              <div className="text-sm space-y-1">
                <div>Type: {localMetadata.deviceType}</div>
                <div>Orientation: {localMetadata.orientation}</div>
                <div>Screen: {localMetadata.screenWidth}x{localMetadata.screenHeight}</div>
                <div>Video: {localMetadata.videoWidth}x{localMetadata.videoHeight}</div>
                <div>Display Mode: {localMetadata.preferredDisplayMode}</div>
              </div>
            ) : (
              <div className="text-gray-400">No data</div>
            )}
          </div>
          
          <div className="bg-gray-800 p-4 rounded">
            <h3 className="font-semibold mb-2">Remote Device</h3>
            {remoteMetadata ? (
              <div className="text-sm space-y-1">
                <div>Type: {remoteMetadata.deviceType}</div>
                <div>Orientation: {remoteMetadata.orientation}</div>
                <div>Screen: {remoteMetadata.screenWidth}x{remoteMetadata.screenHeight}</div>
                <div>Video: {remoteMetadata.videoWidth}x{remoteMetadata.videoHeight}</div>
                <div>Display Mode: {remoteMetadata.preferredDisplayMode}</div>
              </div>
            ) : (
              <div className="text-gray-400">No data</div>
            )}
          </div>
        </div>

        {/* Video Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Remote Video (Main) */}
          <div className="bg-black rounded-lg overflow-hidden h-96 relative">
            <h3 className="absolute top-2 left-2 bg-black/50 px-2 py-1 rounded text-sm z-10">
              Remote Video (Main)
            </h3>
            <div ref={remoteContainerRef} className="w-full h-full">
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* Local Video (PiP) */}
          <div className="bg-black rounded-lg overflow-hidden h-96 relative">
            <h3 className="absolute top-2 left-2 bg-black/50 px-2 py-1 rounded text-sm z-10">
              Local Video (Picture-in-Picture)
            </h3>
            <div className="relative w-full h-full">
              <div 
                ref={localContainerRef}
                className="absolute top-4 right-4 w-32 h-24 bg-gray-800 rounded border-2 border-rose-400/30"
              >
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover rounded"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Logs */}
        <div className="bg-black rounded-lg p-4">
          <h3 className="font-semibold mb-2">Real-time Logs</h3>
          <div className="h-48 overflow-y-auto text-sm font-mono space-y-1">
            {logs.map((log, index) => (
              <div key={index} className="text-green-400">
                {log}
              </div>
            ))}
          </div>
        </div>

        <div className="mt-4 text-sm text-gray-400">
          <p>📱 Rotate your device or resize the window to test real-time orientation detection</p>
          <p>🎥 Use the buttons to simulate different remote device orientations</p>
        </div>
      </div>
    </div>
  );
}