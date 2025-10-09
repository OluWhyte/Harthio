'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Logo } from '@/components/common/logo';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, 
  User, 
  Mail, 
  Phone, 
  Calendar,
  MapPin,
  Star,
  MessageSquare,
  Users,
  Activity,
  Clock,
  TrendingUp,
  Shield,
  Eye,
  Flag,
  Settings,
  BarChart3
} from 'lucide-react';
import { AdminService } from '@/lib/services/admin-service';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';

export default function UserDetailPage() {
  const params = useParams();
  const userId = params.id as string;
  const [userFootprint, setUserFootprint] = useState<any>(null);
  const [engagementMetrics, setEngagementMetrics] = useState<any>(null);
  const [behaviorPattern, setBehaviorPattern] = useState<any>(null);
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
    if (mounted && user && userId) {
      checkAdminAndLoadUserData();
    }
  }, [user, mounted, userId]);

  const checkAdminAndLoadUserData = async () => {
    if (!user) {
      router.push('/admin/login?redirect=' + encodeURIComponent(`/admin/users/${userId}`));
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
      await loadUserData();
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

  const loadUserData = async () => {
    try {
      const [footprint, engagement, behavior] = await Promise.all([
        AdminService.getUserFootprint(userId),
        AdminService.getUserEngagementMetrics(userId),
        AdminService.getUserBehaviorPattern(userId)
      ]);

      setUserFootprint(footprint);
      setEngagementMetrics(engagement);
      setBehaviorPattern(behavior);
    } catch (error) {
      console.error('Error loading user data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load user data.',
        variant: 'destructive'
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getDisplayName = (user: any) => {
    if (user?.display_name) return user.display_name;
    if (user?.first_name && user?.last_name) return `${user.first_name} ${user.last_name}`;
    if (user?.first_name) return user.first_name;
    return user?.email?.split('@')[0] || 'Unknown User';
  };

  const getEngagementColor = (level: string) => {
    switch (level) {
      case 'High': return 'bg-green-100 text-green-800';
      case 'Medium': return 'bg-yellow-100 text-yellow-800';
      case 'Low': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
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

  if (!userFootprint?.profile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">User Not Found</h1>
          <p className="text-gray-600">The requested user could not be found.</p>
          <Button asChild className="mt-4">
            <Link href="/admin/users">Back to Users</Link>
          </Button>
        </div>
      </div>
    );
  }

  const profile = userFootprint.profile;
  const activity = userFootprint.activity;
  const stats = userFootprint.stats;

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
                  <Link href="/admin/users">
                    <ArrowLeft className="h-4 w-4 mr-1" />
                    Users
                  </Link>
                </Button>
                <span className="text-gray-400">/</span>
                <h1 className="text-xl font-semibold text-gray-900">{getDisplayName(profile)}</h1>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Button variant="outline" size="sm">
                <Flag className="h-4 w-4 mr-1" />
                Report User
              </Button>
              <Button variant="outline" size="sm">
                <Shield className="h-4 w-4 mr-1" />
                Moderate
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* User Profile Header */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row lg:items-start gap-6">
              {/* Avatar & Basic Info */}
              <div className="flex items-start gap-4">
                <div className="w-20 h-20 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center text-white text-2xl font-semibold">
                  {profile.avatar_url ? (
                    <img src={profile.avatar_url} alt={getDisplayName(profile)} className="w-20 h-20 rounded-full object-cover" />
                  ) : (
                    getDisplayName(profile).charAt(0).toUpperCase()
                  )}
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-1">{getDisplayName(profile)}</h2>
                  {profile.headline && (
                    <p className="text-gray-600 mb-2">{profile.headline}</p>
                  )}
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <Mail className="h-4 w-4" />
                      {profile.email}
                    </div>
                    {profile.phone_number && (
                      <div className="flex items-center gap-1">
                        <Phone className="h-4 w-4" />
                        {profile.phone_country_code}{profile.phone_number}
                        {profile.phone_verified && <Badge variant="secondary" className="ml-1">Verified</Badge>}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <p className="text-2xl font-bold text-blue-600">{activity.topics_created}</p>
                  <p className="text-sm text-blue-800">Topics Created</p>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <p className="text-2xl font-bold text-green-600">{activity.messages_sent}</p>
                  <p className="text-sm text-green-800">Messages Sent</p>
                </div>
                <div className="text-center p-3 bg-yellow-50 rounded-lg">
                  <p className="text-2xl font-bold text-yellow-600">{stats.avg_rating.toFixed(1)}</p>
                  <p className="text-sm text-yellow-800">Avg Rating</p>
                </div>
                <div className="text-center p-3 bg-purple-50 rounded-lg">
                  <p className="text-2xl font-bold text-purple-600">{stats.account_age_days}</p>
                  <p className="text-sm text-purple-800">Days Active</p>
                </div>
              </div>
            </div>

            {/* Additional Info */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <span>Joined {formatDate(profile.created_at)}</span>
                </div>
                {stats.last_active && (
                  <div className="flex items-center gap-2">
                    <Activity className="h-4 w-4 text-gray-400" />
                    <span>Last active {formatDate(stats.last_active)}</span>
                  </div>
                )}
                {profile.country && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-gray-400" />
                    <span>{profile.country}</span>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Engagement & Behavior Analysis */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Engagement Metrics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Engagement Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              {engagementMetrics ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Engagement Level</span>
                    <Badge className={getEngagementColor(engagementMetrics.engagement_level)}>
                      {engagementMetrics.engagement_level}
                    </Badge>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span>Topics per day</span>
                      <span className="font-medium">{engagementMetrics.metrics.topics_per_day.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Messages per day</span>
                      <span className="font-medium">{engagementMetrics.metrics.messages_per_day.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Ratings per day</span>
                      <span className="font-medium">{engagementMetrics.metrics.ratings_per_day.toFixed(2)}</span>
                    </div>
                  </div>

                  <div className="pt-4 border-t">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-primary">{engagementMetrics.engagement_score.toFixed(1)}</p>
                      <p className="text-sm text-gray-600">Engagement Score</p>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-gray-500">Loading engagement data...</p>
              )}
            </CardContent>
          </Card>

          {/* Behavior Patterns */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Behavior Patterns
              </CardTitle>
            </CardHeader>
            <CardContent>
              {behaviorPattern ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Peak Activity</span>
                      <p className="text-gray-600">{behaviorPattern.activity_patterns.peak_day}</p>
                      <p className="text-gray-600">{behaviorPattern.activity_patterns.peak_hour}:00</p>
                    </div>
                    <div>
                      <span className="font-medium">Consistency</span>
                      <p className="text-gray-600">{behaviorPattern.behavior_insights.engagement_consistency}</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Prefers creating topics</span>
                      <Badge variant={behaviorPattern.behavior_insights.prefers_creating_topics ? "default" : "secondary"}>
                        {behaviorPattern.behavior_insights.prefers_creating_topics ? "Yes" : "No"}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span>Active rater</span>
                      <Badge variant={behaviorPattern.behavior_insights.active_rater ? "default" : "secondary"}>
                        {behaviorPattern.behavior_insights.active_rater ? "Yes" : "No"}
                      </Badge>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-gray-500">Loading behavior data...</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Activity Details */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Topics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Recent Topics ({activity.topics_created})
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {userFootprint.recent_activity.topics.length > 0 ? (
                <div className="space-y-3">
                  {userFootprint.recent_activity.topics.map((topic: any) => (
                    <div key={topic.id} className="p-3 bg-gray-50 rounded-lg">
                      <h4 className="font-medium text-sm mb-1">{topic.title}</h4>
                      <p className="text-xs text-gray-600 mb-2 line-clamp-2">{topic.description}</p>
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>{formatDate(topic.created_at)}</span>
                        <span>{topic.participants?.length || 0} participants</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">No topics created yet</p>
              )}
            </CardContent>
          </Card>

          {/* Recent Ratings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Star className="h-5 w-5" />
                  Recent Ratings ({activity.ratings_received})
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {userFootprint.recent_activity.ratings.length > 0 ? (
                <div className="space-y-3">
                  {userFootprint.recent_activity.ratings.map((rating: any) => (
                    <div key={rating.id} className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">
                          {rating.rater?.display_name || rating.rater?.first_name || 'Anonymous'}
                        </span>
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 text-yellow-500 fill-current" />
                          <span className="text-sm font-medium">
                            {((rating.politeness + rating.relevance + rating.problem_solved + rating.communication + rating.professionalism) / 5).toFixed(1)}
                          </span>
                        </div>
                      </div>
                      <p className="text-xs text-gray-600">{rating.topic?.title}</p>
                      <p className="text-xs text-gray-500">{formatDate(rating.created_at)}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">No ratings received yet</p>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}