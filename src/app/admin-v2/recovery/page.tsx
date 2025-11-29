'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/lib/supabase';
import { 
  Heart, 
  Calendar, 
  Image, 
  RefreshCw, 
  TrendingUp, 
  AlertTriangle,
  Award,
  Users,
  Download,
  Activity,
  Target,
  Smile,
  Frown,
  Meh
} from 'lucide-react';

interface TrackerStats {
  activeTrackers: number;
  totalCheckins: number;
  avgCheckinsPerDay: number;
  trackersByType: { type: string; count: number }[];
  recentRelapses: number;
}

interface CheckinTrend {
  date: string;
  count: number;
  avgMood: number;
}

interface MilestoneUser {
  user_id: string;
  display_name: string;
  tracker_type: string;
  days_sober: number;
  milestone: number;
  start_date: string;
}

interface AtRiskUser {
  user_id: string;
  display_name: string;
  tracker_type: string;
  last_checkin: string;
  days_since_checkin: number;
  current_streak: number;
}

export default function RecoveryManagementPage() {
  const [stats, setStats] = useState<TrackerStats>({
    activeTrackers: 0,
    totalCheckins: 0,
    visualJourneys: 0,
    avgCheckinsPerDay: 0,
    trackersByType: [],
    recentRelapses: 0
  });
  const [checkinTrends, setCheckinTrends] = useState<CheckinTrend[]>([]);
  const [milestoneUsers, setMilestoneUsers] = useState<MilestoneUser[]>([]);
  const [atRiskUsers, setAtRiskUsers] = useState<AtRiskUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    await Promise.all([
      loadStats(),
      loadCheckinTrends(),
      loadMilestoneUsers(),
      loadAtRiskUsers()
    ]);
    setLoading(false);
  };

  const loadStats = async () => {
    try {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      // Run all queries in parallel for better performance
      const [
        { count: trackerCount },
        { count: checkinCount },
        { data: trackers },
        { count: relapseCount },
        { count: recentCheckins }
      ] = await Promise.all([
        // Active trackers count
        supabase.from('sobriety_trackers')
          .select('*', { count: 'exact', head: true })
          .eq('is_active', true),
        
        // Total check-ins
        supabase.from('daily_checkins')
          .select('*', { count: 'exact', head: true }),
        
        // Trackers by type
        supabase.from('sobriety_trackers')
          .select('tracker_type')
          .eq('is_active', true),
        
        // Recent relapses (last 7 days)
        supabase.from('tracker_relapses')
          .select('*', { count: 'exact', head: true })
          .gte('relapse_date', sevenDaysAgo.toISOString()),
        
        // Recent check-ins (last 30 days)
        supabase.from('daily_checkins')
          .select('*', { count: 'exact', head: true })
          .gte('checkin_date', thirtyDaysAgo.toISOString())
      ]);

      const trackersByType = trackers?.reduce((acc: any[], tracker: any) => {
        const existing = acc.find(t => t.type === tracker.tracker_type);
        if (existing) {
          existing.count++;
        } else {
          acc.push({ type: tracker.tracker_type || 'Unknown', count: 1 });
        }
        return acc;
      }, []) || [];

      const avgCheckinsPerDay = recentCheckins ? Math.round(recentCheckins / 30) : 0;

      setStats({
        activeTrackers: trackerCount || 0,
        totalCheckins: checkinCount || 0,
        avgCheckinsPerDay,
        trackersByType: trackersByType.sort((a, b) => b.count - a.count),
        recentRelapses: relapseCount || 0
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const loadCheckinTrends = async () => {
    try {
      // Get last 14 days of check-ins
      const fourteenDaysAgo = new Date();
      fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

      const { data: checkins } = await supabase
        .from('daily_checkins')
        .select('checkin_date, mood_rating')
        .gte('checkin_date', fourteenDaysAgo.toISOString())
        .order('checkin_date', { ascending: true });

      // Group by date
      const trendMap = new Map<string, { count: number; totalMood: number }>();
      
      checkins?.forEach((checkin: any) => {
        const date = new Date(checkin.checkin_date).toISOString().split('T')[0];
        const existing = trendMap.get(date) || { count: 0, totalMood: 0 };
        trendMap.set(date, {
          count: existing.count + 1,
          totalMood: existing.totalMood + (checkin.mood_rating || 0)
        });
      });

      const trends: CheckinTrend[] = Array.from(trendMap.entries()).map(([date, data]) => ({
        date,
        count: data.count,
        avgMood: data.count > 0 ? data.totalMood / data.count : 0
      }));

      setCheckinTrends(trends);
    } catch (error) {
      console.error('Error loading check-in trends:', error);
    }
  };

  const loadMilestoneUsers = async () => {
    try {
      const { data: trackers } = await supabase
        .from('sobriety_trackers')
        .select(`
          user_id,
          tracker_type,
          start_date,
          users!sobriety_trackers_user_id_fkey(display_name)
        `)
        .eq('is_active', true);

      const milestones = [7, 30, 90, 180, 365];
      const users: MilestoneUser[] = [];

      trackers?.forEach((tracker: any) => {
        const startDate = new Date(tracker.start_date);
        const daysSober = Math.floor((Date.now() - startDate.getTime()) / (1000 * 60 * 60 * 24));
        
        // Check if user is within 3 days of a milestone
        milestones.forEach(milestone => {
          const daysUntilMilestone = milestone - daysSober;
          if (daysUntilMilestone >= -1 && daysUntilMilestone <= 3) {
            users.push({
              user_id: tracker.user_id,
              display_name: tracker.users?.display_name || 'Unknown User',
              tracker_type: tracker.tracker_type,
              days_sober: daysSober,
              milestone,
              start_date: tracker.start_date
            });
          }
        });
      });

      setMilestoneUsers(users.sort((a, b) => a.milestone - b.milestone));
    } catch (error) {
      console.error('Error loading milestone users:', error);
    }
  };

  const loadAtRiskUsers = async () => {
    try {
      // Get users who haven't checked in for 3+ days
      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

      const { data: trackers } = await supabase
        .from('sobriety_trackers')
        .select(`
          user_id,
          tracker_type,
          start_date,
          users!sobriety_trackers_user_id_fkey(display_name)
        `)
        .eq('is_active', true);

      const atRisk: AtRiskUser[] = [];

      for (const tracker of trackers || []) {
        // Get last check-in for this user
        const { data: lastCheckin } = await supabase
          .from('daily_checkins')
          .select('checkin_date')
          .eq('user_id', tracker.user_id)
          .order('checkin_date', { ascending: false })
          .limit(1)
          .single();

        if (lastCheckin) {
          const lastCheckinDate = new Date(lastCheckin.checkin_date);
          const daysSinceCheckin = Math.floor((Date.now() - lastCheckinDate.getTime()) / (1000 * 60 * 60 * 24));
          
          if (daysSinceCheckin >= 3) {
            const startDate = new Date(tracker.start_date);
            const currentStreak = Math.floor((Date.now() - startDate.getTime()) / (1000 * 60 * 60 * 24));
            
            atRisk.push({
              user_id: tracker.user_id,
              display_name: tracker.users?.display_name || 'Unknown User',
              tracker_type: tracker.tracker_type,
              last_checkin: lastCheckin.checkin_date,
              days_since_checkin: daysSinceCheckin,
              current_streak: currentStreak
            });
          }
        }
      }

      setAtRiskUsers(atRisk.sort((a, b) => b.days_since_checkin - a.days_since_checkin));
    } catch (error) {
      console.error('Error loading at-risk users:', error);
    }
  };

  const exportData = async (type: string) => {
    try {
      let data: any[] = [];
      let filename = '';

      switch (type) {
        case 'trackers':
          const { data: trackers } = await supabase
            .from('sobriety_trackers')
            .select('*')
            .eq('is_active', true);
          data = trackers || [];
          filename = 'recovery-trackers.json';
          break;
        case 'checkins':
          const { data: checkins } = await supabase
            .from('daily_checkins')
            .select('*')
            .order('checkin_date', { ascending: false })
            .limit(1000);
          data = checkins || [];
          filename = 'daily-checkins.json';
          break;
        case 'milestones':
          data = milestoneUsers;
          filename = 'milestone-users.json';
          break;
        case 'at-risk':
          data = atRiskUsers;
          filename = 'at-risk-users.json';
          break;
      }

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting data:', error);
    }
  };

  const getMoodIcon = (mood: number) => {
    if (mood >= 4) return <Smile className="h-4 w-4 text-green-600" />;
    if (mood >= 2.5) return <Meh className="h-4 w-4 text-yellow-600" />;
    return <Frown className="h-4 w-4 text-red-600" />;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-gray-400" />
          <p className="text-gray-600">Loading recovery data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 max-w-7xl space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Recovery Management</h1>
          <p className="text-sm sm:text-base text-muted-foreground">Monitor recovery trackers and user progress</p>
        </div>
        <Button variant="outline" size="sm" onClick={loadAllData} className="gap-2 flex-shrink-0">
          <RefreshCw className="h-4 w-4" />
          <span className="hidden sm:inline">Refresh</span>
        </Button>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Trackers</CardTitle>
            <Heart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeTrackers}</div>
            <p className="text-xs text-muted-foreground mt-1">Users in recovery</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Check-ins</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCheckins}</div>
            <p className="text-xs text-muted-foreground mt-1">
              ~{stats.avgCheckinsPerDay}/day avg
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recent Relapses</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.recentRelapses}</div>
            <p className="text-xs text-muted-foreground mt-1">Last 7 days</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for Different Views */}
      <Tabs defaultValue="overview" className="space-y-4">
        <div className="overflow-x-auto pb-2">
          <TabsList className="inline-flex w-auto min-w-full">
            <TabsTrigger value="overview" className="whitespace-nowrap">Overview</TabsTrigger>
            <TabsTrigger value="trackers" className="whitespace-nowrap">Trackers</TabsTrigger>
            <TabsTrigger value="checkins" className="whitespace-nowrap">Check-ins</TabsTrigger>
            <TabsTrigger value="milestones" className="whitespace-nowrap">Milestones</TabsTrigger>
            <TabsTrigger value="at-risk" className="whitespace-nowrap">At Risk</TabsTrigger>
          </TabsList>
        </div>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Tracker Breakdown */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg">Tracker Breakdown</CardTitle>
                <Target className="h-5 w-5 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {stats.trackersByType.length > 0 ? (
                  <div className="space-y-3">
                    {stats.trackersByType.map((tracker, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-blue-500" />
                          <span className="text-sm font-medium capitalize">{tracker.type}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">{tracker.count}</span>
                          <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-blue-500 rounded-full"
                              style={{ 
                                width: `${(tracker.count / stats.activeTrackers) * 100}%` 
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No active trackers</p>
                )}
              </CardContent>
            </Card>

            {/* Check-in Trends */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg">Check-in Trends (14 Days)</CardTitle>
                <Activity className="h-5 w-5 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {checkinTrends.length > 0 ? (
                  <div className="space-y-2">
                    {checkinTrends.slice(-7).map((trend, index) => (
                      <div key={index} className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">
                          {new Date(trend.date).toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric' 
                          })}
                        </span>
                        <div className="flex items-center gap-2">
                          {getMoodIcon(trend.avgMood)}
                          <span className="font-medium">{trend.count} check-ins</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No check-in data</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Trackers Tab */}
        <TabsContent value="trackers" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Active Recovery Trackers</CardTitle>
              <Button variant="outline" size="sm" onClick={() => exportData('trackers')}>
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats.trackersByType.map((tracker, index) => (
                  <div key={index} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold capitalize">{tracker.type}</h3>
                        <p className="text-sm text-muted-foreground">{tracker.count} active trackers</p>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold">
                          {Math.round((tracker.count / stats.activeTrackers) * 100)}%
                        </div>
                        <p className="text-xs text-muted-foreground">of total</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Check-ins Tab */}
        <TabsContent value="checkins" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Daily Check-in Patterns</CardTitle>
              <Button variant="outline" size="sm" onClick={() => exportData('checkins')}>
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {checkinTrends.map((trend, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Calendar className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">
                          {new Date(trend.date).toLocaleDateString('en-US', { 
                            weekday: 'short',
                            month: 'short', 
                            day: 'numeric' 
                          })}
                        </p>
                        <p className="text-sm text-muted-foreground">{trend.count} check-ins</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getMoodIcon(trend.avgMood)}
                      <span className="text-sm font-medium">
                        {trend.avgMood.toFixed(1)} avg mood
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Milestones Tab */}
        <TabsContent value="milestones" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Upcoming Milestones</CardTitle>
              <Button variant="outline" size="sm" onClick={() => exportData('milestones')}>
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </CardHeader>
            <CardContent>
              {milestoneUsers.length > 0 ? (
                <div className="space-y-3">
                  {milestoneUsers.map((user, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg bg-gradient-to-r from-yellow-50 to-transparent">
                      <div className="flex items-center gap-3">
                        <Award className="h-6 w-6 text-yellow-600" />
                        <div>
                          <p className="font-semibold">{user.display_name}</p>
                          <p className="text-sm text-muted-foreground capitalize">
                            {user.tracker_type} • {user.days_sober} days
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-yellow-600">
                          {user.milestone} Days
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {user.milestone - user.days_sober > 0 
                            ? `In ${user.milestone - user.days_sober} days`
                            : 'Reached!'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No upcoming milestones in the next 3 days
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* At Risk Tab */}
        <TabsContent value="at-risk" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Users Needing Support</CardTitle>
              <Button variant="outline" size="sm" onClick={() => exportData('at-risk')}>
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </CardHeader>
            <CardContent>
              {atRiskUsers.length > 0 ? (
                <div className="space-y-3">
                  {atRiskUsers.map((user, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg bg-gradient-to-r from-red-50 to-transparent">
                      <div className="flex items-center gap-3">
                        <AlertTriangle className="h-6 w-6 text-red-600" />
                        <div>
                          <p className="font-semibold">{user.display_name}</p>
                          <p className="text-sm text-muted-foreground capitalize">
                            {user.tracker_type} • {user.current_streak} day streak
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-red-600">
                          {user.days_since_checkin} days
                        </div>
                        <p className="text-xs text-muted-foreground">since check-in</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">
                  All users are checking in regularly! 🎉
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
