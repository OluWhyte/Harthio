
'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Topic, TopicCard } from '@/components/harthio/topic-card';
import { Loader2, History } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from '@/components/ui/input';

const getInitials = (name: string = '') => {
  if (!name) return 'U';
  const names = name.split(' ');
  const initials = names.map((n) => n[0] || '').join('');
  return initials.toUpperCase();
}

const placeholderProfile = {
    displayName: "Jane Doe",
    avatarUrl: 'https://placehold.co/64x64.png',
};

const placeholderTopics: Topic[] = []; // No past sessions in placeholder


export default function UserHistoryPage({ params }: { params: { userId: string } }) {
  const [allTopics, setAllTopics] = useState<Topic[]>([]);
  const [filteredTopics, setFilteredTopics] = useState<Topic[]>([]);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterDate, setFilterDate] = useState('');
  const { userId } = params;

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    if (!userId) {
        setLoading(false);
        return;
    }
    
    try {
      // Simulate fetching data
      await new Promise(resolve => setTimeout(resolve, 500));
      setUserProfile(placeholderProfile);
      setAllTopics(placeholderTopics);
      setFilteredTopics(placeholderTopics);

    } catch (error) {
      console.error("Error fetching user history:", error);
    } finally {
      setLoading(false);
    }
  }, [userId]);


  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  useEffect(() => {
    let tempTopics = [...allTopics];

    if (filterStatus !== 'all') {
        tempTopics = tempTopics.filter(topic => {
            // A session has "joiners" if there is more than one participant (the host)
            if (filterStatus === 'joined') return topic.participants && topic.participants.length > 1;
            if (filterStatus === 'noJoiners') return !topic.participants || topic.participants.length <= 1;
            return true;
        });
    }

    if (filterDate) {
        tempTopics = tempTopics.filter(topic => {
            const topicDate = topic.startTime.toISOString().split('T')[0];
            return topicDate === filterDate;
        });
    }

    setFilteredTopics(tempTopics);

  }, [filterStatus, filterDate, allTopics]);


  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!userProfile) {
    return (
        <div className="flex-1 p-4 sm:p-6 lg:p-8">
            <Card>
                <CardHeader>
                    <CardTitle>User Not Found</CardTitle>
                </CardHeader>
                <CardContent>
                    <p>The profile for this user could not be found.</p>
                </CardContent>
            </Card>
        </div>
    );
  }


  return (
    <div className="flex-1 p-4 sm:p-6 lg:p-8">
      <Card>
        <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Avatar className="h-16 w-16">
                        <AvatarImage src={userProfile.avatarUrl} alt={userProfile.displayName} />
                        <AvatarFallback>{getInitials(userProfile.displayName)}</AvatarFallback>
                    </Avatar>
                    <div>
                        <CardTitle className="text-2xl">{userProfile.displayName}'s History</CardTitle>
                        <CardDescription>
                            A record of all past sessions this user participated in.
                        </CardDescription>
                    </div>
                </div>
                 <div className="flex flex-col sm:flex-row gap-2">
                    <Select onValueChange={setFilterStatus} value={filterStatus}>
                        <SelectTrigger className="w-full sm:w-[180px]">
                            <SelectValue placeholder="Filter by Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Sessions</SelectItem>
                            <SelectItem value="joined">With Joiners</SelectItem>
                            <SelectItem value="noJoiners">Without Joiners</SelectItem>
                        </SelectContent>
                    </Select>
                    <Input
                        type="date"
                        value={filterDate}
                        onChange={(e) => setFilterDate(e.target.value)}
                        className="w-full sm:w-auto"
                    />
                </div>
            </div>
        </CardHeader>
        <CardContent>
          {filteredTopics.length > 0 ? (
            <div className="space-y-4">
                {filteredTopics.map(topic => (
                    <TopicCard key={topic.id} topic={topic} onUpdateRequest={fetchHistory} />
                ))}
            </div>
          ) : (
             <div className="flex flex-col items-center justify-center h-64 text-center border-2 border-dashed rounded-lg">
                <History className="w-12 h-12 text-muted-foreground" />
                <p className="mt-4 text-lg font-semibold">No Matching Sessions</p>
                <p className="text-sm text-muted-foreground">
                    No past sessions match the current filters.
                </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
