'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { AdminUserService } from '@/lib/services/admin-user-service';
import { UserWithStats } from '@/lib/database-types';
import { useAdminUserId } from '@/contexts/admin-context';
import { Ban, Mail, TrendingUp, AlertTriangle, Crown, Shield } from 'lucide-react';

interface UserActionDialogsProps {
  user: UserWithStats | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function SuspendUserDialog({ user, onClose, onSuccess }: UserActionDialogsProps) {
  const [loading, setLoading] = useState(false);
  const [reason, setReason] = useState('');
  const [duration, setDuration] = useState<string>('');
  const [suspensionType, setSuspensionType] = useState<'temporary' | 'permanent'>('temporary');
  const { toast } = useToast();
  const adminUserId = useAdminUserId();

  const handleSuspend = async () => {
    if (!user || !reason.trim() || !adminUserId) {
      toast({
        title: 'Error',
        description: !adminUserId ? 'Admin authentication required.' : 'Please provide a reason for suspension.',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);
    try {
      await AdminUserService.suspendUser({
        userId: user.id,
        reason: reason.trim(),
        duration: suspensionType === 'temporary' ? parseInt(duration) || undefined : undefined,
        adminUserId
      });

      toast({
        title: 'Success',
        description: `User has been ${suspensionType === 'permanent' ? 'permanently suspended' : `suspended for ${duration} days`}.`
      });

      onSuccess();
      onClose();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to suspend user.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <Dialog open={!!user} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Ban className="h-5 w-5 text-red-600" />
            Suspend User
          </DialogTitle>
          <DialogDescription>
            Suspend {user.display_name || user.email} from the platform
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <span className="font-medium text-red-900">Warning</span>
            </div>
            <p className="text-sm text-red-800">
              This action will immediately prevent the user from accessing the platform.
            </p>
          </div>

          <div>
            <Label htmlFor="suspension-type">Suspension Type</Label>
            <Select value={suspensionType} onValueChange={(value: 'temporary' | 'permanent') => setSuspensionType(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="temporary">Temporary</SelectItem>
                <SelectItem value="permanent">Permanent</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {suspensionType === 'temporary' && (
            <div>
              <Label htmlFor="duration">Duration (days)</Label>
              <Input
                id="duration"
                type="number"
                min="1"
                max="365"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                placeholder="Enter number of days"
              />
            </div>
          )}

          <div>
            <Label htmlFor="reason">Reason for Suspension *</Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Explain why this user is being suspended..."
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button 
            variant="destructive" 
            onClick={handleSuspend} 
            disabled={loading || !reason.trim()}
          >
            {loading ? 'Suspending...' : `Suspend User`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function UpgradeUserDialog({ user, onClose, onSuccess }: UserActionDialogsProps) {
  const [loading, setLoading] = useState(false);
  const [targetTier, setTargetTier] = useState<'pro' | 'free'>('pro');
  const { toast } = useToast();
  const adminUserId = useAdminUserId();

  const currentTier = (user as any)?.subscription_tier || 'free';
  const isTrialActive = (user as any)?.is_trial_active || false;

  const handleUpgrade = async () => {
    if (!user || !adminUserId) {
      toast({
        title: 'Error',
        description: 'Admin authentication required.',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);
    try {
      await AdminUserService.upgradeUser({
        userId: user.id,
        targetTier,
        adminUserId
      });

      toast({
        title: 'Success',
        description: `User tier updated to ${targetTier.toUpperCase()}.`
      });

      onSuccess();
      onClose();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update user tier.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <Dialog open={!!user} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-purple-600" />
            Update User Tier
          </DialogTitle>
          <DialogDescription>
            Change subscription tier for {user.display_name || user.email}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">Current Status</h4>
            <div className="flex flex-wrap gap-2">
              <Badge variant={currentTier === 'pro' ? 'default' : 'outline'}>
                {currentTier.toUpperCase()}
              </Badge>
              {isTrialActive && (
                <Badge className="bg-blue-100 text-blue-800">
                  Trial Active
                </Badge>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="target-tier">New Tier</Label>
            <Select value={targetTier} onValueChange={(value: 'pro' | 'free') => setTargetTier(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="free">Free Tier</SelectItem>
                <SelectItem value="pro">Pro Tier</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {targetTier === 'pro' && (
            <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
              <p className="text-sm text-purple-800">
                <strong>Pro Tier Benefits:</strong> Unlimited sessions, priority support, advanced features
              </p>
            </div>
          )}

          {targetTier === 'free' && currentTier === 'pro' && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <span className="font-medium text-amber-900">Downgrade Warning</span>
              </div>
              <p className="text-sm text-amber-800">
                User will lose Pro features and may have limited access.
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button 
            onClick={handleUpgrade} 
            disabled={loading || targetTier === currentTier}
            className={targetTier === 'pro' ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700' : ''}
          >
            {loading ? 'Updating...' : `Update to ${targetTier.toUpperCase()}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function SendEmailDialog({ user, onClose, onSuccess }: UserActionDialogsProps) {
  const [loading, setLoading] = useState(false);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const { toast } = useToast();
  const adminUserId = useAdminUserId();

  const handleSendEmail = async () => {
    if (!user || !subject.trim() || !message.trim() || !adminUserId) {
      toast({
        title: 'Error',
        description: !adminUserId ? 'Admin authentication required.' : 'Please provide both subject and message.',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);
    try {
      await AdminUserService.sendAdminEmail({
        userId: user.id,
        subject: subject.trim(),
        message: message.trim(),
        adminUserId
      });

      toast({
        title: 'Success',
        description: 'Email sent successfully.'
      });

      onSuccess();
      onClose();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to send email.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <Dialog open={!!user} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-blue-600" />
            Send Admin Email
          </DialogTitle>
          <DialogDescription>
            Send an administrative email to {user.display_name || user.email}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>To:</strong> {user.email}
            </p>
          </div>

          <div>
            <Label htmlFor="email-subject">Subject *</Label>
            <Input
              id="email-subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Enter email subject..."
            />
          </div>

          <div>
            <Label htmlFor="email-message">Message *</Label>
            <Textarea
              id="email-message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Enter your message..."
              rows={6}
            />
            <p className="text-xs text-gray-500 mt-1">
              {message.length} characters
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button 
            onClick={handleSendEmail} 
            disabled={loading || !subject.trim() || !message.trim()}
          >
            {loading ? 'Sending...' : 'Send Email'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}