
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { format } from 'date-fns';
import { topicService, dbUtils } from '@/lib/supabase-services';

export function OngoingSessionIndicator() {
  const [activeSession, setActiveSession] = useState<any | null>(null);
  const [upcomingSession, setUpcomingSession] = useState<any | null>(null);
  const { user, setIsInOngoingSession } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const fetchSessionStatus = async () => {
      if (user?.uid) {
        try {
          // Fetch topics the user authored and participates in
          const [authored, participating] = await Promise.all([
            topicService.getTopicsByUserId(user.uid),
            topicService.getParticipantTopics(user.uid),
          ]);

          // Merge and dedupe by id
          const topicMap = new Map<string, any>();
          [...authored, ...participating].forEach((t) => topicMap.set(t.id, t));
          const allTopics = Array.from(topicMap.values());

          // Filter topics that user can join (author or participant) and have exactly 2 participants
          const userTopics = allTopics.filter((t) => 
            dbUtils.canUserJoinSession(t, user.uid) && dbUtils.getTotalParticipantCount(t) === 2
          );

          // Find active session (within time window AND has exactly 2 participants)
          // Only show join button during the actual session time window
          const activeSessionTopic = userTopics.find((t) => dbUtils.isTopicActive(t));

          // Find upcoming session (before start time AND has exactly 2 participants)
          const upcomingSessionTopics = userTopics
            .filter((t) => dbUtils.isTopicReady(t))
            .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());

          const nextUpcomingTopic = upcomingSessionTopics[0] || null;

          // Set session states - only show if user has confirmed sessions with exactly 2 participants
          setActiveSession(activeSessionTopic ? {
            id: activeSessionTopic.id,
            title: activeSessionTopic.title,
            author: activeSessionTopic.author,
            startTime: new Date(activeSessionTopic.start_time),
            endTime: new Date(activeSessionTopic.end_time),
          } : null);

          setUpcomingSession(nextUpcomingTopic ? {
            id: nextUpcomingTopic.id,
            title: nextUpcomingTopic.title,
            author: nextUpcomingTopic.author,
            startTime: new Date(nextUpcomingTopic.start_time),
            endTime: new Date(nextUpcomingTopic.end_time),
          } : null);

          setIsInOngoingSession(!!activeSessionTopic);

          // Clean up expired topics periodically (only run cleanup every 2 minutes for better state management)
          const lastCleanup = localStorage.getItem('lastTopicCleanup');
          const currentTime = Date.now();
          if (!lastCleanup || currentTime - parseInt(lastCleanup) > 2 * 60 * 1000) {
            dbUtils.cleanupExpiredTopics().catch(console.error);
            localStorage.setItem('lastTopicCleanup', currentTime.toString());
          }
        } catch (error) {
          console.error('Fetch session status error:', error);
          setActiveSession(null);
          setUpcomingSession(null);
          setIsInOngoingSession(false);
        }
      } else {
        setActiveSession(null);
        setUpcomingSession(null);
        setIsInOngoingSession(false);
      }
    };

    fetchSessionStatus();
    const interval = setInterval(fetchSessionStatus, 30000); // Re-check every 30 seconds for better responsiveness
    return () => clearInterval(interval);
  }, [user, setIsInOngoingSession, router]);


  // STATE 3: Show "Join Session" when session is active (within time window AND has exactly 2 participants)
  // This is the only time users can actually join the session
  if (activeSession) {
    return (
      <div className="flex items-center gap-2">
        <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
        <Button variant="destructive" size="sm" onClick={() => router.push(`/session/${activeSession.id}`)}>
          Join Session
        </Button>
      </div>
    );
  }

  // STATE 2: Show "Upcoming Session" when session is ready (before start time AND has exactly 2 participants)
  // This shows only to author and approved participant
  if (upcomingSession) {
    return (
       <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="outline" size="sm">
            Upcoming Session
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
          <AlertDialogTitle>Your next session</AlertDialogTitle>
             <AlertDialogDescription>
              You are scheduled to join the following session.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4 space-y-2">
            <p><span className="font-semibold">Topic:</span> {upcomingSession.title}</p>
            {upcomingSession.author?.display_name && (
              <p><span className="font-semibold">Host:</span> {upcomingSession.author.display_name}</p>
            )}
            <p><span className="font-semibold">Starts at:</span> {format(upcomingSession.startTime, 'E, d MMM @ HH:mm')}</p>
          </div>
          <AlertDialogFooter>
            <AlertDialogAction>Got it</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    )
  }

  // STATE 1: No buttons shown for created sessions (no approved participants)
  // These sessions are visible on timeline for all users to request to join
  // 
  // Both buttons disappear when:
  // 1. Session has ended
  // 2. Session doesn't have exactly 2 participants confirmed
  // 3. Session is in STATE 1 (created but no approved participants)
  return null;
}
