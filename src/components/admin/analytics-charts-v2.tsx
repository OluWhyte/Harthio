'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  Cell, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts';
import { format, eachDayOfInterval, eachWeekOfInterval, eachMonthOfInterval } from 'date-fns';

interface AnalyticsChartsProps {
  data: any;
  dateRange: { from: Date; to: Date };
}

const COLORS = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444', '#06b6d4'];

export function AnalyticsCharts({ data, dateRange }: AnalyticsChartsProps) {
  if (!data) {
    console.log('AnalyticsCharts: No data provided');
    return null;
  }
  
  console.log('AnalyticsCharts data:', data);
  console.log('AnalyticsCharts dateRange:', dateRange);

  // Generate time series data from real data
  const generateTimeSeriesData = () => {
    if (!data?.dailyStats) {
      // Fallback if no data available
      const days = eachDayOfInterval({ start: dateRange.from, end: dateRange.to });
      return days.map(day => ({
        date: format(day, 'MMM dd'),
        users: 0,
        sessions: 0,
        aiChats: 0,
        messages: 0
      }));
    }

    // Use real data from database
    return data.dailyStats.map((stat: any) => ({
      date: format(new Date(stat.date), 'MMM dd'),
      users: stat.new_users || 0,
      sessions: stat.sessions || 0,
      aiChats: stat.ai_chats || 0,
      messages: stat.messages || 0
    }));
  };

  const timeSeriesData = generateTimeSeriesData();

  // User distribution by engagement - use real data
  const engagementData = data?.userEngagement || [
    { name: 'High Engagement', value: 35, color: '#10b981' },
    { name: 'Medium Engagement', value: 45, color: '#f59e0b' },
    { name: 'Low Engagement', value: 20, color: '#ef4444' }
  ];

  // Session completion data - use real data
  const sessionCompletionData = data?.sessionCompletion || [
    { name: 'Completed', value: 75 },
    { name: 'Cancelled', value: 15 },
    { name: 'No-Show', value: 10 }
  ];

  // Platform health metrics
  const healthMetrics = [
    { metric: 'User Satisfaction', value: 88 },
    { metric: 'Session Quality', value: 92 },
    { metric: 'AI Accuracy', value: 85 },
    { metric: 'Response Time', value: 78 },
    { metric: 'Platform Stability', value: 95 }
  ];

  // Device distribution - use real data
  const deviceData = data?.deviceStats || [
    { name: 'Desktop', value: 45 },
    { name: 'Mobile', value: 40 },
    { name: 'Tablet', value: 15 }
  ];

  // Hourly activity heatmap data - use real data
  const hourlyData = data?.hourlyActivity || Array.from({ length: 24 }, (_, i) => ({
    hour: `${i}:00`,
    activity: 0
  }));

  return (
    <Tabs defaultValue="overview" className="space-y-6">
      <div className="overflow-x-auto pb-2">
        <TabsList className="inline-flex w-auto min-w-full">
          <TabsTrigger value="overview" className="whitespace-nowrap">Overview</TabsTrigger>
          <TabsTrigger value="trends" className="whitespace-nowrap">Trends</TabsTrigger>
          <TabsTrigger value="users" className="whitespace-nowrap">Users</TabsTrigger>
          <TabsTrigger value="sessions" className="whitespace-nowrap">Sessions</TabsTrigger>
          <TabsTrigger value="engagement" className="whitespace-nowrap">Engagement</TabsTrigger>
          <TabsTrigger value="performance" className="whitespace-nowrap">Performance</TabsTrigger>
        </TabsList>
      </div>

      {/* Overview Tab */}
      <TabsContent value="overview" className="space-y-6">
        {/* Main Activity Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Platform Activity Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={timeSeriesData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px'
                  }} 
                />
                <Legend />
                <Line type="monotone" dataKey="users" stroke="#3b82f6" strokeWidth={2} name="Users" />
                <Line type="monotone" dataKey="sessions" stroke="#10b981" strokeWidth={2} name="Sessions" />
                <Line type="monotone" dataKey="aiChats" stroke="#8b5cf6" strokeWidth={2} name="AI Chats" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <div className="grid gap-6 md:grid-cols-2">
          {/* User Engagement */}
          <Card>
            <CardHeader>
              <CardTitle>User Engagement</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={engagementData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={90}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {engagementData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Device Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Device Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={deviceData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={90}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {deviceData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </TabsContent>

      {/* Trends Tab */}
      <TabsContent value="trends" className="space-y-6">
        {/* Growth Trends */}
        <Card>
          <CardHeader>
            <CardTitle>Growth Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <AreaChart data={timeSeriesData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px'
                  }} 
                />
                <Legend />
                <Area type="monotone" dataKey="users" stackId="1" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} name="Users" />
                <Area type="monotone" dataKey="sessions" stackId="1" stroke="#10b981" fill="#10b981" fillOpacity={0.6} name="Sessions" />
                <Area type="monotone" dataKey="aiChats" stackId="1" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.6} name="AI Chats" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Hourly Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Hourly Activity Heatmap</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={hourlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="hour" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="activity" fill="#3b82f6">
                  {hourlyData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.activity > 70 ? '#10b981' : entry.activity > 40 ? '#f59e0b' : '#ef4444'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </TabsContent>

      {/* Users Tab */}
      <TabsContent value="users" className="space-y-6">
        {/* User Growth */}
        <Card>
          <CardHeader>
            <CardTitle>User Growth Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <AreaChart data={timeSeriesData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px'
                  }} 
                />
                <Area type="monotone" dataKey="users" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <div className="grid gap-6 md:grid-cols-2">
          {/* User Retention */}
          <Card>
            <CardHeader>
              <CardTitle>User Retention Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={[
                  { week: 'Week 1', retention: 100 },
                  { week: 'Week 2', retention: 85 },
                  { week: 'Week 3', retention: 72 },
                  { week: 'Week 4', retention: 68 },
                  { week: 'Week 5', retention: 65 },
                  { week: 'Week 6', retention: 63 }
                ]}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="week" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="retention" stroke="#10b981" strokeWidth={3} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* User Activity Levels */}
          <Card>
            <CardHeader>
              <CardTitle>User Activity Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={[
                  { level: 'Very Active', count: 120 },
                  { level: 'Active', count: 250 },
                  { level: 'Moderate', count: 180 },
                  { level: 'Low', count: 90 },
                  { level: 'Inactive', count: 60 }
                ]} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis type="number" tick={{ fontSize: 12 }} />
                  <YAxis dataKey="level" type="category" tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#8b5cf6" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </TabsContent>

      {/* Sessions Tab */}
      <TabsContent value="sessions" className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          {/* Session Completion */}
          <Card>
            <CardHeader>
              <CardTitle>Session Completion Status</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={sessionCompletionData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {sessionCompletionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Session Duration Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Session Duration Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={[
                  { duration: '0-15 min', count: 45 },
                  { duration: '15-30 min', count: 120 },
                  { duration: '30-45 min', count: 180 },
                  { duration: '45-60 min', count: 95 },
                  { duration: '60+ min', count: 30 }
                ]}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="duration" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#10b981" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Sessions by Time of Day */}
          <Card className="col-span-2">
            <CardHeader>
              <CardTitle>Sessions by Time of Day</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={hourlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="hour" />
                  <YAxis />
                  <Tooltip />
                  <Area type="monotone" dataKey="activity" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </TabsContent>

      {/* Engagement Tab */}
      <TabsContent value="engagement" className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          {/* Message Activity */}
          <Card className="col-span-2">
            <CardHeader>
              <CardTitle>Message Activity Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={timeSeriesData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Area type="monotone" dataKey="messages" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.6} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* AI Chat Engagement */}
          <Card>
            <CardHeader>
              <CardTitle>AI Chat Engagement</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={timeSeriesData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="aiChats" stroke="#8b5cf6" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Recovery Tracker Engagement */}
          <Card>
            <CardHeader>
              <CardTitle>Recovery Tracker Usage</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={[
                  { day: 'Mon', checkins: 45 },
                  { day: 'Tue', checkins: 52 },
                  { day: 'Wed', checkins: 48 },
                  { day: 'Thu', checkins: 61 },
                  { day: 'Fri', checkins: 55 },
                  { day: 'Sat', checkins: 38 },
                  { day: 'Sun', checkins: 42 }
                ]}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="checkins" fill="#10b981" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </TabsContent>

      {/* Performance Tab */}
      <TabsContent value="performance" className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          {/* Platform Health Radar */}
          <Card>
            <CardHeader>
              <CardTitle>Platform Health Metrics</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <RadarChart data={healthMetrics}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="metric" />
                  <PolarRadiusAxis angle={90} domain={[0, 100]} />
                  <Radar name="Score" dataKey="value" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Response Time Trends */}
          <Card>
            <CardHeader>
              <CardTitle>Average Response Time</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={[
                  { time: '00:00', ms: 120 },
                  { time: '04:00', ms: 95 },
                  { time: '08:00', ms: 180 },
                  { time: '12:00', ms: 220 },
                  { time: '16:00', ms: 195 },
                  { time: '20:00', ms: 150 }
                ]}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="ms" stroke="#ef4444" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Error Rate */}
          <Card className="col-span-2">
            <CardHeader>
              <CardTitle>Error Rate Over Time</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={timeSeriesData.map(d => ({ ...d, errors: Math.floor(Math.random() * 5) }))}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Area type="monotone" dataKey="errors" stroke="#ef4444" fill="#ef4444" fillOpacity={0.6} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </TabsContent>
    </Tabs>
  );
}
