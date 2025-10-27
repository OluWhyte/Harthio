'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SimpleVideoTester, type SimpleVideoProvider } from '@/lib/simple-video-test';

interface TestResult {
  provider: SimpleVideoProvider;
  status: 'idle' | 'testing' | 'success' | 'error';
  error?: string;
  progress?: string;
}

export default function TestVideoPage() {
  const [results, setResults] = useState<TestResult[]>([
    { provider: 'daily', status: 'idle' },
    { provider: 'jitsi-public', status: 'idle' },
    { provider: 'jitsi-self', status: 'idle' },
    { provider: 'webrtc', status: 'idle' }
  ]);

  const updateResult = (provider: SimpleVideoProvider, updates: Partial<TestResult>) => {
    setResults(prev => prev.map(r => 
      r.provider === provider ? { ...r, ...updates } : r
    ));
  };

  const testProvider = async (provider: SimpleVideoProvider) => {
    updateResult(provider, { status: 'testing', error: undefined, progress: 'Starting...' });

    // Create test container
    const containerId = 'video-test-container';
    let container = document.getElementById(containerId);
    if (!container) {
      container = document.createElement('div');
      container.id = containerId;
      container.style.position = 'fixed';
      container.style.top = '-1000px';
      container.style.width = '320px';
      container.style.height = '240px';
      document.body.appendChild(container);
    }

    const tester = new SimpleVideoTester(
      {
        sessionId: 'test-session',
        displayName: 'Test User',
        containerId
      },
      {
        onSuccess: () => {
          updateResult(provider, { status: 'success', progress: 'Test completed successfully!' });
        },
        onError: (_, error) => {
          updateResult(provider, { status: 'error', error, progress: undefined });
        },
        onProgress: (message) => {
          updateResult(provider, { progress: message });
        }
      }
    );

    try {
      switch (provider) {
        case 'daily':
          await tester.testDaily();
          break;
        case 'jitsi-public':
          await tester.testJitsiPublic();
          break;
        case 'jitsi-self':
          await tester.testJitsiSelf();
          break;
        case 'webrtc':
          await tester.testWebRTC();
          break;
      }
    } catch (error) {
      // Error already handled by callbacks
    } finally {
      tester.cleanup();
    }
  };

  const resetTests = () => {
    setResults(prev => prev.map(r => ({ 
      provider: r.provider, 
      status: 'idle' as const 
    })));
  };

  const getStatusBadge = (result: TestResult) => {
    switch (result.status) {
      case 'idle':
        return <Badge variant="outline">Not Tested</Badge>;
      case 'testing':
        return <Badge variant="secondary">Testing...</Badge>;
      case 'success':
        return <Badge variant="default" className="bg-green-500">✅ Working</Badge>;
      case 'error':
        return <Badge variant="destructive">❌ Failed</Badge>;
    }
  };

  const getProviderDescription = (provider: SimpleVideoProvider) => {
    switch (provider) {
      case 'daily':
        return 'Daily.co service with API key - Should be reliable';
      case 'jitsi-public':
        return 'Public Jitsi Meet (meet.jit.si) - Free fallback';
      case 'jitsi-self':
        return 'Your self-hosted Jitsi (session.harthio.com) - Custom server';
      case 'webrtc':
        return 'Direct WebRTC with coturn - Currently working';
    }
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Simple Video Provider Testing</h1>
        <p className="text-lg text-muted-foreground mb-4">
          Test each video provider individually to isolate issues and find what's working.
        </p>
        <div className="flex gap-4">
          <Button onClick={resetTests} variant="outline">
            Reset All Tests
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        {results.map((result) => (
          <Card key={result.provider}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg capitalize">
                  {result.provider.replace('-', ' ')}
                </CardTitle>
                <div className="flex items-center gap-2">
                  {getStatusBadge(result)}
                  <Button
                    onClick={() => testProvider(result.provider)}
                    disabled={result.status === 'testing'}
                    size="sm"
                  >
                    {result.status === 'testing' ? 'Testing...' : 'Test'}
                  </Button>
                </div>
              </div>
              <CardDescription>
                {getProviderDescription(result.provider)}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              {result.progress && (
                <div className="text-sm text-blue-600 mb-2">
                  🔄 {result.progress}
                </div>
              )}
              {result.error && (
                <div className="text-sm text-red-600 bg-red-50 p-3 rounded">
                  <strong>Error:</strong> {result.error}
                </div>
              )}
              {result.status === 'success' && (
                <div className="text-sm text-green-600 bg-green-50 p-3 rounded">
                  ✅ This provider is working correctly!
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="mt-8 border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="text-blue-800">Testing Strategy</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm text-blue-700">
            <p><strong>Step 1:</strong> Test each provider individually</p>
            <p><strong>Step 2:</strong> Fix issues one by one</p>
            <p><strong>Step 3:</strong> Once working, integrate into main system</p>
            <p><strong>Step 4:</strong> Set priority order based on reliability</p>
          </div>
        </CardContent>
      </Card>

      {/* Hidden test container */}
      <div id="video-test-container" style={{ display: 'none' }}></div>
    </div>
  );
}