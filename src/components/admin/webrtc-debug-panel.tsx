/**
 * WebRTC Debug Panel for Admin
 * Provides guidance on using chrome://webrtc-internals for debugging
 */

"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Bug, 
  Chrome, 
  AlertTriangle, 
  CheckCircle, 
  Copy,
  ExternalLink,
  Monitor,
  Wifi,
  Activity
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function WebRTCDebugPanel() {
  const { toast } = useToast();
  const [copiedStep, setCopiedStep] = useState<string | null>(null);

  const copyToClipboard = (text: string, stepId: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedStep(stepId);
      toast({
        title: "Copied!",
        description: "Debug URL copied to clipboard",
      });
      setTimeout(() => setCopiedStep(null), 2000);
    });
  };

  const debugSteps = [
    {
      id: 'access',
      title: 'Access WebRTC Internals',
      description: 'Open the most powerful WebRTC debugging tool',
      action: 'chrome://webrtc-internals',
      instructions: [
        'Open Chrome or Edge browser',
        'Type chrome://webrtc-internals in the address bar',
        'Press Enter to access the debug interface',
        'Keep this tab open while testing video calls'
      ]
    },
    {
      id: 'ice',
      title: 'Check ICE Candidate Pairs',
      description: 'Verify if WebRTC connection was established',
      lookFor: [
        'Look for "ICE candidate pair" section',
        'Check if state shows "connected" or "completed"',
        'Verify both local and remote candidates are present',
        'Failed connections will show "failed" or "disconnected"'
      ]
    },
    {
      id: 'packets',
      title: 'Monitor Packet Loss',
      description: 'Check if network is dropping data',
      lookFor: [
        'Find "packetsLost" in the stats',
        'Good: 0-2% packet loss',
        'Fair: 2-5% packet loss',
        'Poor: >5% packet loss (causes quality issues)'
      ]
    },
    {
      id: 'jitter',
      title: 'Check Jitter & Quality',
      description: 'Identify choppy or unstable streams',
      lookFor: [
        'Look for "jitter" values in audio/video stats',
        'Good: <30ms jitter',
        'Fair: 30-100ms jitter',
        'Poor: >100ms jitter (causes choppy audio/video)'
      ]
    }
  ];

  const commonIssues = [
    {
      issue: 'No ICE candidates',
      cause: 'STUN/TURN servers not reachable',
      solution: 'Check firewall settings, verify TURN server credentials'
    },
    {
      issue: 'High packet loss (>5%)',
      cause: 'Network congestion or poor connection',
      solution: 'Switch to wired connection, close bandwidth-heavy apps'
    },
    {
      issue: 'High jitter (>100ms)',
      cause: 'Unstable network or CPU overload',
      solution: 'Check network stability, close other applications'
    },
    {
      issue: 'Connection state "failed"',
      cause: 'Firewall blocking WebRTC or TURN server issues',
      solution: 'Check corporate firewall, verify TURN server configuration'
    }
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bug className="w-5 h-5" />
            WebRTC Real-Time Debugging
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Use Chrome/Edge webrtc-internals to debug failed or unstable video calls in real-time
          </p>
        </CardHeader>
        
        <CardContent>
          <Tabs defaultValue="guide" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="guide">Debug Guide</TabsTrigger>
              <TabsTrigger value="issues">Common Issues</TabsTrigger>
              <TabsTrigger value="stats">Live Stats</TabsTrigger>
            </TabsList>
            
            <TabsContent value="guide" className="space-y-4">
              <div className="grid gap-4">
                {debugSteps.map((step, index) => (
                  <Card key={step.id} className="border-l-4 border-l-blue-500">
                    <CardContent className="pt-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-semibold flex items-center gap-2">
                            <Badge variant="outline">{index + 1}</Badge>
                            {step.title}
                          </h3>
                          <p className="text-sm text-muted-foreground mt-1">
                            {step.description}
                          </p>
                        </div>
                        
                        {step.action && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => copyToClipboard(step.action, step.id)}
                            className="ml-4"
                          >
                            {copiedStep === step.id ? (
                              <CheckCircle className="w-4 h-4" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </Button>
                        )}
                      </div>
                      
                      <div className="space-y-2">
                        {step.instructions && (
                          <div>
                            <h4 className="text-sm font-medium mb-2">Steps:</h4>
                            <ul className="text-sm text-muted-foreground space-y-1">
                              {step.instructions.map((instruction, i) => (
                                <li key={i} className="flex items-start gap-2">
                                  <span className="text-blue-500 mt-1">•</span>
                                  {instruction}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        
                        {step.lookFor && (
                          <div>
                            <h4 className="text-sm font-medium mb-2">What to Look For:</h4>
                            <ul className="text-sm text-muted-foreground space-y-1">
                              {step.lookFor.map((item, i) => (
                                <li key={i} className="flex items-start gap-2">
                                  <span className="text-green-500 mt-1">✓</span>
                                  {item}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
            
            <TabsContent value="issues" className="space-y-4">
              <div className="grid gap-4">
                {commonIssues.map((item, index) => (
                  <Card key={index}>
                    <CardContent className="pt-4">
                      <div className="flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5" />
                        <div className="flex-1">
                          <h3 className="font-semibold text-red-700">{item.issue}</h3>
                          <p className="text-sm text-muted-foreground mt-1">
                            <span className="font-medium">Cause:</span> {item.cause}
                          </p>
                          <p className="text-sm text-green-700 mt-2">
                            <span className="font-medium">Solution:</span> {item.solution}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
            
            <TabsContent value="stats" className="space-y-4">
              <Card>
                <CardContent className="pt-4">
                  <div className="text-center py-8">
                    <Monitor className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="font-semibold mb-2">Live WebRTC Stats</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      To view live statistics during an active call:
                    </p>
                    <div className="space-y-2 text-sm text-left max-w-md mx-auto">
                      <div className="flex items-center gap-2">
                        <Chrome className="w-4 h-4" />
                        <span>Open chrome://webrtc-internals</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Activity className="w-4 h-4" />
                        <span>Start a video call in another tab</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Wifi className="w-4 h-4" />
                        <span>Monitor real-time connection stats</span>
                      </div>
                    </div>
                    
                    <Button
                      variant="outline"
                      className="mt-4"
                      onClick={() => copyToClipboard('chrome://webrtc-internals', 'stats')}
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Copy Debug URL
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}