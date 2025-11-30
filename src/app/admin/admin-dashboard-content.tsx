'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BlogService } from '@/lib/services/blog-service';
import { AdminService } from '@/lib/services/admin-service';
import { AdminAuthService } from '@/lib/services/admin-auth-service';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { 
  FileText, 
  Users, 
  BarChart3, 
  Settings,
  Plus,
  Eye,
  Edit,
  TrendingUp,
  MessageSquare,
  Activity,
  Download,
  Calendar,
  Star,
  AlertTriangle
} from 'lucide-react';
import { LineChartComponent, AreaChartComponent, BarChartComponent } from '@/components/admin/analytics-charts';
import { CacheMonitor } from '@/components/admin/cache-monitor';

export default function AdminDashboardContent() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalPosts: 0,
    publishedPosts: 0,
    draftPosts: 0,
    totalLikes: 0,
    totalUsers: 0,
    activeUsers: 0,
    totalSessions: 0,
    activeSessions: 0
  });
  const [chartData, setChartData] = useState<{
    userGrowth: any[];
    sessionActivity: any[];
    engagementMetrics: any[];
    topicCategories: any[];
  }>({
    userGrowth: [],
    sessionActivity: [],
    engagementMetrics: [],
    topicCategories: []
  });
  const [exporting, setExporting] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      checkAdminAccess();
    } else {
      router.push('/admin/login?redirect=' + encodeURIComponent('/admin'));
    }
  }, [user, router]);

  const checkAdminAccess = async () => {
    if (!user) return;

    try {
      const adminStatus = await AdminAuthService.isUserAdmin(user.uid);
      if (!adminStatus) {
        toast({
          title: 'Access Denied',
          description: `User ${user.email} does not have admin privileges.`,
          variant: 'destructive'
        });
        setTimeout(() => router.push('/'), 3000);
        return;
      }

      setIsAdmin(true);
      await loadStats();
    } catch (error) {
      console.error('Error checking admin status:', error);
      toast({
        title: 'Error',
        description: `Failed to verify admin access: ${(error as any)?.message || 'Unknown error'}`,
        variant: 'destructive'
      });
      setTimeout(() => router.push('/'), 3000);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const [
        posts, 
        userAnalytics, 
        topicAnalytics, 
        userGrowthData, 
        sessionActivityData, 
        engagementData, 
        categoriesData
      ]: [any, any, any, any[], any[], any[], any[]] = await Promise.all([
        BlogService.getAllPosts(100),
        AdminService.getUserAnalytics(),
        AdminService.getTopicAnalytics(),
        AdminService.getUserGrowthData(30),
        AdminService.getSessionActivityData(30),
        AdminService.getEngagementMetricsData(),
        AdminService.getTopicCategoriesData()
      ]);

      // Ensure posts is an array and filter safely
      const postsArray = Array.isArray(posts) ? posts : [];
      const published = postsArray.filter((p: any) => p && p.status === 'published');
      const drafts = postsArray.filter((p: any) => p && p.status === 'draft');
      const totalLikes = postsArray.reduce((sum: any, post: any) => sum + (post?.like_count || 0), 0);

      setStats({
        totalPosts: postsArray.length,
        publishedPosts: published.length,
        draftPosts: drafts.length,
        totalLikes,
        totalUsers: userAnalytics?.total_users || 0,
        activeUsers: userAnalytics?.active_users || 0,
        totalSessions: topicAnalytics?.total_topics || 0,
        activeSessions: topicAnalytics?.active_topics || 0
      });

      setChartData({
        userGrowth: Array.isArray(userGrowthData) ? userGrowthData : [],
        sessionActivity: Array.isArray(sessionActivityData) ? sessionActivityData : [],
        engagementMetrics: Array.isArray(engagementData) ? engagementData : [],
        topicCategories: Array.isArray(categoriesData) ? categoriesData : []
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleExport = async (type: 'users' | 'analytics', format: 'csv' | 'json') => {
    setExporting(true);
    try {
      let exportData;
      if (type === 'users') {
        exportData = await AdminService.exportUserData(format);
      } else {
        exportData = await AdminService.exportAnalyticsReport(format);
      }
      
      AdminService.downloadFile(exportData.content, exportData.filename, exportData.mimeType);
      
      toast({
        title: 'Export Successful',
        description: `${type} data exported as ${format.toUpperCase()}`
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: 'Export Failed',
        description: 'Failed to export data. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setExporting(false);
    }
  };

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
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header with Export Actions */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6 sm:mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Platform Analytics</h1>
            <p className="text-sm sm:text-base text-gray-600 mt-1">Comprehensive overview of platform performance and user engagement</p>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
            <Button 
              variant="outline" 
              onClick={() => handleExport('analytics', 'csv')}
              disabled={exporting}
            >
              <Download className="h-4 w-4 mr-2" />
              Export Analytics
            </Button>
            <Button 
              variant="outline" 
              onClick={() => handleExport('users', 'csv')}
              disabled={exporting}
            >
              <Download className="h-4 w-4 mr-2" />
              Export Users
            </Button>
          </div>
        </div>

        {/* Performance Monitor - O(1) Cache */}
        <div className="mb-6">
          <CacheMonitor />
        </div>

        {/* Key Metrics - Prioritized */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <Card className="border-l-4 border-l-blue-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Users</p>
                  <p className="text-3xl font-bold text-blue-600">{stats.totalUsers}</p>
                  <p className="text-xs text-gray-500 mt-1">Platform registrations</p>
                </div>
                <Users className="h-10 w-10 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-green-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Users</p>
                  <p className="text-3xl font-bold text-green-600">{stats.activeUsers}</p>
                  <p className="text-xs text-gray-500 mt-1">With scheduled sessions</p>
                </div>
                <Activity className="h-10 w-10 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-purple-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Sessions</p>
                  <p className="text-3xl font-bold text-purple-600">{stats.totalSessions}</p>
                  <p className="text-xs text-gray-500 mt-1">All conversations</p>
                </div>
                <MessageSquare className="h-10 w-10 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-orange-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Sessions</p>
                  <p className="text-3xl font-bold text-orange-600">{stats.activeSessions}</p>
                  <p className="text-xs text-gray-500 mt-1">Currently ongoing</p>
                </div>
                <Calendar className="h-10 w-10 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Advanced Analytics Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>User Growth</CardTitle>
            </CardHeader>
            <CardContent>
              <LineChartComponent data={chartData.userGrowth} dataKey="value" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Session Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <AreaChartComponent data={chartData.sessionActivity} dataKey="value" />
            </CardContent>
          </Card>
        </div>

        {/* Primary Admin Sections - Prioritized by Importance */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 mb-6 sm:mb-8">
          {/* User Management - Highest Priority */}
          <Card className="border-2 border-blue-200 bg-blue-50/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-600" />
                User Management
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-600">
                Comprehensive user oversight, engagement tracking, and community management tools.
              </p>
              <div className="grid grid-cols-2 gap-3 text-sm mb-4">
                <div className="bg-white p-3 rounded-lg border">
                  <p className="font-medium text-blue-600">Active Rate</p>
                  <p className="text-xl font-bold">
                    {stats.totalUsers > 0 ? Math.round((stats.activeUsers / stats.totalUsers) * 100) : 0}%
                  </p>
                </div>
                <div className="bg-white p-3 rounded-lg border">
                  <p className="font-medium text-green-600">Engagement</p>
                  <p className="text-xl font-bold">High</p>
                </div>
              </div>
              <div className="flex flex-col gap-3">
                <Button asChild className="bg-blue-600 hover:bg-blue-700">
                  <Link href="/admin/users">
                    <Users className="h-4 w-4 mr-2" />
                    Manage Users ({stats.totalUsers})
                  </Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/admin/users/reports">
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    User Reports
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Session Management - High Priority */}
          <Card className="border-2 border-purple-200 bg-purple-50/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-purple-600" />
                Session Management
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-600">
                Monitor active conversations, manage session reports, and ensure platform safety.
              </p>
              <div className="grid grid-cols-2 gap-3 text-sm mb-4">
                <div className="bg-white p-3 rounded-lg border">
                  <p className="font-medium text-purple-600">Active Now</p>
                  <p className="text-xl font-bold">{stats.activeSessions}</p>
                </div>
                <div className="bg-white p-3 rounded-lg border">
                  <p className="font-medium text-orange-600">Total</p>
                  <p className="text-xl font-bold">{stats.totalSessions}</p>
                </div>
              </div>
              <div className="flex flex-col gap-3">
                <Button asChild className="bg-purple-600 hover:bg-purple-700">
                  <Link href="/admin/sessions">
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Monitor Sessions
                  </Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/admin/sessions/reports">
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    Session Reports
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Advanced Analytics - High Priority */}
          <Card className="border-2 border-green-200 bg-green-50/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-green-600" />
                Advanced Analytics
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-600">
                Deep insights into platform performance, user behavior, and growth trends.
              </p>
              <div className="grid grid-cols-2 gap-3 text-sm mb-4">
                <div className="bg-white p-3 rounded-lg border">
                  <p className="font-medium text-green-600">Growth Rate</p>
                  <p className="text-xl font-bold">+12%</p>
                </div>
                <div className="bg-white p-3 rounded-lg border">
                  <p className="font-medium text-blue-600">Retention</p>
                  <p className="text-xl font-bold">85%</p>
                </div>
              </div>
              <div className="flex flex-col gap-3">
                <Button asChild className="bg-green-600 hover:bg-green-700">
                  <Link href="/admin/analytics">
                    <BarChart3 className="h-4 w-4 mr-2" />
                    View Full Analytics
                  </Link>
                </Button>
                <Button variant="outline" onClick={() => handleExport('analytics', 'csv')}>
                  <Download className="h-4 w-4 mr-2" />
                  Export Reports
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Secondary Admin Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
          {/* Platform Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Platform Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-600">
                Configure platform settings, manage categories, and control system features.
              </p>
              <div className="flex flex-col gap-3">
                <Button variant="outline" asChild>
                  <Link href="/admin/settings">
                    <Settings className="h-4 w-4 mr-2" />
                    General Settings
                  </Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/admin/settings/categories">
                    <FileText className="h-4 w-4 mr-2" />
                    Manage Categories
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Content Management - Lower Priority */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Content Management
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-600">
                Manage blog posts, announcements, and platform content.
              </p>
              <div className="grid grid-cols-2 gap-3 text-sm mb-4">
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="font-medium">Published</p>
                  <p className="text-xl font-bold text-green-600">{stats.publishedPosts}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="font-medium">Total Likes</p>
                  <p className="text-xl font-bold text-red-600">{stats.totalLikes}</p>
                </div>
              </div>
              <div className="flex flex-col gap-3">
                <Button variant="outline" asChild>
                  <Link href="/admin/blog">
                    <FileText className="h-4 w-4 mr-2" />
                    Manage Blog ({stats.totalPosts})
                  </Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/admin/blog/new">
                    <Plus className="h-4 w-4 mr-2" />
                    New Post
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Additional Admin Tools */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
          {/* Session Management */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Session Management
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-600">
                Monitor active conversations, manage session reports, and oversee platform safety.
              </p>
              <div className="flex flex-col gap-3">
                <Button variant="outline" asChild>
                  <Link href="/admin/sessions">
                    <Eye className="h-4 w-4 mr-2" />
                    Active Sessions
                  </Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/admin/sessions/reports">
                    <Settings className="h-4 w-4 mr-2" />
                    Session Reports
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Platform Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Platform Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-600">
                Configure platform settings, manage categories, and control system features.
              </p>
              <div className="flex flex-col gap-3">
                <Button variant="outline" asChild>
                  <Link href="/admin/settings">
                    <Settings className="h-4 w-4 mr-2" />
                    General Settings
                  </Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/admin/settings/categories">
                    <FileText className="h-4 w-4 mr-2" />
                    Manage Categories
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Start Guide */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Quick Start Guide</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-4 border border-gray-200 rounded-lg">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Plus className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">Create Your First Post</h3>
                <p className="text-sm text-gray-600 mb-3">
                  Share product updates, feature announcements, or community highlights.
                </p>
                <Button size="sm" asChild>
                  <Link href="/admin/blog/new">Get Started</Link>
                </Button>
              </div>

              <div className="text-center p-4 border border-gray-200 rounded-lg">
                <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Eye className="h-6 w-6 text-accent" />
                </div>
                <h3 className="font-semibold mb-2">Preview Your Blog</h3>
                <p className="text-sm text-gray-600 mb-3">
                  See how your blog looks to visitors and test the user experience.
                </p>
                <Button size="sm" variant="outline" asChild>
                  <Link href="/blog" target="_blank">View Blog</Link>
                </Button>
              </div>

              <div className="text-center p-4 border border-gray-200 rounded-lg">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <BarChart3 className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="font-semibold mb-2">Track Engagement</h3>
                <p className="text-sm text-gray-600 mb-3">
                  Monitor likes, shares, and community discussions on your posts.
                </p>
                <Button size="sm" variant="outline" asChild>
                  <Link href="/admin/blog">View Analytics</Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
