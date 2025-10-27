/**
 * Session Safety Reminder
 * Simplified version of the disclaimer for in-session viewing
 */

"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, Eye, Users, AlertTriangle, CheckCircle, X } from 'lucide-react';

interface SessionSafetyReminderProps {
  isOpen: boolean;
  onClose: () => void;
  sessionTitle?: string;
}

export function SessionSafetyReminder({ 
  isOpen, 
  onClose, 
  sessionTitle 
}: SessionSafetyReminderProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4">
      <Card className="w-full max-w-xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
        <CardHeader className="text-center border-b relative">
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="absolute right-2 top-2 h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
          <div className="flex items-center justify-center gap-2 mb-2">
            <Shield className="h-5 w-5 text-blue-600" />
            <CardTitle className="text-lg">Safety & Privacy Reminder</CardTitle>
          </div>
          {sessionTitle && (
            <p className="text-sm text-muted-foreground">
              Currently in "{sessionTitle}"
            </p>
          )}
        </CardHeader>

        <CardContent className="space-y-4 p-4 sm:p-6">
          {/* Quick Privacy Reminder */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4 text-green-600" />
              <h3 className="font-medium">Protect Your Privacy</h3>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <ul className="text-sm text-green-700 space-y-1">
                <li>• Keep personal details (address, phone, financial info) private</li>
                <li>• Use first names or nicknames</li>
                <li>• Trust your instincts about what to share</li>
              </ul>
            </div>
          </div>

          {/* Safety Reminder */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-600" />
              <h3 className="font-medium">Stay Safe</h3>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• You can leave this session anytime if uncomfortable</li>
                <li>• Report inappropriate behavior if needed</li>
                <li>• This is for discussion, not professional advice</li>
              </ul>
            </div>
          </div>

          {/* Quick Reminder */}
          <div className="bg-gradient-to-r from-blue-50 to-green-50 border border-blue-200 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <h4 className="font-medium text-green-800 text-sm">You're in Control</h4>
            </div>
            <p className="text-xs text-green-700">
              Remember: You already agreed to these guidelines when joining. 
              This is just a friendly reminder to help keep conversations positive and safe.
            </p>
          </div>

          {/* Close Button */}
          <div className="flex justify-center pt-2">
            <Button onClick={onClose} className="w-full sm:w-auto">
              <CheckCircle className="h-4 w-4 mr-2" />
              Got it, thanks!
            </Button>
          </div>

          <p className="text-xs text-center text-muted-foreground">
            These guidelines help everyone have better conversations on Harthio
          </p>
        </CardContent>
      </Card>
    </div>
  );
}