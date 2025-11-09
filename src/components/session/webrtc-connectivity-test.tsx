/**
 * WebRTC Connectivity Test Component
 * Pre-call connectivity testing UI component
 */

"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  Loader2, 
  Wifi, 
  Video, 
  Mic,
  Globe,
  Zap,
  BarChart3,
  RefreshCw
} from 'lucide-react';
import { WebRTCConnectivityTest, ConnectivityTestResult, TestResult } from '@/lib/webrtc-connectivity-test';
import { cn } from '@/lib/utils';

interface WebRTCConnectivityTestProps {
  onTestComplete?: (result: ConnectivityTestResult) => void;
  onSkip?: () => void;
  autoStart?: boolean;
  className?: string;
}

export function WebRTCConnectivityTestComponent({
  onTestComplete,
  onSkip,
  autoStart = false,
  className
}: WebRTCConnectivityTestProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<ConnectivityTestResult | null>(null);
  const [progress, setProgress] = useState(0);
  const [currentTest, setCurrentTest] = useState<string>('');

  const testService = React.useRef(new WebRTCConnectivityTest());

  useEffect(() => {
    if (autoStart) {
      runTests();
    }
  }, [autoStart]);

  const runTests = async () => {
    setIsRunning(true);
    setResult(null);
    setProgress(0);
    setCurrentTest('Initializing...');

    try {
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) return prev;
          return prev + Math.random() * 15;
        });
      }, 500);

      // Update current test being run
      const testNames = [
        'Checking WebRTC support...',
        'Testing STUN connectivity...',
        'Testing TURN connectivity...',
        'Checking media devices...',
        'Measuring network latency...',
        'Estimating bandwidth...'
      ];

      let testIndex = 0;
      const testInterval = setInterval(() => {
        if (testIndex < testNames.length) {
          setCurrentTest(testNames[testIndex]);
          testIndex++;
        }
      }, 2000);

      const testResult = await testService.current.runConnectivityTests();
      
      clearInterval(progressInterval);
      clearInterval(testInterval);
      
      setProgress(100);
      setCurrentTest('Tests completed!');
      setResult(testResult);
      
      if (onTestComplete) {
        onTestComplete(testResult);
      }
    } catch (error) {
      console.error('Connectivity test failed:', error);
      setCurrentTest('Tests failed');
    } finally {
      setIsRunning(false);
    }
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'pass':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'warn':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'fail':
        return <XCircle className="w-4 h-4 text-red-500" />;
    }
  };

  const getTestIcon = (testName: string) => {
    switch (testName) {
      case 'webrtcSupport':
        return <Globe className="w-4 h-4" />;
      case 'stunConnectivity':
        return <Wifi className="w-4 h-4" />;
      case 'turnConnectivity':
        return <Wifi className="w-4 h-4" />;
      case 'mediaDevices':
        return <Video className="w-4 h-4" />;
      case 'networkLatency':
        return <Zap className="w-4 h-4" />;
      case 'bandwidthEstimate':
        return <BarChart3 className="w-4 h-4" />;
      default:
        return <CheckCircle className="w-4 h-4" />;
    }
  };

  const getTestDisplayName = (testName: string) => {
    switch (testName) {
      case 'webrtcSupport':
        return 'WebRTC Support';
      case 'stunConnectivity':
        return 'STUN Connectivity';
      case 'turnConnectivity':
        return 'TURN Connectivity';
      case 'mediaDevices':
        return 'Media Devices';
      case 'networkLatency':
        return 'Network Latency';
      case 'bandwidthEstimate':
        return 'Bandwidth Estimate';
      default:
        return testName;
    }
  };

  const getOverallBadgeVariant = (overall: ConnectivityTestResult['overall']) => {
    switch (overall) {
      case 'excellent':
        return 'default'; // Green
      case 'good':
        return 'secondary'; // Blue
      case 'fair':
        return 'outline'; // Yellow
      case 'poor':
        return 'destructive'; // Red
      case 'failed':
        return 'destructive'; // Red
    }
  };

  return (
    <Card className={cn("w-full max-w-2xl mx-auto", className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wifi className="w-5 h-5" />
          Connection Test
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Testing your connection to ensure the best video calling experience
        </p>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Running Tests */}
        {isRunning && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm font-medium">{currentTest}</span>
            </div>
            <Progress value={progress} className="w-full" />
          </div>
        )}

        {/* Test Results */}
        {result && (
          <div className="space-y-4">
            {/* Overall Result */}
            <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
              <div className="flex items-center gap-3">
                <div className="text-2xl font-bold">{result.score}%</div>
                <div>
                  <div className="font-semibold">Connection Quality</div>
                  <Badge variant={getOverallBadgeVariant(result.overall)} className="capitalize">
                    {result.overall}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Individual Test Results */}
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">Test Details</h4>
              {Object.entries(result.tests).map(([testName, testResult]) => (
                <div key={testName} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {getTestIcon(testName)}
                    <div>
                      <div className="font-medium text-sm">{getTestDisplayName(testName)}</div>
                      <div className="text-xs text-muted-foreground">{testResult.message}</div>
                    </div>
                  </div>
                  {getStatusIcon(testResult.status)}
                </div>
              ))}
            </div>

            {/* Recommendations */}
            {result.recommendations.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-semibold text-sm">Recommendations</h4>
                <div className="space-y-2">
                  {result.recommendations.map((recommendation, index) => (
                    <div key={index} className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <AlertTriangle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-blue-800">{recommendation}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3">
          {!isRunning && !result && (
            <Button onClick={runTests} className="flex-1">
              <Wifi className="w-4 h-4 mr-2" />
              Start Connection Test
            </Button>
          )}
          
          {!isRunning && result && (
            <Button onClick={runTests} variant="outline" className="flex items-center gap-2">
              <RefreshCw className="w-4 h-4" />
              Test Again
            </Button>
          )}
          
          {onSkip && (
            <Button 
              variant="outline" 
              onClick={onSkip}
              disabled={isRunning}
            >
              Skip Test
            </Button>
          )}
          
          {result && onTestComplete && (
            <Button 
              onClick={() => onTestComplete(result)}
              variant="outline"
            >
              Save Results
            </Button>
          )}
        </div>

        {/* Help Text */}
        <div className="text-xs text-muted-foreground text-center">
          This test checks your WebRTC connectivity, STUN/TURN servers, and media devices
          to ensure optimal video calling performance.
        </div>
      </CardContent>
    </Card>
  );
}