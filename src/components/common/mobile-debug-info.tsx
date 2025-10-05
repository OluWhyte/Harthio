"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Smartphone, 
  Wifi, 
  Camera, 
  Mic, 
  Monitor,
  ChevronDown,
  ChevronUp,
  Copy,
  CheckCircle
} from 'lucide-react';
import { getDeviceInfo, checkMediaSupport, checkMediaDevicesAvailable } from '@/lib/media-utils';
import { useToast } from '@/hooks/use-toast';

interface DebugInfo {
  deviceInfo: ReturnType<typeof getDeviceInfo>;
  mediaSupport: ReturnType<typeof checkMediaSupport>;
  mediaDevices: Awaited<ReturnType<typeof checkMediaDevicesAvailable>>;
  networkInfo: {
    hostname: string;
    protocol: string;
    port: string;
    userAgent: string;
    isLocalNetwork: boolean;
  };
  webrtcSupport: {
    getUserMedia: boolean;
    RTCPeerConnection: boolean;
    webkitRTCPeerConnection: boolean;
  };
}

export function MobileDebugInfo() {
  const [isOpen, setIsOpen] = useState(false);
  const [debugInfo, setDebugInfo] = useState<DebugInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const loadDebugInfo = async () => {
    setLoading(true);
    
    try {
      const deviceInfo = getDeviceInfo();
      const mediaSupport = checkMediaSupport();
      const mediaDevices = await checkMediaDevicesAvailable();
      
      const hostname = window.location.hostname;
      const isLocalNetwork = 
        hostname === 'localhost' || 
        hostname === '127.0.0.1' ||
        hostname.startsWith('192.168.') ||
        isPrivateIP172(hostname) ||
        hostname.startsWith('10.') ||
        hostname.endsWith('.local');

      // Helper function to check 172.16.0.0/12 range
      function isPrivateIP172(hostname: string): boolean {
        const match = hostname.match(/^172\.(\d+)\./);
        if (!match) return false;
        
        const secondOctet = parseInt(match[1], 10);
        return secondOctet >= 16 && secondOctet <= 31;
      }

      const info: DebugInfo = {
        deviceInfo,
        mediaSupport,
        mediaDevices,
        networkInfo: {
          hostname: window.location.hostname,
          protocol: window.location.protocol,
          port: window.location.port || '80',
          userAgent: navigator.userAgent,
          isLocalNetwork
        },
        webrtcSupport: {
          getUserMedia: !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia),
          RTCPeerConnection: !!(window as any).RTCPeerConnection,
          webkitRTCPeerConnection: !!(window as any).webkitRTCPeerConnection
        }
      };
      
      setDebugInfo(info);
    } catch (error) {
      console.error('Failed to load debug info:', error);
      toast({
        variant: "destructive",
        title: "Debug Error",
        description: "Failed to load debug information"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && !debugInfo) {
      loadDebugInfo();
    }
  }, [isOpen]);

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied!",
        description: "Debug information copied to clipboard"
      });
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const getDebugText = () => {
    if (!debugInfo) return '';
    
    return `Harthio Mobile Debug Info
========================
Device: ${debugInfo.deviceInfo.isMobile ? 'Mobile' : 'Desktop'} (${debugInfo.deviceInfo.browser})
Platform: ${debugInfo.deviceInfo.isIOS ? 'iOS' : debugInfo.deviceInfo.isAndroid ? 'Android' : 'Other'}
Network: ${debugInfo.networkInfo.hostname}:${debugInfo.networkInfo.port} (${debugInfo.networkInfo.protocol})
Local Network: ${debugInfo.networkInfo.isLocalNetwork ? 'Yes' : 'No'}
Media Support: ${debugInfo.mediaSupport.supported ? 'Yes' : 'No'}
Camera: ${debugInfo.mediaDevices.hasCamera ? 'Available' : 'Not Found'}
Microphone: ${debugInfo.mediaDevices.hasMicrophone ? 'Available' : 'Not Found'}
WebRTC: ${debugInfo.webrtcSupport.RTCPeerConnection ? 'Supported' : 'Not Supported'}
getUserMedia: ${debugInfo.webrtcSupport.getUserMedia ? 'Supported' : 'Not Supported'}
User Agent: ${debugInfo.networkInfo.userAgent}`;
  };

  // Helper function to check 172.16.0.0/12 range
  const isPrivateIP172Check = (hostname: string): boolean => {
    const match = hostname.match(/^172\.(\d+)\./);
    if (!match) return false;
    
    const secondOctet = parseInt(match[1], 10);
    return secondOctet >= 16 && secondOctet <= 31;
  };

  // Hide debug info - only show when explicitly needed
  const shouldShow = false; // Disabled to avoid blocking UI

  if (!shouldShow) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Card className="w-80 max-w-[90vw]">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <Smartphone className="h-4 w-4" />
              Debug Info
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(!isOpen)}
            >
              {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
            </Button>
          </div>
        </CardHeader>
        
        {isOpen && (
          <CardContent className="pt-0">
            {loading ? (
              <div className="text-sm text-muted-foreground">Loading debug info...</div>
            ) : debugInfo ? (
              <div className="space-y-3">
                {/* Device Info */}
                <div>
                  <div className="text-xs font-medium mb-1">Device</div>
                  <div className="flex gap-1 flex-wrap">
                    <Badge variant={debugInfo.deviceInfo.isMobile ? "default" : "secondary"}>
                      {debugInfo.deviceInfo.isMobile ? 'Mobile' : 'Desktop'}
                    </Badge>
                    <Badge variant="outline">{debugInfo.deviceInfo.browser}</Badge>
                    {debugInfo.deviceInfo.isIOS && <Badge variant="outline">iOS</Badge>}
                    {debugInfo.deviceInfo.isAndroid && <Badge variant="outline">Android</Badge>}
                  </div>
                </div>

                {/* Network Info */}
                <div>
                  <div className="text-xs font-medium mb-1">Network</div>
                  <div className="flex gap-1 flex-wrap">
                    <Badge variant={debugInfo.networkInfo.isLocalNetwork ? "default" : "secondary"}>
                      <Wifi className="h-3 w-3 mr-1" />
                      {debugInfo.networkInfo.isLocalNetwork ? 'Local' : 'Remote'}
                    </Badge>
                    <Badge variant="outline">
                      {debugInfo.networkInfo.protocol}//{debugInfo.networkInfo.hostname}
                    </Badge>
                  </div>
                </div>

                {/* Media Support */}
                <div>
                  <div className="text-xs font-medium mb-1">Media</div>
                  <div className="flex gap-1 flex-wrap">
                    <Badge variant={debugInfo.mediaSupport.supported ? "default" : "destructive"}>
                      {debugInfo.mediaSupport.supported ? 'Supported' : 'Not Supported'}
                    </Badge>
                    <Badge variant={debugInfo.mediaDevices.hasCamera ? "default" : "secondary"}>
                      <Camera className="h-3 w-3 mr-1" />
                      {debugInfo.mediaDevices.hasCamera ? 'Camera' : 'No Camera'}
                    </Badge>
                    <Badge variant={debugInfo.mediaDevices.hasMicrophone ? "default" : "secondary"}>
                      <Mic className="h-3 w-3 mr-1" />
                      {debugInfo.mediaDevices.hasMicrophone ? 'Mic' : 'No Mic'}
                    </Badge>
                  </div>
                </div>

                {/* WebRTC Support */}
                <div>
                  <div className="text-xs font-medium mb-1">WebRTC</div>
                  <div className="flex gap-1 flex-wrap">
                    <Badge variant={debugInfo.webrtcSupport.RTCPeerConnection ? "default" : "destructive"}>
                      {debugInfo.webrtcSupport.RTCPeerConnection ? 'Supported' : 'Not Supported'}
                    </Badge>
                  </div>
                </div>

                {/* Error Message */}
                {!debugInfo.mediaSupport.supported && (
                  <div className="text-xs text-destructive bg-destructive/10 p-2 rounded">
                    {debugInfo.mediaSupport.error}
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(getDebugText())}
                    className="flex-1"
                  >
                    <Copy className="h-3 w-3 mr-1" />
                    Copy
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={loadDebugInfo}
                    className="flex-1"
                  >
                    Refresh
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">Click to load debug info</div>
            )}
          </CardContent>
        )}
      </Card>
    </div>
  );
}