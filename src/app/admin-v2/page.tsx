'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, MessageSquare, Activity, TrendingUp, Heart, Brain, ArrowUp, ArrowDown, RefreshCw, DollarSign } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useAdmin } from '@/contexts/admin-context';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/common/loading-spinner';

export default function AdminV2Dashboard() {
  const { user } = useAuth();
  const { adminUser, isAdmin } = useAdmin();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    newUsersToday: 0,
    activeSessions: 0,
    totalSessions: 0,
    activeTrackers: 0,
    aiChats: 0,
    userGrowth: 0,
    sessionGrowth: 0,
    totalCredits: 0,
    creditsSpent: 0
  });

  useEffect(() => {
    checkAccess();
  }, [user]);

  const checkAccess = async () => {
    if (!user || !isAdmin) {
      router.push('/admin-v2/login');
      return;
    }

    await loadStats();
    setLoading(false);
  };

  const loadStats = async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    // Run all queries in parallel for better performance
    const [
      { count: userCount },
      { count: newToday },
      { count: newYesterday },
      { count: activeCount },
      { count: totalCount },
      { count: trackerCount },
      { count: aiCount },
      usersData,
      creditsData
    ] = await Promise.all([
      // Total users
      supabase.from('users').select('*', { count: 'exact', head: true }),
      
      // New users today
      supabase.from('users')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', today.toISOString()),
      
      // New users yesterday
      supabase.from('users')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', yesterday.toISOString())
        .lt('created_at', today.toISOString()),
      
      // Active sessions
      supabase.from('topics')
        .select('*', { count: 'exact', head: true })
        .gte('end_time', new Date().toISOString()),
      
      // Total sessions
      supabase.from('topics')
        .select('*', { count: 'exact', head: true }),
      
      // Active trackers
      supabase.from('sobriety_trackers')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true),
      
      // AI chats
      supabase.from('ai_chat_history')
        .select('*', { count: 'exact', head: true }),
      
      // Users with credit balance
      supabase.from('users').select('ai_credits'),
      
      // Credit transactions
      supabase.from('credit_transactions').select('amount, transaction_type')
    ]);

    // Calculate credit stats
    const totalCredits = usersData.data?.reduce((sum, u) => sum + (u.ai_credits || 0), 0) || 0;
    const creditsSpent = creditsData.data?.filter(c => c.transaction_type === 'debit').reduce((sum, c) => sum + Math.abs(c.amount), 0) || 0;

    // Calculate growth
    const userGrowth = newYesterday ? ((newToday || 0) - newYesterday) / newYesterday * 100 : 0;

    setStats({
      totalUsers: userCount || 0,
      newUsersToday: newToday || 0,
      activeSessions: activeCount || 0,
      totalSessions: totalCount || 0,
      activeTrackers: trackerCount || 0,
      aiChats: aiCount || 0,
      userGrowth: Math.round(userGrowth),
      sessionGrowth: 0,
      totalCredits,
      creditsSpent
    });
  };

  if (loading) {
    return <LoadingSpinner size="lg" text="Loading dashboard..." />;
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 max-w-7xl">
      {/* Page Header */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="mt-1 text-sm text-gray-600">
              Welcome back! Here's what's happening with your platform.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={loadStats} className="gap-2 flex-shrink-0">
            <RefreshCw className="h-4 w-4" />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
        </div>
      </div>

      <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-600">Total Users</p>
              <Users className="h-5 w-5 text-blue-500" />
            </div>
            <p className="text-3xl font-bold text-gray-900">{stats.totalUsers.toLocaleString()}</p>
            <p className="text-sm text-gray-600 mt-1">
              <span className="inline-flex items-center text-green-600">
                <ArrowUp className="h-3 w-3 mr-1" />
                {stats.newUsersToday} new today
              </span>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-600">Active Sessions</p>
              <Activity className="h-5 w-5 text-green-500" />
            </div>
            <p className="text-3xl font-bold text-gray-900">{stats.activeSessions}</p>
            <p className="text-sm text-gray-600 mt-1">
              {stats.totalSessions} total sessions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-600">Credits Balance</p>
              <DollarSign className="h-5 w-5 text-emerald-500" />
            </div>
            <p className="text-3xl font-bold text-gray-900">{stats.totalCredits.toLocaleString()}</p>
            <p className="text-sm text-gray-600 mt-1">
              {stats.creditsSpent.toLocaleString()} spent
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-600">Recovery Trackers</p>
              <Heart className="h-5 w-5 text-purple-500" />
            </div>
            <p className="text-3xl font-bold text-gray-900">{stats.activeTrackers}</p>
            <p className="text-sm text-gray-600 mt-1">
              Active journeys
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-600">AI Interactions</p>
              <Brain className="h-5 w-5 text-orange-500" />
            </div>
            <p className="text-3xl font-bold text-gray-900">{stats.aiChats.toLocaleString()}</p>
            <p className="text-sm text-gray-600 mt-1">
              Total conversations
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => router.push('/admin-v2/users')}>
          <CardHeader>
            <CardTitle className="text-base">User Management</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">View and manage user accounts</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => router.push('/admin-v2/sessions')}>
          <CardHeader>
            <CardTitle className="text-base">Active Sessions</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Monitor ongoing conversations</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => router.push('/admin-v2/analytics')}>
          <CardHeader>
            <CardTitle className="text-base">View Analytics</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Deep dive into platform metrics</p>
          </CardContent>
        </Card>
      </div>

      {/* Platform Health */}
      <Card>
        <CardHeader>
          <CardTitle>Platform Health</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium">User Engagement</p>
                <p className="text-xs text-muted-foreground">Active users in last 7 days</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-2 w-32 bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-full bg-green-500" style={{ width: '75%' }}></div>
                </div>
                <span className="text-sm font-medium">75%</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium">Session Completion</p>
                <p className="text-xs text-muted-foreground">Sessions completed successfully</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-2 w-32 bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500" style={{ width: '92%' }}></div>
                </div>
                <span className="text-sm font-medium">92%</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium">AI Response Quality</p>
                <p className="text-xs text-muted-foreground">Positive feedback rate</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-2 w-32 bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-full bg-purple-500" style={{ width: '88%' }}></div>
                </div>
                <span className="text-sm font-medium">88%</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      </div>
    </div>
  );
}
