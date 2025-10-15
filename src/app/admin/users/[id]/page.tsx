'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Logo } from '@/components/common/logo';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, 
  User, 
  Mail, 
  Phone, 
  Calendar,
  MapPin,
  Star,
  MessageSquare,
  Users,
  Activity,
  Clock,
  TrendingUp,
  Shield,
  Eye,
  Flag,
  Settings,
  BarChart3,
  Ban,
  XCircle
} from 'lucide-react';
import { UserManagementService, type UserManagementData } from '@/lib/services/user-management-service';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';

export default function UserDetailPage() {
  const params = useParams();
  const userId = params.id as string;
  const [userData, setUserData] = useState<UserManagementData | null>(null);
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
    if (mounted && user && userId) {
      checkAdminAndLoadUserData();
    }
  }, [user, mounted, userId]);

  const checkAdminAndLoadUserData = async () => {
    if (!user) {
      router.push('/admin/login?redirect=' + encodeURIComponent(`/admin/users/${userId}`));
      return;
    }

    try {
      // For now, assume user is admin if they can access this page
      // You can add proper admin check here if needed
      setIsAdmin(true);
      await loadUserData();
    } catch (error) {
      console.error('Error loading user data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load user data.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const loadUserData = async () => {
    try {
      const userInfo = await UserManagementService.getUserById(userId);
      setUserData(userInfo);
    } catch (error) {
      console.error('Error loading user data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load user data.',
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

  const getDisplayName = (userData: UserManagementData | null) => {
    if (!userData) return 'Unknown User';
    if (userData.display_name) return userData.display_name;
    return userData.email?.split('@')[0] || 'Unknown User';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'suspended': return 'bg-yellow-500';
      case 'banned': return 'bg-red-500';
      case 'under_investigation': return 'bg-orange-500';
      case 'pending_verification': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return <Shield className="h-4 w-4" />;
      case 'moderator': return <Settings className="h-4 w-4" />;
      case 'therapist': return <User className="h-4 w-4" />;
      case 'user': return <User className="h-4 w-4" />;
      case 'suspended': return <XCircle className="h-4 w-4" />;
      case 'banned': return <Ban className="h-4 w-4" />;
      default: return <Users className="h-4 w-4" />;
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

  if (!userData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">User Not Found</h1>
          <p className="text-gray-600">The requested user could not be found.</p>
          <Button asChild className="mt-4">
            <Link href="/admin/users">Back to Users</Link>
          </Button>
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
                    Users
                  </Link>
                </Button>
                <span className="text-gray-400">/</span>
                <h1 className="text-xl font-semibold text-gray-900">{getDisplayName(userData)}</h1>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Button variant="outline" size="sm">
                <Flag className="h-4 w-4 mr-1" />
                Report User
              </Button>
              <Button variant="outline" size="sm">
                <Shield className="h-4 w-4 mr-1" />
                Moderate
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* User Profile Header */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row lg:items-start gap-6">
              {/* Avatar & Basic Info */}
              <div className="flex items-start gap-4">
                <div className="w-20 h-20 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center text-white text-2xl font-semibold">
                  {getDisplayName(userData).charAt(0).toUpperCase()}
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-1">{getDisplayName(userData)}</h2>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <Mail className="h-4 w-4" />
                      {userData.email}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge className={`${getStatusColor(userData.status)} text-white`}>
                      {userData.status}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* User ID and Creation Date */}
              <div className="flex-1">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">User ID:</span>
                    <p className="text-gray-600 font-mono text-xs">{userData.user_id}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Created:</span>
                    <p className="text-gray-600">{formatDate(userData.user_created_at)}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Status Information */}
            {userData.status_changed_at && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">Status Changed:</span>
                    <p className="text-gray-600">{formatDate(userData.status_changed_at)}</p>
                  </div>
                  {userData.status_reason && (
                    <div>
                      <span className="font-medium text-gray-700">Status Reason:</span>
                      <p className="text-gray-600">{userData.status_reason}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Roles and Permissions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* User Roles */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                User Roles ({userData.roles.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {userData.roles.map((roleData, index) => (
                  <div key={index} className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {getRoleIcon(roleData.role)}
                        <span className="font-medium capitalize">{roleData.role}</span>
                      </div>
                      <Badge variant="outline">Active</Badge>
                    </div>
                    <div className="mt-2 text-sm text-gray-600">
                      <p>Granted: {formatDate(roleData.granted_at)}</p>
                      {roleData.expires_at && (
                        <p>Expires: {formatDate(roleData.expires_at)}</p>
                      )}
                    </div>
                  </div>
                ))}
                {userData.roles.length === 0 && (
                  <p className="text-gray-500 text-sm">No roles assigned</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* User Permissions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Permissions ({userData.permissions.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {userData.permissions.map((permission, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <span className="text-sm font-medium">{permission.replace('_', ' ')}</span>
                    <Badge variant="secondary" className="text-xs">Active</Badge>
                  </div>
                ))}
                {userData.permissions.length === 0 && (
                  <p className="text-gray-500 text-sm">No permissions assigned</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Management Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Management Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm">
                <Flag className="h-4 w-4 mr-1" />
                Report User
              </Button>
              <Button variant="outline" size="sm">
                <Shield className="h-4 w-4 mr-1" />
                Change Status
              </Button>
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-1" />
                Manage Roles
              </Button>
              <Button variant="outline" size="sm">
                <Users className="h-4 w-4 mr-1" />
                View Sessions
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}