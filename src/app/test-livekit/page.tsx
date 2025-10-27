/**
 * LiveKit Test Page
 * Simple page to test LiveKit integration before deployment
 */

'use client';

import React, { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useLiveKitCall } from '@/hooks/use-livekit-call';
import { ConnectionState } from 'livekit-client';

export default function TestLiveKitPage() {
  const { user, userProfile } = useAuth();
  const [testRoomId] = useState('test-room-' + Date.now());
  
  const { state, actions } = useLiveKitCall({
    roomId: testRoomId,
    autoConnect: false
  });

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Authentication Required</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">Please log in to test LiveKit functionality.</p>
            <Button onClick={() => window.location.href = '/login'} className="w-full">
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">LiveKit Test Page</h1>
          <p className="text-gray-600">
            Test LiveKit video calling functionality before deployment.
            {process.env.NODE_ENV === 'development' && (
              <span className="ml-2 px-2 py-1 bg-yellow-100 text-yellow-800 text-sm rounded">
                🧪 Using Mock Service
              </span>
            )}
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Connection Status */}
          <Card>
            <CardHeader>
              <CardTitle>Connection Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${
                  state.connectionState === ConnectionState.Connected ? 'bg-green-500' :
                  state.connectionState === ConnectionState.Connecting ? 'bg-yellow-500' :
                  'bg-red-500'
                }`} />
                <span className="capitalize">{state.connectionState}</span>
              </div>
              
              <div className="text-sm text-gray-600">
                <p>Room ID: {testRoomId}</p>
                <p>Participants: {state.participantCount}</p>
                <p>Audio Muted: {state.isAudioMuted ? 'Yes' : 'No'}</p>
                <p>Video Off: {state.isVideoOff ? 'Yes' : 'No'}</p>
              </div>

              {state.error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
                  Error: {state.error}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Controls */}
          <Card>
            <CardHeader>
              <CardTitle>Controls</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {!state.isConnected ? (
                <Button 
                  onClick={actions.connect} 
                  disabled={state.isConnecting}
                  className="w-full"
                >
                  {state.isConnecting ? 'Connecting...' : 'Connect to Call'}
                </Button>
              ) : (
                <>
                  <Button 
                    onClick={actions.toggleMicrophone}
                    variant={state.isAudioMuted ? 'destructive' : 'secondary'}
                    className="w-full"
                  >
                    {state.isAudioMuted ? 'Unmute Microphone' : 'Mute Microphone'}
                  </Button>
                  
                  <Button 
                    onClick={actions.toggleCamera}
                    variant={state.isVideoOff ? 'destructive' : 'secondary'}
                    className="w-full"
                  >
                    {state.isVideoOff ? 'Turn Camera On' : 'Turn Camera Off'}
                  </Button>
                  
                  <Button 
                    onClick={actions.disconnect}
                    variant="outline"
                    className="w-full"
                  >
                    Disconnect
                  </Button>
                </>
              )}
              
              <Button 
                onClick={actions.retry}
                variant="outline"
                className="w-full"
                disabled={!state.error}
              >
                Retry Connection
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Video Preview */}
        {state.isConnected && (
          <div className="mt-6 grid md:grid-cols-2 gap-6">
            {/* Local Video */}
            <Card>
              <CardHeader>
                <CardTitle>Local Video (You)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="aspect-video bg-gray-900 rounded-lg overflow-hidden">
                  {state.localVideoElement ? (
                    <video
                      ref={ref => {
                        if (ref && state.localVideoElement) {
                          ref.srcObject = state.localVideoElement.srcObject;
                        }
                      }}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      No local video
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Remote Video */}
            <Card>
              <CardHeader>
                <CardTitle>Remote Video (Other Participant)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="aspect-video bg-gray-900 rounded-lg overflow-hidden">
                  {state.remoteVideoElement ? (
                    <video
                      ref={ref => {
                        if (ref && state.remoteVideoElement) {
                          ref.srcObject = state.remoteVideoElement.srcObject;
                        }
                      }}
                      autoPlay
                      playsInline
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      {state.participantCount > 1 ? 'Loading remote video...' : 'Waiting for participants...'}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Instructions */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Testing Instructions</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-sm max-w-none">
            <ol className="space-y-2">
              <li>Click "Connect to Call" to join the test room</li>
              <li>Allow camera and microphone permissions when prompted</li>
              <li>Test mute/unmute and camera on/off controls</li>
              <li>Open this page in another browser tab to simulate a second participant</li>
              <li>Verify video and audio work between both tabs</li>
            </ol>
            
            {process.env.NODE_ENV === 'development' && (
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded">
                <p className="text-blue-800 text-sm">
                  <strong>Development Mode:</strong> Using mock LiveKit service for testing. 
                  The remote video will show animated content instead of a real participant.
                  Deploy to Railway for full functionality.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="mt-6 flex space-x-4">
          <Button 
            onClick={() => window.location.href = '/dashboard'}
            variant="outline"
          >
            Back to Dashboard
          </Button>
          <Button 
            onClick={() => window.location.href = `/call/${testRoomId}`}
            variant="outline"
          >
            Test Full Call Interface
          </Button>
        </div>
      </div>
    </div>
  );
}