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
  MessageSquare,
  Flag,
  Users,
  Calendar
} from 'lucide-react';
import { AdminService } from '@/lib/services/admin-service';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';

// Mock data for session reports - in production this would come from the database
const mockSessionReports = [
  {
    id: '1',
    session_id: 'session-1',
    session_title: 'Tech Career Discussion',
    reporter: { id: '1', name: 'John Doe', email: 'john@example.com' },
    reason: 'inappropriate_content',
    description: 'Session contained inappropriate discussions not related to the topic. Multiple participants were sharing personal information.',
    status: 'pending',
    participants_count: 5,
    duration_minutes: 45,
    created_at: '2024-01-15T10:30:00Z',
    updated_at: '2024-01-15T10:30:00Z'
  },
  {
    id: '2',
    session_id: 'session-2',
    session_title: 'Startup Networking',
    reporter: { id: '3', name: 'Mike Johnson', email: 'mike@example.com' },
    reason: 'spam_promotion',
    description: 'Session was hijacked by someone promoting their MLM business. They ignored requests to stop.',
    status: 'resolved',
    participants_count: 8,
    duration_minutes: 30,
    created_at: '2024-01-14T15:45:00Z',
    updated_at: '2024-01-14T16:30:00Z'
  },
  {
    id: '3',
    session_id: 'session-3',
    session_title: 'Mental Health Support',
    reporter: { id: '5', name: 'Emily Davis', email: 'emily@example.com' },
    reason: 'safety_concern',
    description: 'Participant shared concerning statements about self-harm. Session was ended early for safety.',
    status: 'investigating',
    participants_count: 3,
    duration_minutes: 15,
    created_at: '2024-01-13T09:15:00Z',
    updated_at: '2024-01-13T14:20:00Z'
  }
];

export default function SessionReportsPage() {
  const [reports, setReports] = useState(mockSessionReports);
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
      router.push('/admin/login?redirect=' + encodeURIComponent('/admin/sessions/reports'));
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
      // In production, load real session reports from database
      // const reportsData = await AdminService.getSessionReports();
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
      case 'inappropriate_content':
        return 'Inappropriate Content';
      case 'spam_promotion':
        return 'Spam/Promotion';
      case 'safety_concern':
        return 'Safety Concern';
      case 'harassment':
        return 'Harassment';
      case 'technical_issues':
        return 'Technical Issues';
      case 'other':
        return 'Other';
      default:
        return reason;
    }
  };

  const getSeverityColor = (reason: string) => {
    switch (reason) {
      case 'safety_concern':
        return 'bg-red-100 text-red-800';
      case 'harassment':
        return 'bg-orange-100 text-orange-800';
      case 'inappropriate_content':
        return 'bg-yellow-100 text-yellow-800';
      case 'spam_promotion':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
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
                  <Link href="/admin/sessions">
                    <ArrowLeft className="h-4 w-4 mr-1" />
                    Session Management
                  </Link>
                </Button>
                <span className="text-gray-400">/</span>
                <h1 className="text-xl font-semibold text-gray-900">Session Reports</h1>
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
                  <p className="text-sm font-medium text-gray-600">Safety Concerns</p>
                  <p className="text-3xl font-bold text-red-600">
                    {reports.filter(r => r.reason === 'safety_concern').length}
                  </p>
                </div>
                <Shield className="h-8 w-8 text-red-600" />
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
              Session Reports ({reports.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {reports.length === 0 ? (
              <div className="text-center py-12">
                <Shield className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No session reports found</h3>
                <p className="text-gray-600">No session reports have been submitted yet.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {reports.map((report) => (
                  <div key={report.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-3">
                          {getStatusBadge(report.status)}
                          <Badge className={getSeverityColor(report.reason)}>
                            {getReasonLabel(report.reason)}
                          </Badge>
                        </div>
                        
                        <div className="mb-4">
                          <h3 className="text-lg font-semibold text-gray-900 mb-2">{report.session_title}</h3>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                            <div className="flex items-center gap-2">
                              <Users className="h-4 w-4" />
                              <span>{report.participants_count} participants</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4" />
                              <span>{report.duration_minutes} minutes</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <MessageSquare className="h-4 w-4" />
                              <span>Session ID: {report.session_id}</span>
                            </div>
                          </div>
                        </div>

                        <div className="mb-4">
                          <h4 className="font-medium text-gray-900 mb-1">Reported by</h4>
                          <div className="text-sm text-gray-600">
                            {report.reporter.name} ({report.reporter.email})
                          </div>
                        </div>

                        <div className="mb-4">
                          <h4 className="font-medium text-gray-900 mb-2">Report Details</h4>
                          <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                            {report.description}
                          </p>
                        </div>

                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            <span>Reported {formatDate(report.created_at)}</span>
                          </div>
                          <span>Updated {formatDate(report.updated_at)}</span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-col gap-2 min-w-[140px]">
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
                          <MessageSquare className="h-4 w-4 mr-1" />
                          View Session
                        </Button>

                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4 mr-1" />
                          Full Details
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
