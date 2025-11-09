'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Loader2,
  Wifi,
  Server,
  Video,
  Globe,
  Gauge
} from 'lucide-react';
import { WebRTCConnectivityTest, type ConnectivityTestResult } from '@/lib/webrtc-connectivity-test';

export function RobustWebRTCTest() {
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<ConnectivityTestResult | null>(null);
  const [progress, setProgress] = useState(0);

  const runTest = async () => {
    setTesting(true);
    setProgress(0);
    setResult(null);

    // Simulate progress
    const progressInterval = setInterval(() => {
      setProgress(prev => Math.min(prev + 10, 90));
    }, 500);

    try {
      const tester = new WebRTCConnectivityTest();
      const testResult = await tester.runConnectivityTests();
      setResult(testResult);
      setProgress(100);
    } catch (error) {
      console.error('Test failed:', error);
    } finally {
      clearInterval(progressInterval);
      setTesting(false);
    }
  };

  const getStatusIcon = (status: 'pass' | 'warn' | 'fail') => {
    switch (status) {
      case 'pass':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'warn':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'fail':
        return <XCircle className="w-5 h-5 text-red-500" />;
    }
  };

  const getStatusBadge = (status: 'pass' | 'warn' | 'fail') => {
    const variants = {
      pass: 'bg-green-100 text-green-800 border-green-200',
      warn: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      fail: 'bg-red-100 text-red-800 border-red-200'
    };
    
    return (
      <Badge variant="outline" className={variants[status]}>
        {status.toUpperCase()}
      </Badge>
    );
  };

  const getOverallBadge = (overall: string) => {
    const variants: Record<string, string> = {
      excellent: 'bg-green-500 text-white',
      good: 'bg-blue-500 text-white',
      fair: 'bg-yellow-500 text-white',
      poor: 'bg-orange-500 text-white',
      failed: 'bg-red-500 text-white'
    };
    
    return (
      <Badge className={variants[overall] || 'bg-gray-500 text-white'}>
        {overall.toUpperCase()}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Test Control */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Wifi className="w-5 h-5" />
              Comprehensive WebRTC Connectivity Test
            </span>
            <Button 
              onClick={runTest} 
              disabled={testing}
              size="sm"
            >
              {testing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Testing...
                </>
              ) : (
                'Run Full Test'
              )}
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Comprehensive test of WebRTC infrastructure including STUN/TURN servers, 
            media devices, network quality, and browser support.
          </p>
          
          {testing && (
            <div className="space-y-2">
              <Progress value={progress} className="h-2" />
              <p className="text-xs text-muted-foreground text-center">
                Running connectivity tests... {progress}%
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Test Results */}
      {result && (
        <>
          {/* Overall Score */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Overall Result</span>
                {getOverallBadge(result.overall)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Quality Score</span>
                  <span className="text-2xl font-bold">{result.score}/100</span>
                </div>
                <Progress value={result.score} className="h-3" />
                
                {result.recommendations.length > 0 && (
                  <div className="space-y-2 mt-4">
                    <p className="text-sm font-medium">Recommendations:</p>
                    {result.recommendations.map((rec, idx) => (
                      <Alert key={idx}>
                        <AlertDescription className="text-sm">
                          {rec}
                        </AlertDescription>
                      </Alert>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Detailed Test Results */}
          <div className="grid gap-4 md:grid-cols-2">
            {/* WebRTC Support */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between text-base">
                  <span className="flex items-center gap-2">
                    <Video className="w-4 h-4" />
                    WebRTC Support
                  </span>
                  {getStatusBadge(result.tests.webrtcSupport.status)}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-3">
                  {result.tests.webrtcSupport.message}
                </p>
                {result.tests.webrtcSupport.details && (
                  <div className="space-y-1 text-xs">
                    {Object.entries(result.tests.webrtcSupport.details).map(([key, value]) => (
                      <div key={key} className="flex items-center justify-between">
                        <span className="text-muted-foreground">{key}:</span>
                        <span className="font-medium">
                          {value ? (
                            <CheckCircle className="w-4 h-4 text-green-500 inline" />
                          ) : (
                            <XCircle className="w-4 h-4 text-red-500 inline" />
                          )}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
                {result.tests.webrtcSupport.duration && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Duration: {result.tests.webrtcSupport.duration}ms
                  </p>
                )}
              </CardContent>
            </Card>

            {/* STUN Connectivity */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between text-base">
                  <span className="flex items-center gap-2">
                    <Server className="w-4 h-4" />
                    STUN Servers
                  </span>
                  {getStatusBadge(result.tests.stunConnectivity.status)}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-3">
                  {result.tests.stunConnectivity.message}
                </p>
                {result.tests.stunConnectivity.details && (
                  <div className="space-y-1 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Successful:</span>
                      <span className="font-medium">
                        {result.tests.stunConnectivity.details.successfulTests}/
                        {result.tests.stunConnectivity.details.totalTests}
                      </span>
                    </div>
                  </div>
                )}
                {result.tests.stunConnectivity.duration && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Duration: {result.tests.stunConnectivity.duration}ms
                  </p>
                )}
              </CardContent>
            </Card>

            {/* TURN Connectivity */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between text-base">
                  <span className="flex items-center gap-2">
                    <Server className="w-4 h-4" />
                    TURN Servers
                  </span>
                  {getStatusBadge(result.tests.turnConnectivity.status)}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-3">
                  {result.tests.turnConnectivity.message}
                </p>
                {result.tests.turnConnectivity.details && (
                  <div className="space-y-1 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Successful:</span>
                      <span className="font-medium">
                        {result.tests.turnConnectivity.details.successfulTests}/
                        {result.tests.turnConnectivity.details.totalTests}
                      </span>
                    </div>
                  </div>
                )}
                {result.tests.turnConnectivity.duration && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Duration: {result.tests.turnConnectivity.duration}ms
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Media Devices */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between text-base">
                  <span className="flex items-center gap-2">
                    <Video className="w-4 h-4" />
                    Media Devices
                  </span>
                  {getStatusBadge(result.tests.mediaDevices.status)}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-3">
                  {result.tests.mediaDevices.message}
                </p>
                {result.tests.mediaDevices.details && (
                  <div className="space-y-1 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Video Devices:</span>
                      <span className="font-medium">{result.tests.mediaDevices.details.videoDevices}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Audio Devices:</span>
                      <span className="font-medium">{result.tests.mediaDevices.details.audioDevices}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Accessible:</span>
                      <span className="font-medium">
                        {result.tests.mediaDevices.details.mediaAccessible ? 'Yes' : 'No'}
                      </span>
                    </div>
                  </div>
                )}
                {result.tests.mediaDevices.duration && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Duration: {result.tests.mediaDevices.duration}ms
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Network Latency */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between text-base">
                  <span className="flex items-center gap-2">
                    <Globe className="w-4 h-4" />
                    Network Latency
                  </span>
                  {getStatusBadge(result.tests.networkLatency.status)}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-3">
                  {result.tests.networkLatency.message}
                </p>
                {result.tests.networkLatency.details && (
                  <div className="space-y-1 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Average:</span>
                      <span className="font-medium">
                        {Math.round(result.tests.networkLatency.details.averageLatency)}ms
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Tests Passed:</span>
                      <span className="font-medium">
                        {result.tests.networkLatency.details.successfulTests}/
                        {result.tests.networkLatency.details.totalTests}
                      </span>
                    </div>
                  </div>
                )}
                {result.tests.networkLatency.duration && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Duration: {result.tests.networkLatency.duration}ms
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Bandwidth Estimate */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between text-base">
                  <span className="flex items-center gap-2">
                    <Gauge className="w-4 h-4" />
                    Bandwidth
                  </span>
                  {getStatusBadge(result.tests.bandwidthEstimate.status)}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-3">
                  {result.tests.bandwidthEstimate.message}
                </p>
                {result.tests.bandwidthEstimate.details && (
                  <div className="space-y-1 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Estimated:</span>
                      <span className="font-medium">
                        ~{result.tests.bandwidthEstimate.details.bandwidth} Mbps
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Method:</span>
                      <span className="font-medium text-xs">
                        {result.tests.bandwidthEstimate.details.method}
                      </span>
                    </div>
                  </div>
                )}
                {result.tests.bandwidthEstimate.duration && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Duration: {result.tests.bandwidthEstimate.duration}ms
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}