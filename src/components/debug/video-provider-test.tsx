'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { VideoProviderTester, type ProviderTestResult } from '@/lib/video-provider-test';
import { VideoProvider } from '@/lib/video-service-manager';

export function VideoProviderTestComponent() {
  const [testing, setTesting] = useState(false);
  const [results, setResults] = useState<ProviderTestResult[]>([]);
  const [currentTest, setCurrentTest] = useState<string>('');

  const runTests = async () => {
    setTesting(true);
    setResults([]);
    setCurrentTest('Initializing...');

    try {
      const tester = new VideoProviderTester();
      
      // Mock the test progress
      const providers: VideoProvider[] = ['webrtc', 'daily', 'jitsi-public', 'jitsi-self'];
      
      for (let i = 0; i < providers.length; i++) {
        setCurrentTest(`Testing ${providers[i]}... (${i + 1}/${providers.length})`);
        await new Promise(resolve => setTimeout(resolve, 100)); // Small delay for UI update
      }

      const testResults = await tester.testAllProviders();
      setResults(testResults);
      setCurrentTest('');
      
      console.log('📊 Test Report:');
      console.log(tester.generateReport());
      
    } catch (error) {
      console.error('Test failed:', error);
      setCurrentTest('Test failed - check console');
    } finally {
      setTesting(false);
    }
  };

  const getStatusBadge = (result: ProviderTestResult) => {
    if (result.success) {
      return <Badge variant="default" className="bg-green-500">✅ Working</Badge>;
    } else {
      return <Badge variant="destructive">❌ Failed</Badge>;
    }
  };

  const getProviderDescription = (provider: VideoProvider) => {
    switch (provider) {
      case 'webrtc':
        return 'Direct WebRTC with your coturn server - Most stable according to your testing';
      case 'daily':
        return 'Daily.co service - Good mobile optimization with API key';
      case 'jitsi-public':
        return 'Public Jitsi Meet (meet.jit.si) - Reliable fallback';
      case 'jitsi-self':
        return 'Your self-hosted Jitsi (session.harthio.com) - Custom server with coturn';
      default:
        return 'Unknown provider';
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Video Provider Test</CardTitle>
          <CardDescription>
            Test all video calling providers to see which ones are working properly.
            This will help determine the best provider priority order.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Button 
              onClick={runTests} 
              disabled={testing}
              className="w-full"
            >
              {testing ? 'Testing...' : 'Run Provider Tests'}
            </Button>
            
            {testing && currentTest && (
              <div className="text-center text-sm text-muted-foreground">
                {currentTest}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {results.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Test Results</h3>
          
          {results.map((result) => (
            <Card key={result.provider}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base capitalize">
                    {result.provider.replace('-', ' ')}
                  </CardTitle>
                  {getStatusBadge(result)}
                </div>
                <CardDescription className="text-sm">
                  {getProviderDescription(result.provider)}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-2 text-sm">
                  {result.connectionTime && (
                    <div>
                      <span className="font-medium">Connection Time:</span> {result.connectionTime}ms
                    </div>
                  )}
                  {result.quality && (
                    <div>
                      <span className="font-medium">Status:</span> {result.quality}
                    </div>
                  )}
                  {result.error && (
                    <div className="text-red-500">
                      <span className="font-medium">Error:</span> {result.error}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}

          <Card className="border-green-200 bg-green-50">
            <CardHeader>
              <CardTitle className="text-green-800">Recommendations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm text-green-700">
                {(() => {
                  const workingProviders = results.filter(r => r.success);
                  const fastestProvider = workingProviders.sort((a, b) => 
                    (a.connectionTime || 0) - (b.connectionTime || 0)
                  )[0];

                  if (workingProviders.length === 0) {
                    return <p>❌ No providers are working. Check your network and server configurations.</p>;
                  }

                  return (
                    <>
                      <p>✅ {workingProviders.length}/{results.length} providers are working</p>
                      {fastestProvider && (
                        <p>🚀 Fastest: <strong>{fastestProvider.provider}</strong> ({fastestProvider.connectionTime}ms)</p>
                      )}
                      <p className="mt-3 font-medium">Suggested priority order:</p>
                      <ol className="list-decimal list-inside space-y-1 ml-4">
                        {workingProviders
                          .sort((a, b) => (a.connectionTime || 0) - (b.connectionTime || 0))
                          .map((provider, index) => (
                            <li key={provider.provider}>
                              {provider.provider} ({provider.connectionTime}ms)
                            </li>
                          ))
                        }
                      </ol>
                    </>
                  );
                })()}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="text-blue-800">Current Configuration</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm text-blue-700">
            <p><strong>Priority Order:</strong> WebRTC → Daily.co → Jitsi Public → Jitsi Self-hosted</p>
            <p><strong>Self-hosted Jitsi:</strong> session.harthio.com</p>
            <p><strong>Coturn Server:</strong> 13.51.111.2:3478</p>
            <p><strong>Daily.co API:</strong> {process.env.NEXT_PUBLIC_DAILY_API_KEY ? '✅ Configured' : '❌ Missing'}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}