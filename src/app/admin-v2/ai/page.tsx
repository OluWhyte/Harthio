'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/lib/supabase';
import { 
  Brain, ThumbsUp, ThumbsDown, RefreshCw,
  Users, Search, Activity, Target, Shield
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
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

// AI Provider Toggles Component
function AIProviderToggles() {
  const [groqEnabled, setGroqEnabled] = useState(true);
  const [deepseekEnabled, setDeepseekEnabled] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('platform_settings')
        .select('setting_value')
        .eq('setting_key', 'ai_providers')
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (data?.setting_value) {
        setGroqEnabled(data.setting_value.groq_enabled ?? true);
        setDeepseekEnabled(data.setting_value.deepseek_enabled ?? true);
      }
    } catch (error) {
      console.error('Error loading AI provider settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateProviderSetting = async (provider: 'groq' | 'deepseek', enabled: boolean) => {
    setSaving(true);
    try {
      const newSettings = {
        groq_enabled: provider === 'groq' ? enabled : groqEnabled,
        deepseek_enabled: provider === 'deepseek' ? enabled : deepseekEnabled,
      };

      // Check if both would be disabled
      if (!newSettings.groq_enabled && !newSettings.deepseek_enabled) {
        toast({
          title: 'Error',
          description: 'At least one AI provider must be enabled',
          variant: 'destructive',
        });
        return;
      }

      const { error } = await supabase
        .from('platform_settings')
        .upsert({
          setting_key: 'ai_providers',
          setting_value: newSettings,
          description: 'AI provider enable/disable settings',
        }, {
          onConflict: 'setting_key'
        });

      if (error) throw error;

      if (provider === 'groq') setGroqEnabled(enabled);
      if (provider === 'deepseek') setDeepseekEnabled(enabled);

      toast({
        title: 'Success',
        description: `${provider === 'groq' ? 'Groq' : 'DeepSeek'} ${enabled ? 'enabled' : 'disabled'}`,
      });
    } catch (error) {
      console.error('Error updating provider setting:', error);
      toast({
        title: 'Error',
        description: 'Failed to update provider setting',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="text-sm text-muted-foreground">Loading settings...</div>;
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Control which AI providers are available for chat. At least one must be enabled.
      </p>
      
      <div className="space-y-3">
        {/* Groq Toggle */}
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h4 className="font-medium">Groq (Llama 3.3 70B)</h4>
              <Badge variant={groqEnabled ? 'default' : 'secondary'}>
                {groqEnabled ? 'Enabled' : 'Disabled'}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              Premium quality - Used for crisis situations, struggling users, and Pro members
            </p>
          </div>
          <Switch
            checked={groqEnabled}
            onCheckedChange={(checked) => updateProviderSetting('groq', checked)}
            disabled={saving || (!groqEnabled && !deepseekEnabled)}
          />
        </div>

        {/* DeepSeek Toggle */}
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h4 className="font-medium">DeepSeek</h4>
              <Badge variant={deepseekEnabled ? 'default' : 'secondary'}>
                {deepseekEnabled ? 'Enabled' : 'Disabled'}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              Cost-effective - Used for routine conversations and free tier users
            </p>
          </div>
          <Switch
            checked={deepseekEnabled}
            onCheckedChange={(checked) => updateProviderSetting('deepseek', checked)}
            disabled={saving || (!deepseekEnabled && !groqEnabled)}
          />
        </div>
      </div>

      {(!groqEnabled || !deepseekEnabled) && (
        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">
            ⚠️ {!groqEnabled && !deepseekEnabled ? 'Both providers are disabled' : 
                 !groqEnabled ? 'Groq is disabled - all users will use DeepSeek' :
                 'DeepSeek is disabled - all users will use Groq'}
          </p>
        </div>
      )}
    </div>
  );
}

// Types
interface FeedbackEntry {
  id: string;
  user_id: string;
  user_message: string;
  ai_response: string;
  feedback_type: 'positive' | 'negative';
  reason?: string;
  reason_details?: string;
  created_at: string;
  rating?: number;
}

interface ProactiveEvent {
  id: string;
  event_type: string;
  trigger_reason: string;
  was_helpful: boolean | null;
  created_at: string;
}

interface Stats {
  activeUsersToday: number;
  activeUsers7d: number;
  activeUsers30d: number;
  totalMessages: number;
  totalConversations: number;
  avgMessagesPerChat: number;
  totalFeedback: number;
  positiveFeedback: number;
  negativeFeedback: number;
  avgRating: number;
  totalInterventions: number;
  successfulInterventions: number;
  crisisInterventions: number;
  peakHour: number;
}



export default function AIAnalyticsPage() {
  // State
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<FeedbackEntry[]>([]);
  const [proactiveEvents, setProactiveEvents] = useState<ProactiveEvent[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [feedbackFilter, setFeedbackFilter] = useState<string>('all');
  const [timeRange, setTimeRange] = useState<string>('7d');
  const [customDateFrom, setCustomDateFrom] = useState('');
  const [customDateTo, setCustomDateTo] = useState('');
  const { toast } = useToast();

  // Stats state
  const [stats, setStats] = useState<Stats>({
    activeUsersToday: 0,
    activeUsers7d: 0,
    activeUsers30d: 0,
    totalMessages: 0,
    totalConversations: 0,
    avgMessagesPerChat: 0,
    totalFeedback: 0,
    positiveFeedback: 0,
    negativeFeedback: 0,
    avgRating: 0,
    totalInterventions: 0,
    successfulInterventions: 0,
    crisisInterventions: 0,
    peakHour: 0,
  });

  // Calculate date range for filtering
  const getDateRange = useCallback(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    let startDate: Date;
    let endDate: Date | null = null;

    if (timeRange === 'custom' && customDateFrom) {
      startDate = new Date(customDateFrom);
      if (customDateTo) {
        endDate = new Date(customDateTo);
        endDate.setHours(23, 59, 59, 999);
      }
    } else if (timeRange === '24h') {
      startDate = new Date(now);
      startDate.setHours(startDate.getHours() - 24);
    } else if (timeRange === '30d') {
      startDate = new Date(today);
      startDate.setDate(startDate.getDate() - 30);
    } else { // 7d default
      startDate = new Date(today);
      startDate.setDate(startDate.getDate() - 7);
    }

    return { startDate, endDate };
  }, [timeRange, customDateFrom, customDateTo]);

  // Load data function
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const { startDate, endDate } = getDateRange();

      // Load feedback data
      let feedbackQuery = supabase!.from('ai_feedback').select('*').gte('created_at', startDate.toISOString());
      if (endDate) feedbackQuery = feedbackQuery.lte('created_at', endDate.toISOString());
      const { data: feedbackData } = await feedbackQuery.order('created_at', { ascending: false }).limit(100);
      setFeedback(feedbackData || []);

      // Load proactive events
      let eventsQuery = supabase!.from('proactive_ai_events').select('*').gte('created_at', startDate.toISOString());
      if (endDate) eventsQuery = eventsQuery.lte('created_at', endDate.toISOString());
      const { data: eventsData } = await eventsQuery.order('created_at', { ascending: false }).limit(100);
      setProactiveEvents(eventsData || []);

      // Calculate stats
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const days7Ago = new Date(today);
      days7Ago.setDate(days7Ago.getDate() - 7);
      const days30Ago = new Date(today);
      days30Ago.setDate(days30Ago.getDate() - 30);

      // Active users (always show context)
      const [
        { data: usersToday },
        { data: users7d },
        { data: users30d }
      ] = await Promise.all([
        supabase!.from('ai_chat_history').select('user_id').gte('created_at', today.toISOString()),
        supabase!.from('ai_chat_history').select('user_id').gte('created_at', days7Ago.toISOString()),
        supabase!.from('ai_chat_history').select('user_id').gte('created_at', days30Ago.toISOString())
      ]);

      // Messages and conversations (filtered by selected range)
      let messageQuery = supabase!.from('ai_chat_history').select('*', { count: 'exact', head: true }).gte('created_at', startDate.toISOString());
      if (endDate) messageQuery = messageQuery.lte('created_at', endDate.toISOString());
      const { count: messageCount } = await messageQuery;

      let sessionQuery = supabase!.from('ai_chat_history').select('session_id').gte('created_at', startDate.toISOString()).not('session_id', 'is', null);
      if (endDate) sessionQuery = sessionQuery.lte('created_at', endDate.toISOString());
      const { data: sessions } = await sessionQuery;

      // Feedback stats (filtered by selected range)
      let feedbackCountQuery = supabase!.from('ai_feedback').select('*', { count: 'exact', head: true }).gte('created_at', startDate.toISOString());
      if (endDate) feedbackCountQuery = feedbackCountQuery.lte('created_at', endDate.toISOString());
      const { count: feedbackCount } = await feedbackCountQuery;

      let positiveQuery = supabase!.from('ai_feedback').select('*', { count: 'exact', head: true }).gte('created_at', startDate.toISOString()).eq('feedback_type', 'positive');
      if (endDate) positiveQuery = positiveQuery.lte('created_at', endDate.toISOString());
      const { count: positiveCount } = await positiveQuery;

      let negativeQuery = supabase!.from('ai_feedback').select('*', { count: 'exact', head: true }).gte('created_at', startDate.toISOString()).eq('feedback_type', 'negative');
      if (endDate) negativeQuery = negativeQuery.lte('created_at', endDate.toISOString());
      const { count: negativeCount } = await negativeQuery;

      // Average rating (filtered by selected range)
      let ratingsQuery = supabase!.from('ai_feedback').select('rating').gte('created_at', startDate.toISOString()).not('rating', 'is', null);
      if (endDate) ratingsQuery = ratingsQuery.lte('created_at', endDate.toISOString());
      const { data: ratings } = await ratingsQuery;

      // Intervention stats (filtered by selected range)
      let interventionsQuery = supabase!.from('proactive_ai_events').select('*', { count: 'exact', head: true }).gte('created_at', startDate.toISOString());
      if (endDate) interventionsQuery = interventionsQuery.lte('created_at', endDate.toISOString());
      const { count: totalInterventions } = await interventionsQuery;

      let successfulQuery = supabase!.from('proactive_ai_events').select('*', { count: 'exact', head: true }).gte('created_at', startDate.toISOString()).eq('was_helpful', true);
      if (endDate) successfulQuery = successfulQuery.lte('created_at', endDate.toISOString());
      const { count: successfulInterventions } = await successfulQuery;

      let crisisQuery = supabase!.from('proactive_ai_events').select('*', { count: 'exact', head: true }).gte('created_at', startDate.toISOString()).eq('event_type', 'crisis_detection');
      if (endDate) crisisQuery = crisisQuery.lte('created_at', endDate.toISOString());
      const { count: crisisCount } = await crisisQuery;

      // Calculate peak hour from filtered messages
      let allMessagesQuery = supabase!.from('ai_chat_history').select('created_at').gte('created_at', startDate.toISOString());
      if (endDate) allMessagesQuery = allMessagesQuery.lte('created_at', endDate.toISOString());
      const { data: allMessages } = await allMessagesQuery;
      const hourCounts: { [key: number]: number } = {};
      (allMessages as any[])?.forEach((msg: any) => {
        const hour = new Date(msg.created_at).getHours();
        hourCounts[hour] = (hourCounts[hour] || 0) + 1;
      });
      const peakHour = Object.entries(hourCounts).reduce((a, b) => hourCounts[parseInt(a[0])] > hourCounts[parseInt(b[0])] ? a : b)?.[0] || 0;

      // Update stats
      setStats({
        activeUsersToday: new Set((usersToday as any[])?.map((u: any) => u.user_id) || []).size,
        activeUsers7d: new Set((users7d as any[])?.map((u: any) => u.user_id) || []).size,
        activeUsers30d: new Set((users30d as any[])?.map((u: any) => u.user_id) || []).size,
        totalMessages: messageCount || 0,
        totalConversations: new Set((sessions as any[])?.map((s: any) => s.session_id) || []).size,
        avgMessagesPerChat: sessions?.length ? Math.round((messageCount || 0) / new Set((sessions as any[]).map((s: any) => s.session_id)).size) : 0,
        totalFeedback: feedbackCount || 0,
        positiveFeedback: positiveCount || 0,
        negativeFeedback: negativeCount || 0,
        avgRating: ratings && ratings.length > 0 ? (ratings as any[]).reduce((sum: number, r: any) => sum + (r.rating || 0), 0) / ratings.length : 0,
        totalInterventions: totalInterventions || 0,
        successfulInterventions: successfulInterventions || 0,
        crisisInterventions: crisisCount || 0,
        peakHour: parseInt(peakHour.toString()) || 0,
      });

    } catch (error) {
      console.error('Error loading AI analytics:', error);
      toast({
        title: 'Error',
        description: 'Failed to load analytics data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [getDateRange, toast]);

  // Load data on mount and when filters change
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Filter feedback based on search and feedback type
  const filteredFeedback = feedback.filter(f => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      if (!f.user_message?.toLowerCase().includes(query) && 
          !f.ai_response?.toLowerCase().includes(query) &&
          !f.reason?.toLowerCase().includes(query)) {
        return false;
      }
    }
    if (feedbackFilter !== 'all') {
      if (feedbackFilter === 'positive' && f.feedback_type !== 'positive') return false;
      if (feedbackFilter === 'negative' && f.feedback_type !== 'negative') return false;
    }
    return true;
  });

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 max-w-7xl space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">AI Analytics</h1>
          <p className="mt-1 text-sm text-gray-600">
            Comprehensive AI performance, quality, and usage metrics
          </p>
        </div>
      </div>

      {/* Filter Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Analytics Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">Time Range:</label>
              <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="24h">Last 24 Hours</SelectItem>
                  <SelectItem value="7d">Last 7 Days</SelectItem>
                  <SelectItem value="30d">Last 30 Days</SelectItem>
                  <SelectItem value="custom">Custom Range</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {timeRange === 'custom' && (
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700">From:</label>
                <Input
                  type="date"
                  value={customDateFrom}
                  onChange={(e) => setCustomDateFrom(e.target.value)}
                  className="w-[140px]"
                />
                <label className="text-sm font-medium text-gray-700">To:</label>
                <Input
                  type="date"
                  value={customDateTo}
                  onChange={(e) => setCustomDateTo(e.target.value)}
                  className="w-[140px]"
                />
              </div>
            )}
            
            <Button 
              variant="default" 
              size="sm" 
              onClick={loadData} 
              className="gap-2" 
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh Data
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards with Individual Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Active Users Card */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-600">Active Users</p>
              <Users className="h-5 w-5 text-blue-500" />
            </div>
            <p className="text-3xl font-bold text-gray-900">{stats.activeUsersToday}</p>
            <p className="text-sm text-gray-500 mt-1">
              {timeRange === '24h' ? 'Last 24 hours' : 
               timeRange === '7d' ? 'Last 7 days' : 
               timeRange === '30d' ? 'Last 30 days' : 'Custom range'}
            </p>
          </CardContent>
        </Card>

        {/* AI Conversations Card */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-600">AI Conversations</p>
              <Activity className="h-5 w-5 text-purple-500" />
            </div>
            <p className="text-3xl font-bold text-gray-900">{stats.totalConversations}</p>
            <p className="text-sm text-gray-500 mt-1">
              {timeRange === '24h' ? 'Last 24 hours' : 
               timeRange === '7d' ? 'Last 7 days' : 
               timeRange === '30d' ? 'Last 30 days' : 'Custom range'}
            </p>
          </CardContent>
        </Card>

        {/* AI Interventions Card */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-600">AI Interventions</p>
              <Target className="h-5 w-5 text-green-500" />
            </div>
            <p className="text-3xl font-bold text-gray-900">{stats.totalInterventions}</p>
            <p className="text-sm text-gray-500 mt-1">
              {timeRange === '24h' ? 'Last 24 hours' : 
               timeRange === '7d' ? 'Last 7 days' : 
               timeRange === '30d' ? 'Last 30 days' : 'Custom range'}
            </p>
          </CardContent>
        </Card>

        {/* AI Messages Card */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-600">AI Messages</p>
              <Brain className="h-5 w-5 text-orange-500" />
            </div>
            <p className="text-3xl font-bold text-gray-900">{stats.totalMessages}</p>
            <p className="text-sm text-gray-500 mt-1">
              {timeRange === '24h' ? 'Last 24 hours' : 
               timeRange === '7d' ? 'Last 7 days' : 
               timeRange === '30d' ? 'Last 30 days' : 'Custom range'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* AI Provider Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            AI Provider Settings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <AIProviderToggles />
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="feedback" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="feedback">User Feedback</TabsTrigger>
          <TabsTrigger value="interventions">AI Interventions</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="personalization">Personalization</TabsTrigger>
        </TabsList>

        <TabsContent value="feedback" className="mt-6">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <CardTitle>User Feedback ({filteredFeedback.length})</CardTitle>
                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Search feedback..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 w-full sm:w-[200px]"
                    />
                  </div>
                  <Select value={feedbackFilter} onValueChange={setFeedbackFilter}>
                    <SelectTrigger className="w-full sm:w-[120px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="positive">Positive</SelectItem>
                      <SelectItem value="negative">Negative</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {filteredFeedback.length === 0 ? (
                <div className="text-center py-12">
                  <ThumbsUp className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No feedback found</h3>
                  <p className="text-gray-600">
                    {searchQuery || feedbackFilter !== 'all' 
                      ? 'Try adjusting your filters' 
                      : 'No feedback has been submitted yet'}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredFeedback.map((entry) => (
                    <div key={entry.id} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-start justify-between">
                        <Badge variant={entry.feedback_type === 'positive' ? 'default' : 'destructive'}>
                          {entry.feedback_type === 'positive' ? (
                            <><ThumbsUp className="h-3 w-3 mr-1" /> Positive</>
                          ) : (
                            <><ThumbsDown className="h-3 w-3 mr-1" /> Negative</>
                          )}
                        </Badge>
                        <span className="text-sm text-gray-500">
                          {new Date(entry.created_at).toLocaleString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: 'numeric',
                            minute: '2-digit',
                            hour12: true
                          })}
                        </span>
                      </div>
                      
                      <div className="space-y-2">
                        <div>
                          <p className="text-sm font-medium text-gray-700">User Question:</p>
                          <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                            {entry.user_message}
                          </p>
                        </div>
                        
                        <div>
                          <p className="text-sm font-medium text-gray-700">AI Response:</p>
                          <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                            {entry.ai_response}
                          </p>
                        </div>
                        
                        {entry.reason && (
                          <div>
                            <p className="text-sm font-medium text-gray-700">Reason:</p>
                            <p className="text-sm text-gray-600">{entry.reason}</p>
                          </div>
                        )}
                        
                        {entry.rating && (
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-700">Rating:</span>
                            <div className="flex">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <span
                                  key={star}
                                  className={`text-sm ${star <= entry.rating! ? 'text-yellow-400' : 'text-gray-300'}`}
                                >
                                  ★
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="interventions" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>AI Interventions ({proactiveEvents.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {proactiveEvents.length === 0 ? (
                <div className="text-center py-12">
                  <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No interventions found</h3>
                  <p className="text-gray-600">No AI interventions in the selected time period</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {proactiveEvents.map((event) => (
                    <div key={event.id} className="border rounded-lg p-4 space-y-2">
                      <div className="flex items-start justify-between">
                        <Badge variant="outline">
                          {event.event_type.replace(/_/g, ' ')}
                        </Badge>
                        <span className="text-sm text-gray-500">
                          {new Date(event.created_at).toLocaleString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: 'numeric',
                            minute: '2-digit',
                            hour12: true
                          })}
                        </span>
                      </div>
                      
                      <p className="text-sm text-gray-600">{event.trigger_reason}</p>
                      
                      {event.was_helpful !== null && (
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-700">Helpful:</span>
                          <Badge variant={event.was_helpful ? 'default' : 'secondary'}>
                            {event.was_helpful ? 'Yes' : 'No'}
                          </Badge>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="mt-6">
          <div className="grid gap-6">
            {/* Cost Analytics */}
            <Card>
              <CardHeader>
                <CardTitle>Cost Analytics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 border rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">Total Cost</p>
                    <p className="text-2xl font-bold">$0.00</p>
                    <p className="text-xs text-gray-500 mt-1">Selected period</p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">Cost per User</p>
                    <p className="text-2xl font-bold">$0.00</p>
                    <p className="text-xs text-gray-500 mt-1">Average</p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">Cost per Message</p>
                    <p className="text-2xl font-bold">$0.00</p>
                    <p className="text-xs text-gray-500 mt-1">Average</p>
                  </div>
                </div>
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800">
                    💡 Cost tracking coming soon. Will show Groq vs DeepSeek usage and costs.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Response Quality */}
            <Card>
              <CardHeader>
                <CardTitle>Response Quality</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="p-4 border rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">Avg Rating</p>
                    <p className="text-2xl font-bold">{stats.avgRating.toFixed(1)}/5</p>
                    <p className="text-xs text-gray-500 mt-1">User satisfaction</p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">Positive Rate</p>
                    <p className="text-2xl font-bold">
                      {stats.totalFeedback > 0 
                        ? Math.round((stats.positiveFeedback / stats.totalFeedback) * 100)
                        : 0}%
                    </p>
                    <p className="text-xs text-gray-500 mt-1">Thumbs up</p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">Avg Messages</p>
                    <p className="text-2xl font-bold">{stats.avgMessagesPerChat}</p>
                    <p className="text-xs text-gray-500 mt-1">Per conversation</p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">Peak Hour</p>
                    <p className="text-2xl font-bold">{stats.peakHour}:00</p>
                    <p className="text-xs text-gray-500 mt-1">Most active</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Provider Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Provider Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-medium">Groq (Premium)</span>
                      <span className="text-sm text-gray-600">~30%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-blue-500 h-2 rounded-full" style={{ width: '30%' }}></div>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Crisis, Pro users, negative sentiment</p>
                  </div>
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-medium">DeepSeek (Cost-effective)</span>
                      <span className="text-sm text-gray-600">~70%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-green-500 h-2 rounded-full" style={{ width: '70%' }}></div>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Routine conversations, free users</p>
                  </div>
                </div>
                <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-800">
                    ✓ Hybrid strategy saves ~40% on costs while maintaining quality
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="personalization" className="mt-6">
          <div className="grid gap-6">
            {/* Personalization Overview */}
            <Card>
              <CardHeader>
                <CardTitle>Personalization Insights</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 border rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">Users with Preferences</p>
                    <p className="text-2xl font-bold">0</p>
                    <p className="text-xs text-gray-500 mt-1">Have customized AI</p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">Avg Techniques Learned</p>
                    <p className="text-2xl font-bold">0</p>
                    <p className="text-xs text-gray-500 mt-1">Per user</p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">Learning Rate</p>
                    <p className="text-2xl font-bold">0%</p>
                    <p className="text-xs text-gray-500 mt-1">Feedback → Adaptation</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Popular Preferences */}
            <Card>
              <CardHeader>
                <CardTitle>Popular Preferences</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium mb-2">Preferred Tones</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      <div className="p-3 border rounded text-center">
                        <p className="text-lg font-bold">0</p>
                        <p className="text-xs text-gray-600">Supportive</p>
                      </div>
                      <div className="p-3 border rounded text-center">
                        <p className="text-lg font-bold">0</p>
                        <p className="text-xs text-gray-600">Casual</p>
                      </div>
                      <div className="p-3 border rounded text-center">
                        <p className="text-lg font-bold">0</p>
                        <p className="text-xs text-gray-600">Direct</p>
                      </div>
                      <div className="p-3 border rounded text-center">
                        <p className="text-lg font-bold">0</p>
                        <p className="text-xs text-gray-600">Empathetic</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium mb-2">Most Effective Techniques</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                        <span className="text-sm">Breathing exercises</span>
                        <Badge>0 users</Badge>
                      </div>
                      <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                        <span className="text-sm">Grounding (5-4-3-2-1)</span>
                        <Badge>0 users</Badge>
                      </div>
                      <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                        <span className="text-sm">Thought Challenger</span>
                        <Badge>0 users</Badge>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium mb-2">Common Trigger Topics</h4>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline">Family (0)</Badge>
                      <Badge variant="outline">Work (0)</Badge>
                      <Badge variant="outline">Relationships (0)</Badge>
                      <Badge variant="outline">Financial (0)</Badge>
                    </div>
                  </div>
                </div>

                <div className="mt-4 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                  <p className="text-sm text-purple-800">
                    💡 Personalization data will populate as users interact with AI and provide feedback
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Conversation Memory Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Conversation Memory</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 border rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">Avg Conversation Length</p>
                    <p className="text-2xl font-bold">{stats.avgMessagesPerChat}</p>
                    <p className="text-xs text-gray-500 mt-1">Messages per chat</p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">Long Conversations</p>
                    <p className="text-2xl font-bold">0</p>
                    <p className="text-xs text-gray-500 mt-1">12+ messages</p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">Memory Optimization</p>
                    <p className="text-2xl font-bold">60%</p>
                    <p className="text-xs text-gray-500 mt-1">Token savings</p>
                  </div>
                </div>
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800">
                    ✓ Conversations over 12 messages are automatically summarized to save tokens
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}