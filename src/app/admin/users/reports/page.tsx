'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Logo } from '@/components/common/logo';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, 
  AlertTriangle, 
  Shield, 
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  User,
  MessageSquare,
  Flag
} from 'lucide-react';
import { AdminService } from '@/lib/services/admin-service';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';

// Mock data for user reports - in production this would come from the database
const mockReports = [
  {
    id: '1',
    reporter: { id: '1', name: 'John Doe', email: 'john@example.com' },
    reported_user: { id: '2', name: 'Jane Smith', email: 'jane@example.com' },
    session_id: 'session-1',
    session_title: 'Tech Career Discussion',
    reason: 'inappropriate_behavior',
    description: 'User was being disrespectful and using inappropriate language during the session.',
    status: 'pending',
    created_at: '2025-11-07T10:30:00Z',
    updated_at: '2025-11-07T10:30:00Z'
  },
  {
    id: '2',
    reporter: { id: '3', name: 'Mike Johnson', email: 'mike@example.com' },
    reported_user: { id: '4', name: 'Sarah Wilson', email: 'sarah@example.com' },
    session_id: 'session-2',
    session_title: 'Startup Networking',
    reason: 'spam',
    description: 'User kept promoting their business and sending unsolicited links.',
    status: 'resolved',
    created_at: '2025-11-06T15:45:00Z',
    updated_at: '2025-11-06T16:30:00Z'
  },
  {
    id: '3',
    reporter: { id: '5', name: 'Emily Davis', email: 'emily@example.com' },
    reported_user: { id: '6', name: 'Tom Brown', email: 'tom@example.com' },
    session_id: 'session-3',
    session_title: 'Mental Health Support',
    reason: 'harassment',
    description: 'User made personal attacks and continued after being asked to stop.',
    status: 'investigating',
    created_at: '2025-11-05T09:15:00Z',
    updated_at: '2025-11-05T14:20:00Z'
  }
];

export default function UserReportsPage() {
  const [reports, setReports] = useState(mockReports);
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
      checkAdminAndLoadReports();
    }
  }, [user, mounted]);

  const checkAdminAndLoadReports = async () => {
    if (!user) {
      router.push('/admin/login?redirect=' + encodeURIComponent('/admin/users/reports'));
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
      // In production, load real reports from database
      // const reportsData = await AdminService.getUserReports();
      // setReports(reportsData);
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

  const handleUpdateReportStatus = async (reportId: string, newStatus: string) => {
    try {
      // In production, update report status in database
      setReports(prev => prev.map(report => 
        report.id === reportId 
          ? { ...report, status: newStatus, updated_at: new Date().toISOString() }
          : report
      ));
      
      toast({
        title: 'Success',
        description: `Report status updated to ${newStatus}.`
      });
    } catch (error) {
      console.error('Error updating report status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update report status.',
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="text-yellow-600 border-yellow-600"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
      case 'investigating':
        return <Badge variant="outline" className="text-blue-600 border-blue-600"><Eye className="h-3 w-3 mr-1" />Investigating</Badge>;
      case 'resolved':
        return <Badge variant="outline" className="text-green-600 border-green-600"><CheckCircle className="h-3 w-3 mr-1" />Resolved</Badge>;
      case 'dismissed':
        return <Badge variant="outline" className="text-gray-600 border-gray-600"><XCircle className="h-3 w-3 mr-1" />Dismissed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getReasonLabel = (reason: string) => {
    switch (reason) {
      case 'inappropriate_behavior':
        return 'Inappropriate Behavior';
      case 'harassment':
        return 'Harassment';
      case 'spam':
        return 'Spam';
      case 'hate_speech':
        return 'Hate Speech';
      case 'violence':
        return 'Violence/Threats';
      case 'other':
        return 'Other';
      default:
        return reason;
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
                    User Management
                  </Link>
                </Button>
                <span className="text-gray-400">/</span>
                <h1 className="text-xl font-semibold text-gray-900">User Reports</h1>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Reports</p>
                  <p className="text-3xl font-bold text-red-600">{reports.length}</p>
                </div>
                <Flag className="h-8 w-8 text-red-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Pending</p>
                  <p className="text-3xl font-bold text-yellow-600">
                    {reports.filter(r => r.status === 'pending').length}
                  </p>
                </div>
                <Clock className="h-8 w-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Investigating</p>
                  <p className="text-3xl font-bold text-blue-600">
                    {reports.filter(r => r.status === 'investigating').length}
                  </p>
                </div>
                <Eye className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Resolved</p>
                  <p className="text-3xl font-bold text-green-600">
                    {reports.filter(r => r.status === 'resolved').length}
                  </p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Reports List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              User Reports ({reports.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {reports.length === 0 ? (
              <div className="text-center py-12">
                <Shield className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No reports found</h3>
                <p className="text-gray-600">No user reports have been submitted yet.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {reports.map((report) => (
                  <div key={report.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-3">
                          {getStatusBadge(report.status)}
                          <Badge variant="secondary">{getReasonLabel(report.reason)}</Badge>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <div>
                            <h4 className="font-medium text-gray-900 mb-1">Reporter</h4>
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-gray-400" />
                              <span className="text-sm">{report.reporter.name}</span>
                              <span className="text-xs text-gray-500">({report.reporter.email})</span>
                            </div>
                          </div>
                          
                          <div>
                            <h4 className="font-medium text-gray-900 mb-1">Reported User</h4>
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-red-400" />
                              <span className="text-sm">{report.reported_user.name}</span>
                              <span className="text-xs text-gray-500">({report.reported_user.email})</span>
                            </div>
                          </div>
                        </div>

                        <div className="mb-4">
                          <h4 className="font-medium text-gray-900 mb-1">Session</h4>
                          <div className="flex items-center gap-2">
                            <MessageSquare className="h-4 w-4 text-gray-400" />
                            <span className="text-sm">{report.session_title}</span>
                          </div>
                        </div>

                        <div className="mb-4">
                          <h4 className="font-medium text-gray-900 mb-2">Description</h4>
                          <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                            {report.description}
                          </p>
                        </div>

                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span>Reported {formatDate(report.created_at)}</span>
                          <span>Updated {formatDate(report.updated_at)}</span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-col gap-2 min-w-[120px]">
                        {report.status === 'pending' && (
                          <>
                            <Button 
                              size="sm" 
                              onClick={() => handleUpdateReportStatus(report.id, 'investigating')}
                              className="bg-blue-600 hover:bg-blue-700"
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              Investigate
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleUpdateReportStatus(report.id, 'dismissed')}
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              Dismiss
                            </Button>
                          </>
                        )}
                        
                        {report.status === 'investigating' && (
                          <>
                            <Button 
                              size="sm" 
                              onClick={() => handleUpdateReportStatus(report.id, 'resolved')}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Resolve
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleUpdateReportStatus(report.id, 'dismissed')}
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              Dismiss
                            </Button>
                          </>
                        )}

                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4 mr-1" />
                          View Details
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
