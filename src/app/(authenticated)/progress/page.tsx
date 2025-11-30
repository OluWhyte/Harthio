'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrendingUp, Calendar, Clock, Users, Bell, Filter, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/common/loading-spinner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { topicService } from '@/lib/supabase-services';
import { checkinService, type DailyCheckIn } from '@/lib/checkin-service';
import { formatDistanceToNow } from 'date-fns';
import { RecoveryTracker } from '@/components/harthio/recovery-tracker';
import { WeeklyStats } from '@/components/harthio/weekly-stats';
import { MobilePageHeader } from '@/components/harthio/mobile-page-header';
import { useOptimizedRequests } from '@/hooks/use-optimized-requests';
import { useProgressViewDetection } from '@/hooks/useProactiveAI';

export default function ProgressPage() {
  const { user, userProfile } = useAuth();
  const router = useRouter();
  const { receivedRequests } = useOptimizedRequests();
  const [loading, setLoading] = useState(true);
  const [checkInStreak, setCheckInStreak] = useState(0);
  const [totalCheckIns, setTotalCheckIns] = useState(0);
  const [sessionsJoined, setSessionsJoined] = useState(0);
  const [sessionHistory, setSessionHistory] = useState<any[]>([]);
  const [checkInHistory, setCheckInHistory] = useState<DailyCheckIn[]>([]);
  const [historyFilter, setHistoryFilter] = useState<string>('all');

  // Proactive AI: Smart progress detection
  useProgressViewDetection();

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    // Load real data
    const loadData = async () => {
      if (!user.uid) return;

      try {
        // Get check-in streak
        const streak = await checkinService.getCheckInStreak(user.uid);
        setCheckInStreak(streak);

        // Get total check-ins
        const history = await checkinService.getCheckInHistory(user.uid);
        setCheckInHistory(history);
        setTotalCheckIns(history.length);

        // Get session history (combines active and archived sessions)
        const userSessions = await topicService.getUserSessionHistory(user.uid);
        
        setSessionHistory(userSessions);
        setSessionsJoined(userSessions.length);
      } catch (error) {
        console.error('Error loading progress data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user, router]);

  if (!user || !userProfile) return null;

  return (
    <div className="min-h-screen bg-background">
      {/* Unified Mobile Header */}
      <MobilePageHeader
        actions={[
          {
            icon: Bell,
            onClick: () => router.push('/notifications'),
            label: 'Notifications',
            badge: receivedRequests.length,
          },
        ]}
      />

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-6 py-6 pb-20 md:pb-6">
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview" className="text-[15px]">Tracker</TabsTrigger>
            <TabsTrigger value="history" className="text-[15px]">History</TabsTrigger>
            <TabsTrigger value="requests" className="text-[15px]">Stats</TabsTrigger>
          </TabsList>

          {/* Overview Tab - Recovery Tracker */}
          <TabsContent value="overview" className="space-y-6">
            {loading ? (
              <Card>
                <CardContent className="p-12">
                  <LoadingSpinner size="md" text="Loading recovery tracker..." fullScreen={false} />
                </CardContent>
              </Card>
            ) : checkInHistory.length === 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle>Recovery Tracker</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12">
                    <TrendingUp className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                    <p className="text-[17px] font-semibold mb-2">Start Your Journey</p>
                    <p className="text-[15px] text-muted-foreground mb-4">
                      Check in daily to see your mood trends and progress
                    </p>
                    <Link href="/home" className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-md">
                      <Button>Do Your First Check-in</Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <RecoveryTracker checkIns={checkInHistory} streak={checkInStreak} />
            )}

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-full bg-primary/10">
                      <TrendingUp className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      {loading ? (
                        <Loader2 className="h-6 w-6 animate-spin" />
                      ) : (
                        <>
                          <p className="text-2xl font-bold">{checkInStreak}</p>
                          <p className="text-[13px] text-muted-foreground">Check-in Streak</p>
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-full bg-blue-500/10">
                      <Calendar className="h-5 w-5 text-blue-500" />
                    </div>
                    <div>
                      {loading ? (
                        <Loader2 className="h-6 w-6 animate-spin" />
                      ) : (
                        <>
                          <p className="text-2xl font-bold">{totalCheckIns}</p>
                          <p className="text-[13px] text-muted-foreground">Total Check-ins</p>
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-full bg-green-500/10">
                      <Users className="h-5 w-5 text-green-500" />
                    </div>
                    <div>
                      {loading ? (
                        <Loader2 className="h-6 w-6 animate-spin" />
                      ) : (
                        <>
                          <p className="text-2xl font-bold">{sessionsJoined}</p>
                          <p className="text-[13px] text-muted-foreground">Sessions Joined</p>
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* History Tab - Session History */}
          <TabsContent value="history" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Session History</CardTitle>
                  <Select value={historyFilter} onValueChange={setHistoryFilter}>
                    <SelectTrigger className="w-[180px]">
                      <Filter className="h-4 w-4 mr-2" />
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Sessions</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="no-show">No Show</SelectItem>
                      <SelectItem value="no-participants">No Participants</SelectItem>
                      <SelectItem value="ended-early">Ended Early</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <LoadingSpinner size="md" text="Loading stats..." fullScreen={false} />
                ) : (() => {
                  // Filter sessions based on selected filter
                  const filteredHistory = sessionHistory.filter(session => {
                    if (historyFilter === 'all') return true;
                    
                    const hasNoShow = session.no_show === true;
                    const hasEndedEarly = session.ended_early === true;
                    const archiveReason = session.archive_reason;
                    
                    if (historyFilter === 'no-show') return hasNoShow;
                    if (historyFilter === 'ended-early') return hasEndedEarly && !hasNoShow;
                    if (historyFilter === 'no-participants') return archiveReason === 'no_participants';
                    if (historyFilter === 'completed') {
                      return !hasNoShow && !hasEndedEarly && archiveReason !== 'no_participants';
                    }
                    
                    return true;
                  });

                  return filteredHistory.length === 0 ? (
                    <div className="text-center py-12">
                      <Clock className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                      <p className="text-[17px] font-semibold mb-2">
                        {historyFilter === 'all' ? 'No session history yet' : `No ${historyFilter.replace('-', ' ')} sessions`}
                      </p>
                      <p className="text-[15px] text-muted-foreground mb-4">
                        {historyFilter === 'all' 
                          ? 'Your completed sessions will appear here'
                          : 'Try selecting a different filter'}
                      </p>
                      {historyFilter === 'all' && (
                        <Link href="/sessions" className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-md">
                          <Button>Browse Sessions</Button>
                        </Link>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {filteredHistory.map((session) => {
                        // Determine session status badge
                        const getStatusBadge = () => {
                          if (session.no_show) {
                            return <Badge variant="destructive" className="text-xs">No Show</Badge>;
                          }
                          if (session.archive_reason === 'no_participants') {
                            return <Badge variant="outline" className="text-xs text-orange-600 border-orange-300">No Participants</Badge>;
                          }
                          if (session.ended_early) {
                            return <Badge variant="outline" className="text-xs text-amber-600 border-amber-300">Ended Early</Badge>;
                          }
                          return <Badge variant="outline" className="text-xs text-green-600 border-green-300">Completed</Badge>;
                        };

                        return (
                        <div key={session.id} className="p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="text-[17px] font-semibold">{session.title}</h3>
                                {getStatusBadge()}
                              </div>
                              <p className="text-[15px] text-muted-foreground mb-2">
                                {session.description?.substring(0, 100)}
                                {session.description?.length > 100 ? '...' : ''}
                              </p>
                              <div className="flex items-center gap-4 text-[13px] text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {formatDistanceToNow(new Date(session.archived_at || session.end_time), { addSuffix: true })}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Users className="h-3 w-3" />
                                  {(session.participants?.length || 0) + 1} participants
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    </div>
                  );
                })()}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Requests Tab - Weekly Stats */}
          <TabsContent value="requests" className="space-y-4">
            {loading ? (
              <Card>
                <CardContent className="p-12">
                  <LoadingSpinner size="md" text="Loading weekly stats..." fullScreen={false} />
                </CardContent>
              </Card>
            ) : (
              <WeeklyStats 
                checkIns={checkInHistory} 
                sessionsJoined={sessionsJoined}
                sessionHistory={sessionHistory}
              />
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
