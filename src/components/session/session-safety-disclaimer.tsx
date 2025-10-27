/**
 * Session Safety Disclaimer
 * Privacy and safety notice that appears before joining a session
 */

"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Shield, Eye, Users, AlertTriangle, CheckCircle } from 'lucide-react';

interface SessionSafetyDisclaimerProps {
  isOpen: boolean;
  onAccept: () => void;
  onDecline: () => void;
  sessionTitle?: string;
}

export function SessionSafetyDisclaimer({ 
  isOpen, 
  onAccept, 
  onDecline, 
  sessionTitle 
}: SessionSafetyDisclaimerProps) {
  const [hasReadPrivacy, setHasReadPrivacy] = useState(false);
  const [hasReadSafety, setHasReadSafety] = useState(false);
  const [hasReadLiability, setHasReadLiability] = useState(false);

  const canProceed = hasReadPrivacy && hasReadSafety && hasReadLiability;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4">
      <Card className="w-full max-w-2xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
        <CardHeader className="text-center border-b">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Shield className="h-6 w-6 text-blue-600" />
            <CardTitle className="text-xl">Session Safety & Privacy</CardTitle>
          </div>
          {sessionTitle && (
            <p className="text-sm text-muted-foreground">
              Before joining "{sessionTitle}"
            </p>
          )}
        </CardHeader>

        <CardContent className="space-y-4 sm:space-y-6 p-4 sm:p-6">
          {/* Privacy Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-green-600" />
              <h3 className="font-semibold text-lg">Your Privacy Matters</h3>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-2">
              <p className="text-sm text-green-800">
                <strong>Keep your personal information safe:</strong>
              </p>
              <ul className="text-sm text-green-700 space-y-1 ml-4">
                <li>• Don't share your full name, address, or phone number</li>
                <li>• Avoid discussing financial information or bank details</li>
                <li>• Keep work-related sensitive information private</li>
                <li>• Use your first name or a nickname if you prefer</li>
              </ul>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="privacy" 
                checked={hasReadPrivacy}
                onCheckedChange={(checked) => setHasReadPrivacy(checked === true)}
              />
              <label htmlFor="privacy" className="text-sm font-medium">
                I understand how to protect my privacy during sessions
              </label>
            </div>
          </div>

          {/* Safety Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" />
              <h3 className="font-semibold text-lg">Safe Conversations</h3>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
              <p className="text-sm text-blue-800">
                <strong>We're here to facilitate meaningful conversations:</strong>
              </p>
              <ul className="text-sm text-blue-700 space-y-1 ml-4">
                <li>• Sessions are for discussion and support, not professional advice</li>
                <li>• You can leave any session at any time if you feel uncomfortable</li>
                <li>• Report any inappropriate behavior using our feedback system</li>
                <li>• Trust your instincts - if something feels wrong, it probably is</li>
              </ul>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="safety" 
                checked={hasReadSafety}
                onCheckedChange={(checked) => setHasReadSafety(checked === true)}
              />
              <label htmlFor="safety" className="text-sm font-medium">
                I understand the nature of these conversations and my safety options
              </label>
            </div>
          </div>

          {/* Liability Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
              <h3 className="font-semibold text-lg">Important Notice</h3>
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 space-y-2">
              <p className="text-sm text-amber-800">
                <strong>Please understand:</strong>
              </p>
              <ul className="text-sm text-amber-700 space-y-1 ml-4">
                <li>• Harthio provides a platform for conversations between users</li>
                <li>• We are not responsible for the content or outcomes of individual sessions</li>
                <li>• Participants are responsible for their own words and actions</li>
                <li>• This platform is not a substitute for professional counseling or advice</li>
              </ul>
              <p className="text-xs text-amber-600 mt-3 italic">
                By joining, you acknowledge that you participate at your own discretion and responsibility.
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="liability" 
                checked={hasReadLiability}
                onCheckedChange={(checked) => setHasReadLiability(checked === true)}
              />
              <label htmlFor="liability" className="text-sm font-medium">
                I understand and accept these terms and conditions
              </label>
            </div>
          </div>

          {/* Positive Reinforcement */}
          <div className="bg-gradient-to-r from-blue-50 to-green-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <h4 className="font-medium text-green-800">You're in Control</h4>
            </div>
            <p className="text-sm text-green-700">
              Remember: You can end any session immediately if you feel uncomfortable. 
              Most conversations on Harthio are positive and supportive experiences where people connect over shared topics.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={onDecline}
              className="flex-1 sm:flex-none"
            >
              Not Right Now
            </Button>
            <Button
              onClick={onAccept}
              disabled={!canProceed}
              className="flex-1"
            >
              {canProceed ? (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Continue to Session
                </>
              ) : (
                'Please read and check all sections above'
              )}
            </Button>
          </div>

          <p className="text-xs text-center text-muted-foreground">
            This notice helps ensure everyone has safe and positive experiences on Harthio
          </p>
        </CardContent>
      </Card>
    </div>
  );
}