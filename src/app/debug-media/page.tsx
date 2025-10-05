"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  checkMediaSupport, 
  getDeviceInfo, 
  getUserMediaWithFallback,
  getMediaErrorMessage,
  checkMediaDevicesAvailable 
} from '@/lib/media-utils';

export default function DebugMediaPage() {
  const [results, setResults] = useState<any>({});
  const [testing, setTesting] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);

  const runTests = async () => {
    setTesting(true);
    const testResults: any = {};

    try {
      // Basic info
      testResults.deviceInfo = getDeviceInfo();
      testResults.location = {
        hostname: window.location.hostname,
        protocol: window.location.protocol,
        port: window.location.port,
        href: window.location.href
      };

      // Media support check
      testResults.mediaSupport = checkMediaSupport();
      
      // Device enumeration
      try {
        testResults.devices = await checkMediaDevicesAvailable();
      } catch (error: any) {
        testResults.devices = { error: error?.message || 'Unknown error' };
      }

      // WebRTC support
      testResults.webrtc = {
        getUserMedia: !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia),
        RTCPeerConnection: !!(window as any).RTCPeerConnection,
        webkitRTCPeerConnection: !!(window as any).webkitRTCPeerConnection
      };

      // Try to get media
      if (testResults.mediaSupport.supported) {
        try {
          const mediaStream = await getUserMediaWithFallback();
          testResults.mediaAccess = {
            success: true,
            tracks: mediaStream.getTracks().map(track => ({
              kind: track.kind,
              label: track.label,
              enabled: track.enabled,
              readyState: track.readyState
            }))
          };
          setStream(mediaStream);
        } catch (error: any) {
          testResults.mediaAccess = {
            success: false,
            error: error?.message || 'Unknown error',
            friendlyError: getMediaErrorMessage(error)
          };
        }
      }

      setResults(testResults);
    } catch (error: any) {
      console.error('Test failed:', error);
      testResults.error = error?.message || 'Unknown error';
      setResults(testResults);
    } finally {
      setTesting(false);
    }
  };

  const stopStream = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  useEffect(() => {
    return () => {
      stopStream();
    };
  }, []);

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle>Media Access Debug Tool</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button onClick={runTests} disabled={testing}>
              {testing ? 'Testing...' : 'Run Tests'}
            </Button>
            {stream && (
              <Button onClick={stopStream} variant="outline">
                Stop Stream
              </Button>
            )}
          </div>

          {Object.keys(results).length > 0 && (
            <div className="space-y-4">
              {/* Device Info */}
              {results.deviceInfo && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Device Information</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>Mobile: <Badge variant={results.deviceInfo.isMobile ? "default" : "secondary"}>{results.deviceInfo.isMobile ? 'Yes' : 'No'}</Badge></div>
                      <div>Browser: <Badge variant="outline">{results.deviceInfo.browser}</Badge></div>
                      <div>iOS: <Badge variant={results.deviceInfo.isIOS ? "default" : "secondary"}>{results.deviceInfo.isIOS ? 'Yes' : 'No'}</Badge></div>
                      <div>Android: <Badge variant={results.deviceInfo.isAndroid ? "default" : "secondary"}>{results.deviceInfo.isAndroid ? 'Yes' : 'No'}</Badge></div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Location Info */}
              {results.location && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Location Information</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <div>Hostname: <code className="bg-muted px-2 py-1 rounded">{results.location.hostname}</code></div>
                      <div>Protocol: <code className="bg-muted px-2 py-1 rounded">{results.location.protocol}</code></div>
                      <div>Port: <code className="bg-muted px-2 py-1 rounded">{results.location.port || 'default'}</code></div>
                      <div>Full URL: <code className="bg-muted px-2 py-1 rounded text-xs">{results.location.href}</code></div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Media Support */}
              {results.mediaSupport && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Media Support Check</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div>
                        Supported: <Badge variant={results.mediaSupport.supported ? "default" : "destructive"}>
                          {results.mediaSupport.supported ? 'Yes' : 'No'}
                        </Badge>
                      </div>
                      {results.mediaSupport.error && (
                        <div className="text-sm text-destructive bg-destructive/10 p-3 rounded">
                          {results.mediaSupport.error}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* WebRTC Support */}
              {results.webrtc && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">WebRTC Support</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 gap-2 text-sm">
                      <div>getUserMedia: <Badge variant={results.webrtc.getUserMedia ? "default" : "destructive"}>{results.webrtc.getUserMedia ? 'Available' : 'Not Available'}</Badge></div>
                      <div>RTCPeerConnection: <Badge variant={results.webrtc.RTCPeerConnection ? "default" : "destructive"}>{results.webrtc.RTCPeerConnection ? 'Available' : 'Not Available'}</Badge></div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Device Enumeration */}
              {results.devices && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Media Devices</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {results.devices.error ? (
                      <div className="text-sm text-destructive bg-destructive/10 p-3 rounded">
                        Error: {results.devices.error}
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div>Camera: <Badge variant={results.devices.hasCamera ? "default" : "secondary"}>{results.devices.hasCamera ? 'Available' : 'Not Found'}</Badge></div>
                        <div>Microphone: <Badge variant={results.devices.hasMicrophone ? "default" : "secondary"}>{results.devices.hasMicrophone ? 'Available' : 'Not Found'}</Badge></div>
                        <div className="text-xs text-muted-foreground">
                          Total devices: {results.devices.devices?.length || 0}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Media Access Test */}
              {results.mediaAccess && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Media Access Test</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {results.mediaAccess.success ? (
                      <div className="space-y-2">
                        <div>
                          Status: <Badge variant="default">Success</Badge>
                        </div>
                        <div className="text-sm">
                          <div className="font-medium mb-2">Tracks:</div>
                          {results.mediaAccess.tracks.map((track: any, index: number) => (
                            <div key={index} className="bg-muted p-2 rounded text-xs">
                              {track.kind}: {track.label || 'Unnamed'} - {track.enabled ? 'Enabled' : 'Disabled'} ({track.readyState})
                            </div>
                          ))}
                        </div>
                        {stream && (
                          <div className="mt-4">
                            <video 
                              ref={(video) => {
                                if (video && stream) {
                                  video.srcObject = stream;
                                }
                              }}
                              autoPlay 
                              muted 
                              playsInline
                              className="w-full max-w-md border rounded"
                            />
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div>
                          Status: <Badge variant="destructive">Failed</Badge>
                        </div>
                        <div className="text-sm text-destructive bg-destructive/10 p-3 rounded">
                          <div className="font-medium">Error:</div>
                          <div>{results.mediaAccess.error}</div>
                        </div>
                        <div className="text-sm bg-muted p-3 rounded">
                          <div className="font-medium">User-friendly message:</div>
                          <div>{results.mediaAccess.friendlyError}</div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Raw Results */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Raw Results (for debugging)</CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="text-xs bg-muted p-3 rounded overflow-auto max-h-96">
                    {JSON.stringify(results, null, 2)}
                  </pre>
                </CardContent>
              </Card>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}