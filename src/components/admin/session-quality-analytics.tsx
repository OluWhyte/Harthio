'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  Activity,
  Users,
  Clock,
  Wifi,
  RefreshCw
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface QualityMetrics {
  totalSessions: number;
  avgQualityScore: number;
  qualityDistribution: Array<{
    quality: string;
    count: number;
    percentage: number;
  }>;
  providerStats: Array<{
    provider: string;
    sessions: number;
    avgScore: number;
    avgLatency: number;
  }>;
  recentTrends: Array<{
    date: string;
    avgScore: number;
    sessionCount: number;
  }>;
  topIssues: Array<{
    issue: string;
    count: number;
    impact: 'high' | 'medium' | 'low';
  }>;
}

const QUALITY_COLORS = {
  excellent: '#10b981',
  good: '#3b82f6', 
  fair: '#f59e0b',
  poor: '#f97316',
  failed: '#ef4444'
};

export function SessionQualityAnalytics() {
  const [metrics, setMetrics] = useState<QualityMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d'>('7d');

  useEffect(() => {
    loadMetrics();
  }, [timeRange]);

  const loadMetrics = async () => {
    setLoading(true);
    try {
      
      // Calculate date range
      const now = new Date();
      const startDate = new Date();
      switch (timeRange) {
        case '24h':
          startDate.setHours(now.getHours() - 24);
          break;
        case '7d':
          startDate.setDate(now.getDate() - 7);
          break;
        case '30d':
          startDate.setDate(now.getDate() - 30);
          break;
      }

      // Fetch session quality data
      const { data: sessions, error } = await supabase
        .from('session_quality_logs')
        .select('*')
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Failed to load session quality metrics:', error);
        return;
      }

      const sessionsData = (sessions || []) as any[];

      if (!sessionsData || sessionsData.length === 0) {
        setMetrics({
          totalSessions: 0,
          avgQualityScore: 0,
          qualityDistribution: [],
          providerStats: [],
          recentTrends: [],
          topIssues: []
        });
        return;
      }

      // Calculate metrics
      const totalSessions = sessionsData.length;
      const avgQualityScore = Math.round(
        sessionsData.reduce((sum, s) => sum + s.quality_score, 0) / totalSessions
      );

      // Quality distribution
      const qualityCounts = sessionsData.reduce((counts, s) => {
        counts[s.overall_quality] = (counts[s.overall_quality] || 0) + 1;
        return counts;
      }, {} as Record<string, number>);

      const qualityDistribution = Object.entries(qualityCounts).map(([quality, count]) => ({
        quality,
        count: count as number,
        percentage: Math.round(((count as number) / totalSessions) * 100)
      }));

      // Provider stats
      const providerGroups = sessionsData.reduce((groups, s) => {
        if (!groups[s.provider]) {
          groups[s.provider] = [];
        }
        groups[s.provider].push(s);
        return groups;
      }, {} as Record<string, any[]>);

      const providerStats = Object.entries(providerGroups).map(([provider, providerSessions]) => {
        const sessions = providerSessions as any[];
        return {
          provider,
          sessions: sessions.length,
          avgScore: Math.round(
            sessions.reduce((sum, s) => sum + s.quality_score, 0) / sessions.length
          ),
          avgLatency: Math.round(
            sessions.reduce((sum, s) => sum + s.avg_latency, 0) / sessions.length
          )
        };
      });

      // Recent trends (daily aggregation)
      const dailyGroups = sessionsData.reduce((groups, s) => {
        const date = new Date(s.created_at).toISOString().split('T')[0];
        if (!groups[date]) {
          groups[date] = [];
        }
        groups[date].push(s);
        return groups;
      }, {} as Record<string, any[]>);

      const recentTrends = Object.entries(dailyGroups)
        .map(([date, daySessions]) => {
          const sessions = daySessions as any[];
          return {
            date,
            avgScore: Math.round(
              sessions.reduce((sum, s) => sum + s.quality_score, 0) / sessions.length
            ),
            sessionCount: sessions.length
          };
        })
        .sort((a, b) => a.date.localeCompare(b.date))
        .slice(-7); // Last 7 days

      // Top issues analysis
      const topIssues: Array<{issue: string; count: number; impact: 'high' | 'medium' | 'low'}> = [];
      
      const poorSessions = sessionsData.filter(s => s.overall_quality === 'poor' || s.overall_quality === 'failed');
      if (poorSessions.length > 0) {
        topIssues.push({
          issue: `${poorSessions.length} sessions with poor/failed quality`,
          count: poorSessions.length,
          impact: 'high' as const
        });
      }

      const highLatencySessions = sessionsData.filter(s => s.avg_latency > 300);
      if (highLatencySessions.length > 0) {
        topIssues.push({
          issue: `${highLatencySessions.length} sessions with high latency (>300ms)`,
          count: highLatencySessions.length,
          impact: 'medium' as const
        });
      }

      const unstableSessions = sessionsData.filter(s => s.quality_changes > 5);
      if (unstableSessions.length > 0) {
        topIssues.push({
          issue: `${unstableSessions.length} sessions with frequent quality changes`,
          count: unstableSessions.length,
          impact: 'medium' as const
        });
      }

      const connectionDropSessions = sessionsData.filter(s => s.connection_drops > 0);
      if (connectionDropSessions.length > 0) {
        topIssues.push({
          issue: `${connectionDropSessions.length} sessions with connection drops`,
          count: connectionDropSessions.length,
          impact: 'high' as const
        });
      }

      setMetrics({
        totalSessions,
        avgQualityScore,
        qualityDistribution,
        providerStats,
        recentTrends,
        topIssues
      });

    } catch (error) {
      console.error('Failed to load session quality metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  const getQualityBadge = (quality: string) => {
    const variants: Record<string, string> = {
      excellent: 'bg-green-100 text-green-800 border-green-200',
      good: 'bg-blue-100 text-blue-800 border-blue-200',
      fair: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      poor: 'bg-orange-100 text-orange-800 border-orange-200',
      failed: 'bg-red-100 text-red-800 border-red-200'
    };
    
    return (
      <Badge variant="outline" className={variants[quality] || 'bg-gray-100 text-gray-800'}>
        {quality.toUpperCase()}
      </Badge>
    );
  };

  const getImpactBadge = (impact: string) => {
    const variants = {
      high: 'bg-red-100 text-red-800 border-red-200',
      medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      low: 'bg-green-100 text-green-800 border-green-200'
    };
    
    return (
      <Badge variant="outline" className={variants[impact as keyof typeof variants]}>
        {impact.toUpperCase()}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center p-8">
          <RefreshCw className="w-6 h-6 animate-spin mr-2" />
          Loading session quality analytics...
        </div>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">Failed to load session quality metrics</p>
            <Button onClick={loadMetrics} className="mt-4">
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Time Range Selector */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Session Quality Analytics</h3>
        <div className="flex gap-2">
          {(['24h', '7d', '30d'] as const).map((range) => (
            <Button
              key={range}
              variant={timeRange === range ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTimeRange(range)}
            >
              {range === '24h' ? '24 Hours' : range === '7d' ? '7 Days' : '30 Days'}
            </Button>
          ))}
          <Button variant="outline" size="sm" onClick={loadMetrics}>
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Sessions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-muted-foreground" />
              <span className="text-2xl font-bold">{metrics.totalSessions}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Avg Quality Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-muted-foreground" />
              <span className="text-2xl font-bold">{metrics.avgQualityScore}/100</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Quality Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              {metrics.avgQualityScore >= 75 ? (
                <TrendingUp className="w-4 h-4 text-green-500" />
              ) : (
                <TrendingDown className="w-4 h-4 text-red-500" />
              )}
              <span className="text-2xl font-bold">
                {metrics.avgQualityScore >= 75 ? 'Good' : 'Poor'}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Top Issues
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Wifi className="w-4 h-4 text-muted-foreground" />
              <span className="text-2xl font-bold">{metrics.topIssues.length}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Quality Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Quality Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            {metrics.qualityDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={metrics.qualityDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ quality, percentage }) => `${quality} (${percentage}%)`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {metrics.qualityDistribution.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={QUALITY_COLORS[entry.quality as keyof typeof QUALITY_COLORS] || '#8884d8'} 
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                No data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Provider Performance */}
        <Card>
          <CardHeader>
            <CardTitle>Provider Performance</CardTitle>
          </CardHeader>
          <CardContent>
            {metrics.providerStats.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={metrics.providerStats}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="provider" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="avgScore" fill="#3b82f6" name="Avg Score" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                No data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Trends */}
      {metrics.recentTrends.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Quality Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={metrics.recentTrends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="avgScore" 
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  name="Avg Quality Score"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Top Issues */}
      {metrics.topIssues.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Top Quality Issues</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {metrics.topIssues.map((issue, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <p className="text-sm font-medium">{issue.issue}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      {issue.count} sessions
                    </span>
                    {getImpactBadge(issue.impact)}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* No Data State */}
      {metrics.totalSessions === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Session Data</h3>
            <p className="text-muted-foreground">
              No session quality data found for the selected time range.
              Sessions need to be completed for quality metrics to appear.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}