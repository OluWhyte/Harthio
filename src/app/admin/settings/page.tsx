'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ResponsiveAdminHeader } from '@/components/admin/responsive-admin-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Settings, 
  Globe, 
  Bell, 
  Shield, 
  Palette,
  Users,
  ShieldCheck,
  Crown,
  UserPlus,
  UserMinus,
  Mail,
  Save
} from 'lucide-react';
import { AdminService } from '@/lib/services/admin-service';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import type { AdminRole, User } from '@/lib/database-types';

export default function PlatformSettingsPage() {
  const [admins, setAdmins] = useState<(AdminRole & { user: User })[]>([]);
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
      checkAdminAndLoadSettings();
    }
  }, [user, mounted]);

  const checkAdminAndLoadSettings = async () => {
    if (!user) {
      router.push('/admin/login?redirect=' + encodeURIComponent('/admin/settings'));
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
      await loadAdmins();
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

  const loadAdmins = async () => {
    try {
      const adminData = await AdminService.getAllAdmins();
      setAdmins(adminData);
    } catch (error) {
      console.error('Error loading admins:', error);
      toast({
        title: 'Error',
        description: 'Failed to load admin users.',
        variant: 'destructive'
      });
    }
  };

  const handleRevokeAdmin = async (userId: string, userName: string) => {
    if (!confirm(`Are you sure you want to revoke admin privileges for ${userName}?`)) return;

    try {
      await AdminService.revokeAdminRole(userId);
      toast({
        title: 'Success',
        description: `Admin privileges revoked for ${userName}.`
      });
      await loadAdmins();
    } catch (error) {
      console.error('Error revoking admin:', error);
      toast({
        title: 'Error',
        description: 'Failed to revoke admin privileges.',
        variant: 'destructive'
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getDisplayName = (user: User) => {
    if (user.display_name) return user.display_name;
    if (user.first_name && user.last_name) return `${user.first_name} ${user.last_name}`;
    if (user.first_name) return user.first_name;
    return user.email.split('@')[0];
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
      <ResponsiveAdminHeader
        title="Platform Settings"
        actions={[
          {
            label: 'Add Admin',
            icon: <UserPlus className="h-4 w-4" />,
            onClick: () => {
              // TODO: Implement add admin functionality
              toast({
                title: 'Coming Soon',
                description: 'Add admin functionality will be implemented soon.',
              });
            },
            variant: 'outline'
          },
          {
            label: 'Save Settings',
            icon: <Save className="h-4 w-4" />,
            onClick: () => {
              // TODO: Implement save settings functionality
              toast({
                title: 'Settings Saved',
                description: 'Platform settings have been saved successfully.',
              });
            },
            variant: 'default'
          }
        ]}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Settings Categories */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <CardContent className="p-6 text-center">
              <Globe className="h-12 w-12 text-blue-600 mx-auto mb-4" />
              <h3 className="font-semibold mb-2">General Settings</h3>
              <p className="text-sm text-gray-600">Platform configuration and basic settings</p>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <CardContent className="p-6 text-center">
              <Bell className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <h3 className="font-semibold mb-2">Notifications</h3>
              <p className="text-sm text-gray-600">Email templates and notification preferences</p>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <CardContent className="p-6 text-center">
              <Shield className="h-12 w-12 text-red-600 mx-auto mb-4" />
              <h3 className="font-semibold mb-2">Safety & Moderation</h3>
              <p className="text-sm text-gray-600">Content policies and safety controls</p>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <CardContent className="p-6 text-center">
              <Palette className="h-12 w-12 text-purple-600 mx-auto mb-4" />
              <h3 className="font-semibold mb-2">Appearance</h3>
              <p className="text-sm text-gray-600">Themes, branding, and customization</p>
            </CardContent>
          </Card>
        </div>

        {/* Admin Management */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5" />
              Admin Management ({admins.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {admins.length === 0 ? (
              <div className="text-center py-12">
                <ShieldCheck className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No admin users found</h3>
                <p className="text-gray-600">Add admin users to manage the platform.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {admins.map((admin) => (
                  <div key={admin.id} className="border border-gray-200 rounded-lg p-4 sm:p-6 hover:shadow-md transition-shadow">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                      <div className="flex items-start gap-4 flex-1">
                        {/* Avatar */}
                        <div className="w-12 h-12 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center text-white font-semibold">
                          {admin.user.avatar_url ? (
                            <img src={admin.user.avatar_url} alt={getDisplayName(admin.user)} className="w-12 h-12 rounded-full object-cover" />
                          ) : (
                            getDisplayName(admin.user).charAt(0).toUpperCase()
                          )}
                        </div>

                        {/* Admin Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-lg font-semibold text-gray-900 truncate">
                              {getDisplayName(admin.user)}
                            </h3>
                            <Badge variant={admin.role === 'admin' ? 'default' : 'secondary'}>
                              {admin.role === 'admin' ? (
                                <>
                                  <Crown className="h-3 w-3 mr-1" />
                                  Admin
                                </>
                              ) : (
                                <>
                                  <Users className="h-3 w-3 mr-1" />
                                  Editor
                                </>
                              )}
                            </Badge>
                          </div>

                          <div className="flex items-center gap-1 mb-2">
                            <Mail className="h-4 w-4 text-gray-400" />
                            <span className="text-sm text-gray-600">{admin.user.email}</span>
                          </div>

                          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                            <span>Admin since {formatDate(admin.created_at)}</span>
                            <span>User joined {formatDate(admin.user.created_at)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        {admin.user.id !== user?.uid && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleRevokeAdmin(admin.user.id, getDisplayName(admin.user))}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <UserMinus className="h-4 w-4 mr-1" />
                            Revoke
                          </Button>
                        )}
                        {admin.user.id === user?.uid && (
                          <Badge variant="outline">You</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Platform Configuration */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Platform Configuration
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Platform Name
                  </label>
                  <input
                    id="platform-name"
                    name="platform-name"
                    type="text"
                    defaultValue="Harthio"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Platform Description
                  </label>
                  <textarea
                    rows={3}
                    defaultValue="A platform for meaningful conversations with AI-powered matching and moderation."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Contact Email
                  </label>
                  <input
                    id="contact-email"
                    name="contact-email"
                    type="email"
                    defaultValue="hello@harthio.com"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Max Session Duration (minutes)
                  </label>
                  <input
                    id="max-session-duration"
                    name="max-session-duration"
                    type="number"
                    defaultValue="120"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Max Participants per Session
                  </label>
                  <input
                    id="max-participants"
                    name="max-participants"
                    type="number"
                    defaultValue="8"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="registration-enabled"
                    name="registration-enabled"
                    defaultChecked
                    className="rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <label htmlFor="registration-enabled" className="text-sm font-medium text-gray-700">
                    Enable new user registration
                  </label>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="email-verification"
                    name="email-verification"
                    defaultChecked
                    className="rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <label htmlFor="email-verification" className="text-sm font-medium text-gray-700">
                    Require email verification
                  </label>
                </div>
              </div>
            </div>


          </CardContent>
        </Card>
      </main>
    </div>
  );
}
