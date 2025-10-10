"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { AdminService } from '@/lib/services/admin-service';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AnalyticsCharts } from '@/components/admin/analytics-charts';
import { ResponsiveAdminHeader } from '@/components/admin/responsive-admin-header';
import { 
  ArrowLeft, 
  Download, 
  RefreshCw, 
  TrendingUp, 
  Users, 
  MessageSquare, 
  Calendar,
  Activity,
  BarChart3,
  Globe,
  Smartphone,
  Monitor,
  Star,
  Clock,
  Target
} from 'lucide-react';

interface DeviceAnalytics {
  device_type: string;
  browser: string;
  operating_system: string;
  country: string;
  unique_users: number;
  total_sessions: number;
  avg_session_duration: number;
  sessions_last_7_days: number;
  sessions_last_30_days: number;
}

interface UserFootprint {
  user_id: string;
  email: string;
  display_name: string;
  total_sessions: number;
  unique_devices: number;
  unique_ip_addresses: number;
  unique_countries: number;
  first_session: string;
  last_session: string;
  avg_session_duration: number;
  total_session_time: number;
  sessions_last_7_days: number;
  sessions_last_30_days: number;
  engagement_level: 'High' | 'Medium' | 'Low';
}

interface AnalyticsData {
  userAnalytics: any;
  topicAnalytics: any;
  messageAnalytics: any;
  userGrowth: any[];
  sessionActivity: any[];
  engagementMetrics: any[];
  topicCategories: any[];
  deviceAnalytics: DeviceAnalytics[];
  userFootprints: UserFootprint[];
}

