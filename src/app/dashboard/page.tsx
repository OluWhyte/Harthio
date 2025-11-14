"use client";

// Force dynamic rendering
export const dynamic = 'force-dynamic';

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { useMobileOptimized, getOptimizedSettings } from "@/hooks/use-mobile-optimized";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Flame,
  Plus,
  Radio,
  Loader2,
  UserCheck,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";
import { TopicCard, Topic } from "@/components/harthio/topic-card";
import { ScheduleSessionDialog } from "@/components/harthio/schedule-session-dialog";
import { topicService } from "@/lib/supabase-services";
import { getSessionStatus } from "@/lib/time-utils";
import { ErrorBoundary } from "@/components/common/error-boundary";
import {
  TopicCardSkeleton,
  LoadingSpinner,
} from "@/components/common/loading-states";

import { useTopicErrorHandler } from "@/hooks/use-error-handler";
import { useNewTopicDetector } from "@/hooks/use-new-topic-detector";
import { FloatingRefreshArrow } from "@/components/common/floating-refresh-arrow";

const trendingTopics = [
  { title: "Managing difficult employees", tag: "Management" },
  { title: "Venting about a co-founder", tag: "Startups" },
  { title: "Imposter syndrome after promotion", tag: "CareerGrowth" },
];

const popularTags = [
  "#BusinessStress",
  "#PlantDads",
  "#SingleParents",
  "#FounderLife",
  "#WorkLifeBalance",
];

// Helper function to determine if a topic should be visible to the user
// Implements 3-state session visibility system:
// 1. Created sessions (no approved participants) → Visible to all users (can request to join)
// 2. Upcoming sessions (with approved participants) → Visible only to author and ONE approved participant
// 3. Active sessions → Only author and approved participant can join at set start time, clears at end time
const shouldShowTopic = (topic: Topic, userId: string | undefined): boolean => {
  try {
    if (!userId || !topic || !topic.id) return false;

    const status = getSessionStatus(topic.startTime, topic.endTime);
    const participants = Array.isArray(topic.participants) ? topic.participants : [];
    const requests = Array.isArray(topic.requests) ? topic.requests : [];
    const isUserAuthor = topic.author?.userId === userId;
    const isUserParticipant = participants.includes(userId);
    const hasUserRequest = requests.some(
      (req) => req && req.requesterId === userId
    );
    const hasApprovedParticipants = participants.length > 0;

    // Don't show ended sessions - they should be cleared
    if (status === "ended") {
      return false;
    }

    // 3-STATE SYSTEM: States are determined by participant approval, NOT by time
    
    // STATE 1: No approved participants - visible to all users (regardless of time)
    // Session remains in STATE 1 until someone is approved, even if start time passes
    // Users can request to join, session cannot start without approved participants
    if (!hasApprovedParticipants) {
      return true; // All users can see and request to join
    }

    // STATE 2: Has approved participants and is upcoming - only visible to author and participant
    // Once author approves ONE user, only author and approved participant can see the session
    // All users not approved to join are cleared from requests and cannot see the session
    if (hasApprovedParticipants && status === "upcoming") {
      return isUserAuthor || isUserParticipant;
    }

    // STATE 3: Has approved participants and is active - only author and participant can join
    // Session can only be active and joinable by author and approved participant
    // Session will clear at the end time set by author when creating session
    if (hasApprovedParticipants && status === "active") {
      return isUserAuthor || isUserParticipant;
    }
    
    return false;
  } catch (error) {
    console.error('Error in shouldShowTopic:', error, topic);
    return false;
  }
};

