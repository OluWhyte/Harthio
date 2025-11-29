'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { ModerationService, UserReport, ContentFlag, ModerationStats } from '@/lib/services/moderation-service';
import { ReportCard, FlagCard } from '@/components/admin/moderation-components';
import { LoadingSpinner } from '@/components/common/loading-spinner';
import { 
  AlertTriangle, Flag, Shield, Search, RefreshCw, 
  Users, MessageSquare, Clock, TrendingUp, Eye,
  CheckCircle, XCircle, Activity
} from 'lucide-react';

export default function ModerationPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<ModerationStats>({
    pendingReports: 0,
    activeFlags: 0,
    reportsToday: 0,
    flagsToday: 0,
    totalReports: 0,
    totalFlags: 0,
    avgResolutionTime: 0
  });
  const [reports, setReports] = useState<UserReport[]>([]);
  const [flags, setFlags] = useState<ContentFlag[]>([]);
  const [reportFilter, setReportFilter] = useState('all');
  const [flagFilter, setFlagFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('queue');
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [statsData, reportsData, flagsData] = await Promise.all([
        ModerationService.getStats(),
        ModerationService.getReports(50, 0, reportFilter === 'all' ? undefined : reportFilter),
        ModerationService.getFlags(50, 0, flagFilter === 'all' ? undefined : flagFilter)
      ]);

      setStats(statsData);
      setReports(reportsData.reports);
      setFlags(flagsData.flags);
    } catch (error: any) {
      console.error('Error loading moderation data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load moderation data.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const loadReports = async () => {
    try {
      const data = await ModerationService.getReports(50, 0, reportFilter === 'all' ? undefined : reportFilter);
      setReports(data.reports);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to load reports.',
        variant: 'destructive'
      });
    }
  };

  const loadFlags = async () => {
    try {
      const data = await ModerationService.getFlags(50, 0, flagFilter === 'all' ? undefined : flagFilter);
      setFlags(data.flags);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to load flags.',
        variant: 'destructive'
      });
    }
  };

  const filteredReports = reports.filter(report => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      report.reporter.email.toLowerCase().includes(query) ||
      report.reported_user.email.toLowerCase().includes(query) ||
      report.description.toLowerCase().includes(query) ||
      report.report_type.toLowerCase().includes(query)
    );
  });

  const filteredFlags = flags.filter(flag => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      flag.content_type.toLowerCase().includes(query) ||
      flag.reason.toLowerCase().includes(query) ||
      flag.flag_type.toLowerCase().includes(query)
    );
  });

  if (loading) {
    return <LoadingSpinner size="lg" text="Loading moderation data..." />;
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 max-w-7xl">
      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Moderation Center</h1>
            <p className="mt-1 text-sm text-gray-600">
              Review user reports and manage content flags
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Button variant="outline" size="sm" onClick={loadData} className="gap-2">
              <RefreshCw className="h-4 w-4" />
              <span className="hidden sm:inline">Refresh</span>
            </Button>
          </div>
        </div>
      </div>

      <div className="space-y-6">

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-600">Pending Reports</p>
              <AlertTriangle className="h-5 w-5 text-orange-500" />
            </div>
            <p className="text-3xl font-bold text-gray-900">{stats.pendingReports}</p>
            <p className="text-sm text-gray-500 mt-1">
              {stats.reportsToday} new today
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-600">Active Flags</p>
              <Flag className="h-5 w-5 text-red-500" />
            </div>
            <p className="text-3xl font-bold text-gray-900">{stats.activeFlags}</p>
            <p className="text-sm text-gray-500 mt-1">
              {stats.flagsToday} new today
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-600">Total Reports</p>
              <Users className="h-5 w-5 text-blue-500" />
            </div>
            <p className="text-3xl font-bold text-gray-900">{stats.totalReports}</p>
            <p className="text-sm text-gray-500 mt-1">
              All time
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-600">Avg Resolution</p>
              <Clock className="h-5 w-5 text-green-500" />
            </div>
            <p className="text-3xl font-bold text-gray-900">{stats.avgResolutionTime}h</p>
            <p className="text-sm text-gray-500 mt-1">
              Response time
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Priority Queue Alert */}
      {(stats.pendingReports > 0 || stats.activeFlags > 0) && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-orange-600" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-orange-900">
                  {stats.pendingReports + stats.activeFlags} Items Need Attention
                </p>
                <p className="text-sm text-orange-700">
                  {stats.pendingReports} pending reports and {stats.activeFlags} active flags require moderation
                </p>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                className="bg-white"
                onClick={() => setActiveTab('queue')}
              >
                <Eye className="h-4 w-4 mr-2" />
                Review Queue
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Moderation Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <div className="overflow-x-auto pb-2">
          <TabsList className="inline-flex w-auto min-w-full">
            <TabsTrigger value="queue" className="whitespace-nowrap">
              Priority Queue ({stats.pendingReports + stats.activeFlags})
            </TabsTrigger>
            <TabsTrigger value="reports" className="whitespace-nowrap">
              User Reports ({stats.totalReports})
            </TabsTrigger>
            <TabsTrigger value="flags" className="whitespace-nowrap">
              Content Flags ({stats.totalFlags})
            </TabsTrigger>
            <TabsTrigger value="analytics" className="whitespace-nowrap">
              Analytics
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Priority Queue Tab */}
        <TabsContent value="queue" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Priority Moderation Queue
              </CardTitle>
            </CardHeader>
            <CardContent>
              {stats.pendingReports === 0 && stats.activeFlags === 0 ? (
                <div className="text-center py-12">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">All Clear!</h3>
                  <p className="text-gray-600">No pending reports or active flags require attention.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Pending Reports */}
                  {stats.pendingReports > 0 && (
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-orange-500" />
                        Pending Reports ({stats.pendingReports})
                      </h3>
                      <div className="grid gap-4">
                        {reports.filter(r => r.status === 'pending').slice(0, 5).map((report) => (
                          <ReportCard key={report.id} report={report} onResolve={loadData} />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Active Flags */}
                  {stats.activeFlags > 0 && (
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <Flag className="h-4 w-4 text-red-500" />
                        Active Flags ({stats.activeFlags})
                      </h3>
                      <div className="grid gap-4">
                        {flags.filter(f => f.status === 'active').slice(0, 5).map((flag) => (
                          <FlagCard key={flag.id} flag={flag} onResolve={loadData} />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Reports Tab */}
        <TabsContent value="reports" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <CardTitle>User Reports ({filteredReports.length})</CardTitle>
                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Search reports..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 w-full sm:w-[200px]"
                    />
                  </div>
                  <Select value={reportFilter} onValueChange={setReportFilter}>
                    <SelectTrigger className="w-full sm:w-[140px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Reports</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                      <SelectItem value="dismissed">Dismissed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {filteredReports.length === 0 ? (
                <div className="text-center py-12">
                  <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No reports found</h3>
                  <p className="text-gray-600">
                    {searchQuery || reportFilter !== 'all' 
                      ? 'Try adjusting your filters' 
                      : 'No user reports have been submitted yet'}
                  </p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {filteredReports.map((report) => (
                    <ReportCard key={report.id} report={report} onResolve={loadReports} />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Flags Tab */}
        <TabsContent value="flags" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <CardTitle>Content Flags ({filteredFlags.length})</CardTitle>
                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Search flags..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 w-full sm:w-[200px]"
                    />
                  </div>
                  <Select value={flagFilter} onValueChange={setFlagFilter}>
                    <SelectTrigger className="w-full sm:w-[140px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Flags</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                      <SelectItem value="dismissed">Dismissed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {filteredFlags.length === 0 ? (
                <div className="text-center py-12">
                  <Flag className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No flags found</h3>
                  <p className="text-gray-600">
                    {searchQuery || flagFilter !== 'all' 
                      ? 'Try adjusting your filters' 
                      : 'No content has been flagged yet'}
                  </p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {filteredFlags.map((flag) => (
                    <FlagCard key={flag.id} flag={flag} onResolve={loadFlags} />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Moderation Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Reports Today</span>
                    <span className="font-semibold">{stats.reportsToday}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Flags Today</span>
                    <span className="font-semibold">{stats.flagsToday}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Avg Resolution Time</span>
                    <span className="font-semibold">{stats.avgResolutionTime}h</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Pending Items</span>
                    <span className="font-semibold text-orange-600">
                      {stats.pendingReports + stats.activeFlags}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Platform Health</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-sm font-medium">Moderation Load</p>
                      <p className="text-xs text-gray-600">Current workload</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-32 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-green-500" 
                          style={{ 
                            width: `${Math.min(100, ((stats.pendingReports + stats.activeFlags) / 10) * 100)}%` 
                          }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium">
                        {stats.pendingReports + stats.activeFlags < 5 ? 'Low' : 
                         stats.pendingReports + stats.activeFlags < 15 ? 'Medium' : 'High'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-sm font-medium">Response Time</p>
                      <p className="text-xs text-gray-600">Average resolution</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-32 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-blue-500" 
                          style={{ width: `${Math.max(20, 100 - (stats.avgResolutionTime * 2))}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium">
                        {stats.avgResolutionTime < 2 ? 'Excellent' : 
                         stats.avgResolutionTime < 8 ? 'Good' : 'Needs Improvement'}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
      </div>
    </div>
  );
}
