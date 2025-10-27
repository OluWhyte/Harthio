/**
 * Connection Diagnostics Component
 * Helps users understand connection issues and provider switching
 */

"use client";

import React from 'react';
import { 
  Wifi, WifiOff, Signal, AlertTriangle, CheckCircle, 
  Clock, Zap, Globe, Smartphone 
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ConnectionDiagnosticsProps {
  currentProvider: string | null;
  connectionQuality: 'excellent' | 'good' | 'fair' | 'poor' | 'failed';
  connectionStats: {
    bandwidth: number;
    latency: number;
    packetLoss: number;
    quality: string;
    resolution: string;
    frameRate: number;
  };
  onSwitchProvider?: (provider: string) => void;
  onRetry?: () => void;
}

export function ConnectionDiagnostics({
  currentProvider,
  connectionQuality,
  connectionStats,
  onSwitchProvider,
  onRetry
}: ConnectionDiagnosticsProps) {
  
  const getProviderInfo = (provider: string | null) => {
    switch (provider) {
      case 'jitsi-public':
        return {
          name: 'Jitsi Meet',
          description: 'Public servers (most reliable)',
          icon: <Globe className="h-4 w-4" />,
          color: 'bg-blue-500'
        };
      case 'daily':
        return {
          name: 'Daily.co',
          description: 'Mobile-optimized servers',
          icon: <Smartphone className="h-4 w-4" />,
          color: 'bg-green-500'
        };
      case 'jitsi-self':
        return {
          name: 'Harthio Video',
          description: 'Self-hosted servers',
          icon: <Zap className="h-4 w-4" />,
          color: 'bg-orange-500'
        };
      case 'webrtc':
        return {
          name: 'Direct Connection',
          description: 'Peer-to-peer fallback',
          icon: <Wifi className="h-4 w-4" />,
          color: 'bg-gray-500'
        };
      default:
        return {
          name: 'Connecting...',
          description: 'Selecting best provider',
          icon: <Clock className="h-4 w-4" />,
          color: 'bg-gray-400'
        };
    }
  };

  const getQualityInfo = (quality: string) => {
    switch (quality) {
      case 'excellent':
        return { icon: <CheckCircle className="h-4 w-4 text-green-500" />, text: 'Excellent', color: 'text-green-500' };
      case 'good':
        return { icon: <Signal className="h-4 w-4 text-blue-500" />, text: 'Good', color: 'text-blue-500' };
      case 'fair':
        return { icon: <Signal className="h-4 w-4 text-yellow-500" />, text: 'Fair', color: 'text-yellow-500' };
      case 'poor':
        return { icon: <AlertTriangle className="h-4 w-4 text-orange-500" />, text: 'Poor', color: 'text-orange-500' };
      case 'failed':
        return { icon: <WifiOff className="h-4 w-4 text-red-500" />, text: 'Failed', color: 'text-red-500' };
      default:
        return { icon: <Clock className="h-4 w-4 text-gray-500" />, text: 'Unknown', color: 'text-gray-500' };
    }
  };

  const providerInfo = getProviderInfo(currentProvider);
  const qualityInfo = getQualityInfo(connectionQuality);

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Wifi className="h-5 w-5" />
          Connection Status
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Provider */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${providerInfo.color}`} />
            <div>
              <p className="font-medium text-sm">{providerInfo.name}</p>
              <p className="text-xs text-gray-500">{providerInfo.description}</p>
            </div>
          </div>
          {providerInfo.icon}
        </div>

        {/* Connection Quality */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {qualityInfo.icon}
            <span className={`font-medium ${qualityInfo.color}`}>
              {qualityInfo.text}
            </span>
          </div>
          <Badge variant="outline" className="text-xs">
            {connectionStats.latency}ms
          </Badge>
        </div>

        {/* Connection Stats */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="bg-gray-50 p-2 rounded">
            <p className="text-gray-500">Bandwidth</p>
            <p className="font-medium">{Math.round(connectionStats.bandwidth / 1000)}k</p>
          </div>
          <div className="bg-gray-50 p-2 rounded">
            <p className="text-gray-500">Resolution</p>
            <p className="font-medium">{connectionStats.resolution}</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          {onRetry && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onRetry}
              className="flex-1"
            >
              Retry
            </Button>
          )}
          
          {onSwitchProvider && currentProvider !== 'daily' && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => onSwitchProvider('daily')}
              className="flex-1"
            >
              Try Daily.co
            </Button>
          )}
        </div>

        {/* Tips for African Mobile Networks */}
        <div className="bg-blue-50 p-3 rounded-lg">
          <p className="text-xs text-blue-700 font-medium mb-1">
            💡 For better connection on mobile networks:
          </p>
          <ul className="text-xs text-blue-600 space-y-1">
            <li>• Move to an area with stronger signal</li>
            <li>• Switch to WiFi if available</li>
            <li>• Close other apps using internet</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}