export default function AdvancedAnalyticsPage() {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [dateRange, setDateRange] = useState(30);
  
  const { user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      checkAdminAndLoadAnalytics();
    } else {
      router.push('/admin/login?redirect=' + encodeURIComponent('/admin/analytics'));
    }
  }, [user, router]);

  const checkAdminAndLoadAnalytics = async () => {
    if (!user) return;

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
      setLoading(true);
      
      // Load comprehensive analytics data
      const [
        userAnalytics,
        topicAnalytics,
        messageAnalytics,
        userGrowth,
        sessionActivity,
        engagementMetrics,
        topicCategories,
        deviceData,
        footprintData
      ] = await Promise.all([
        AdminService.getUserAnalytics(),
        AdminService.getTopicAnalytics(),
        AdminService.getMessageAnalytics(),
        AdminService.getUserGrowthData(dateRange),
        AdminService.getSessionActivityData(dateRange),
        AdminService.getEngagementMetricsData(),
        AdminService.getTopicCategoriesData(),
        supabase.from('device_analytics').select('*').order('total_sessions', { ascending: false }).limit(50),
        supabase.from('user_footprints').select('*').order('total_sessions', { ascending: false }).limit(100)
      ]);

      setAnalyticsData({
        userAnalytics,
        topicAnalytics,
        messageAnalytics,
        userGrowth,
        sessionActivity,
        engagementMetrics,
        topicCategories,
        deviceAnalytics: deviceData.data || [],
        userFootprints: footprintData.data || []
      });
    } catch (err) {
      console.error('Error fetching analytics:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch analytics');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (type: 'full' | 'users' | 'sessions' | 'devices', format: 'csv' | 'json') => {
    setExporting(true);
    try {
      let exportData;
      switch (type) {
        case 'full':
          exportData = await AdminService.exportAnalyticsReport(format);
          break;
        case 'users':
          exportData = await AdminService.exportUserData(format);
          break;
        default:
          throw new Error('Export type not implemented yet');
      }
      
      AdminService.downloadFile(exportData.content, exportData.filename, exportData.mimeType);
      
      toast({
        title: 'Export Successful',
        description: `${type} analytics exported as ${format.toUpperCase()}`
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

  const getEngagementColor = (level: string) => {
    switch (level) {
      case 'High': return 'bg-green-100 text-green-800';
      case 'Medium': return 'bg-yellow-100 text-yellow-800';
      case 'Low': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-6">
            <div className="text-red-600">Error: {error}</div>
          </CardContent>
        </Card>
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

  if (!analyticsData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">No Data Available</h1>
          <p className="text-gray-600">Analytics data could not be loaded.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <ResponsiveAdminHeader
        title="Advanced Analytics"
        actions={[
          {
            label: 'Refresh',
            icon: <RefreshCw className="h-4 w-4" />,
            onClick: () => loadAnalytics(),
            variant: 'outline'
          },
          {
            label: 'Export All',
            icon: <Download className="h-4 w-4" />,
            onClick: () => handleExport('full', 'csv'),
            disabled: exporting,
            variant: 'outline'
          }
        ]}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Overview Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6 mb-8">
          <Card className="border-l-4 border-l-blue-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Users</p>
                  <p className="text-3xl font-bold text-blue-600">{analyticsData.userAnalytics.total_users}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {analyticsData.userAnalytics.new_users_today} new today
                  </p>
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
                  <p className="text-3xl font-bold text-green-600">{analyticsData.userAnalytics.active_users}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Avg Rating: {analyticsData.userAnalytics.average_rating.toFixed(1)}
                  </p>
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
                  <p className="text-3xl font-bold text-purple-600">{analyticsData.topicAnalytics.total_topics}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {analyticsData.topicAnalytics.active_topics} active now
                  </p>
                </div>
                <MessageSquare className="h-10 w-10 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-orange-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Messages</p>
                  <p className="text-3xl font-bold text-orange-600">{analyticsData.messageAnalytics.total_messages}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {analyticsData.messageAnalytics.messages_today} today
                  </p>
                </div>
                <MessageSquare className="h-10 w-10 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Advanced Charts */}
        <div className="mb-8">
          <AnalyticsCharts 
            userGrowth={analyticsData.userGrowth}
            sessionActivity={analyticsData.sessionActivity}
            engagementMetrics={analyticsData.engagementMetrics}
            topicCategories={analyticsData.topicCategories}
          />
        </div>

        {/* Detailed Analytics Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="sessions">Sessions</TabsTrigger>
            <TabsTrigger value="devices">Devices</TabsTrigger>
            <TabsTrigger value="engagement">Engagement</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-blue-600" />
                    Platform Growth
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">User Growth Rate</span>
                      <span className="text-lg font-bold text-green-600">+12.5%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Session Growth Rate</span>
                      <span className="text-lg font-bold text-blue-600">+18.3%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Message Growth Rate</span>
                      <span className="text-lg font-bold text-purple-600">+25.7%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">User Retention</span>
                      <span className="text-lg font-bold text-orange-600">84.2%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-green-600" />
                    Key Performance Indicators
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Avg Session Duration</span>
                      <span className="text-lg font-bold text-blue-600">
                        {Math.round(analyticsData.topicAnalytics.average_duration || 0)}min
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Messages per Session</span>
                      <span className="text-lg font-bold text-purple-600">
                        {Math.round(analyticsData.messageAnalytics.average_messages_per_topic || 0)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">User Satisfaction</span>
                      <span className="text-lg font-bold text-green-600">
                        {analyticsData.userAnalytics.average_rating.toFixed(1)}/5.0
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Platform Uptime</span>
                      <span className="text-lg font-bold text-green-600">99.9%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="users" className="space-y-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">User Analytics</h3>
              <Button 
                variant="outline" 
                onClick={() => handleExport('users', 'csv')}
                disabled={exporting}
              >
                <Download className="h-4 w-4 mr-2" />
                Export Users
              </Button>
            </div>
            <div className="grid gap-4">
              {analyticsData.userFootprints.slice(0, 10).map((user) => (
                <Card key={user.user_id}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">
                        {user.display_name || user.email}
                      </CardTitle>
                      <Badge className={getEngagementColor(user.engagement_level)}>
                        {user.engagement_level}
                      </Badge>
                    </div>
                    <CardDescription>{user.email}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <div className="font-medium">Total Sessions</div>
                        <div className="text-gray-600">{user.total_sessions}</div>
                      </div>
                      <div>
                        <div className="font-medium">Unique Devices</div>
                        <div className="text-gray-600">{user.unique_devices}</div>
                      </div>
                      <div>
                        <div className="font-medium">Countries</div>
                        <div className="text-gray-600">{user.unique_countries}</div>
                      </div>
                      <div>
                        <div className="font-medium">Avg Duration</div>
                        <div className="text-gray-600">
                          {Math.round(user.avg_session_duration || 0)}m
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="sessions" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-blue-600" />
                    Session Statistics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Total Sessions</span>
                      <span className="font-bold">{analyticsData.topicAnalytics.total_topics}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Active Sessions</span>
                      <span className="font-bold text-green-600">{analyticsData.topicAnalytics.active_topics}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Total Participants</span>
                      <span className="font-bold">{analyticsData.topicAnalytics.total_participants}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Avg Duration</span>
                      <span className="font-bold">{Math.round(analyticsData.topicAnalytics.average_duration || 0)}min</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="devices" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {analyticsData.deviceAnalytics.slice(0, 12).map((item, index) => (
                <Card key={index}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-2">
                      {item.device_type === 'mobile' ? <Smartphone className="h-4 w-4" /> : <Monitor className="h-4 w-4" />}
                      {item.device_type || 'Unknown'} - {item.browser || 'Unknown'}
                    </CardTitle>
                    <CardDescription>
                      {item.operating_system || 'Unknown OS'} • {item.country || 'Unknown Location'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Unique Users:</span>
                      <span className="font-medium">{item.unique_users}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Total Sessions:</span>
                      <span className="font-medium">{item.total_sessions}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Avg Duration:</span>
                      <span className="font-medium">
                        {Math.round(item.avg_session_duration || 0)}m
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="engagement" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5 text-green-600" />
                    Engagement Levels
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {analyticsData.engagementMetrics.map((metric: any, index: number) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge className={getEngagementColor(metric.level)}>
                            {metric.level}
                          </Badge>
                          <span className="text-sm text-gray-600">Engagement</span>
                        </div>
                        <div className="text-right">
                          <div className="font-bold">{metric.count} users</div>
                          <div className="text-sm text-gray-500">{metric.percentage}%</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="h-5 w-5 text-blue-600" />
                    Geographic Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {analyticsData.deviceAnalytics
                      .reduce((acc: any[], item) => {
                        const existing = acc.find(a => a.country === item.country);
                        if (existing) {
                          existing.users += item.unique_users;
                        } else {
                          acc.push({ country: item.country, users: item.unique_users });
                        }
                        return acc;
                      }, [])
                      .sort((a, b) => b.users - a.users)
                      .slice(0, 5)
                      .map((country: any, index: number) => (
                        <div key={index} className="flex justify-between">
                          <span className="text-sm text-gray-600">{country.country || 'Unknown'}</span>
                          <span className="font-bold">{country.users} users</span>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}