'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrendingUp, Calendar, Clock, Users, Loader2 } from 'lucide-react';
import { MobileNavigation } from '@/components/harthio/mobile-navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { topicService } from '@/lib/supabase-services';
import { checkinService, type DailyCheckIn } from '@/lib/checkin-service';
import { formatDistanceToNow } from 'date-fns';
import { RecoveryTracker } from '@/components/harthio/recovery-tracker';
import { WeeklyStats } from '@/components/harthio/weekly-stats';

export default function ProgressPage() {
  const { user, userProfile } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [checkInStreak, setCheckInStreak] = useState(0);
  const [totalCheckIns, setTotalCheckIns] = useState(0);
  const [sessionsJoined, setSessionsJoined] = useState(0);
  const [sessionHistory, setSessionHistory] = useState<any[]>([]);
  const [checkInHistory, setCheckInHistory] = useState<DailyCheckIn[]>([]);

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

        // Get session history (sessions where user was author or participant)
        const allTopics = await topicService.getAllTopics();
        const userSessions = allTopics.filter(topic => {
          const isAuthor = topic.author_id === user.uid;
          const isParticipant = topic.participants?.includes(user.uid);
          const isPast = new Date(topic.end_time) < new Date();
          return (isAuthor || isParticipant) && isPast;
        });
        
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
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto p-6">
          <div className="flex items-center gap-3">
            <TrendingUp className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-2xl font-bold">Your Progress</h1>
              <p className="text-muted-foreground text-sm">Track your recovery journey</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto p-6">
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Tracker</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
            <TabsTrigger value="requests">Stats</TabsTrigger>
          </TabsList>

          {/* Overview Tab - Recovery Tracker */}
          <TabsContent value="overview" className="space-y-6">
            {loading ? (
              <Card>
                <CardContent className="p-12">
                  <div className="text-center">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
                  </div>
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
                    <p className="text-lg font-semibold mb-2">Start Your Journey</p>
                    <p className="text-muted-foreground mb-4">
                      Check in daily to see your mood trends and progress
                    </p>
                    <Link href="/home">
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
                          <p className="text-sm text-muted-foreground">Check-in Streak</p>
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
                          <p className="text-sm text-muted-foreground">Total Check-ins</p>
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
                          <p className="text-sm text-muted-foreground">Sessions Joined</p>
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
                <CardTitle>Session History</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
                  </div>
                ) : sessionHistory.length === 0 ? (
                  <div className="text-center py-12">
                    <Clock className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                    <p className="text-lg font-semibold mb-2">No session history yet</p>
                    <p className="text-muted-foreground mb-4">
                      Your completed sessions will appear here
                    </p>
                    <Link href="/dashboard">
                      <Button>Browse Sessions</Button>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {sessionHistory.map((session) => (
                      <div key={session.id} className="p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-semibold mb-1">{session.title}</h3>
                            <p className="text-sm text-muted-foreground mb-2">
                              {session.description?.substring(0, 100)}
                              {session.description?.length > 100 ? '...' : ''}
                            </p>
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {formatDistanceToNow(new Date(session.end_time), { addSuffix: true })}
                              </span>
                              <span className="flex items-center gap-1">
                                <Users className="h-3 w-3" />
                                {(session.participants?.length || 0) + 1} participants
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Requests Tab - Weekly Stats */}
          <TabsContent value="requests" className="space-y-4">
            {loading ? (
              <Card>
                <CardContent className="p-12">
                  <div className="text-center">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
                  </div>
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

      <MobileNavigation />
    </div>
  );
}
