/**
 * Call Debug Helper - User-friendly troubleshooting
 * Shows when video calls fail, helps users help themselves
 */

"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  AlertTriangle, 
  Wifi, 
  Camera, 
  Mic,
  RefreshCw,
  ExternalLink,
  Copy,
  CheckCircle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface CallDebugHelperProps {
  onRetry?: () => void;
  onClose?: () => void;
  errorType?: 'connection' | 'media' | 'general';
}

export function CallDebugHelper({ onRetry, onClose, errorType = 'general' }: CallDebugHelperProps) {
  const { toast } = useToast();
  const [showAdvanced, setShowAdvanced] = useState(false);

  const copyDebugUrl = () => {
    navigator.clipboard.writeText('chrome://webrtc-internals').then(() => {
      toast({
        title: "Copied!",
        description: "Debug URL copied to clipboard",
      });
    });
  };

  const quickFixes = [
    {
      icon: <Wifi className="w-4 h-4" />,
      title: "Check your internet",
      description: "Try switching between WiFi and mobile data",
      action: "Switch Network"
    },
    {
      icon: <Camera className="w-4 h-4" />,
      title: "Allow camera access",
      description: "Click the camera icon in your browser's address bar",
      action: "Check Permissions"
    },
    {
      icon: <Mic className="w-4 h-4" />,
      title: "Allow microphone access",
      description: "Make sure your microphone isn't muted or blocked",
      action: "Check Audio"
    },
    {
      icon: <RefreshCw className="w-4 h-4" />,
      title: "Refresh the page",
      description: "Sometimes a simple refresh fixes connection issues",
      action: "Refresh Page"
    }
  ];

  const handleQuickFix = (action: string) => {
    switch (action) {
      case "Refresh Page":
        window.location.reload();
        break;
      case "Check Permissions":
        // Guide user to check permissions
        toast({
          title: "Check Permissions",
          description: "Look for camera/microphone icons in your browser's address bar",
        });
        break;
      default:
        toast({
          title: "Tip Applied",
          description: `Try: ${action}`,
        });
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-orange-500" />
          Connection Trouble?
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Let's get your video call working. Try these quick fixes:
        </p>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Quick Fixes */}
        <div className="grid gap-3">
          {quickFixes.map((fix, index) => (
            <div key={index} className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-full">
                  {fix.icon}
                </div>
                <div>
                  <h3 className="font-medium text-sm">{fix.title}</h3>
                  <p className="text-xs text-muted-foreground">{fix.description}</p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleQuickFix(fix.action)}
              >
                Try This
              </Button>
            </div>
          ))}
        </div>

        {/* Advanced Debug Option */}
        <div className="border-t pt-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="w-full"
          >
            {showAdvanced ? 'Hide' : 'Show'} Advanced Debug Info
          </Button>
          
          {showAdvanced && (
            <div className="mt-4 p-4 bg-muted rounded-lg">
              <h4 className="font-medium mb-2">For Technical Users</h4>
              <p className="text-sm text-muted-foreground mb-3">
                If you're comfortable with technical debugging, you can check detailed 
                connection information in your browser's WebRTC internals.
              </p>
              
              <div className="flex items-center gap-2">
                <code className="text-xs bg-background px-2 py-1 rounded border">
                  chrome://webrtc-internals
                </code>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={copyDebugUrl}
                >
                  <Copy className="w-3 h-3 mr-1" />
                  Copy
                </Button>
              </div>
              
              <p className="text-xs text-muted-foreground mt-2">
                Paste this URL in Chrome or Edge to see detailed connection stats
              </p>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4">
          {onRetry && (
            <Button onClick={onRetry} className="flex-1">
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
          )}
          
          {onClose && (
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          )}
        </div>

        {/* Help Text */}
        <div className="text-xs text-muted-foreground text-center pt-2 border-t">
          Still having trouble? These issues are usually network-related and temporary.
        </div>
      </CardContent>
    </Card>
  );
}