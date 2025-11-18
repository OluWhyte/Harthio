'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Plus, Radio, Loader2, Clock, Users, Bell, Search } from 'lucide-react';
import { TopicCard, Topic } from '@/components/harthio/topic-card';
import { ScheduleSessionDialog } from '@/components/harthio/schedule-session-dialog';
import { topicService } from '@/lib/supabase-services';
import { getSessionStatus } from '@/lib/time-utils';
import { MobilePageHeader } from '@/components/harthio/mobile-page-header';

import { SearchSessionsSheet, type SearchFilters } from '@/components/harthio/search-sessions-sheet';
import { RequestsSheet } from '@/components/harthio/requests-sheet';
import { useOptimizedRequests } from '@/hooks/use-optimized-requests';

// Convert Supabase topic to TopicCard format
const convertTopic = (supabaseTopic: any): Topic => {
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
      initials: displayName.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2) || "U",
      rating: author.rating || 0,
      reviews: author.reviews_count || 0,
    },
    createdAt: new Date(supabaseTopic.created_at),
    participants: Array.isArray(supabaseTopic.participants) ? supabaseTopic.participants : [],
  };
};

// Check if user should see this session
const shouldShowSession = (topic: Topic, userId: string | undefined): boolean => {
  if (!userId || !topic) return false;

  const status = getSessionStatus(topic.startTime, topic.endTime);
  const participants = topic.participants || [];
  const isAuthor = topic.author?.userId === userId;
  const isParticipant = participants.includes(userId);
  const hasParticipants = participants.length > 0;

  if (status === "ended") return false;
  if (!hasParticipants) return true; // Open to all
  if (hasParticipants && (status === "upcoming" || status === "active")) {
    return isAuthor || isParticipant; // Only author and participant
  }
  
  return false;
};

export default function SessionsPage() {
  const { user, userProfile, isInOngoingSession } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState<Topic[]>([]);
  const [showRequestsSheet, setShowRequestsSheet] = useState(false);
  const [showSearchSheet, setShowSearchSheet] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFilters, setSearchFilters] = useState<SearchFilters>({
    timeFilter: 'all',
    sortBy: 'soonest',
  });

  // Get pending requests count for badge
  const { receivedRequests } = useOptimizedRequests({
    enableCache: true,
    enableRealtime: true,
  });

  const fetchSessions = useCallback(async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const data = await topicService.getAllTopics();
      const converted = (data || []).map(convertTopic);
      setSessions(converted);
    } catch (error) {
      console.error('Error loading sessions:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    fetchSessions();
  }, [user, router, fetchSessions]);

  if (!user || !userProfile) return null;

  // Filter sessions based on search and visibility
  const filteredSessions = sessions.filter(s => {
    if (!shouldShowSession(s, user.uid)) return false;
    if (searchQuery && !s.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  // Categorize filtered sessions
  const visibleSessions = filteredSessions;
  
  const myActiveSession = visibleSessions.find(s => {
    const status = getSessionStatus(s.startTime, s.endTime);
    const isAuthor = s.author?.userId === user.uid;
    const isParticipant = s.participants?.includes(user.uid);
    return status === "active" && (isAuthor || isParticipant);
  });

  const myUpcoming = visibleSessions.filter(s => {
    const status = getSessionStatus(s.startTime, s.endTime);
    const isAuthor = s.author?.userId === user.uid;
    const isParticipant = s.participants?.includes(user.uid);
    return status === "upcoming" && (isAuthor || isParticipant);
  });

  const available = visibleSessions.filter(s => {
    const status = getSessionStatus(s.startTime, s.endTime);
    const hasParticipants = (s.participants?.length || 0) > 0;
    const isAuthor = s.author?.userId === user.uid;
    const isParticipant = s.participants?.includes(user.uid);
    return !hasParticipants && !isAuthor && status !== "ended";
  });

  const handleSearch = (query: string, filters: SearchFilters) => {
    setSearchQuery(query);
    setSearchFilters(filters);
    // TODO: Implement actual search/filter logic
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Header */}
      <MobilePageHeader
        title=""
        actions={[
          {
            icon: Bell,
            onClick: () => setShowRequestsSheet(true),
            label: 'Requests',
            badge: receivedRequests.length,
          },
          {
            icon: Search,
            onClick: () => setShowSearchSheet(true),
            label: 'Search',
          },
        ]}
      />

      {/* Requests Sheet (Mobile) */}
      <RequestsSheet
        open={showRequestsSheet}
        onOpenChange={setShowRequestsSheet}
      />

      {/* Search Sheet */}
      <SearchSessionsSheet
        open={showSearchSheet}
        onOpenChange={setShowSearchSheet}
        onSearch={handleSearch}
      />

      {/* Desktop Schedule Button - Hidden on mobile */}
      <div className="hidden md:flex justify-end mb-6 max-w-4xl mx-auto px-6 pt-6">
        <ScheduleSessionDialog onSessionCreated={fetchSessions}>
          <Button disabled={isInOngoingSession}>
            <Plus className="mr-2 h-4 w-4" /> Schedule Session
          </Button>
        </ScheduleSessionDialog>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        {loading ? (
          <div className="text-center py-16">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
          </div>
        ) : (
          <>
            {/* Active Session */}
            {myActiveSession && (
              <Card className="border-2 border-green-500 bg-green-50 dark:bg-green-900/20">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-[17px] text-green-900 dark:text-green-100">
                    <Radio className="h-5 w-5 animate-pulse" />
                    Your Active Session
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <TopicCard topic={myActiveSession} onUpdateRequest={fetchSessions} />
                </CardContent>
              </Card>
            )}

            {/* My Sessions */}
            {myUpcoming.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-[17px]">
                    <Clock className="h-5 w-5 text-primary" />
                    My Sessions ({myUpcoming.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {myUpcoming.map(session => (
                    <TopicCard key={session.id} topic={session} onUpdateRequest={fetchSessions} />
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Available Sessions */}
            {available.length > 0 && (
              <div className="space-y-4">
                <h2 className="text-[17px] font-semibold flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  Available Sessions ({available.length})
                </h2>
                {available.map(session => (
                  <TopicCard key={session.id} topic={session} onUpdateRequest={fetchSessions} />
                ))}
              </div>
            )}

            {/* Empty State */}
            {!myActiveSession && myUpcoming.length === 0 && available.length === 0 && (
              <Card className="border-dashed">
                <CardContent className="py-16 text-center">
                  <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-[17px] font-semibold mb-2">No sessions available</h3>
                  <p className="text-[15px] text-muted-foreground mb-4">
                    Be the first to schedule a meaningful conversation!
                  </p>
                  <ScheduleSessionDialog onSessionCreated={fetchSessions}>
                    <Button disabled={isInOngoingSession}>
                      <Plus className="mr-2 h-4 w-4" /> Schedule Your First Session
                    </Button>
                  </ScheduleSessionDialog>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>

      {/* Mobile FAB - Bottom right, above bottom nav */}
      <div className="md:hidden fixed bottom-20 right-4 z-40">
        <ScheduleSessionDialog onSessionCreated={fetchSessions}>
          <Button 
            size="lg" 
            className="h-14 w-14 rounded-full shadow-lg"
            disabled={isInOngoingSession}
          >
            <Plus className="h-6 w-6" />
          </Button>
        </ScheduleSessionDialog>
      </div>
    </div>
  );
}
