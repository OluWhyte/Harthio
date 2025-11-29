'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
import { SettingsService, PlatformSettings, AdminUserInfo, CreateAdminParams } from '@/lib/services/settings-service';
import { useAdminUserId } from '@/contexts/admin-context';
import { 
  Save, TestTube, CheckCircle, XCircle, AlertTriangle,
  Mail, Database, Brain, Shield, Users, Plus, Trash2,
  Settings, Globe, Bell, Palette, Clock, Key
} from 'lucide-react';

interface PlatformSettingsFormProps {
  settings: PlatformSettings;
  onSave: (settings: Partial<PlatformSettings>) => Promise<void>;
}

export function PlatformSettingsForm({ settings, onSave }: PlatformSettingsFormProps) {
  const [formData, setFormData] = useState<PlatformSettings>(settings);
  const [saving, setSaving] = useState(false);
  const [testingEmail, setTestingEmail] = useState(false);
  const [testingAI, setTestingAI] = useState(false);
  const { toast } = useToast();

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(formData);
      toast({
        title: 'Success',
        description: 'Platform settings updated successfully.'
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update settings.',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  const testEmailConfig = async () => {
    setTestingEmail(true);
    try {
      const result = await SettingsService.testEmailConfig();
      toast({
        title: result.success ? 'Success' : 'Error',
        description: result.message,
        variant: result.success ? 'default' : 'destructive'
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to test email configuration.',
        variant: 'destructive'
      });
    } finally {
      setTestingEmail(false);
    }
  };

  const testAIConfig = async () => {
    setTestingAI(true);
    try {
      const result = await SettingsService.testAIConfig();
      toast({
        title: result.success ? 'Success' : 'Error',
        description: result.message,
        variant: result.success ? 'default' : 'destructive'
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to test AI configuration.',
        variant: 'destructive'
      });
    } finally {
      setTestingAI(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Platform Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Platform Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="platform_name">Platform Name</Label>
              <Input
                id="platform_name"
                value={formData.platform_name}
                onChange={(e) => setFormData({ ...formData, platform_name: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="contact_email">Contact Email</Label>
              <Input
                id="contact_email"
                type="email"
                value={formData.contact_email}
                onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
              />
            </div>
          </div>
          <div>
            <Label htmlFor="platform_description">Platform Description</Label>
            <Textarea
              id="platform_description"
              value={formData.platform_description}
              onChange={(e) => setFormData({ ...formData, platform_description: e.target.value })}
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Feature Toggles */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Feature Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>User Registration</Label>
                <p className="text-sm text-gray-600">Allow new users to register</p>
              </div>
              <Switch
                checked={formData.registration_enabled}
                onCheckedChange={(checked) => setFormData({ ...formData, registration_enabled: checked })}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Email Verification</Label>
                <p className="text-sm text-gray-600">Require email verification</p>
              </div>
              <Switch
                checked={formData.email_verification_required}
                onCheckedChange={(checked) => setFormData({ ...formData, email_verification_required: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>AI Moderation</Label>
                <p className="text-sm text-gray-600">Enable AI content moderation</p>
              </div>
              <Switch
                checked={formData.ai_moderation_enabled}
                onCheckedChange={(checked) => setFormData({ ...formData, ai_moderation_enabled: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Maintenance Mode</Label>
                <p className="text-sm text-gray-600">Disable platform access</p>
              </div>
              <Switch
                checked={formData.maintenance_mode}
                onCheckedChange={(checked) => setFormData({ ...formData, maintenance_mode: checked })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Session Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Session Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="max_session_duration">Max Duration (minutes)</Label>
              <Input
                id="max_session_duration"
                type="number"
                min="15"
                max="480"
                value={formData.max_session_duration}
                onChange={(e) => setFormData({ ...formData, max_session_duration: parseInt(e.target.value) })}
              />
            </div>
            <div>
              <Label htmlFor="max_participants">Max Participants</Label>
              <Input
                id="max_participants"
                type="number"
                min="2"
                max="20"
                value={formData.max_participants_per_session}
                onChange={(e) => setFormData({ ...formData, max_participants_per_session: parseInt(e.target.value) })}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Approval Required</Label>
                <p className="text-sm text-gray-600">Require host approval</p>
              </div>
              <Switch
                checked={formData.session_approval_required}
                onCheckedChange={(checked) => setFormData({ ...formData, session_approval_required: checked })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Email Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Email Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="email_provider">Email Provider</Label>
              <Select value={formData.email_provider} onValueChange={(value: 'resend' | 'sendgrid' | 'mailgun') => setFormData({ ...formData, email_provider: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="resend">Resend</SelectItem>
                  <SelectItem value="sendgrid">SendGrid</SelectItem>
                  <SelectItem value="mailgun">Mailgun</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="from_email">From Email</Label>
              <Input
                id="from_email"
                type="email"
                value={formData.from_email}
                onChange={(e) => setFormData({ ...formData, from_email: e.target.value })}
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={testEmailConfig} disabled={testingEmail}>
              <TestTube className="h-4 w-4 mr-2" />
              {testingEmail ? 'Testing...' : 'Test Email Config'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* AI Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            AI Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="ai_provider">AI Provider</Label>
              <Select value={formData.ai_provider} onValueChange={(value: 'openai' | 'anthropic' | 'google') => setFormData({ ...formData, ai_provider: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="openai">OpenAI</SelectItem>
                  <SelectItem value="anthropic">Anthropic</SelectItem>
                  <SelectItem value="google">Google</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="ai_model">Model</Label>
              <Input
                id="ai_model"
                value={formData.ai_model}
                onChange={(e) => setFormData({ ...formData, ai_model: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="ai_temperature">Temperature</Label>
              <Input
                id="ai_temperature"
                type="number"
                min="0"
                max="2"
                step="0.1"
                value={formData.ai_temperature}
                onChange={(e) => setFormData({ ...formData, ai_temperature: parseFloat(e.target.value) })}
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={testAIConfig} disabled={testingAI}>
              <TestTube className="h-4 w-4 mr-2" />
              {testingAI ? 'Testing...' : 'Test AI Config'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Security Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Security Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="password_min_length">Min Password Length</Label>
              <Input
                id="password_min_length"
                type="number"
                min="6"
                max="32"
                value={formData.password_min_length}
                onChange={(e) => setFormData({ ...formData, password_min_length: parseInt(e.target.value) })}
              />
            </div>
            <div>
              <Label htmlFor="session_timeout">Session Timeout (minutes)</Label>
              <Input
                id="session_timeout"
                type="number"
                min="30"
                max="1440"
                value={formData.session_timeout_minutes}
                onChange={(e) => setFormData({ ...formData, session_timeout_minutes: parseInt(e.target.value) })}
              />
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Require 2FA for Admins</Label>
              <p className="text-sm text-gray-600">Enforce two-factor authentication</p>
            </div>
            <Switch
              checked={formData.require_2fa_for_admins}
              onCheckedChange={(checked) => setFormData({ ...formData, require_2fa_for_admins: checked })}
            />
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving} className="gap-2">
          <Save className="h-4 w-4" />
          {saving ? 'Saving...' : 'Save Settings'}
        </Button>
      </div>
    </div>
  );
}

interface AdminManagementProps {
  admins: AdminUserInfo[];
  onRefresh: () => void;
}

export function AdminManagement({ admins, onRefresh }: AdminManagementProps) {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminRole, setNewAdminRole] = useState<'admin' | 'editor'>('editor');
  const { toast } = useToast();
  const adminUserId = useAdminUserId();

  const handleCreateAdmin = async () => {
    if (!newAdminEmail.trim() || !adminUserId) {
      toast({
        title: 'Error',
        description: 'Please provide a valid email address.',
        variant: 'destructive'
      });
      return;
    }

    setCreating(true);
    try {
      await SettingsService.createAdmin({
        email: newAdminEmail.trim(),
        role: newAdminRole,
        adminUserId
      });

      toast({
        title: 'Success',
        description: 'Admin user created successfully.'
      });

      setShowCreateDialog(false);
      setNewAdminEmail('');
      setNewAdminRole('editor');
      onRefresh();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create admin user.',
        variant: 'destructive'
      });
    } finally {
      setCreating(false);
    }
  };

  const handleRemoveAdmin = async (adminId: string) => {
    if (!adminUserId) return;

    try {
      await SettingsService.removeAdmin(adminId, adminUserId);
      toast({
        title: 'Success',
        description: 'Admin access removed successfully.'
      });
      onRefresh();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to remove admin access.',
        variant: 'destructive'
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Admin Users ({admins.length})
            </CardTitle>
            <Button onClick={() => setShowCreateDialog(true)} size="sm" className="gap-2">
              <Plus className="h-4 w-4" />
              Add Admin
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {admins.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No admin users</h3>
              <p className="text-gray-600">Add admin users to manage the platform.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {admins.map((admin) => (
                <div key={admin.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-semibold">
                      {(admin.display_name || admin.email).charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">
                        {admin.display_name || admin.email}
                      </h4>
                      <p className="text-sm text-gray-600">{admin.email}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant={admin.role === 'admin' ? 'default' : 'secondary'}>
                          {admin.role}
                        </Badge>
                        <span className="text-xs text-gray-500">
                          Added {formatDate(admin.created_at)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {admin.last_login && (
                      <span className="text-xs text-gray-500">
                        Last login: {formatDate(admin.last_login)}
                      </span>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRemoveAdmin(admin.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Admin Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Admin User</DialogTitle>
            <DialogDescription>
              Grant admin access to an existing user. They must be registered first.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="admin-email">Email Address</Label>
              <Input
                id="admin-email"
                type="email"
                value={newAdminEmail}
                onChange={(e) => setNewAdminEmail(e.target.value)}
                placeholder="user@example.com"
              />
            </div>

            <div>
              <Label htmlFor="admin-role">Role</Label>
              <Select value={newAdminRole} onValueChange={(value: 'admin' | 'editor') => setNewAdminRole(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="editor">Editor - Limited permissions</SelectItem>
                  <SelectItem value="admin">Admin - Full permissions</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)} disabled={creating}>
              Cancel
            </Button>
            <Button onClick={handleCreateAdmin} disabled={creating || !newAdminEmail.trim()}>
              {creating ? 'Creating...' : 'Add Admin'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}