// Helper function to categorize topics for display with error handling
// Updated for 3-state session visibility system
const categorizeTopics = (topics: Topic[], userId: string | undefined) => {
  const categories = {
    myUpcomingSessions: [] as Topic[],
    otherActiveSessions: [] as Topic[],
    otherTimelineSessions: [] as Topic[],
    myActiveSession: null as Topic | null,
  };

  if (!userId || !Array.isArray(topics)) return categories;

  topics.forEach((topic) => {
    try {
      if (!topic || !topic.id) return;

      const status = getSessionStatus(topic.startTime, topic.endTime);
      const participants = Array.isArray(topic.participants) ? topic.participants : [];
      const hasApprovedParticipants = participants.length > 0;
      const isUserAuthor = topic.author?.userId === userId;
      const isUserParticipant = participants.includes(userId);

      // 3-STATE SYSTEM: Categorization based on participant approval, not time
      
      // STATE 1: No approved participants - show on timeline for all users (regardless of time)
      // Sessions remain in STATE 1 until someone is approved, even if start time passes
      if (!hasApprovedParticipants) {
        if (isUserAuthor) {
          categories.myUpcomingSessions.push(topic);
        } else {
          categories.otherTimelineSessions.push(topic);
        }
        return;
      }

      // STATE 2: Has approved participants and is upcoming - only for author and participant
      // Only show as "My Upcoming Sessions" for author and approved participant
      if (hasApprovedParticipants && status === "upcoming") {
        if (isUserAuthor || isUserParticipant) {
          categories.myUpcomingSessions.push(topic);
        }
        return;
      }

      // STATE 3: Has approved participants and is active - only author and participant can join
      // Only author and approved participant can see and join at set start time
      if (hasApprovedParticipants && status === "active") {
        if (isUserAuthor || isUserParticipant) {
          if (!categories.myActiveSession) {
            categories.myActiveSession = topic;
          }
        }
        return;
      }

    } catch (error) {
      console.error('Error categorizing topic:', error, topic);
    }
  });

  // Sort sessions by start time with error handling
  const sortByStartTime = (a: Topic, b: Topic) => {
    try {
      return a.startTime.getTime() - b.startTime.getTime();
    } catch (error) {
      console.error('Error sorting topics:', error);
      return 0;
    }
  };

  categories.myUpcomingSessions.sort(sortByStartTime);
  categories.otherActiveSessions.sort(sortByStartTime);
  categories.otherTimelineSessions.sort(sortByStartTime);

  return categories;
};

// Helper function to convert Supabase topic to TopicCard format with error handling
const convertSupabaseTopicToTopic = (supabaseTopic: any): Topic => {
  try {
    if (!supabaseTopic || !supabaseTopic.id) {
      throw new Error('Invalid topic data');
    }

    const author = supabaseTopic.author || {};
    const displayName = author.display_name || author.email || 'Unknown User';
    
    return {
      id: supabaseTopic.id,
      title: supabaseTopic.title || 'Untitled Session',
      description: supabaseTopic.description || '',
      requests: Array.isArray(supabaseTopic.requests) ? supabaseTopic.requests : [],
      startTime: new Date(supabaseTopic.start_time),
      endTime: new Date(supabaseTopic.end_time),
      author: {
        userId: author.id || 'unknown',
        name: displayName,
        avatarUrl: author.avatar_url || "https://placehold.co/40x40.png",
        initials: displayName
          .split(" ")
          .map((n: string) => n[0])
          .join("")
          .toUpperCase()
          .slice(0, 2) || "U",
        rating: author.rating || 0,
        reviews: author.reviews_count || 0,
      },
      createdAt: new Date(supabaseTopic.created_at),
      participants: Array.isArray(supabaseTopic.participants) ? supabaseTopic.participants : [],
    };
  } catch (error) {
    console.error('Error converting topic:', error, supabaseTopic);
    // Return a fallback topic to prevent crashes
    return {
      id: supabaseTopic?.id || 'error',
      title: 'Error Loading Session',
      description: 'This session could not be loaded properly',
      requests: [],
      startTime: new Date(),
      endTime: new Date(),
      author: {
        userId: 'unknown',
        name: 'Unknown User',
        avatarUrl: "https://placehold.co/40x40.png",
        initials: "U",
        rating: 0,
        reviews: 0,
      },
      createdAt: new Date(),
      participants: [],
    };
  }
};

