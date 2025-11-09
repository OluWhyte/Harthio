/**
 * Connection Help Dialog
 * Provides users with troubleshooting guidance and tips
 */

'use client';

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import {
  HelpCircle,
  Wifi,
  Smartphone,
  Monitor,
  Camera,
  Mic,
  Shield,
  Zap,
  CheckCircle,
  AlertTriangle,
  Info
} from 'lucide-react';

interface ConnectionHelpDialogProps {
  trigger?: React.ReactNode;
  connectionQuality?: 'excellent' | 'good' | 'fair' | 'poor' | 'failed';
  isMobile?: boolean;
}

export function ConnectionHelpDialog({ 
  trigger, 
  connectionQuality = 'good',
  isMobile = false 
}: ConnectionHelpDialogProps) {
  const defaultTrigger = (
    <Button variant="outline" size="sm" className="gap-2">
      <HelpCircle className="w-4 h-4" />
      Connection Help
    </Button>
  );

  const getQualityColor = (quality: string) => {
    switch (quality) {
      case 'excellent': return 'text-green-600 bg-green-50 border-green-200';
      case 'good': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'fair': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'poor': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'failed': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getQualityIcon = (quality: string) => {
    switch (quality) {
      case 'excellent':
      case 'good':
        return <CheckCircle className="w-4 h-4" />;
      case 'fair':
        return <Info className="w-4 h-4" />;
      case 'poor':
      case 'failed':
        return <AlertTriangle className="w-4 h-4" />;
      default:
        return <Info className="w-4 h-4" />;
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <HelpCircle className="w-5 h-5" />
            Connection Help & Troubleshooting
          </DialogTitle>
        </DialogHeader>

        {/* Current Status */}
        <div className={`p-3 rounded-lg border ${getQualityColor(connectionQuality)}`}>
          <div className="flex items-center gap-2 mb-1">
            {getQualityIcon(connectionQuality)}
            <span className="font-medium">Current Connection: {connectionQuality}</span>
          </div>
          <p className="text-sm opacity-80">
            {connectionQuality === 'excellent' && 'Perfect! You should have no issues with video calls.'}
            {connectionQuality === 'good' && 'Great connection. Video calls should work smoothly.'}
            {connectionQuality === 'fair' && 'Decent connection. Video quality may be automatically adjusted.'}
            {connectionQuality === 'poor' && 'Limited connection. Consider the tips below to improve quality.'}
            {connectionQuality === 'failed' && 'Connection issues detected. Please try the troubleshooting steps below.'}
          </p>
        </div>

        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="general">
            <AccordionTrigger>General Tips</AccordionTrigger>
            <AccordionContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <Wifi className="w-4 h-4" />
                Network Connection Tips
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Use WiFi instead of mobile data when possible</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Move closer to your WiFi router</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Close other apps or browser tabs using internet</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Pause downloads, streaming, or cloud backups</span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <Zap className="w-4 h-4" />
                Quick Fixes
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                  <span>Refresh the page if video isn't working</span>
                </div>
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                  <span>Try switching between WiFi and mobile data</span>
                </div>
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                  <span>Restart your browser if problems persist</span>
                </div>
              </div>
            </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="mobile">
            <AccordionTrigger>Mobile Tips</AccordionTrigger>
            <AccordionContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <Smartphone className="w-4 h-4" />
                Mobile-Specific Tips
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-start gap-2">
                  <Shield className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                  <span>Ensure you're using HTTPS (secure connection)</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Use the latest version of Chrome, Safari, or Firefox</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Close other apps to free up memory and bandwidth</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Keep your phone plugged in during long calls</span>
                </div>
              </div>
            </div>

            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="font-medium text-blue-800 mb-1">Mobile Data Usage</h4>
              <p className="text-sm text-blue-700">
                Video calls use approximately 150-300 MB per hour. Consider using WiFi for extended sessions.
              </p>
            </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="devices">
            <AccordionTrigger>Device Issues</AccordionTrigger>
            <AccordionContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <Camera className="w-4 h-4" />
                Camera Issues
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                  <span>Click the camera icon in your browser's address bar to allow access</span>
                </div>
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                  <span>Check if another app is using your camera</span>
                </div>
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                  <span>Try switching between front and back camera on mobile</span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <Mic className="w-4 h-4" />
                Microphone Issues
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                  <span>Check your system's microphone permissions</span>
                </div>
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                  <span>Make sure your microphone isn't muted in system settings</span>
                </div>
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                  <span>Try using headphones or earbuds to reduce echo</span>
                </div>
              </div>
            </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="advanced">
            <AccordionTrigger>Advanced Settings</AccordionTrigger>
            <AccordionContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <Monitor className="w-4 h-4" />
                Browser Settings
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-start gap-2">
                  <Info className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                  <span>Enable hardware acceleration in browser settings</span>
                </div>
                <div className="flex items-start gap-2">
                  <Info className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                  <span>Clear browser cache and cookies if experiencing issues</span>
                </div>
                <div className="flex items-start gap-2">
                  <Info className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                  <span>Disable browser extensions that might interfere</span>
                </div>
              </div>
            </div>

            <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
              <h4 className="font-medium text-gray-800 mb-2">Supported Browsers</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs">Chrome</Badge>
                  <span className="text-gray-600">v80+</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs">Firefox</Badge>
                  <span className="text-gray-600">v75+</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs">Safari</Badge>
                  <span className="text-gray-600">v13+</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs">Edge</Badge>
                  <span className="text-gray-600">v80+</span>
                </div>
              </div>
            </div>

            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <h4 className="font-medium text-yellow-800 mb-1">Still Having Issues?</h4>
              <p className="text-sm text-yellow-700">
                The system automatically switches between different connection methods to ensure the best experience. 
                If video isn't working, you can still communicate via audio and chat.
              </p>
            </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </DialogContent>
    </Dialog>
  );
}