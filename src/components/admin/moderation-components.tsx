'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { ModerationService, UserReport, ContentFlag } from '@/lib/services/moderation-service';
import { useAdminUserId } from '@/contexts/admin-context';
import { 
  AlertTriangle, CheckCircle, XCircle, Eye, MessageSquare, 
  User, Calendar, Clock, Flag, Shield, Ban
} from 'lucide-react';

interface ReportCardProps {
  report: UserReport;
  onResolve: () => void;
}

export function ReportCard({ report, onResolve }: ReportCardProps) {
  const [showResolveDialog, setShowResolveDialog] = useState(false);
  const [resolving, setResolving] = useState(false);
  const [resolutionStatus, setResolutionStatus] = useState<'resolved' | 'dismissed'>('resolved');
  const [resolutionNotes, setResolutionNotes] = useState('');
  const { toast } = useToast();
  const adminUserId = useAdminUserId();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      case 'dismissed': return 'bg-gray-100 text-gray-800';
      case 'reviewed': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getReportTypeColor = (type: string) => {
    switch (type) {
      case 'harassment': return 'bg-red-100 text-red-800';
      case 'spam': return 'bg-orange-100 text-orange-800';
      case 'inappropriate': return 'bg-purple-100 text-purple-800';
      case 'violence': return 'bg-red-100 text-red-800';
      case 'hate_speech': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleResolve = async () => {
    if (!resolutionNotes.trim() || !adminUserId) {
      toast({
        title: 'Error',
        description: !adminUserId ? 'Admin authentication required.' : 'Please provide resolution notes.',
        variant: 'destructive'
      });
      return;
    }

    setResolving(true);
    try {
      await ModerationService.resolveReport({
        reportId: report.id,
        adminUserId,
        status: resolutionStatus,
        resolutionNotes: resolutionNotes.trim()
      });

      toast({
        title: 'Success',
        description: `Report ${resolutionStatus} successfully.`
      });

      setShowResolveDialog(false);
      onResolve();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to resolve report.',
        variant: 'destructive'
      });
    } finally {
      setResolving(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <>
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              <div>
                <h3 className="font-semibold text-gray-900">User Report</h3>
                <p className="text-sm text-gray-600">ID: {report.id.slice(0, 8)}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Badge className={getReportTypeColor(report.report_type)}>
                {report.report_type.replace('_', ' ')}
              </Badge>
              <Badge className={getStatusColor(report.status)}>
                {report.status}
              </Badge>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Reporter & Reported User */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div className="p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <User className="h-4 w-4 text-blue-600" />
                <span className="font-medium text-blue-900">Reporter</span>
              </div>
              <p className="text-blue-800">
                {report.reporter.display_name || report.reporter.email}
              </p>
            </div>
            <div className="p-3 bg-red-50 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <User className="h-4 w-4 text-red-600" />
                <span className="font-medium text-red-900">Reported User</span>
              </div>
              <p className="text-red-800">
                {report.reported_user.display_name || report.reported_user.email}
              </p>
            </div>
          </div>

          {/* Description */}
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Description</h4>
            <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">
              {report.description}
            </p>
          </div>

          {/* Metadata */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              {formatDate(report.created_at)}
            </div>
            {report.reported_content_id && (
              <div className="flex items-center gap-1">
                <MessageSquare className="h-4 w-4" />
                Content ID: {report.reported_content_id.slice(0, 8)}
              </div>
            )}
          </div>

          {/* Resolution Info */}
          {report.status !== 'pending' && (
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="font-medium text-gray-900">Resolution</span>
              </div>
              {report.resolution_notes && (
                <p className="text-sm text-gray-700 mb-2">{report.resolution_notes}</p>
              )}
              <p className="text-xs text-gray-600">
                {report.reviewed_at && `Resolved on ${formatDate(report.reviewed_at)}`}
              </p>
            </div>
          )}

          {/* Actions */}
          {report.status === 'pending' && (
            <div className="flex gap-2 pt-2 border-t">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowResolveDialog(true)}
                className="flex-1"
              >
                <Shield className="h-4 w-4 mr-2" />
                Resolve
              </Button>
              <Button variant="outline" size="sm">
                <Eye className="h-4 w-4 mr-2" />
                View Details
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Resolve Dialog */}
      <Dialog open={showResolveDialog} onOpenChange={setShowResolveDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Resolve Report</DialogTitle>
            <DialogDescription>
              How would you like to resolve this report?
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Resolution Status
              </label>
              <Select value={resolutionStatus} onValueChange={(value: 'resolved' | 'dismissed') => setResolutionStatus(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="resolved">Resolved - Action Taken</SelectItem>
                  <SelectItem value="dismissed">Dismissed - No Action Needed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Resolution Notes *
              </label>
              <Textarea
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
                placeholder="Explain what action was taken or why the report was dismissed..."
                rows={4}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowResolveDialog(false)} disabled={resolving}>
              Cancel
            </Button>
            <Button onClick={handleResolve} disabled={resolving || !resolutionNotes.trim()}>
              {resolving ? 'Resolving...' : 'Resolve Report'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

interface FlagCardProps {
  flag: ContentFlag;
  onResolve: () => void;
}

export function FlagCard({ flag, onResolve }: FlagCardProps) {
  const [resolving, setResolving] = useState(false);
  const { toast } = useToast();
  const adminUserId = useAdminUserId();

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getFlagTypeColor = (type: string) => {
    switch (type) {
      case 'ai_detected': return 'bg-purple-100 text-purple-800';
      case 'user_reported': return 'bg-blue-100 text-blue-800';
      case 'admin_flagged': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleResolve = async (status: 'resolved' | 'dismissed') => {
    if (!adminUserId) {
      toast({
        title: 'Error',
        description: 'Admin authentication required.',
        variant: 'destructive'
      });
      return;
    }

    setResolving(true);
    try {
      await ModerationService.resolveFlag(
        flag.id,
        adminUserId,
        status
      );

      toast({
        title: 'Success',
        description: `Flag ${status} successfully.`
      });

      onResolve();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to resolve flag.',
        variant: 'destructive'
      });
    } finally {
      setResolving(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-2">
            <Flag className="h-5 w-5 text-red-500" />
            <div>
              <h3 className="font-semibold text-gray-900">Content Flag</h3>
              <p className="text-sm text-gray-600">
                {flag.content_type} • ID: {flag.content_id.slice(0, 8)}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Badge className={getSeverityColor(flag.severity)}>
              {flag.severity.toUpperCase()}
            </Badge>
            <Badge className={getFlagTypeColor(flag.flag_type)}>
              {flag.flag_type.replace('_', ' ')}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Reason */}
        <div>
          <h4 className="font-medium text-gray-900 mb-2">Reason</h4>
          <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">
            {flag.reason}
          </p>
        </div>

        {/* Metadata */}
        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
          <div className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            {formatDate(flag.created_at)}
          </div>
          <div className="flex items-center gap-1">
            <MessageSquare className="h-4 w-4" />
            {flag.content_type}
          </div>
        </div>

        {/* Actions */}
        {flag.status === 'active' && (
          <div className="flex gap-2 pt-2 border-t">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleResolve('resolved')}
              disabled={resolving}
              className="flex-1"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Resolve
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleResolve('dismissed')}
              disabled={resolving}
              className="flex-1"
            >
              <XCircle className="h-4 w-4 mr-2" />
              Dismiss
            </Button>
          </div>
        )}

        {flag.status !== 'active' && (
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="font-medium text-gray-900">
                {flag.status === 'resolved' ? 'Resolved' : 'Dismissed'}
              </span>
            </div>
            {flag.resolved_at && (
              <p className="text-xs text-gray-600 mt-1">
                {formatDate(flag.resolved_at)}
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}