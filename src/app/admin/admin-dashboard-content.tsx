'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Logo } from '@/components/common/logo';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BlogService } from '@/lib/services/blog-service';
import { AdminService } from '@/lib/services/admin-service';
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
  TrendingUp
} from 'lucide-react';

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
      const adminStatus = await BlogService.isUserAdmin(user.uid);
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
        description: `Failed to verify admin access: ${error.message}`,
        variant: 'destructive'
      });
      setTimeout(() => router.push('/'), 3000);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const [posts, userAnalytics, topicAnalytics] = await Promise.all([
        BlogService.getAllPosts(100),
        AdminService.getUserAnalytics(),
        AdminService.getTopicAnalytics()
      ]);

      const published = posts.filter(p => p.status === 'published');
      const drafts = posts.filter(p => p.status === 'draft');
      const totalLikes = posts.reduce((sum, post) => sum + (post.like_count || 0), 0);

      setStats({
        totalPosts: posts.length,
        publishedPosts: published.length,
        draftPosts: drafts.length,
        totalLikes,
        totalUsers: userAnalytics.total_users,
        activeUsers: userAnalytics.active_users,
        totalSessions: topicAnalytics.total_topics,
        activeSessions: topicAnalytics.active_topics
      });
    } catch (error) {
      console.error('Error loading stats:', error);
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
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <Logo />
              <div className="hidden sm:block">
                <h1 className="text-xl font-semibold text-gray-900">Admin Dashboard</h1>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Button variant="outline" asChild>
                <Link href="/" target="_blank">
                  <Eye className="h-4 w-4 mr-2" />
                  View Site
                </Link>
              </Button>
              <div className="text-sm text-gray-600">
                Welcome, {user?.email}
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Users</p>
                  <p className="text-3xl font-bold text-blue-600">{stats.totalUsers}</p>
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
                  <p className="text-3xl font-bold text-green-600">{stats.activeUsers}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Sessions</p>
                  <p className="text-3xl font-bold text-purple-600">{stats.totalSessions}</p>
                </div>
                <Settings className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Blog Posts</p>
                  <p className="text-3xl font-bold text-primary">{stats.totalPosts}</p>
                </div>
                <FileText className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Published</p>
                  <p className="text-3xl font-bold text-green-600">{stats.publishedPosts}</p>
                </div>
                <Eye className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Blog Likes</p>
                  <p className="text-3xl font-bold text-red-600">{stats.totalLikes}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-red-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Admin Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
          {/* Blog Management */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Blog Management
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-600">
                Create, edit, and manage your blog posts. Share product updates, feature announcements, and community highlights.
              </p>
              <div className="flex flex-col gap-3">
                <Button asChild className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90">
                  <Link href="/admin/blog/new">
                    <Plus className="h-4 w-4 mr-2" />
                    New Post
                  </Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/admin/blog">
                    <FileText className="h-4 w-4 mr-2" />
                    All Blog Posts ({stats.totalPosts})
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* User Management */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                User Management
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-600">
                Manage user accounts, view user activity, handle reports, and manage admin privileges.
              </p>
              <div className="flex flex-col gap-3">
                <Button variant="outline" asChild>
                  <Link href="/admin/users">
                    <Users className="h-4 w-4 mr-2" />
                    All Users
                  </Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/admin/users/reports">
                    <Settings className="h-4 w-4 mr-2" />
                    User Reports
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Analytics & Insights */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Analytics & Insights
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-600">
                Track platform engagement, monitor performance, and understand your community better.
              </p>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="font-medium">Avg. Likes per Post</p>
                  <p className="text-2xl font-bold text-primary">
                    {stats.totalPosts > 0 ? Math.round(stats.totalLikes / stats.totalPosts) : 0}
                  </p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="font-medium">Publish Rate</p>
                  <p className="text-2xl font-bold text-green-600">
                    {stats.totalPosts > 0 ? Math.round((stats.publishedPosts / stats.totalPosts) * 100) : 0}%
                  </p>
                </div>
              </div>
              <Button variant="outline" asChild className="w-full">
                <Link href="/admin/analytics">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  View Analytics
                </Link>
              </Button>
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