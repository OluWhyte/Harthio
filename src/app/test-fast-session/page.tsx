/**
 * Fast Session Test Page
 * Demonstrates the speed improvements
 */

"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { performanceMonitor } from '@/lib/performance-monitor';
import { FastSessionInitializer } from '@/lib/fast-session-init';

export default function TestFastSessionPage() {
  const [testResults, setTestResults] = useState<any>(null);
  const [isRunning, setIsRunning] = useState(false);

  const runSpeedTest = async () => {
    setIsRunning(true);
    setTestResults(null);

    try {
      // Mock configuration for testing
      const config = {
        sessionId: 'test-session-123',
        userId: 'test-user-456',
        userProfile: {
          display_name: 'Test User',
          email: 'test@example.com'
        },
        enableFastTrack: true,
        skipSafetyDisclaimer: true,
        skipCameraPreview: true
      };

      const callbacks = {
        video: {
          onReady: () => console.log('Video ready'),
          onJoined: () => console.log('Video joined'),
          onLeft: () => console.log('Video left'),
          onError: () => console.log('Video error'),
          onMessage: () => {},
          onParticipantJoined: () => {},
          onParticipantLeft: () => {},
          onConnectionQualityChanged: () => {},
          onProviderChanged: () => {},
          onProviderPerformanceUpdate: () => {},
          onBackgroundSwitching: () => {},
          onRemoteDeviceInfo: () => {}
        },
        webrtc: {
          onStateChange: () => {},
          onQualityChange: () => {},
          onLocalStream: () => {},
          onRemoteStream: () => {},
          onMessage: () => {},
          onError: () => {},
          onRemoteAudioToggle: () => {},
          onRemoteVideoToggle: () => {},
          onRemoteDeviceInfo: () => {}
        },
        messaging: {
          onMessage: () => {},
          onUserTyping: () => {},
          onError: () => {}
        },
        onProgress: (progress: any) => {
          console.log('Progress:', progress);
        }
      };

      // Run the fast initialization
      const result = await FastSessionInitializer.initializeSession(config, callbacks);
      
      // Get performance insights
      const insights = performanceMonitor.getInsights();
      const exportData = performanceMonitor.exportData();

      setTestResults({
        result,
        insights,
        reports: exportData.reports
      });

    } catch (error) {
      console.error('Test failed:', error);
      setTestResults({
        error: error instanceof Error ? error.message : 'Test failed'
      });
    } finally {
      setIsRunning(false);
    }
  };

  const clearCache = () => {
    FastSessionInitializer.clearCache();
    performanceMonitor.clearMetrics();
    setTestResults(null);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">Fast Session Initialization Test</h1>
        <p className="text-gray-600">
          Test the speed improvements of the optimized session initialization
        </p>
      </div>

      <div className="flex gap-4 justify-center">
        <Button 
          onClick={runSpeedTest} 
          disabled={isRunning}
          className="bg-green-600 hover:bg-green-700"
        >
          {isRunning ? 'Running Test...' : 'Run Speed Test'}
        </Button>
        
        <Button 
          onClick={clearCache} 
          variant="outline"
        >
          Clear Cache
        </Button>
      </div>

      {isRunning && (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-center space-x-2">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600"></div>
              <span>Running initialization test...</span>
            </div>
          </CardContent>
        </Card>
      )}

      {testResults && (
        <div className="space-y-4">
          {testResults.error ? (
            <Card className="border-red-200">
              <CardHeader>
                <CardTitle className="text-red-600">Test Failed</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-red-600">{testResults.error}</p>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Results Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-green-600">
                    ✅ Test Results
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {testResults.result.initTime}ms
                      </div>
                      <div className="text-sm text-gray-600">Total Time</div>
                    </div>
                    
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {testResults.result.usedFastTrack ? '⚡' : '🐌'}
                      </div>
                      <div className="text-sm text-gray-600">
                        {testResults.result.usedFastTrack ? 'Fast Track' : 'Standard'}
                      </div>
                    </div>
                    
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">
                        {testResults.insights.averageInitTime.toFixed(0)}ms
                      </div>
                      <div className="text-sm text-gray-600">Average</div>
                    </div>
                    
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-600">
                        {testResults.insights.fastestInit}ms
                      </div>
                      <div className="text-sm text-gray-600">Fastest</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Performance Metrics */}
              {testResults.reports.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Performance Metrics</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {testResults.reports[0].metrics.map((metric: any, index: number) => (
                        <div key={index} className="flex justify-between items-center py-2 border-b">
                          <span className="font-medium">{metric.name}</span>
                          <span className="text-green-600 font-mono">
                            {metric.duration?.toFixed(2)}ms
                          </span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Optimizations Applied */}
              {testResults.reports[0]?.optimizations.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>⚡ Optimizations Applied</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-1">
                      {testResults.reports[0].optimizations.map((opt: string, index: number) => (
                        <li key={index} className="flex items-center space-x-2">
                          <span className="text-green-600">✓</span>
                          <span>{opt}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {/* Recommendations */}
              {testResults.reports[0]?.recommendations.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>💡 Recommendations</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-1">
                      {testResults.reports[0].recommendations.map((rec: string, index: number) => (
                        <li key={index} className="flex items-center space-x-2">
                          <span className="text-blue-600">💡</span>
                          <span>{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>
      )}

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>How to Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p>1. Click "Run Speed Test" to test the fast initialization</p>
          <p>2. Check the console for detailed performance logs</p>
          <p>3. Run multiple tests to see caching improvements</p>
          <p>4. Use "Clear Cache" to test without optimizations</p>
          <p className="text-sm text-gray-600 mt-4">
            Note: This is a mock test. In a real session, you would see camera initialization,
            video provider testing, and actual session joining.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}