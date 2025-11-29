'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Activity, Users, MessageSquare, Clock, Calendar, 
  Play, Square, AlertTriangle, Eye, Shield, Search,
  TrendingUp, TrendingDown, Minus, Filter, Download,
  BarChart3, PieChart, Archive, RefreshCw
} from 'lucide-react';
import { AdminService } from '@/lib/services/admin-service';
import { useToast } from '@/hooks/use-toast';
import type { TopicWithDetails } from '@/lib/database-types';
import { LoadingSpinner } from '@/components/common/loading-spinner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';

export default function SessionsPage() {
  const [sessions, setSessions] = useState<TopicWithDetails[]>([]);
  const [activeSessions, setActiveSessions] = useState<TopicWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [allSessions, activeSessionsData] = await Promise.all([
        AdminService.getAllTopicsIncludingArchived(100),
        AdminService.getActiveTopics()
      ]);
      
      setSessions(allSessions);
      setActiveSessions(activeSessionsData);
    } catch (error) {
      console.error('Error loading sessions:', error);
      toast({
        title: 'Error',
        description: 'Failed to load session data.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  // Calculate analytics
  const analytics = {
    total: sessions.length,
    active: activeSessions.length,
    completed: sessions.filter(s => {
      const now = new Date();
      const endTime = new Date(s.end_time);
      return endTime < now && !s.no_show;
    }).length,
    noShow: sessions.filter(s => s.no_show).length,
    totalParticipants: sessions.reduce((sum, s) => sum + (s.participant_count || 0), 0),
    totalMessages: sessions.reduce((sum, s) => sum + (s.message_count || 0), 0),
    avgDuration: sessions.filter(s => s.actual_duration).length > 0
      ? Math.round(sessions.reduce((sum, s) => sum + (s.actual_duration || 0), 0) / sessions.filter(s => s.actual_duration).length)
      : 0,
    avgParticipants: sessions.length > 0
      ? (sessions.reduce((sum, s) => sum + (s.participant_count || 0), 0) / sessions.length).toFixed(1)
      : 0,
  };

  // Filter sessions
  const filteredSessions = sessions.filter(session => {
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesSearch = 
        session.title?.toLowerCase().includes(query) ||
        session.description?.toLowerCase().includes(query) ||
        session.author?.display_name?.toLowerCase().includes(query) ||
        session.author?.email?.toLowerCase().includes(query);
      if (!matchesSearch) return false;
    }

    // Status filter
    if (statusFilter !== 'all') {
      const now = new Date();
      const startTime = new Date(session.start_time);
      const endTime = new Date(session.end_time);
      const hasParticipants = (session.participant_count || 0) > 0;
      const archiveReason = (session as any).archive_reason;
      
      if (statusFilter === 'active' && !(now >= startTime && now <= endTime)) return false;
      if (statusFilter === 'upcoming' && (now >= startTime || !hasParticipants)) return false;
      if (statusFilter === 'pending' && (now >= startTime || hasParticipants)) return false;
      if (statusFilter === 'completed' && (now < endTime || session.no_show || archiveReason === 'no_participants')) return false;
      if (statusFilter === 'no-show' && !session.no_show) return false;
      if (statusFilter === 'no-participants' && archiveReason !== 'no_participants') return false;
    }

    return true;
  });

  const getSessionStatus = (session: TopicWithDetails) => {
    if (session.no_show) {
      return { status: 'no-show', color: 'bg-red-100 text-red-800', label: 'No Show', icon: AlertTriangle };
    }
    
    const now = new Date();
    const startTime = new Date(session.start_time);
    const endTime = new Date(session.end_time);
    const hasParticipants = (session.participant_count || 0) > 0;

    // Before start time
    if (now < startTime) {
      if (!hasParticipants) {
        // No participants approved yet - waiting for approval
        return { status: 'pending', color: 'bg-amber-100 text-amber-800', label: 'Pending', icon: Clock };
      }
      // Has approved participants - ready to start
      return { status: 'upcoming', color: 'bg-blue-100 text-blue-800', label: 'Upcoming', icon: Calendar };
    }
    
    // During session time
    if (now >= startTime && now <= endTime) {
      return { status: 'active', color: 'bg-green-100 text-green-800', label: 'Active', icon: Play };
    }
    
    // After end time
    return { status: 'completed', color: 'bg-gray-100 text-gray-800', label: 'Completed', icon: Square };
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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

  const exportData = () => {
    const csv = [
      ['Title', 'Status', 'Host', 'Start Time', 'Duration', 'Participants', 'Messages'].join(','),
      ...filteredSessions.map(s => [
        `"${s.title}"`,
        getSessionStatus(s).label,
        s.author?.display_name || s.author?.email || 'Unknown',
        new Date(s.start_time).toISOString(),
        getDuration(s.start_time, s.end_time),
        s.participant_count || 0,
        s.message_count || 0
      ].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sessions-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  if (loading) {
    return <LoadingSpinner size="lg" text="Loading sessions..." />;
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 max-w-7xl">
      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Session Analytics</h1>
            <p className="mt-1 text-sm text-gray-600">
              Monitor session performance and engagement metrics
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Button variant="outline" size="sm" onClick={loadData} className="gap-2">
              <RefreshCw className="h-4 w-4" />
              <span className="hidden sm:inline">Refresh</span>
            </Button>
            <Button variant="outline" size="sm" onClick={exportData} className="gap-2">
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">Export</span>
            </Button>
          </div>
        </div>
      </div>

      <div className="space-y-6">

      {/* Key Metrics - Google Analytics Style */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-600">Total Sessions</p>
              <Activity className="h-5 w-5 text-blue-500" />
            </div>
            <p className="text-3xl font-bold text-gray-900">{analytics.total}</p>
            <div className="flex items-center gap-1 mt-2 text-sm">
              <span className="text-green-600 flex items-center">
                <TrendingUp className="h-3 w-3 mr-1" />
                {analytics.active} active
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-600">Avg Participants</p>
              <Users className="h-5 w-5 text-purple-500" />
            </div>
            <p className="text-3xl font-bold text-gray-900">{analytics.avgParticipants}</p>
            <div className="flex items-center gap-1 mt-2 text-sm text-gray-600">
              {analytics.totalParticipants} total
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-600">Total Messages</p>
              <MessageSquare className="h-5 w-5 text-orange-500" />
            </div>
            <p className="text-3xl font-bold text-gray-900">{analytics.totalMessages}</p>
            <div className="flex items-center gap-1 mt-2 text-sm text-gray-600">
              {sessions.length > 0 ? Math.round(analytics.totalMessages / sessions.length) : 0} avg/session
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-600">Avg Duration</p>
              <Clock className="h-5 w-5 text-green-500" />
            </div>
            <p className="text-3xl font-bold text-gray-900">{analytics.avgDuration}m</p>
            <div className="flex items-center gap-1 mt-2 text-sm">
              <span className="text-gray-600">{analytics.completed} completed</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters & Search */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search sessions by title, host, or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sessions</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="upcoming">Upcoming</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="no-show">No Show</SelectItem>
                <SelectItem value="no-participants">No Participants</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Active Sessions Alert */}
      {activeSessions.length > 0 && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                <Play className="h-5 w-5 text-green-600" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-green-900">
                  {activeSessions.length} Active Session{activeSessions.length !== 1 ? 's' : ''}
                </p>
                <p className="text-sm text-green-700">
                  {activeSessions.reduce((sum, s) => sum + (s.session_presence?.filter(p => p.status === 'active').length || 0), 0)} users currently in sessions
                </p>
              </div>
              <Button variant="outline" size="sm" className="bg-white">
                <Eye className="h-4 w-4 mr-2" />
                Monitor
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Sessions List */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Sessions ({filteredSessions.length})
            </h3>
          </div>

          {filteredSessions.length === 0 ? (
            <div className="text-center py-12">
              <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No sessions found</h3>
              <p className="text-gray-600">
                {searchQuery || statusFilter !== 'all' 
                  ? 'Try adjusting your filters' 
                  : 'No sessions have been created yet'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredSessions.map((session) => {
                const status = getSessionStatus(session);
                const StatusIcon = status.icon;
                
                return (
                  <div 
                    key={session.id} 
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all hover:border-gray-300"
                  >
                    <div className="flex items-start gap-4">
                      {/* Status Icon */}
                      <div className={`flex-shrink-0 h-10 w-10 rounded-lg ${status.color} flex items-center justify-center`}>
                        <StatusIcon className="h-5 w-5" />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4 mb-2">
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900 mb-1">{session.title}</h4>
                            <p className="text-sm text-gray-600 line-clamp-1">{session.description}</p>
                          </div>
                          <Badge className={status.color}>{status.label}</Badge>
                        </div>

                        {/* Metadata */}
                        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <Users className="h-4 w-4" />
                            {session.author?.display_name || session.author?.email || 'Unknown'}
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {formatDate(session.start_time)}
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {getDuration(session.start_time, session.end_time)}
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

                        {/* Additional Info */}
                        {(session.ended_early || session.actual_duration || (session as any).archived_at || (session as any).archive_reason) && (
                          <div className="flex flex-wrap gap-2 mt-2">
                            {session.ended_early && (
                              <Badge variant="outline" className="text-amber-600 border-amber-300 text-xs">
                                Ended Early
                              </Badge>
                            )}
                            {session.actual_duration && (
                              <Badge variant="outline" className="text-blue-600 border-blue-300 text-xs">
                                Ran {session.actual_duration}min
                              </Badge>
                            )}
                            {(session as any).archived_at && (
                              <Badge variant="outline" className="text-purple-600 border-purple-300 text-xs">
                                Archived: {(session as any).archive_reason || 'unknown'}
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex-shrink-0 flex gap-2">
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Shield className="h-4 w-4" />
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
      </div>
    </div>
  );
}
