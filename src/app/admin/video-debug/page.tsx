/**
 * Admin Video Debug Page
 * Technical interface for monitoring video provider performance
 */

"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { VideoProviderTester, type ProviderTestResult } from '@/lib/test-video-providers';
import { Loader2, RefreshCw, Monitor, Wifi, Clock, Signal } from 'lucide-react';

interface ProviderPerformance {
  provider: string;
  latency: number;
  availability: boolean;
  quality: 'excellent' | 'good' | 'fair' | 'poor' | 'failed';
  lastTested: Date;
  connectionTime: number;
}

export default function VideoDebugPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [providerPerformance, setProviderPerformance] = useState<ProviderPerformance[]>([]);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const testAllProviders = async () => {
    setIsLoading(true);
    const results: ProviderPerformance[] = [];

    try {
      // Test Jitsi Public
      const jitsiResult = await VideoProviderTester.testJitsiPublic();
      results.push(mapTestResult('jitsi-public', jitsiResult));

      // Test Daily.co
      const dailyResult = await VideoProviderTester.testDailyCo();
      results.push(mapTestResult('daily', dailyResult));

      // Test WebRTC
      const webrtcResult = await VideoProviderTester.testWebRTC();
      results.push(mapTestResult('webrtc', webrtcResult));

      // Test Self-hosted Jitsi
      const jitsiSelfResult = await testJitsiSelf();
      results.push(mapTestResult('jitsi-self', jitsiSelfResult));

      setProviderPerformance(results);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Failed to test providers:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const testJitsiSelf = async (): Promise<ProviderTestResult> => {
    try {
      const customDomain = process.env.NEXT_PUBLIC_JITSI_DOMAIN || 'session.harthio.com';
      const startTime = performance.now();
      
      const response = await fetch(`https://${customDomain}/external_api.js`, { 
        method: 'HEAD',
        mode: 'no-cors'
      });
      
      const endTime = performance.now();
      
      return {
        provider: 'jitsi-self',
        available: true,
        latency: endTime - startTime,
        details: { domain: customDomain }
      };
    } catch (error) {
      return {
        provider: 'jitsi-self',
        available: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  };

  const mapTestResult = (provider: string, result: ProviderTestResult): ProviderPerformance => {
    const latency = result.latency || 0;
    let quality: 'excellent' | 'good' | 'fair' | 'poor' | 'failed' = 'failed';
    
    if (result.available) {
      if (latency < 100) quality = 'excellent';
      else if (latency < 200) quality = 'good';
      else if (latency < 400) quality = 'fair';
      else quality = 'poor';
    }

    return {
      provider,
      latency,
      availability: result.available,
      quality,
      lastTested: new Date(),
      connectionTime: latency
    };
  };

  const getQualityColor = (quality: string) => {
    switch (quality) {
      case 'excellent': return 'text-green-500 bg-green-100';
      case 'good': return 'text-blue-500 bg-blue-100';
      case 'fair': return 'text-yellow-500 bg-yellow-100';
      case 'poor': return 'text-orange-500 bg-orange-100';
      case 'failed': return 'text-red-500 bg-red-100';
      default: return 'text-gray-500 bg-gray-100';
    }
  };

  const getProviderIcon = (provider: string) => {
    switch (provider) {
      case 'jitsi-public': return <Monitor className="w-4 h-4" />;
      case 'daily': return <Wifi className="w-4 h-4" />;
      case 'jitsi-self': return <Monitor className="w-4 h-4" />;
      case 'webrtc': return <Signal className="w-4 h-4" />;
      default: return <Monitor className="w-4 h-4" />;
    }
  };

  const getProviderName = (provider: string) => {
    switch (provider) {
      case 'jitsi-public': return 'Jitsi Meet (Public)';
      case 'daily': return 'Daily.co';
      case 'jitsi-self': return 'Jitsi (Self-hosted)';
      case 'webrtc': return 'WebRTC Direct';
      default: return provider;
    }
  };

  useEffect(() => {
    // Auto-test on page load
    testAllProviders();
  }, []);

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Video Provider Debug</h1>
        <p className="text-gray-600">
          Technical interface for monitoring video provider performance and availability.
        </p>
      </div>

      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button 
            onClick={testAllProviders} 
            disabled={isLoading}
            className="flex items-center gap-2"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            {isLoading ? 'Testing...' : 'Test All Providers'}
          </Button>
          
          {lastUpdate && (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Clock className="w-4 h-4" />
              Last updated: {lastUpdate.toLocaleTimeString()}
            </div>
          )}
        </div>
      </div>

      <div className="grid gap-4">
        {providerPerformance.map((perf) => (
          <Card key={perf.provider}>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getProviderIcon(perf.provider)}
                  {getProviderName(perf.provider)}
                </div>
                <Badge className={getQualityColor(perf.quality)}>
                  {perf.quality}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <div className="font-medium text-gray-500">Status</div>
                  <div className={perf.availability ? 'text-green-600' : 'text-red-600'}>
                    {perf.availability ? 'Available' : 'Unavailable'}
                  </div>
                </div>
                <div>
                  <div className="font-medium text-gray-500">Latency</div>
                  <div>{perf.latency.toFixed(0)}ms</div>
                </div>
                <div>
                  <div className="font-medium text-gray-500">Connection Time</div>
                  <div>{perf.connectionTime.toFixed(0)}ms</div>
                </div>
                <div>
                  <div className="font-medium text-gray-500">Last Tested</div>
                  <div>{perf.lastTested.toLocaleTimeString()}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {providerPerformance.length === 0 && !isLoading && (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-gray-500">No provider data available. Click "Test All Providers" to begin.</p>
          </CardContent>
        </Card>
      )}

      <div className="mt-8 p-4 bg-gray-50 rounded-lg">
        <h3 className="font-semibold mb-2">Quality Metrics</h3>
        <div className="text-sm text-gray-600 space-y-1">
          <div><strong>Excellent:</strong> &lt; 100ms latency</div>
          <div><strong>Good:</strong> 100-200ms latency</div>
          <div><strong>Fair:</strong> 200-400ms latency</div>
          <div><strong>Poor:</strong> &gt; 400ms latency</div>
          <div><strong>Failed:</strong> Provider unavailable</div>
        </div>
      </div>
    </div>
  );
}