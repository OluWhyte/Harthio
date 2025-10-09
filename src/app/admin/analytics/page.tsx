'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Logo } from '@/components/common/logo';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  ArrowLeft, 
  BarChart3, 
  TrendingUp, 
  Users, 
  MessageCircle,
  Calendar,
  Star,
  Clock,
  Activity,
  Target
} from 'lucide-react';
import { AdminService } from '@/lib/services/admin-service';
import { BlogService } from '@/lib/services/blog-service';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import type { UserAnalytics, TopicAnalytics, MessageAnalytics } from '@/lib/database-types';

export default function AnalyticsPage() {
  const [userAnalytics, setUserAnalytics] = useState<UserAnalytics | null>(null);
  const [topicAnalytics, setTopicAnalytics] = useState<TopicAnalytics | null>(null);
  const [messageAnalytics, setMessageAnalytics] = useState<MessageAnalytics | null>(null);
  const [blogStats, setBlogStats] = useState({ total: 0, published: 0, totalLikes: 0 });
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && user) {
      checkAdminAndLoadAnalytics();
    }
  }, [user, mounted]);

  const checkAdminAndLoadAnalytics = async () => {
    if (!user) {
      router.push('/admin/login?redirect=' + encodeURIComponent('/admin/analytics'));
      return;
    }

    try {
      const adminStatus = await AdminService.isUserAdmin(user.uid);
      if (!adminStatus) {
        toast({
          title: 'Access Denied',
          description: 'You do not have admin privileges.',
          variant: 'destructive'
        });
        router.push('/');
        return;
      }

      setIsAdmin(true);
      await loadAnalytics();
    } catch (error) {
      console.error('Error checking admin status:', error);
      toast({
        title: 'Error',
        description: 'Failed to load admin data.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const loadAnalytics = async () => {
    try {
      const [userAnalyticsData, topicAnalyticsData, messageAnalyticsData, blogPosts] = await Promise.all([
        AdminService.getUserAnalytics(),
        AdminService.getTopicAnalytics(),
        AdminService.getMessageAnalytics(),
        BlogService.getAllPosts(100)
      ]);

      setUserAnalytics(userAnalyticsData);
      setTopicAnalytics(topicAnalyticsData);
      setMessageAnalytics(messageAnalyticsData);

      const published = blogPosts.filter(p => p.status === 'published');
      const totalLikes = blogPosts.reduce((sum, post) => sum + (post.like_count || 0), 0);
      setBlogStats({
        total: blogPosts.length,
        published: published.length,
        totalLikes
      });
    } catch (error) {
      console.error('Error loading analytics:', error);
      toast({
        title: 'Error',
        description: 'Failed to load analytics data.',
        variant: 'destructive'
      });
    }
  };

  const getPopularHours = () => {
    if (!topicAnalytics?.popular_times) return [];
    return topicAnalytics.popular_times
      .map((item, index) => ({ ...item, hour: index }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  };

  if (!mounted) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600">You do not have admin privileges.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <Logo />
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/admin">
                    <ArrowLeft className="h-4 w-4 mr-1" />
                    Dashboard
                  </Link>
                </Button>
                <span className="text-gray-400">/</span>
                <h1 className="text-xl font-semibold text-gray-900">Analytics & Insights</h1>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Button variant="outline" onClick={loadAnalytics}>
                Refresh Data
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Overview Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Users</p>
                  <p className="text-3xl font-bold text-blue-600">{userAnalytics?.total_users || 0}</p>
                </div>
                <Users className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Users</p>
                  <p className="text-3xl font-bold text-green-600">{userAnalytics?.active_users || 0}</p>
                </div>
                <Activity className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">New Today</p>
                  <p className="text-3xl font-bold text-purple-600">{userAnalytics?.new_users_today || 0}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Avg Rating</p>
                  <p className="text-3xl font-bold text-yellow-600">
                    {userAnalytics?.average_rating ? userAnalytics.average_rating.toFixed(1) : '0.0'}
                  </p>
                </div>
                <Star className="h-8 w-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Sessions</p>
                  <p className="text-3xl font-bold text-indigo-600">{topicAnalytics?.total_topics || 0}</p>
                </div>
                <MessageCircle className="h-8 w-8 text-indigo-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Blog Posts</p>
                  <p className="text-3xl font-bold text-pink-600">{blogStats.published}</p>
                </div>
                <BarChart3 className="h-8 w-8 text-pink-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* User Analytics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                User Analytics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <p className="text-sm font-medium text-blue-900">Total Users</p>
                    <p className="text-2xl font-bold text-blue-600">{userAnalytics?.total_users || 0}</p>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <p className="text-sm font-medium text-green-900">Active (30d)</p>
                    <p className="text-2xl font-bold text-green-600">{userAnalytics?.active_users || 0}</p>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-3">Top Rated Users</h4>
                  <div className="space-y-2">
                    {userAnalytics?.top_rated_users?.slice(0, 3).map((user, index) => (
                      <div key={user.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center text-white text-sm font-semibold">
                            {(user.display_name || user.first_name || user.email).charAt(0).toUpperCase()}
                          </div>
                          <span className="font-medium">
                            {user.display_name || user.first_name || user.email.split('@')[0]}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 text-yellow-500 fill-current" />
                          <span className="font-medium">
                            {user.rating_stats?.overall_average.toFixed(1)}
                          </span>
                        </div>
                      </div>
                    )) || (
                      <p className="text-gray-500 text-sm">No rated users yet</p>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Session Analytics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5" />
                Session Analytics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <p className="text-sm font-medium text-purple-900">Total Sessions</p>
                    <p className="text-2xl font-bold text-purple-600">{topicAnalytics?.total_topics || 0}</p>
                  </div>
                  <div className="bg-orange-50 p-4 rounded-lg">
                    <p className="text-sm font-medium text-orange-900">Active Now</p>
                    <p className="text-2xl font-bold text-orange-600">{topicAnalytics?.active_topics || 0}</p>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-3">Popular Hours</h4>
                  <div className="space-y-2">
                    {getPopularHours().map((timeSlot) => (
                      <div key={timeSlot.hour} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <span className="text-sm">
                          {timeSlot.hour}:00 - {timeSlot.hour + 1}:00
                        </span>
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-primary h-2 rounded-full" 
                              style={{ width: `${Math.min(100, (timeSlot.count / Math.max(...getPopularHours().map(t => t.count))) * 100)}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium">{timeSlot.count}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Message & Content Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Message Analytics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5" />
                Message Analytics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-indigo-50 p-4 rounded-lg">
                    <p className="text-sm font-medium text-indigo-900">Total Messages</p>
                    <p className="text-2xl font-bold text-indigo-600">{messageAnalytics?.total_messages || 0}</p>
                  </div>
                  <div className="bg-teal-50 p-4 rounded-lg">
                    <p className="text-sm font-medium text-teal-900">Today</p>
                    <p className="text-2xl font-bold text-teal-600">{messageAnalytics?.messages_today || 0}</p>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm font-medium text-gray-900 mb-1">Avg Messages per Session</p>
                  <p className="text-3xl font-bold text-gray-600">
                    {messageAnalytics?.average_messages_per_topic?.toFixed(1) || '0.0'}
                  </p>
                </div>

                <div>
                  <h4 className="font-medium mb-3">Most Active Sessions</h4>
                  <div className="space-y-2">
                    {messageAnalytics?.most_active_topics?.slice(0, 3).map((topic) => (
                      <div key={topic.id} className="p-3 bg-gray-50 rounded-lg">
                        <p className="font-medium text-sm truncate">{topic.title}</p>
                        <p className="text-xs text-gray-500">{topic.message_count} messages</p>
                      </div>
                    )) || (
                      <p className="text-gray-500 text-sm">No active sessions yet</p>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Blog Analytics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Content Analytics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-pink-50 p-4 rounded-lg">
                    <p className="text-sm font-medium text-pink-900">Published Posts</p>
                    <p className="text-2xl font-bold text-pink-600">{blogStats.published}</p>
                  </div>
                  <div className="bg-red-50 p-4 rounded-lg">
                    <p className="text-sm font-medium text-red-900">Total Likes</p>
                    <p className="text-2xl font-bold text-red-600">{blogStats.totalLikes}</p>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm font-medium text-gray-900 mb-1">Avg Likes per Post</p>
                  <p className="text-3xl font-bold text-gray-600">
                    {blogStats.published > 0 ? (blogStats.totalLikes / blogStats.published).toFixed(1) : '0.0'}
                  </p>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm font-medium text-gray-900 mb-1">Publish Rate</p>
                  <p className="text-3xl font-bold text-gray-600">
                    {blogStats.total > 0 ? Math.round((blogStats.published / blogStats.total) * 100) : 0}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}