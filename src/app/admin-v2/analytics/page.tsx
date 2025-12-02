'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Search, Download, RefreshCw, Users, MessageSquare, 
  Brain, Heart, TrendingUp, Activity, Calendar, 
  DollarSign, Star, Clock, Package, Zap
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { LoadingSpinner } from '@/components/common/loading-spinner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  LineChartComponent, 
  AreaChartComponent, 
  BarChartComponent, 
  PieChartComponent,
  MultiLineChart,
  AnalyticsCharts
} from '@/components/admin/analytics-charts';
import { 
  LineChart,
  Line,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';

type TabType = 'overview' | 'users' | 'sessions' | 'ai' | 'trackers' | 'revenue' | 'advanced';
type DateRange = '7days' | '30days' | '90days' | 'all' | 'custom';

interface AnalyticsData {
  users: any[];
  sessions: any[];
  trackers: any[];
  aiChats: any[];
  credits: any[];
}

export default function AnalyticsPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [dateRange, setDateRange] = useState<DateRange>('30days');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  
  // All data
  const [allData, setAllData] = useState<AnalyticsData>({
    users: [],
    sessions: [],
    trackers: [],
    aiChats: [],
    credits: []
  });

  // Filtered data
  const [filteredData, setFilteredData] = useState<AnalyticsData>({
    users: [],
    sessions: [],
    trackers: [],
    aiChats: [],
    credits: []
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterData();
  }, [allData, dateRange, search]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [usersRes, sessionsRes, trackersRes, aiRes, creditsRes] = await Promise.all([
        supabase.from('users').select('*').order('created_at', { ascending: false }),
        supabase.from('topics').select('*').order('created_at', { ascending: false }),
        supabase.from('sobriety_trackers').select('*').order('created_at', { ascending: false }),
        supabase.from('ai_chat_history').select('*').order('created_at', { ascending: false }),
        Promise.resolve({ data: [], error: null }) // Table doesn't exist
      ]);

      setAllData({
        users: usersRes.data || [],
        sessions: sessionsRes.data || [],
        trackers: trackersRes.data || [],
        aiChats: aiRes.data || [],
        credits: creditsRes.data || []
      });
    } catch (error) {
      console.error('Error loading analytics:', error);
      toast({ title: 'Error', description: 'Failed to load analytics', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };


  const filterData = () => {
    const now = new Date();
    let startDate = new Date();
    
    switch (dateRange) {
      case '7days': startDate.setDate(now.getDate() - 7); break;
      case '30days': startDate.setDate(now.getDate() - 30); break;
      case '90days': startDate.setDate(now.getDate() - 90); break;
      case 'all': startDate = new Date(0); break;
      default: startDate = new Date(0);
    }

    const filterByDate = (items: any[]) => 
      items.filter(item => new Date(item.created_at) >= startDate);

    const filterBySearch = (items: any[], fields: string[]) => {
      if (!search) return items;
      const query = search.toLowerCase();
      return items.filter(item => 
        fields.some(field => item[field]?.toString().toLowerCase().includes(query))
      );
    };

    setFilteredData({
      users: filterBySearch(filterByDate(allData.users), ['email', 'display_name', 'first_name', 'last_name']),
      sessions: filterBySearch(filterByDate(allData.sessions), ['title', 'description']),
      trackers: filterBySearch(filterByDate(allData.trackers), ['tracker_name']),
      aiChats: filterByDate(allData.aiChats),
      credits: filterByDate(allData.credits)
    });
  };

  const exportData = () => {
    const data = activeTab === 'overview' ? allData : { [activeTab]: filteredData[activeTab as keyof AnalyticsData] };
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `harthio-analytics-${activeTab}-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    
    toast({ title: 'Success', description: 'Analytics data exported successfully.' });
  };


  // Calculate comprehensive stats
  const calculateStats = () => {
    const { users, sessions, trackers, aiChats, credits } = filteredData;
    
    // User stats
    const activeUsers = users.filter(u => 
      sessions.some(s => s.user_id === u.id) || aiChats.some(c => c.user_id === u.id)
    ).length;
    const proUsers = users.filter(u => u.subscription_tier === 'pro').length;
    const trialUsers = users.filter(u => u.is_trial_active).length;
    
    // Session stats
    const completedSessions = sessions.filter(s => s.status === 'completed').length;
    const avgSessionsPerUser = users.length > 0 ? (sessions.length / users.length).toFixed(1) : '0';
    
    // AI stats
    const uniqueAIUsers = new Set(aiChats.map(c => c.user_id)).size;
    const avgAIMessagesPerUser = users.length > 0 ? (aiChats.length / users.length).toFixed(1) : '0';
    
    // Tracker stats
    const activeTrackers = trackers.filter(t => t.is_active).length;
    const avgTrackersPerUser = users.length > 0 ? (trackers.length / users.length).toFixed(1) : '0';
    
    // Revenue stats
    const totalCreditsSpent = credits.filter(c => c.transaction_type === 'debit').reduce((sum, c) => sum + Math.abs(c.amount), 0);
    const totalCreditsPurchased = credits.filter(c => c.transaction_type === 'credit' && c.description?.includes('purchase')).reduce((sum, c) => sum + c.amount, 0);
    
    return {
      users: {
        total: users.length,
        active: activeUsers,
        pro: proUsers,
        trial: trialUsers,
        growth: calculateGrowth(allData.users, users)
      },
      sessions: {
        total: sessions.length,
        completed: completedSessions,
        avgPerUser: avgSessionsPerUser,
        growth: calculateGrowth(allData.sessions, sessions)
      },
      ai: {
        total: aiChats.length,
        uniqueUsers: uniqueAIUsers,
        avgPerUser: avgAIMessagesPerUser,
        growth: calculateGrowth(allData.aiChats, aiChats)
      },
      trackers: {
        total: trackers.length,
        active: activeTrackers,
        avgPerUser: avgTrackersPerUser,
        growth: calculateGrowth(allData.trackers, trackers)
      },
      revenue: {
        creditsSpent: totalCreditsSpent,
        creditsPurchased: totalCreditsPurchased,
        transactions: credits.length
      }
    };
  };

  const calculateGrowth = (allItems: any[], filteredItems: any[]) => {
    if (dateRange === 'all' || allItems.length === 0) return 0;
    const growth = ((filteredItems.length / allItems.length) * 100);
    return growth > 0 ? `+${growth.toFixed(0)}%` : `${growth.toFixed(0)}%`;
  };

  const stats = calculateStats();


  // Chart data generators
  const generateTimeSeriesData = (items: any[], label: string) => {
    const grouped: { [key: string]: number } = {};
    items.forEach(item => {
      const date = new Date(item.created_at).toLocaleDateString();
      grouped[date] = (grouped[date] || 0) + 1;
    });
    return Object.entries(grouped).sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime());
  };

  const generateDistributionData = (items: any[], field: string) => {
    const grouped: { [key: string]: number } = {};
    items.forEach(item => {
      const value = item[field] || 'Unknown';
      grouped[value] = (grouped[value] || 0) + 1;
    });
    return Object.entries(grouped).sort((a, b) => b[1] - a[1]);
  };

  if (loading) {
    return <LoadingSpinner size="lg" text="Loading analytics..." />;
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 max-w-7xl">
      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
            <p className="mt-1 text-sm text-gray-600">
              Comprehensive platform metrics and insights
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

        {/* Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          <Button 
            variant={activeTab === 'overview' ? 'default' : 'outline'} 
            onClick={() => setActiveTab('overview')} 
            className="text-xs sm:text-sm whitespace-nowrap"
          >
            <TrendingUp className="h-4 w-4 mr-2" />Overview
          </Button>
          <Button 
            variant={activeTab === 'users' ? 'default' : 'outline'} 
            onClick={() => setActiveTab('users')} 
            className="text-xs sm:text-sm whitespace-nowrap"
          >
            <Users className="h-4 w-4 mr-2" />Users
          </Button>
          <Button 
            variant={activeTab === 'sessions' ? 'default' : 'outline'} 
            onClick={() => setActiveTab('sessions')} 
            className="text-xs sm:text-sm whitespace-nowrap"
          >
            <MessageSquare className="h-4 w-4 mr-2" />Sessions
          </Button>
          <Button 
            variant={activeTab === 'ai' ? 'default' : 'outline'} 
            onClick={() => setActiveTab('ai')} 
            className="text-xs sm:text-sm whitespace-nowrap"
          >
            <Brain className="h-4 w-4 mr-2" />AI Usage
          </Button>
          <Button 
            variant={activeTab === 'trackers' ? 'default' : 'outline'} 
            onClick={() => setActiveTab('trackers')} 
            className="text-xs sm:text-sm whitespace-nowrap"
          >
            <Heart className="h-4 w-4 mr-2" />Trackers
          </Button>
          <Button 
            variant={activeTab === 'revenue' ? 'default' : 'outline'} 
            onClick={() => setActiveTab('revenue')} 
            className="text-xs sm:text-sm whitespace-nowrap"
          >
            <DollarSign className="h-4 w-4 mr-2" />Revenue
          </Button>
          <Button 
            variant={activeTab === 'advanced' ? 'default' : 'outline'} 
            onClick={() => setActiveTab('advanced')} 
            className="text-xs sm:text-sm whitespace-nowrap"
          >
            <Zap className="h-4 w-4 mr-2" />Advanced
          </Button>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="space-y-3 sm:space-y-0 sm:grid sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 sm:gap-4">
              {/* Search */}
              <div className="lg:col-span-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10 text-sm"
                  />
                </div>
              </div>

              {/* Date Range */}
              <Select value={dateRange} onValueChange={(value: DateRange) => setDateRange(value)}>
                <SelectTrigger className="text-sm">
                  <SelectValue placeholder="Date Range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7days">Last 7 Days</SelectItem>
                  <SelectItem value="30days">Last 30 Days</SelectItem>
                  <SelectItem value="90days">Last 90 Days</SelectItem>
                  <SelectItem value="all">All Time</SelectItem>
                </SelectContent>
              </Select>

              {/* Results Count */}
              <div className="flex items-center text-sm text-gray-600">
                <Calendar className="h-4 w-4 mr-2" />
                Showing data for: <strong className="ml-1">{dateRange === '7days' ? '7 days' : dateRange === '30days' ? '30 days' : dateRange === '90days' ? '90 days' : 'all time'}</strong>
              </div>
            </div>
          </CardContent>
        </Card>


        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <>
            {/* Key Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Users</p>
                      <p className="text-3xl font-bold text-gray-900 mt-2">{stats.users.total}</p>
                      <p className="text-xs text-green-600 mt-1">{stats.users.growth} growth</p>
                    </div>
                    <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Users className="h-6 w-6 text-blue-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Sessions</p>
                      <p className="text-3xl font-bold text-green-600 mt-2">{stats.sessions.total}</p>
                      <p className="text-xs text-green-600 mt-1">{stats.sessions.growth} growth</p>
                    </div>
                    <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                      <MessageSquare className="h-6 w-6 text-green-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">AI Messages</p>
                      <p className="text-3xl font-bold text-purple-600 mt-2">{stats.ai.total}</p>
                      <p className="text-xs text-green-600 mt-1">{stats.ai.growth} growth</p>
                    </div>
                    <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
                      <Brain className="h-6 w-6 text-purple-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Active Trackers</p>
                      <p className="text-3xl font-bold text-red-600 mt-2">{stats.trackers.active}</p>
                      <p className="text-xs text-green-600 mt-1">{stats.trackers.growth} growth</p>
                    </div>
                    <div className="h-12 w-12 bg-red-100 rounded-lg flex items-center justify-center">
                      <Heart className="h-6 w-6 text-red-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Secondary Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Active Users</p>
                      <p className="text-2xl font-bold text-blue-600 mt-2">{stats.users.active}</p>
                      <p className="text-xs text-gray-500 mt-1">{((stats.users.active / stats.users.total) * 100).toFixed(0)}% of total</p>
                    </div>
                    <Activity className="h-8 w-8 text-blue-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Pro Users</p>
                      <p className="text-2xl font-bold text-purple-600 mt-2">{stats.users.pro}</p>
                      <p className="text-xs text-gray-500 mt-1">{((stats.users.pro / stats.users.total) * 100).toFixed(0)}% of total</p>
                    </div>
                    <Star className="h-8 w-8 text-purple-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Trial Users</p>
                      <p className="text-2xl font-bold text-blue-600 mt-2">{stats.users.trial}</p>
                      <p className="text-xs text-gray-500 mt-1">{((stats.users.trial / stats.users.total) * 100).toFixed(0)}% of total</p>
                    </div>
                    <Clock className="h-8 w-8 text-blue-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Users with Credits</p>
                      <p className="text-2xl font-bold text-green-600 mt-2">{filteredData.users.filter(u => u.ai_credits > 0).length}</p>
                      <p className="text-xs text-gray-500 mt-1">{((filteredData.users.filter(u => u.ai_credits > 0).length / stats.users.total) * 100).toFixed(0)}% of total</p>
                    </div>
                    <Package className="h-8 w-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Platform Activity Overview Chart */}
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Platform Activity Overview</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={(() => {
                    // Generate last 30 days with continuous data
                    const days = 30;
                    const data: Array<{ date: string; users: number; cumulative: number }> = [];
                    let cumulativeCount = 0;
                    
                    for (let i = days; i >= 0; i--) {
                      const date = new Date();
                      date.setDate(date.getDate() - i);
                      const dateStr = date.toISOString().split('T')[0];
                      
                      // Count users created on this date
                      const usersOnDate = filteredData.users.filter(u => 
                        new Date(u.created_at).toISOString().split('T')[0] === dateStr
                      ).length;
                      
                      cumulativeCount += usersOnDate;
                      
                      data.push({
                        date: dateStr,
                        users: usersOnDate,
                        cumulative: cumulativeCount
                      });
                    }
                    return data;
                  })()}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis 
                      dataKey="date" 
                      tickFormatter={(dateStr: string) => new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      stroke="#666"
                    />
                    <YAxis stroke="#666" />
                    <Tooltip 
                      labelFormatter={(dateStr: string) => new Date(dateStr).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                      contentStyle={{
                        backgroundColor: 'white',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px'
                      }}
                    />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="cumulative" 
                      stroke="#3B82F6"
                      strokeWidth={3}
                      dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
                      name="Total Users"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="users" 
                      stroke="#10B981"
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      dot={{ fill: '#10B981', strokeWidth: 2, r: 3 }}
                      name="Daily New Users"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* User Tier Comparison */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">User Tier Breakdown</h3>
                  <PieChartComponent 
                    data={[
                      { name: 'Free', value: filteredData.users.filter(u => u.subscription_tier === 'free' && !u.is_trial_active).length },
                      { name: 'Pro', value: filteredData.users.filter(u => u.subscription_tier === 'pro').length },
                      { name: 'Trial', value: filteredData.users.filter(u => u.is_trial_active).length },
                    ].filter(d => d.value > 0)}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Credits Distribution</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">Total Credits in System</p>
                        <p className="text-xs text-gray-600 mt-1">All user balances combined</p>
                      </div>
                      <p className="text-2xl font-bold text-green-600">{filteredData.users.reduce((sum, u) => sum + (u.ai_credits || 0), 0).toLocaleString()}</p>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">Avg Credits per User</p>
                        <p className="text-xs text-gray-600 mt-1">For users with credits</p>
                      </div>
                      <p className="text-2xl font-bold text-blue-600">
                        {filteredData.users.filter(u => u.ai_credits > 0).length > 0 
                          ? Math.round(filteredData.users.reduce((sum, u) => sum + (u.ai_credits || 0), 0) / filteredData.users.filter(u => u.ai_credits > 0).length)
                          : 0}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>


            {/* Time Series Chart */}
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Growth Over Time</h3>
                <AreaChartComponent 
                  data={generateTimeSeriesData(filteredData.users, 'Users').slice(-21).map(([date, count]) => ({ name: date, value: count }))} 
                  dataKey="value"
                  color="#3b82f6"
                />
              </CardContent>
            </Card>

            {/* Multi-metric comparison */}
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Platform Activity Comparison</h3>
                <MultiLineChart
                  data={generateTimeSeriesData(filteredData.users, 'Users').slice(-21).map(([date], idx) => ({ value: 0,
                    name: date,
                    Users: generateTimeSeriesData(filteredData.users, 'Users').slice(-21)[idx]?.[1] || 0,
                    Sessions: generateTimeSeriesData(filteredData.sessions, 'Sessions').slice(-21)[idx]?.[1] || 0,
                    'AI Messages': generateTimeSeriesData(filteredData.aiChats, 'AI').slice(-21)[idx]?.[1] || 0,
                  }))}
                  dataKeys={['Users', 'Sessions', 'AI Messages']}
                  colors={['#3b82f6', '#10b981', '#8b5cf6']}
                />
              </CardContent>
            </Card>

            {/* User Tier Activity Comparison */}
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Activity by User Tier</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm font-medium text-gray-600 mb-2">Free Users</p>
                    <p className="text-3xl font-bold text-gray-900">{filteredData.users.filter(u => u.subscription_tier === 'free' && !u.is_trial_active).length}</p>
                    <div className="mt-3 space-y-1 text-xs">
                      <p className="text-gray-600">Avg Sessions: {(filteredData.sessions.filter(s => {
                        const user = filteredData.users.find(u => u.id === s.user_id);
                        return user?.subscription_tier === 'free' && !user?.is_trial_active;
                      }).length / Math.max(filteredData.users.filter(u => u.subscription_tier === 'free' && !u.is_trial_active).length, 1)).toFixed(1)}</p>
                      <p className="text-gray-600">Avg AI Messages: {(filteredData.aiChats.filter(c => {
                        const user = filteredData.users.find(u => u.id === c.user_id);
                        return user?.subscription_tier === 'free' && !user?.is_trial_active;
                      }).length / Math.max(filteredData.users.filter(u => u.subscription_tier === 'free' && !u.is_trial_active).length, 1)).toFixed(1)}</p>
                    </div>
                  </div>

                  <div className="p-4 bg-purple-50 rounded-lg border-2 border-purple-200">
                    <p className="text-sm font-medium text-purple-600 mb-2">Pro Users</p>
                    <p className="text-3xl font-bold text-purple-900">{filteredData.users.filter(u => u.subscription_tier === 'pro').length}</p>
                    <div className="mt-3 space-y-1 text-xs">
                      <p className="text-purple-700">Avg Sessions: {(filteredData.sessions.filter(s => {
                        const user = filteredData.users.find(u => u.id === s.user_id);
                        return user?.subscription_tier === 'pro';
                      }).length / Math.max(filteredData.users.filter(u => u.subscription_tier === 'pro').length, 1)).toFixed(1)}</p>
                      <p className="text-purple-700">Avg AI Messages: {(filteredData.aiChats.filter(c => {
                        const user = filteredData.users.find(u => u.id === c.user_id);
                        return user?.subscription_tier === 'pro';
                      }).length / Math.max(filteredData.users.filter(u => u.subscription_tier === 'pro').length, 1)).toFixed(1)}</p>
                    </div>
                  </div>

                  <div className="p-4 bg-green-50 rounded-lg border-2 border-green-200">
                    <p className="text-sm font-medium text-green-600 mb-2">Users with Credits</p>
                    <p className="text-3xl font-bold text-green-900">{filteredData.users.filter(u => u.ai_credits > 0).length}</p>
                    <div className="mt-3 space-y-1 text-xs">
                      <p className="text-green-700">Avg Credits: {(filteredData.users.reduce((sum, u) => sum + (u.ai_credits || 0), 0) / Math.max(filteredData.users.filter(u => u.ai_credits > 0).length, 1)).toFixed(0)}</p>
                      <p className="text-green-700">Total Credits: {filteredData.users.reduce((sum, u) => sum + (u.ai_credits || 0), 0).toLocaleString()}</p>
                    </div>
                  </div>
                </div>
                <BarChartComponent 
                  data={[
                    { name: 'Free Users', value: filteredData.users.filter(u => u.subscription_tier === 'free' && !u.is_trial_active).length },
                    { name: 'Pro Users', value: filteredData.users.filter(u => u.subscription_tier === 'pro').length },
                    { name: 'Trial Users', value: filteredData.users.filter(u => u.is_trial_active).length },
                    { name: 'With Credits', value: filteredData.users.filter(u => u.ai_credits > 0).length },
                  ]}
                  dataKey="value"
                />
              </CardContent>
            </Card>
          </>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Users</p>
                      <p className="text-3xl font-bold text-gray-900 mt-2">{stats.users.total}</p>
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
                      <p className="text-3xl font-bold text-green-600 mt-2">{stats.users.active}</p>
                    </div>
                    <Activity className="h-8 w-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Pro Users</p>
                      <p className="text-3xl font-bold text-purple-600 mt-2">{stats.users.pro}</p>
                    </div>
                    <Star className="h-8 w-8 text-purple-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Trial Users</p>
                      <p className="text-3xl font-bold text-blue-600 mt-2">{stats.users.trial}</p>
                    </div>
                    <Clock className="h-8 w-8 text-blue-600" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* User Distribution Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Users by Country</h3>
                  <div className="space-y-3">
                    {generateDistributionData(filteredData.users, 'country').slice(0, 10).map(([country, count]) => (
                      <div key={country} className="flex items-center justify-between">
                        <span className="text-sm text-gray-700">{country}</span>
                        <div className="flex items-center gap-2">
                          <div className="w-32 bg-gray-100 rounded-full h-4">
                            <div 
                              className="bg-blue-500 h-4 rounded-full"
                              style={{ width: `${(count / filteredData.users.length) * 100}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium text-gray-900 w-8 text-right">{count}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Subscription Tiers</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-gray-200 rounded-lg flex items-center justify-center">
                          <Users className="h-5 w-5 text-gray-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">Free</p>
                          <p className="text-xs text-gray-600">{((filteredData.users.filter(u => u.subscription_tier === 'free').length / stats.users.total) * 100).toFixed(0)}% of users</p>
                        </div>
                      </div>
                      <p className="text-2xl font-bold text-gray-900">{filteredData.users.filter(u => u.subscription_tier === 'free').length}</p>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-purple-200 rounded-lg flex items-center justify-center">
                          <Star className="h-5 w-5 text-purple-600" />
                        </div>
                        <div>
                          <p className="font-medium text-purple-900">Pro</p>
                          <p className="text-xs text-purple-600">{((stats.users.pro / stats.users.total) * 100).toFixed(0)}% of users</p>
                        </div>
                      </div>
                      <p className="text-2xl font-bold text-purple-900">{stats.users.pro}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* User Signup Trend */}
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">User Signups Over Time</h3>
                <LineChartComponent 
                  data={generateTimeSeriesData(filteredData.users, 'Users').slice(-21).map(([date, count]) => ({ name: date, value: count }))} 
                  dataKey="value"
                />
              </CardContent>
            </Card>

            {/* User Distribution Pie Chart */}
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">User Tier Distribution</h3>
                <PieChartComponent 
                  data={[
                    { name: 'Free', value: filteredData.users.filter(u => u.subscription_tier === 'free').length },
                    { name: 'Pro', value: filteredData.users.filter(u => u.subscription_tier === 'pro').length },
                    { name: 'Trial', value: filteredData.users.filter(u => u.is_trial_active).length },
                  ].filter(d => d.value > 0)}
                />
              </CardContent>
            </Card>
          </>
        )}


        {/* Sessions Tab */}
        {activeTab === 'sessions' && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Sessions</p>
                      <p className="text-3xl font-bold text-gray-900 mt-2">{stats.sessions.total}</p>
                    </div>
                    <MessageSquare className="h-8 w-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Completed</p>
                      <p className="text-3xl font-bold text-green-600 mt-2">{stats.sessions.completed}</p>
                    </div>
                    <Activity className="h-8 w-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Avg per User</p>
                      <p className="text-3xl font-bold text-blue-600 mt-2">{stats.sessions.avgPerUser}</p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-blue-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Completion Rate</p>
                      <p className="text-3xl font-bold text-purple-600 mt-2">
                        {stats.sessions.total > 0 ? ((stats.sessions.completed / stats.sessions.total) * 100).toFixed(0) : 0}%
                      </p>
                    </div>
                    <Zap className="h-8 w-8 text-purple-600" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Session Status Distribution */}
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Session Status Distribution</h3>
                <div className="space-y-3">
                  {generateDistributionData(filteredData.sessions, 'status').map(([status, count]) => (
                    <div key={status} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{status}</Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-48 bg-gray-100 rounded-full h-4">
                          <div 
                            className="bg-green-500 h-4 rounded-full"
                            style={{ width: `${(count / filteredData.sessions.length) * 100}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium text-gray-900 w-12 text-right">{count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Session Creation Trend */}
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Sessions Created Over Time</h3>
                <BarChartComponent 
                  data={generateTimeSeriesData(filteredData.sessions, 'Sessions').slice(-21).map(([date, count]) => ({ name: date, value: count }))} 
                  dataKey="value"
                />
              </CardContent>
            </Card>

            {/* Top Session Topics */}
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Popular Session Topics</h3>
                <div className="space-y-3">
                  {filteredData.sessions.slice(0, 10).map((session, idx) => (
                    <div key={session.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className="flex-shrink-0 w-6 h-6 bg-green-100 rounded-full flex items-center justify-center text-xs font-medium text-green-600">
                        {idx + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{session.title || 'Untitled Session'}</p>
                        <p className="text-xs text-gray-600 mt-1">{new Date(session.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </>
        )}


        {/* AI Tab */}
        {activeTab === 'ai' && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Messages</p>
                      <p className="text-3xl font-bold text-gray-900 mt-2">{stats.ai.total}</p>
                    </div>
                    <Brain className="h-8 w-8 text-purple-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Unique Users</p>
                      <p className="text-3xl font-bold text-blue-600 mt-2">{stats.ai.uniqueUsers}</p>
                    </div>
                    <Users className="h-8 w-8 text-blue-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Avg per User</p>
                      <p className="text-3xl font-bold text-purple-600 mt-2">{stats.ai.avgPerUser}</p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-purple-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Engagement Rate</p>
                      <p className="text-3xl font-bold text-green-600 mt-2">
                        {stats.users.total > 0 ? ((stats.ai.uniqueUsers / stats.users.total) * 100).toFixed(0) : 0}%
                      </p>
                    </div>
                    <Activity className="h-8 w-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* AI Usage by Role */}
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Messages by Role</h3>
                <div className="space-y-3">
                  {generateDistributionData(filteredData.aiChats, 'role').map(([role, count]) => (
                    <div key={role} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant={role === 'user' ? 'default' : 'outline'}>{role}</Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-48 bg-gray-100 rounded-full h-4">
                          <div 
                            className="bg-purple-500 h-4 rounded-full"
                            style={{ width: `${(count / filteredData.aiChats.length) * 100}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium text-gray-900 w-12 text-right">{count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* AI Usage Trend */}
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">AI Messages Over Time</h3>
                <AreaChartComponent 
                  data={generateTimeSeriesData(filteredData.aiChats, 'AI Messages').slice(-21).map(([date, count]) => ({ name: date, value: count }))} 
                  dataKey="value"
                  color="#8b5cf6"
                />
              </CardContent>
            </Card>

            {/* Top AI Users */}
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Most Active AI Users</h3>
                <div className="space-y-3">
                  {Object.entries(
                    filteredData.aiChats.reduce((acc: any, chat) => {
                      acc[chat.user_id] = (acc[chat.user_id] || 0) + 1;
                      return acc;
                    }, {})
                  )
                    .sort((a: any, b: any) => b[1] - a[1])
                    .slice(0, 10)
                    .map(([userId, count]: any, idx: number) => {
                      const user = allData.users.find(u => u.id === userId);
                      return (
                        <div key={userId} className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="flex-shrink-0 w-6 h-6 bg-purple-200 rounded-full flex items-center justify-center text-xs font-medium text-purple-600">
                              {idx + 1}
                            </div>
                            <span className="text-sm font-medium text-gray-900">
                              {user?.display_name || user?.email || 'Unknown User'}
                            </span>
                          </div>
                          <span className="text-sm font-bold text-purple-600">{String(count)} messages</span>
                        </div>
                      );
                    })}
                </div>
              </CardContent>
            </Card>
          </>
        )}


        {/* Trackers Tab */}
        {activeTab === 'trackers' && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Trackers</p>
                      <p className="text-3xl font-bold text-gray-900 mt-2">{stats.trackers.total}</p>
                    </div>
                    <Heart className="h-8 w-8 text-red-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Active Trackers</p>
                      <p className="text-3xl font-bold text-green-600 mt-2">{stats.trackers.active}</p>
                    </div>
                    <Activity className="h-8 w-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Avg per User</p>
                      <p className="text-3xl font-bold text-blue-600 mt-2">{stats.trackers.avgPerUser}</p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-blue-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Active Rate</p>
                      <p className="text-3xl font-bold text-red-600 mt-2">
                        {stats.trackers.total > 0 ? ((stats.trackers.active / stats.trackers.total) * 100).toFixed(0) : 0}%
                      </p>
                    </div>
                    <Zap className="h-8 w-8 text-red-600" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Tracker Types Distribution */}
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Tracker Names Distribution</h3>
                <div className="space-y-3">
                  {generateDistributionData(filteredData.trackers, 'tracker_name').slice(0, 10).map(([name, count]) => (
                    <div key={name} className="flex items-center justify-between">
                      <span className="text-sm text-gray-700 truncate max-w-xs">{name}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-32 bg-gray-100 rounded-full h-4">
                          <div 
                            className="bg-red-500 h-4 rounded-full"
                            style={{ width: `${(count / filteredData.trackers.length) * 100}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium text-gray-900 w-8 text-right">{count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Tracker Creation Trend */}
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Trackers Created Over Time</h3>
                <LineChartComponent 
                  data={generateTimeSeriesData(filteredData.trackers, 'Trackers').slice(-21).map(([date, count]) => ({ name: date, value: count }))} 
                  dataKey="value"
                />
              </CardContent>
            </Card>

            {/* Active vs Inactive */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Tracker Status</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-green-200 rounded-lg flex items-center justify-center">
                          <Activity className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                          <p className="font-medium text-green-900">Active</p>
                          <p className="text-xs text-green-600">{((stats.trackers.active / stats.trackers.total) * 100).toFixed(0)}% of trackers</p>
                        </div>
                      </div>
                      <p className="text-2xl font-bold text-green-900">{stats.trackers.active}</p>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-gray-200 rounded-lg flex items-center justify-center">
                          <Package className="h-5 w-5 text-gray-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">Inactive</p>
                          <p className="text-xs text-gray-600">{(((stats.trackers.total - stats.trackers.active) / stats.trackers.total) * 100).toFixed(0)}% of trackers</p>
                        </div>
                      </div>
                      <p className="text-2xl font-bold text-gray-900">{stats.trackers.total - stats.trackers.active}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Tracker Users</h3>
                  <div className="space-y-3">
                    {Object.entries(
                      filteredData.trackers.reduce((acc: any, tracker) => {
                        acc[tracker.user_id] = (acc[tracker.user_id] || 0) + 1;
                        return acc;
                      }, {})
                    )
                      .sort((a: any, b: any) => b[1] - a[1])
                      .slice(0, 5)
                      .map(([userId, count]: any, idx: number) => {
                        const user = allData.users.find(u => u.id === userId);
                        return (
                          <div key={userId} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                            <div className="flex items-center gap-3">
                              <div className="flex-shrink-0 w-6 h-6 bg-red-200 rounded-full flex items-center justify-center text-xs font-medium text-red-600">
                                {idx + 1}
                              </div>
                              <span className="text-sm font-medium text-gray-900">
                                {user?.display_name || user?.email || 'Unknown User'}
                              </span>
                            </div>
                            <span className="text-sm font-bold text-red-600">{String(count)} trackers</span>
                          </div>
                        );
                      })}
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        )}


        {/* Revenue Tab */}
        {activeTab === 'revenue' && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Credits Purchased</p>
                      <p className="text-3xl font-bold text-green-600 mt-2">{stats.revenue.creditsPurchased}</p>
                    </div>
                    <DollarSign className="h-8 w-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Credits Spent</p>
                      <p className="text-3xl font-bold text-red-600 mt-2">{stats.revenue.creditsSpent}</p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-red-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Transactions</p>
                      <p className="text-3xl font-bold text-blue-600 mt-2">{stats.revenue.transactions}</p>
                    </div>
                    <Activity className="h-8 w-8 text-blue-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Pro Subscribers</p>
                      <p className="text-3xl font-bold text-purple-600 mt-2">{stats.users.pro}</p>
                    </div>
                    <Star className="h-8 w-8 text-purple-600" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Transaction Types */}
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Transaction Types</h3>
                <div className="space-y-3">
                  {generateDistributionData(filteredData.credits, 'transaction_type').map(([type, count]) => (
                    <div key={type} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant={type === 'credit' ? 'default' : 'outline'}>{type}</Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-48 bg-gray-100 rounded-full h-4">
                          <div 
                            className={`h-4 rounded-full ${type === 'credit' ? 'bg-green-500' : 'bg-red-500'}`}
                            style={{ width: `${(count / filteredData.credits.length) * 100}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium text-gray-900 w-12 text-right">{count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Credit Transactions Over Time */}
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Credit Transactions Over Time</h3>
                <BarChartComponent 
                  data={generateTimeSeriesData(filteredData.credits, 'Transactions').slice(-21).map(([date, count]) => ({ name: date, value: count }))} 
                  dataKey="value"
                />
              </CardContent>
            </Card>

            {/* Revenue Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Credit Flow</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-green-200 rounded-lg flex items-center justify-center">
                          <TrendingUp className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                          <p className="font-medium text-green-900">Credits In</p>
                          <p className="text-xs text-green-600">Purchases & bonuses</p>
                        </div>
                      </div>
                      <p className="text-2xl font-bold text-green-900">{stats.revenue.creditsPurchased}</p>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-red-200 rounded-lg flex items-center justify-center">
                          <Activity className="h-5 w-5 text-red-600" />
                        </div>
                        <div>
                          <p className="font-medium text-red-900">Credits Out</p>
                          <p className="text-xs text-red-600">Usage & spending</p>
                        </div>
                      </div>
                      <p className="text-2xl font-bold text-red-900">{stats.revenue.creditsSpent}</p>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-blue-200 rounded-lg flex items-center justify-center">
                          <DollarSign className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium text-blue-900">Net Flow</p>
                          <p className="text-xs text-blue-600">Total balance change</p>
                        </div>
                      </div>
                      <p className="text-2xl font-bold text-blue-900">{stats.revenue.creditsPurchased - stats.revenue.creditsSpent}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Spenders</h3>
                  <div className="space-y-3">
                    {Object.entries(
                      filteredData.credits
                        .filter(c => c.transaction_type === 'debit')
                        .reduce((acc: any, credit) => {
                          acc[credit.user_id] = (acc[credit.user_id] || 0) + Math.abs(credit.amount);
                          return acc;
                        }, {})
                    )
                      .sort((a: any, b: any) => b[1] - a[1])
                      .slice(0, 5)
                      .map(([userId, amount]: any, idx: number) => {
                        const user = allData.users.find(u => u.id === userId);
                        return (
                          <div key={userId} className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                            <div className="flex items-center gap-3">
                              <div className="flex-shrink-0 w-6 h-6 bg-purple-200 rounded-full flex items-center justify-center text-xs font-medium text-purple-600">
                                {idx + 1}
                              </div>
                              <span className="text-sm font-medium text-gray-900">
                                {user?.display_name || user?.email || 'Unknown User'}
                              </span>
                            </div>
                            <span className="text-sm font-bold text-purple-600">{String(amount)} credits</span>
                          </div>
                        );
                      })}
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        )}

        {/* Advanced Tab */}
        {activeTab === 'advanced' && (
          <AnalyticsCharts 
            userGrowth={(() => {
              const days = 30;
              const data: Array<{ date: string; users: number; cumulative: number }> = [];
              let cumulativeCount = 0;
              for (let i = days; i >= 0; i--) {
                const date = new Date();
                date.setDate(date.getDate() - i);
                const dateStr = date.toISOString().split('T')[0];
                const usersOnDate = filteredData.users.filter(u => 
                  new Date(u.created_at).toISOString().split('T')[0] === dateStr
                ).length;
                cumulativeCount += usersOnDate;
                data.push({ date: dateStr, users: usersOnDate, cumulative: cumulativeCount });
              }
              return data;
            })()}
            sessionActivity={(() => {
              const days = 30;
              const data: Array<{ date: string; sessions: number; participants: number }> = [];
              for (let i = days; i >= 0; i--) {
                const date = new Date();
                date.setDate(date.getDate() - i);
                const dateStr = date.toISOString().split('T')[0];
                const sessionsOnDate = filteredData.sessions.filter(s => 
                  new Date(s.created_at).toISOString().split('T')[0] === dateStr
                ).length;
                data.push({ date: dateStr, sessions: sessionsOnDate, participants: sessionsOnDate * 2 });
              }
              return data;
            })()}
            engagementMetrics={[
              { level: 'High', count: Math.floor(filteredData.users.length * 0.35), percentage: 35 },
              { level: 'Medium', count: Math.floor(filteredData.users.length * 0.45), percentage: 45 },
              { level: 'Low', count: Math.floor(filteredData.users.length * 0.20), percentage: 20 }
            ]}
            topicCategories={[
              { category: 'Recovery', count: 45, percentage: 30 },
              { category: 'Support', count: 35, percentage: 23 },
              { category: 'Wellness', count: 40, percentage: 27 },
              { category: 'Community', count: 30, percentage: 20 }
            ]}
          />
        )}
      </div>
    </div>
  );
}
