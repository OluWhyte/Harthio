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
    autoGainControl: true
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
      autoGainControl: true
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
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Session Settings
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Audio Settings */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Mic className="w-4 h-4" />
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
                <SelectTrigger>
                  <SelectValue placeholder="Select microphone" />
                </SelectTrigger>
                <SelectContent>
                  {audioDevices.map((device) => (
                    <SelectItem key={device.deviceId} value={device.deviceId}>
                      {device.label || `Microphone ${device.deviceId.slice(0, 8)}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Audio Volume */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs text-gray-600">Volume</Label>
                <span className="text-xs text-gray-500">{settings.audioVolume}%</span>
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
              <div className="flex items-center justify-between">
                <Label className="text-xs text-gray-600">Echo Cancellation</Label>
                <Switch
                  checked={settings.echoCancellation}
                  onCheckedChange={(checked) => setSettings(prev => ({ ...prev, echoCancellation: checked }))}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-xs text-gray-600">Noise Suppression</Label>
                <Switch
                  checked={settings.noiseSuppression}
                  onCheckedChange={(checked) => setSettings(prev => ({ ...prev, noiseSuppression: checked }))}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-xs text-gray-600">Auto Gain Control</Label>
                <Switch
                  checked={settings.autoGainControl}
                  onCheckedChange={(checked) => setSettings(prev => ({ ...prev, autoGainControl: checked }))}
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Video Settings */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Video className="w-4 h-4" />
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
                <SelectTrigger>
                  <SelectValue placeholder="Select camera" />
                </SelectTrigger>
                <SelectContent>
                  {videoDevices.map((device) => (
                    <SelectItem key={device.deviceId} value={device.deviceId}>
                      {device.label || `Camera ${device.deviceId.slice(0, 8)}`}
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
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="auto">Auto</SelectItem>
                  <SelectItem value="high">High (1080p)</SelectItem>
                  <SelectItem value="medium">Medium (720p)</SelectItem>
                  <SelectItem value="low">Low (480p)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500">
                {getQualityDescription(settings.videoQuality)}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={handleReset}
              className="flex items-center gap-2"
            >
              <RefreshCw className="w-3 h-3" />
              Reset
            </Button>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={onClose}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleApply}
                disabled={isLoading}
              >
                <Check className="w-3 h-3 mr-1" />
                Apply
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}