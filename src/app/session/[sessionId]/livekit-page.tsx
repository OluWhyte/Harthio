/**
 * LiveKit Session Page
 * Replacement for the complex video provider system
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { SessionSafetyDisclaimer } from '@/components/session/session-safety-disclaimer';
import { topicService } from '@/lib/supabase-services';

export default function LiveKitSessionPage() {
  const { sessionId } = useParams();
  const { user, userProfile } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const [topic, setTopic] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showSafetyDisclaimer, setShowSafetyDisclaimer] = useState(false);

  // Load session data
  useEffect(() => {
    const loadSession = async () => {
      if (!user || !sessionId) return;

      try {
        const sessionData = await topicService.getTopicById(sessionId as string);
        setTopic(sessionData);
        
        // Show safety disclaimer for first-time users
        const hasSeenDisclaimer = localStorage.getItem(`safety_disclaimer_${user.uid}`);
        if (!hasSeenDisclaimer) {
          setShowSafetyDisclaimer(true);
        }
        
      } catch (error) {
        console.error('Failed to load session:', error);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to load session data',
        });
        router.push('/dashboard');
      } finally {
        setLoading(false);
      }
    };

    loadSession();
  }, [user, sessionId, toast, router]);

  // Handle safety disclaimer acceptance
  const handleAcceptDisclaimer = () => {
    localStorage.setItem(`safety_disclaimer_${user?.uid}`, Date.now().toString());
    setShowSafetyDisclaimer(false);
    
    // Redirect to LiveKit call page
    router.push(`/call/${sessionId}`);
  };

  // Handle safety disclaimer decline
  const handleDeclineDisclaimer = () => {
    router.push('/dashboard');
  };

  // Join call directly (if disclaimer already seen)
  const handleJoinCall = () => {
    router.push(`/call/${sessionId}`);
  };

  // Loading state
  if (loading || !topic) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-400 mx-auto mb-4"></div>
          <p className="text-rose-200">Loading session...</p>
        </div>
      </div>
    );
  }

  // Safety disclaimer
  if (showSafetyDisclaimer) {
    return (
      <SessionSafetyDisclaimer
        isOpen={showSafetyDisclaimer}
        onAccept={handleAcceptDisclaimer}
        onDecline={handleDeclineDisclaimer}
        sessionTitle={topic?.title}
      />
    );
  }

  // Session preview
  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <h1 className="text-2xl font-bold mb-2">{topic.title}</h1>
          <p className="text-gray-400">{topic.description}</p>
        </div>
        
        <div className="space-y-4">
          <div className="bg-gray-900 rounded-lg p-4">
            <h3 className="font-semibold mb-2">Ready to join?</h3>
            <p className="text-sm text-gray-400 mb-4">
              You'll be connected via high-quality video call powered by LiveKit.
            </p>
            
            <Button
              onClick={handleJoinCall}
              className="w-full bg-rose-600 hover:bg-rose-700"
              size="lg"
            >
              Join Video Call
            </Button>
          </div>
          
          <Button
            onClick={() => router.push('/dashboard')}
            variant="ghost"
            className="w-full"
          >
            Back to Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
}