function DashboardContent() {
  const router = useRouter();
  const { user, isInOngoingSession, loading } = useAuth();
  const [currentTime, setCurrentTime] = useState(new Date());
  const { hasError, handleError, clearError } = useTopicErrorHandler();

  // Mobile optimization
  const device = useMobileOptimized();
  const settings = getOptimizedSettings(device);

  // Optimized topic state management - prevent excessive re-renders
  const [topics, setTopics] = useState<Topic[]>([]);
  const [isLoadingTopics, setIsLoadingTopics] = useState(true);
  const [topicsError, setTopicsError] = useState<string | null>(null);

  const lastFetchRef = useRef<number>(0);
  const fetchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // New topic detection system - adjusted for mobile
  const { hasNewTopics, refreshAndDismiss } = useNewTopicDetector({
    userId: user?.uid,
    checkInterval: settings.realtimeInterval, // Longer on mobile
    enabled: !!user && !loading
  });

  // Optimized time updates - only when needed
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute
    return () => clearInterval(timer);
  }, []);

  // Handle refresh from floating arrow
  const handleRefreshFromArrow = useCallback(async () => {
    await refreshAndDismiss();
    // Force a fresh fetch after dismissing the arrow
    if (user) {
      try {
        const data = await topicService.getAllTopics();
        const convertedTopics = (data || []).map(convertSupabaseTopicToTopic);
        setTopics(convertedTopics);
      } catch (error) {
        console.debug('Refresh from arrow failed:', error);
      }
    }
  }, [refreshAndDismiss, user]);

  // Optimized fetchTopics with caching and timeout protection
  const fetchTopics = useCallback(async (force = false) => {
    if (!user) {
      setIsLoadingTopics(false);
      return;
    }

    // Prevent rapid successive calls
    const now = Date.now();
    if (!force && now - lastFetchRef.current < 2000) {
      console.log('⏭️ Skipping fetch - too soon after last fetch');
      return;
    }
    lastFetchRef.current = now;

    // Clear any pending fetch
    if (fetchTimeoutRef.current) {
      clearTimeout(fetchTimeoutRef.current);
      fetchTimeoutRef.current = null;
    }

    // Try cache first (unless force refresh)
    const CACHE_KEY = 'dashboard_topics_cache';
    const CACHE_TIME = settings.cacheTime;

    if (!force) {
      try {
        const cached = sessionStorage.getItem(CACHE_KEY);
        if (cached) {
          const { data, timestamp } = JSON.parse(cached);
          const age = Date.now() - timestamp;
          
          if (age < CACHE_TIME) {
            console.log(`📦 [CACHE] Hit - Age: ${(age / 1000).toFixed(0)}s`);
            const convertedTopics = (data || []).map(convertSupabaseTopicToTopic);
            setTopics(convertedTopics);
            setIsLoadingTopics(false);
            return;
          }
          console.log(`📦 [CACHE] Expired - Age: ${(age / 1000).toFixed(0)}s`);
        }
      } catch (cacheError) {
        console.error('📦 [CACHE] Error reading:', cacheError);
      }
    }

    try {
      setIsLoadingTopics(true);
      setTopicsError(null);
      clearError();

      const startTime = performance.now();
      console.log('⚡ Fetching topics for user:', user.uid);
      
      // Add timeout protection to prevent hanging
      const fetchPromise = topicService.getAllTopics();
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Topics fetch timeout')), 15000)
      );
      
      const data = await Promise.race([fetchPromise, timeoutPromise]) as any[];
      const fetchTime = performance.now() - startTime;
      console.log(`⚡ Topics fetched in ${fetchTime.toFixed(0)}ms - ${data?.length || 0} topics`);

      // Save to cache
      try {
        sessionStorage.setItem(CACHE_KEY, JSON.stringify({
          data,
          timestamp: Date.now()
        }));
        console.log(`📦 [CACHE] Saved ${data?.length || 0} topics`);
      } catch (cacheError) {
        console.error('📦 [CACHE] Error saving:', cacheError);
      }

      const convertedTopics = (data || []).map(convertSupabaseTopicToTopic);
      
      // Only update if data actually changed - use shallow comparison for better performance
      setTopics(prevTopics => {
        if (prevTopics.length !== convertedTopics.length) {
          console.log('Topics count changed, updating state');
          return convertedTopics;
        }
        
        // Quick comparison of IDs and key fields
        const prevIds = prevTopics.map(t => `${t.id}-${t.requests?.length || 0}-${t.participants?.length || 0}`);
        const newIds = convertedTopics.map(t => `${t.id}-${t.requests?.length || 0}-${t.participants?.length || 0}`);
        
        if (prevIds.join(',') !== newIds.join(',')) {
          console.log('Topics data changed, updating state');
          return convertedTopics;
        } else {
          console.log('Topics data unchanged, skipping state update');
          return prevTopics;
        }
      });
      
    } catch (error: any) {
      // Silent error handling
      setTopicsError(null); // Don't show error messages
      // Still handle error for logging but don't show to user
      handleError(error, { context: 'fetchTopics', silent: true });
    } finally {
      setIsLoadingTopics(false);
    }
  }, [user, handleError, clearError]);

  // Real-time callbacks removed - using new topic detection system instead

  // Real-time subscriptions replaced with new topic detection system

  // Initial fetch on mount and when user changes - with timeout protection
  useEffect(() => {
    let isMounted = true;
    
    if (user) {
      console.log('User authenticated, fetching initial topics...');
      
      // Use requestIdleCallback for better performance if available
      const scheduleFetch = () => {
        if (!isMounted) return;
        fetchTopics(true).catch(error => {
          if (isMounted) {
            console.error('Initial topics fetch failed:', error);
          }
        });
      };
      
      if ('requestIdleCallback' in window) {
        requestIdleCallback(scheduleFetch, { timeout: 2000 });
      } else {
        setTimeout(scheduleFetch, 100);
      }
    } else {
      console.log('No user, clearing topics');
      setTopics([]);
      setIsLoadingTopics(false);
    }
    
    return () => {
      isMounted = false;
    };
  }, [user?.uid, fetchTopics]); // Include fetchTopics in dependencies

  const now = currentTime;

  // Note: Session archival now happens server-side via pg_cron
  // Expired sessions are automatically moved to topics_archive table every hour
  // No need for browser-side cleanup

  // Filter and categorize topics based on their current state and user relationship
  const filteredTopics = topics.filter((topic) =>
    shouldShowTopic(topic, user?.uid)
  );
  const categorizedTopics = categorizeTopics(filteredTopics, user?.uid);

  // Enhanced loading and authentication state handling
  if (loading) {
    return (
      <div className="flex-1 p-4 sm:p-6 lg:p-8">
        <div className="text-center py-16">
          <LoadingSpinner size="lg" text="Loading dashboard..." />
        </div>
      </div>
    );
  }

  // Show login prompt if no user (this should be handled by layout, but keep as fallback)
  if (!user) {
    console.log('No user found, redirecting to login...');
    router.push("/login");
    return (
      <div className="flex-1 p-4 sm:p-6 lg:p-8">
        <div className="text-center py-16">
          <LoadingSpinner size="lg" text="Redirecting to login..." />
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Floating refresh arrow */}
      <FloatingRefreshArrow 
        show={hasNewTopics} 
        onRefresh={handleRefreshFromArrow}
      />
      
      <div className="flex-1 p-4 sm:p-6 lg:p-8">
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-8">
        <div className="md:col-span-2 lg:col-span-3 space-y-6">
          {/* MY ACTIVE SESSION - Show prominently at the top when user has an active session */}
          {categorizedTopics.myActiveSession && (
            <div className="space-y-4">
              <Card className="border-primary/20 bg-primary/5">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center text-xl">
                    <Radio className="mr-2 h-5 w-5 text-primary animate-pulse" />
                    Your Active Session
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <TopicCard
                    topic={categorizedTopics.myActiveSession}
                    onUpdateRequest={() => fetchTopics()}
                  />
                </CardContent>
              </Card>
              <Separator />
            </div>
          )}

          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold">Timeline</h1>
              <div className="flex items-center gap-4 mt-2">

                

              </div>
            </div>
            <ScheduleSessionDialog onSessionCreated={() => fetchTopics()}>
              <Button disabled={isInOngoingSession}>
                <Plus className="mr-2 h-4 w-4" /> Schedule Session
              </Button>
            </ScheduleSessionDialog>
          </div>

          {/* OTHER ACTIVE SESSIONS - Public view (only show if user doesn't have their own active session) */}
          {categorizedTopics.otherActiveSessions.length > 0 &&
            !categorizedTopics.myActiveSession && (
              <div className="space-y-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center text-xl">
                      <Radio className="mr-2 h-5 w-5 text-primary animate-pulse" />
                      Active Now ({categorizedTopics.otherActiveSessions.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {categorizedTopics.otherActiveSessions.map((topic) => (
                      <div
                        key={topic.id}
                        className="p-3 rounded-lg bg-background text-sm text-muted-foreground"
                      >
                        A session on &quot;{topic.title}&quot; is currently in
                        progress.
                      </div>
                    ))}
                  </CardContent>
                </Card>
                <Separator />
              </div>
            )}

          {isLoadingTopics ? (
            <div className="space-y-4">
              {/* Show skeleton cards while loading - no loading message */}
              {[1, 2, 3].map((i) => (
                <TopicCardSkeleton key={i} />
              ))}
            </div>
          ) : (
            <>
              {/* MY UPCOMING SESSIONS */}
              {categorizedTopics.myUpcomingSessions.length > 0 && (
                <div className="space-y-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="flex items-center text-xl">
                        <UserCheck className="mr-2 h-5 w-5 text-primary" /> My
                        Upcoming Sessions
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {categorizedTopics.myUpcomingSessions.map((topic) => (
                        <TopicCard
                          key={topic.id}
                          topic={topic}
                          onUpdateRequest={() => fetchTopics()}
                        />
                      ))}
                    </CardContent>
                  </Card>
                  <Separator />
                </div>
              )}

              {/* OTHER SESSIONS ON TIMELINE */}
              <div className="space-y-4">
                {categorizedTopics.otherTimelineSessions.length > 0
                  ? categorizedTopics.otherTimelineSessions.map((topic) => (
                      <TopicCard
                        key={topic.id}
                        topic={topic}
                        onUpdateRequest={() => fetchTopics()}
                      />
                    ))
                  : categorizedTopics.myUpcomingSessions.length === 0 &&
                    categorizedTopics.otherActiveSessions.length === 0 &&
                    !categorizedTopics.myActiveSession && (
                      <div className="text-center text-muted-foreground py-16">
                        <p className="font-semibold text-lg">
                          No sessions available.
                        </p>
                        <p>Schedule a session to get started!</p>
                      </div>
                    )}
              </div>
            </>
          )}

          {/* Empty states - only show when no sessions at all (including no active session) */}
          {!isLoadingTopics && !hasError && filteredTopics.length === 0 && !categorizedTopics.myActiveSession && (
            <div className="text-center text-muted-foreground py-16">
              <div className="max-w-md mx-auto">
                <div className="mb-4">
                  <Radio className="h-12 w-12 mx-auto text-muted-foreground/50" />
                </div>
                <p className="font-semibold text-lg mb-2">
                  No sessions available
                </p>
                <p className="text-sm mb-4">
                  There are no active or upcoming sessions right now. Be the
                  first to schedule a meaningful conversation!
                </p>
                <ScheduleSessionDialog onSessionCreated={() => fetchTopics()}>
                  <Button disabled={isInOngoingSession}>
                    <Plus className="mr-2 h-4 w-4" /> Schedule Your First
                    Session
                  </Button>
                </ScheduleSessionDialog>
              </div>
            </div>
          )}

          {/* No error state shown */}
        </div>

        {/* Sidebar */}
        <aside className="space-y-6 md:col-start-3 lg:col-start-4">
          <Card>
            <CardContent className="p-4 space-y-4">
              <div className="flex items-center font-bold">
                <Flame className="mr-2 h-5 w-5 text-primary" />
                Trending Topics
              </div>
              <Separator />
              <ul className="space-y-3">
                {trendingTopics.map((item, index) => (
                  <li
                    key={index}
                    className="text-sm text-muted-foreground hover:text-foreground cursor-pointer"
                  >
                    <div>{item.title}</div>
                    <div className="text-xs text-accent">#{item.tag}</div>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 space-y-4">
              <div className="font-bold">Popular Tags</div>
              <Separator />
              <div className="flex flex-wrap gap-2">
                {popularTags.map((tag) => (
                  <Button
                    key={tag}
                    variant="outline"
                    size="sm"
                    className="rounded-full"
                  >
                    {tag}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        </aside>
      </div>
      {/* <PerformanceMonitor /> */}
      </div>
    </>
  );
}

export default function DashboardPage() {
  return (
    <ErrorBoundary>
      <DashboardContent />
    </ErrorBoundary>
  );
}
