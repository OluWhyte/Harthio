'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ResponsiveAdminHeader } from '@/components/admin/responsive-admin-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Settings, 
  Eye, 
  Shield, 
  AlertTriangle,
  Users,
  Clock,
  MessageSquare,
  Calendar,
  Play,
  Pause,
  Square,
  MoreHorizontal
} from 'lucide-react';
import { AdminService } from '@/lib/services/admin-service';
import { FilterComponent } from '@/components/admin/filters';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import type { TopicWithDetails, SessionStatus } from '@/lib/database-types';

export default function SessionManagementPage() {
  const [sessions, setSessions] = useState<TopicWithDetails[]>([]);
  const [activeSessions, setActiveSessions] = useState<TopicWithDetails[]>([]);
  const [filters, setFilters] = useState<any>({});
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
      checkAdminAndLoadSessions();
    }
  }, [user, mounted]);

  const checkAdminAndLoadSessions = async () => {
    if (!user) {
      router.push('/admin/login?redirect=' + encodeURIComponent('/admin/sessions'));
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
      await loadSessions();
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

  const loadSessions = async () => {
    try {
      const [allSessions, activeSessionsData] = await Promise.all([
        Object.keys(filters).length > 0 
          ? AdminService.getFilteredTopics(filters, 50)
          : AdminService.getAllTopics(50),
        AdminService.getActiveTopics()
      ]);
      
      setSessions(allSessions);
      setActiveSessions(activeSessionsData);
    } catch (error) {
      console.error('Error loading sessions:', error);
      toast({
        title: 'Error',
        description: 'Failed to load sessions.',
        variant: 'destructive'
      });
    }
  };

  const handleFiltersChange = async (newFilters: any) => {
    setFilters(newFilters);
    // Auto-apply filters
    try {
      const [allSessions, activeSessionsData] = await Promise.all([
        Object.keys(newFilters).length > 0 
          ? AdminService.getFilteredTopics(newFilters, 50)
          : AdminService.getAllTopics(50),
        AdminService.getActiveTopics()
      ]);
      
      setSessions(allSessions);
      setActiveSessions(activeSessionsData);
    } catch (error) {
      console.error('Error applying filters:', error);
      toast({
        title: 'Error',
        description: 'Failed to apply filters.',
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

  const getSessionStatus = (session: TopicWithDetails) => {
    if (session.session_status) {
      return AdminService.getSessionStatusInfo(session.session_status);
    }
    
    // Fallback to basic status calculation
    const now = new Date();
    const startTime = new Date(session.start_time);
    const endTime = new Date(session.end_time);

    if (now < startTime) return { status: 'upcoming', color: 'bg-blue-100 text-blue-800', description: 'Upcoming', priority: 4 };
    if (now >= startTime && now <= endTime) return { status: 'active', color: 'bg-green-100 text-green-800', description: 'Active', priority: 6 };
    return { status: 'ended', color: 'bg-gray-100 text-gray-800', description: 'Ended', priority: 7 };
  };

  const getSessionDetails = (session: TopicWithDetails) => {
    const details = [];
    
    // Join requests info
    if (session.join_requests && session.join_requests.length > 0) {
      const pending = session.join_requests.filter(r => r.status === 'pending').length;
      const approved = session.join_requests.filter(r => r.status === 'approved').length;
      const rejected = session.join_requests.filter(r => r.status === 'rejected').length;
      
      if (pending > 0) details.push(`${pending} pending requests`);
      if (approved > 0) details.push(`${approved} approved`);
      if (rejected > 0) details.push(`${rejected} rejected`);
    }
    
    // Presence info
    if (session.session_presence && session.session_presence.length > 0) {
      const active = session.session_presence.filter(p => p.status === 'active').length;
      const left = session.session_presence.filter(p => p.status === 'left').length;
      
      if (active > 0) details.push(`${active} currently active`);
      if (left > 0) details.push(`${left} left session`);
    }
    
    // Duration info
    if (session.actual_duration && session.actual_duration > 0) {
      const scheduled = AdminService.getScheduledDuration(session);
      details.push(`Ran for ${session.actual_duration}/${scheduled} minutes`);
    }
    
    return details;
  };

  const getDuration = (startTime: string, endTime: string) => {
    const start = new Date(startTime);
    const end = new Date(endTime);
    const diffMs = end.getTime() - start.getTime();
    const diffMins = Math.round(diffMs / (1000 * 60));
    
    if (diffMins < 60) return `${diffMins}m`;
    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
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
      <ResponsiveAdminHeader
        title="Session Management"
        actions={[
          {
            label: 'Refresh',
            onClick: loadSessions,
            variant: 'outline'
          }
        ]}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Sessions</p>
                  <p className="text-3xl font-bold text-blue-600">{sessions.length}</p>
                </div>
                <Settings className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Now</p>
                  <p className="text-3xl font-bold text-green-600">{activeSessions.length}</p>
                </div>
                <Play className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Participants</p>
                  <p className="text-3xl font-bold text-purple-600">
                    {sessions.reduce((sum, s) => sum + (s.participant_count || 0), 0)}
                  </p>
                </div>
                <Users className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Messages</p>
                  <p className="text-3xl font-bold text-orange-600">
                    {sessions.reduce((sum, s) => sum + (s.message_count || 0), 0)}
                  </p>
                </div>
                <MessageSquare className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Active Sessions */}
        {activeSessions.length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Play className="h-5 w-5 text-green-600" />
                Active Sessions ({activeSessions.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {activeSessions.map((session) => {
                  const sessionStatus = getSessionStatus(session);
                  return (
                    <div key={session.id} className="border border-green-200 bg-green-50 rounded-lg p-4">
                      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge className={sessionStatus.color}>
                              {sessionStatus.description || sessionStatus.status}
                            </Badge>
                            <span className="text-sm text-gray-500">
                              {getDuration(session.start_time, session.end_time)}
                            </span>
                            {session.session_presence && session.session_presence.filter(p => p.status === 'active').length > 0 && (
                              <Badge variant="outline" className="text-green-600 border-green-300">
                                {session.session_presence.filter(p => p.status === 'active').length} Active
                              </Badge>
                            )}
                          </div>
                          
                          <h3 className="text-lg font-semibold text-gray-900 mb-2">{session.title}</h3>
                          <p className="text-gray-600 text-sm mb-3 line-clamp-2">{session.description}</p>
                          
                          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                            <div className="flex items-center gap-1">
                              <Users className="h-4 w-4" />
                              {session.author.display_name || session.author.first_name || 'Host'}
                            </div>
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              {formatDate(session.start_time)}
                            </div>
                            <div className="flex items-center gap-1">
                              <Users className="h-4 w-4" />
                              {session.participant_count || 0} participants
                            </div>
                            <div className="flex items-center gap-1">
                              <MessageSquare className="h-4 w-4" />
                              {session.message_count || 0} messages
                            </div>
                          </div>

                          {/* Active Session Details */}
                          {getSessionDetails(session).length > 0 && (
                            <div className="mt-3 pt-3 border-t border-green-200">
                              <div className="flex flex-wrap gap-2">
                                {getSessionDetails(session).map((detail, index) => (
                                  <span key={index} className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                                    {detail}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4 mr-1" />
                            Monitor
                          </Button>
                          <Button variant="outline" size="sm">
                            <Shield className="h-4 w-4 mr-1" />
                            Moderate
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* All Sessions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>All Sessions ({sessions.length})</span>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm">
                  <AlertTriangle className="h-4 w-4 mr-1" />
                  Reports
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {sessions.length === 0 ? (
              <div className="text-center py-12">
                <Settings className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No sessions found</h3>
                <p className="text-gray-600">No sessions have been created yet.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {sessions.map((session) => {
                  const sessionStatus = getSessionStatus(session);
                  return (
                    <div key={session.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge className={sessionStatus.color}>
                              {sessionStatus.description || sessionStatus.status}
                            </Badge>
                            <span className="text-sm text-gray-500">
                              {getDuration(session.start_time, session.end_time)}
                            </span>
                            {session.ended_early && (
                              <Badge variant="outline" className="text-amber-600 border-amber-300">
                                Ended Early
                              </Badge>
                            )}
                            {session.no_show && (
                              <Badge variant="outline" className="text-red-600 border-red-300">
                                No Show
                              </Badge>
                            )}
                          </div>
                          
                          <h3 className="text-lg font-semibold text-gray-900 mb-2">{session.title}</h3>
                          <p className="text-gray-600 text-sm mb-3 line-clamp-2">{session.description}</p>
                          
                          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                            <div className="flex items-center gap-1">
                              <Users className="h-4 w-4" />
                              {session.author.display_name || session.author.first_name || 'Host'}
                            </div>
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              {formatDate(session.start_time)}
                            </div>
                            <div className="flex items-center gap-1">
                              <Users className="h-4 w-4" />
                              {session.participant_count || 0} participants
                            </div>
                            <div className="flex items-center gap-1">
                              <MessageSquare className="h-4 w-4" />
                              {session.message_count || 0} messages
                            </div>
                          </div>

                          {/* Enhanced Session Details */}
                          {getSessionDetails(session).length > 0 && (
                            <div className="mt-3 pt-3 border-t border-gray-100">
                              <div className="flex flex-wrap gap-2">
                                {getSessionDetails(session).map((detail, index) => (
                                  <span key={index} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                                    {detail}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Join Requests Details */}
                          {session.join_requests && session.join_requests.length > 0 && (
                            <div className="mt-3 pt-3 border-t border-gray-100">
                              <h4 className="text-sm font-medium text-gray-700 mb-2">Join Requests:</h4>
                              <div className="space-y-1">
                                {session.join_requests.slice(0, 3).map((request) => (
                                  <div key={request.id} className="flex items-center justify-between text-xs">
                                    <span className="text-gray-600">{request.requester_name}</span>
                                    <Badge 
                                      variant="outline" 
                                      className={
                                        request.status === 'approved' ? 'text-green-600 border-green-300' :
                                        request.status === 'rejected' ? 'text-red-600 border-red-300' :
                                        'text-yellow-600 border-yellow-300'
                                      }
                                    >
                                      {request.status}
                                    </Badge>
                                  </div>
                                ))}
                                {session.join_requests.length > 3 && (
                                  <div className="text-xs text-gray-500">
                                    +{session.join_requests.length - 3} more requests
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Shield className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}