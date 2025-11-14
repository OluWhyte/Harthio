
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, History, Calendar, Users, MessageSquare, Clock, Filter, X } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { topicService, userService } from '@/lib/supabase-services';
import { getSessionStatus } from '@/lib/time-utils';
import type { TopicWithAuthor } from '@/lib/database-types';

export default function UserHistoryPage({ params }: { params: { userId: string } }) {
  const [allTopics, setAllTopics] = useState<TopicWithAuthor[]>([]);
  const [filteredTopics, setFilteredTopics] = useState<TopicWithAuthor[]>([]);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterRole, setFilterRole] = useState('all');
  const [filterDate, setFilterDate] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const { userId } = params;
  const { user } = useAuth();
  const router = useRouter();

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    if (!userId) {
        setLoading(false);
        return;
    }
    
    try {
      const startTime = performance.now();
      
      // Fetch all data in parallel for better performance
      const [profile, createdTopics, participantTopics, archivedTopics] = await Promise.all([
        userService.getUserProfile(userId),
        topicService.getTopicsByUserId(userId),
        topicService.getParticipantTopics(userId),
        topicService.getArchivedSessions(userId)
      ]);

      const fetchTime = performance.now() - startTime;
      console.log(`⚡ [HISTORY] Fetched all data in ${fetchTime.toFixed(0)}ms`);

      if (!profile) {
        setLoading(false);
        return;
      }
      setUserProfile(profile);

      console.log(`📊 [HISTORY] Created: ${createdTopics.length}, Participant: ${participantTopics.length}, Archived: ${archivedTopics.length}`);

      // Combine active and archived sessions, then deduplicate
      const allUserTopics = [...createdTopics, ...participantTopics, ...archivedTopics];
      const uniqueTopics = Array.from(
        new Map(allUserTopics.map(topic => [topic.id, topic])).values()
      );

      // Sort by start time (most recent first)
      const sortedTopics = uniqueTopics.sort((a, b) => 
        new Date(b.start_time).getTime() - new Date(a.start_time).getTime()
      );

      setAllTopics(sortedTopics);
      setFilteredTopics(sortedTopics);
      
      const totalTime = performance.now() - startTime;
      console.log(`✅ [HISTORY] Complete in ${totalTime.toFixed(0)}ms - ${sortedTopics.length} sessions`);

    } catch (error) {
      console.error("Error fetching user history:", error);
    } finally {
      setLoading(false);
    }
  }, [userId]);


  useEffect(() => {
    // Check if user is viewing their own history
    if (user && user.uid !== userId) {
      // Redirect to their own history
      router.push(`/history/${user.uid}`);
      return;
    }
    
    if (!user) {
      router.push('/login');
      return;
    }

    fetchHistory();
  }, [fetchHistory, user, userId, router]);

  useEffect(() => {
    let tempTopics = [...allTopics];

    // Filter by status
    if (filterStatus !== 'all') {
      tempTopics = tempTopics.filter(topic => {
        const status = getSessionStatus(topic.start_time, topic.end_time);
        return status === filterStatus;
      });
    }

    // Filter by role
    if (filterRole !== 'all') {
      tempTopics = tempTopics.filter(topic => {
        if (filterRole === 'host') return topic.author_id === userId;
        if (filterRole === 'participant') return topic.author_id !== userId;
        return true;
      });
    }

    // Filter by date
    if (filterDate) {
      tempTopics = tempTopics.filter(topic => {
        const topicDate = new Date(topic.start_time).toISOString().split('T')[0];
        return topicDate === filterDate;
      });
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      tempTopics = tempTopics.filter(topic => 
        topic.title.toLowerCase().includes(query) ||
        topic.description.toLowerCase().includes(query)
      );
    }

    setFilteredTopics(tempTopics);

  }, [filterStatus, filterRole, filterDate, searchQuery, allTopics, userId]);

  const clearFilters = () => {
    setFilterStatus('all');
    setFilterRole('all');
    setFilterDate('');
    setSearchQuery('');
  };

  const hasActiveFilters = filterStatus !== 'all' || filterRole !== 'all' || filterDate || searchQuery;


  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800">Active</Badge>;
      case 'upcoming':
        return <Badge className="bg-blue-100 text-blue-800">Upcoming</Badge>;
      case 'ended':
        return <Badge className="bg-gray-100 text-gray-800">Ended</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2">Loading your history...</p>
      </div>
    );
  }

  if (!userProfile) {
    return (
        <div className="flex-1 p-4 sm:p-6 lg:p-8">
            <Card>
                <CardHeader>
                    <CardTitle>Oops! Something went wrong</CardTitle>
                    <CardDescription>
                        We couldn't load your profile. This usually fixes itself with a quick refresh.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-gray-600">
                        Don't worry, your data is safe. Let's try loading it again.
                    </p>
                    <div className="flex gap-3">
                        <Button onClick={() => window.location.reload()}>
                            Refresh Page
                        </Button>
                        <Button 
                            variant="outline" 
                            onClick={() => router.push('/dashboard')}
                        >
                            Go to Dashboard
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
  }

  return (
    <div className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header with Stats */}
      <div className="mb-6">
        <div className="mb-4">
          <h1 className="text-3xl font-bold">History</h1>
          <p className="text-gray-600">
            Your complete record of conversations
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Sessions</p>
                  <p className="text-2xl font-bold">{allTopics.length}</p>
                </div>
                <History className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">As Host</p>
                  <p className="text-2xl font-bold">
                    {allTopics.filter(t => t.author_id === userId).length}
                  </p>
                </div>
                <Users className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">As Participant</p>
                  <p className="text-2xl font-bold">
                    {allTopics.filter(t => t.author_id !== userId).length}
                  </p>
                </div>
                <MessageSquare className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Completed</p>
                  <p className="text-2xl font-bold">
                    {allTopics.filter(t => getSessionStatus(t.start_time, t.end_time) === 'ended').length}
                  </p>
                </div>
                <Clock className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters
            </CardTitle>
            {hasActiveFilters && (
              <Button variant="outline" size="sm" onClick={clearFilters}>
                <X className="h-4 w-4 mr-1" />
                Clear Filters
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Search</label>
              <Input
                placeholder="Search sessions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Status</label>
              <Select onValueChange={setFilterStatus} value={filterStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="upcoming">Upcoming</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="ended">Ended</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Role</label>
              <Select onValueChange={setFilterRole} value={filterRole}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="host">As Host</SelectItem>
                  <SelectItem value="participant">As Participant</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Date</label>
              <Input
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
              />
            </div>
          </div>

          {hasActiveFilters && (
            <div className="mt-4 flex items-center gap-2 text-sm text-gray-600">
              <span>Showing {filteredTopics.length} of {allTopics.length} sessions</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sessions List */}
      <Card>
        <CardHeader>
          <CardTitle>Sessions ({filteredTopics.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredTopics.length > 0 ? (
            <div className="space-y-4">
              {filteredTopics.map(topic => {
                const status = getSessionStatus(topic.start_time, topic.end_time);
                const isHost = topic.author_id === userId;
                
                return (
                  <div key={topic.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          {getStatusBadge(status)}
                          <Badge variant="outline">
                            {isHost ? 'Host' : 'Participant'}
                          </Badge>
                          <span className="text-sm text-gray-500">
                            {getDuration(topic.start_time, topic.end_time)}
                          </span>
                        </div>
                        
                        <h3 className="text-lg font-semibold mb-2">{topic.title}</h3>
                        <p className="text-gray-600 text-sm mb-3 line-clamp-2">{topic.description}</p>
                        
                        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {formatDate(topic.start_time)}
                          </div>
                          <div className="flex items-center gap-1">
                            <Users className="h-4 w-4" />
                            {topic.author.display_name || topic.author.first_name}
                          </div>
                        </div>
                      </div>
                      
                      {status === 'active' && (
                        <Button size="sm" onClick={() => router.push(`/session/${topic.id}`)}>
                          Join Session
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 text-center border-2 border-dashed rounded-lg">
              <History className="w-12 h-12 text-muted-foreground" />
              <p className="mt-4 text-lg font-semibold">
                {hasActiveFilters ? 'No Matching Sessions' : 'No Sessions Yet'}
              </p>
              <p className="text-sm text-muted-foreground">
                {hasActiveFilters 
                  ? 'Try adjusting your filters to see more results'
                  : 'Your session history will appear here once you create or join sessions'
                }
              </p>
              {hasActiveFilters && (
                <Button variant="outline" className="mt-4" onClick={clearFilters}>
                  Clear Filters
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
