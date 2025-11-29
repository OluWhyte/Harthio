'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from './use-auth';
import {
  detectSessionBrowsing,
  detectMoodChange,
  detectIdleOnHome,
  detectMultipleResets,
  detectNoCheckins,
  detectSessionEnded,
  detectProgressView,
  trackPageView,
  getPageDuration,
  getCurrentPage
} from '@/ai/services/proactive-ai-service';

// Hook for session browsing detection
export function useSessionBrowsingDetection(isDialogOpen: boolean = false) {
  const { user } = useAuth();
  const pathname = usePathname();
  const isSessionsPage = pathname === '/sessions';
  const timerRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    // Don't trigger if dialog is open (user is creating a session)
    if (!user || !isSessionsPage || isDialogOpen) {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      return;
    }

    // Start timer when user lands on sessions page
    timerRef.current = setTimeout(() => {
      detectSessionBrowsing(user.id, 180);
    }, 180000); // 3 minutes

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [user, isSessionsPage, isDialogOpen]);
}

// Hook for idle detection on home page
export function useIdleDetection() {
  const { user } = useAuth();
  const pathname = usePathname();
  const isHomePage = pathname === '/home';
  const timerRef = useRef<NodeJS.Timeout>();
  const lastActivityRef = useRef(Date.now());

  useEffect(() => {
    if (!user || !isHomePage) return;

    const resetActivity = () => {
      lastActivityRef.current = Date.now();
    };

    // Track user activity
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    events.forEach(event => {
      window.addEventListener(event, resetActivity);
    });

    // Check for idle every 30 seconds
    const checkIdle = () => {
      const idleTime = Math.floor((Date.now() - lastActivityRef.current) / 1000);
      if (idleTime >= 300) { // 5 minutes idle
        detectIdleOnHome(user.id, idleTime);
      }
    };

    timerRef.current = setInterval(checkIdle, 30000);

    return () => {
      events.forEach(event => {
        window.removeEventListener(event, resetActivity);
      });
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [user, isHomePage]);
}

// Hook for tracking page views
export function usePageTracking() {
  const pathname = usePathname();

  useEffect(() => {
    trackPageView(pathname);
  }, [pathname]);
}

// Hook for checking no check-ins (runs once on app load)
export function useNoCheckinsDetection() {
  const { user } = useAuth();
  const hasCheckedRef = useRef(false);

  useEffect(() => {
    if (!user || hasCheckedRef.current) return;

    hasCheckedRef.current = true;
    
    // Check after 5 seconds of app being open
    setTimeout(() => {
      detectNoCheckins(user.id);
    }, 5000);
  }, [user]);
}

// Hook for detecting multiple resets (call this after a reset)
export function useTriggerResetDetection() {
  const { user } = useAuth();

  return async () => {
    if (!user) return;
    await detectMultipleResets(user.id);
  };
}

// Hook for mood change detection (call this when mood changes)
export function useTriggerMoodChange() {
  const { user } = useAuth();

  return async (fromMood: string, toMood: string) => {
    if (!user) return;
    await detectMoodChange(user.id, fromMood, toMood);
  };
}

// Hook for session ended detection (call this when session ends)
export function useTriggerSessionEnded() {
  const { user } = useAuth();

  return async (sessionId: string) => {
    if (!user) return;
    await detectSessionEnded(user.id, sessionId);
  };
}

// Hook for progress page detection
export function useProgressViewDetection() {
  const { user } = useAuth();
  const pathname = usePathname();
  const isProgressPage = pathname === '/progress';
  const timerRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (!user || !isProgressPage) return;

    // Trigger after 30 seconds of viewing progress
    timerRef.current = setTimeout(() => {
      detectProgressView(user.id, 30);
    }, 30000); // 30 seconds

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [user, isProgressPage]);
}
