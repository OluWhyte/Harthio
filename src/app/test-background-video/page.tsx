'use client';

import { useState, useEffect } from 'react';
import { 
  createBackgroundVideoService, 
  getBackgroundVideoService, 
  clearBackgroundVideoService,
  BackgroundVideoState 
} from '@/lib/background-video-service';
import { VideoServiceConfig } from '@/lib/video-service-manager';

export default function TestBackgroundVideoPage() {
  const [state, setState] = useState<BackgroundVideoState>({
    isInitializing: false,
    isReady: false,
    hasError: false,
    currentService: 'none'
  });
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    console.log(message);
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const startBackgroundInit = () => {
    addLog('🚀 Starting background video initialization...');
    
    const config: VideoServiceConfig = {
      sessionId: 'test-session-123',
      userId: 'test-user-1',
      userName: 'Test User 1',
      userEmail: 'test@example.com',
      otherUserId: 'test-user-2'
    };

    const service = createBackgroundVideoService(config, {
      onStateChange: (newState) => {
        setState(newState);
        addLog(`📊 State: ${newState.isInitializing ? 'Initializing' : ''} ${newState.isReady ? 'Ready' : ''} ${newState.hasError ? 'Error' : ''} (${newState.currentService})`);
      },
      onReady: (videoManager) => {
        addLog('✅ Background video service ready! Video call will start instantly.');
      },
      onError: (error) => {
        addLog(`❌ Error: ${error}`);
      }
    });

    service.startBackgroundInit();
  };

  const checkService = () => {
    const service = getBackgroundVideoService();
    if (service) {
      const currentState = service.getState();
      addLog(`📋 Current service state: Ready=${currentState.isReady}, Service=${currentState.currentService}`);
      
      const videoManager = service.getVideoManager();
      addLog(`🎥 Video manager available: ${!!videoManager}`);
    } else {
      addLog('❌ No background service found');
    }
  };

  const simulateTransfer = () => {
    const service = getBackgroundVideoService();
    if (service) {
      addLog('🔄 Simulating transfer to main session...');
      
      // This would normally be done with real callbacks
      const mockCallbacks = {
        onStateChange: () => {},
        onConnectionStats: () => {},
        onMessage: () => {},
        onError: () => {}
      };
      
      const videoManager = service.transferToMainSession(mockCallbacks);
      if (videoManager) {
        addLog('✅ Video manager transferred successfully!');
        addLog('🎉 Instant video connection would be established!');
      } else {
        addLog('❌ Transfer failed - service not ready');
      }
    } else {
      addLog('❌ No service to transfer');
    }
  };

  const clearService = () => {
    clearBackgroundVideoService();
    setState({
      isInitializing: false,
      isReady: false,
      hasError: false,
      currentService: 'none'
    });
    addLog('🧹 Background service cleared');
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Background Video Service Test</h1>
        
        {/* Status */}
        <div className="bg-gray-800 p-6 rounded-lg mb-6">
          <h2 className="text-xl font-semibold mb-4">Current Status</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <div className="text-gray-400">Initializing</div>
              <div className={state.isInitializing ? 'text-yellow-400' : 'text-gray-600'}>
                {state.isInitializing ? 'Yes' : 'No'}
              </div>
            </div>
            <div>
              <div className="text-gray-400">Ready</div>
              <div className={state.isReady ? 'text-green-400' : 'text-gray-600'}>
                {state.isReady ? 'Yes' : 'No'}
              </div>
            </div>
            <div>
              <div className="text-gray-400">Has Error</div>
              <div className={state.hasError ? 'text-red-400' : 'text-gray-600'}>
                {state.hasError ? 'Yes' : 'No'}
              </div>
            </div>
            <div>
              <div className="text-gray-400">Service</div>
              <div className="text-blue-400">{state.currentService}</div>
            </div>
          </div>
          {state.errorMessage && (
            <div className="mt-4 p-3 bg-red-900/50 border border-red-500 rounded text-red-200">
              {state.errorMessage}
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <button
            onClick={startBackgroundInit}
            disabled={state.isInitializing || state.isReady}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 px-4 py-2 rounded"
          >
            Start Background Init
          </button>
          <button
            onClick={checkService}
            className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded"
          >
            Check Service
          </button>
          <button
            onClick={simulateTransfer}
            disabled={!state.isReady}
            className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 px-4 py-2 rounded"
          >
            Simulate Transfer
          </button>
          <button
            onClick={clearService}
            className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded"
          >
            Clear Service
          </button>
        </div>

        {/* Simulation Flow */}
        <div className="bg-gray-800 p-6 rounded-lg mb-6">
          <h2 className="text-xl font-semibold mb-4">Simulation Flow</h2>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
              <span>1. User clicks "Join Session" on dashboard</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
              <span>2. Pre-call setup page loads + background video starts initializing</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <span>3. User tests camera/mic while video connects in background</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
              <span>4. User clicks "Join Session" → instant video connection!</span>
            </div>
          </div>
        </div>

        {/* Logs */}
        <div className="bg-black rounded-lg p-4">
          <h3 className="font-semibold mb-2">Real-time Logs</h3>
          <div className="h-64 overflow-y-auto text-sm font-mono space-y-1">
            {logs.map((log, index) => (
              <div key={index} className="text-green-400">
                {log}
              </div>
            ))}
          </div>
        </div>

        <div className="mt-4 text-sm text-gray-400">
          <p>🚀 This simulates the background video initialization that happens during pre-call setup</p>
          <p>✨ In real usage, video calls will start instantly when users finish device testing</p>
        </div>
      </div>
    </div>
  );
}