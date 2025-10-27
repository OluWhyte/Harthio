/**
 * Session Settings Modal
 * Audio/Video device selection and quality settings
 */

"use client";

import React, { useState, useEffect } from 'react';
import { 
  Settings, Mic, Video, Volume2, Monitor,
  Check, X, RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';

interface SessionSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplySettings: (settings: SessionSettings) => void;
}

export interface SessionSettings {
  audioDeviceId?: string;
  videoDeviceId?: string;
  audioVolume: number;
  videoQuality: 'low' | 'medium' | 'high' | 'auto';
  echoCancellation: boolean;
  noiseSuppression: boolean;
  autoGainControl: boolean;
  defaultAudioMuted: boolean;
  defaultVideoOff: boolean;
}

export function SessionSettingsModal({
  isOpen,
  onClose,
  onApplySettings
}: SessionSettingsModalProps) {
  const [audioDevices, setAudioDevices] = useState<MediaDeviceInfo[]>([]);
  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
  const [settings, setSettings] = useState<SessionSettings>({
    audioVolume: 80,
    videoQuality: 'auto',
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true,
    defaultAudioMuted: false,
    defaultVideoOff: false
  });
  const [isLoading, setIsLoading] = useState(false);

  // Load available devices
  useEffect(() => {
    if (isOpen) {
      loadDevices();
    }
  }, [isOpen]);

  const loadDevices = async () => {
    try {
      setIsLoading(true);
      
      // Request permissions first
      await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
      
      // Get available devices
      const devices = await navigator.mediaDevices.enumerateDevices();
      
      const audioInputs = devices.filter(device => device.kind === 'audioinput');
      const videoInputs = devices.filter(device => device.kind === 'videoinput');
      
      setAudioDevices(audioInputs);
      setVideoDevices(videoInputs);
      
      // Set default devices if not already set
      if (!settings.audioDeviceId && audioInputs.length > 0) {
        setSettings(prev => ({ ...prev, audioDeviceId: audioInputs[0].deviceId }));
      }
      if (!settings.videoDeviceId && videoInputs.length > 0) {
        setSettings(prev => ({ ...prev, videoDeviceId: videoInputs[0].deviceId }));
      }
      
    } catch (error) {
      console.error('Failed to load devices:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApply = () => {
    onApplySettings(settings);
    onClose();
  };

  const handleReset = () => {
    setSettings({
      audioVolume: 80,
      videoQuality: 'auto',
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
      defaultAudioMuted: false,
      defaultVideoOff: false
    });
  };

  const getQualityDescription = (quality: string) => {
    switch (quality) {
      case 'low': return '480p, 15fps - Best for slow connections';
      case 'medium': return '720p, 30fps - Balanced quality and performance';
      case 'high': return '1080p, 30fps - Best quality, requires good connection';
      case 'auto': return 'Automatically adjusts based on connection';
      default: return '';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] flex flex-col w-[95vw] sm:w-full">
        <DialogHeader className="flex-shrink-0 px-4 sm:px-6 pt-4 sm:pt-6">
          <DialogTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <Settings className="w-4 w-4 sm:w-5 sm:h-5 flex-shrink-0" />
            <span className="truncate">Session Settings</span>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-grow overflow-y-auto px-4 sm:px-6 pb-4 sm:pb-6">
          <div className="space-y-4 sm:space-y-6">
            {/* Audio Settings */}
            <div className="space-y-3 sm:space-y-4">
              <div className="flex items-center gap-2">
                <Mic className="w-4 h-4 flex-shrink-0" />
                <Label className="text-sm font-medium">Audio</Label>
              </div>

              {/* Microphone Selection */}
              <div className="space-y-2">
                <Label className="text-xs text-gray-600">Microphone</Label>
                <Select
                  value={settings.audioDeviceId}
                  onValueChange={(value) => setSettings(prev => ({ ...prev, audioDeviceId: value }))}
                  disabled={isLoading}
                >
                  <SelectTrigger className="text-sm">
                    <SelectValue placeholder="Select microphone" />
                  </SelectTrigger>
                  <SelectContent>
                    {audioDevices.map((device) => (
                      <SelectItem key={device.deviceId} value={device.deviceId} className="text-sm">
                        <span className="truncate">{device.label || `Microphone ${device.deviceId.slice(0, 8)}`}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Audio Volume */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs text-gray-600">Volume</Label>
                  <span className="text-xs text-gray-500 flex-shrink-0">{settings.audioVolume}%</span>
                </div>
                <Slider
                  value={[settings.audioVolume]}
                  onValueChange={([value]) => setSettings(prev => ({ ...prev, audioVolume: value }))}
                  max={100}
                  step={5}
                  className="w-full"
                />
              </div>

              {/* Audio Processing */}
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <Label className="text-xs text-gray-600 flex-1">Echo Cancellation</Label>
                  <Switch
                    checked={settings.echoCancellation}
                    onCheckedChange={(checked) => setSettings(prev => ({ ...prev, echoCancellation: checked }))}
                  />
                </div>
                <div className="flex items-center justify-between gap-3">
                  <Label className="text-xs text-gray-600 flex-1">Noise Suppression</Label>
                  <Switch
                    checked={settings.noiseSuppression}
                    onCheckedChange={(checked) => setSettings(prev => ({ ...prev, noiseSuppression: checked }))}
                  />
                </div>
                <div className="flex items-center justify-between gap-3">
                  <Label className="text-xs text-gray-600 flex-1">Auto Gain Control</Label>
                  <Switch
                    checked={settings.autoGainControl}
                    onCheckedChange={(checked) => setSettings(prev => ({ ...prev, autoGainControl: checked }))}
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Default States */}
            <div className="space-y-3 sm:space-y-4">
              <div className="flex items-center gap-2">
                <Monitor className="w-4 h-4 flex-shrink-0" />
                <Label className="text-sm font-medium">Default States</Label>
              </div>

              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <Label className="text-xs text-gray-600 break-words">Start with microphone muted</Label>
                    <p className="text-xs text-gray-500 break-words">Microphone will be muted when joining sessions</p>
                  </div>
                  <Switch
                    checked={settings.defaultAudioMuted}
                    onCheckedChange={(checked) => setSettings(prev => ({ ...prev, defaultAudioMuted: checked }))}
                    className="flex-shrink-0"
                  />
                </div>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <Label className="text-xs text-gray-600 break-words">Start with camera off</Label>
                    <p className="text-xs text-gray-500 break-words">Camera will be off when joining sessions</p>
                  </div>
                  <Switch
                    checked={settings.defaultVideoOff}
                    onCheckedChange={(checked) => setSettings(prev => ({ ...prev, defaultVideoOff: checked }))}
                    className="flex-shrink-0"
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Video Settings */}
            <div className="space-y-3 sm:space-y-4">
              <div className="flex items-center gap-2">
                <Video className="w-4 h-4 flex-shrink-0" />
                <Label className="text-sm font-medium">Video</Label>
              </div>

              {/* Camera Selection */}
              <div className="space-y-2">
                <Label className="text-xs text-gray-600">Camera</Label>
                <Select
                  value={settings.videoDeviceId}
                  onValueChange={(value) => setSettings(prev => ({ ...prev, videoDeviceId: value }))}
                  disabled={isLoading}
                >
                  <SelectTrigger className="text-sm">
                    <SelectValue placeholder="Select camera" />
                  </SelectTrigger>
                  <SelectContent>
                    {videoDevices.map((device) => (
                      <SelectItem key={device.deviceId} value={device.deviceId} className="text-sm">
                        <span className="truncate">{device.label || `Camera ${device.deviceId.slice(0, 8)}`}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Video Quality */}
              <div className="space-y-2">
                <Label className="text-xs text-gray-600">Quality</Label>
                <Select
                  value={settings.videoQuality}
                  onValueChange={(value: any) => setSettings(prev => ({ ...prev, videoQuality: value }))}
                >
                  <SelectTrigger className="text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="auto" className="text-sm">Auto</SelectItem>
                    <SelectItem value="high" className="text-sm">High (1080p)</SelectItem>
                    <SelectItem value="medium" className="text-sm">Medium (720p)</SelectItem>
                    <SelectItem value="low" className="text-sm">Low (480p)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500 break-words leading-relaxed">
                  {getQualityDescription(settings.videoQuality)}
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0 pt-3 sm:pt-4 border-t">
              <Button
                variant="outline"
                size="sm"
                onClick={handleReset}
                className="flex items-center gap-2 w-full sm:w-auto text-sm"
              >
                <RefreshCw className="w-3 h-3 flex-shrink-0" />
                <span className="truncate">Reset</span>
              </Button>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onClose}
                  className="flex-1 sm:flex-none text-sm"
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleApply}
                  disabled={isLoading}
                  className="flex-1 sm:flex-none text-sm"
                >
                  <Check className="w-3 h-3 mr-1 flex-shrink-0" />
                  <span className="truncate">Apply</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}