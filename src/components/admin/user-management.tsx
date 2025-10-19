"use client";

import { useState, useEffect } from 'react';
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { 
  Users, Settings, Shield, AlertTriangle, Clock, Search, 
  UserPlus, UserMinus, Ban, CheckCircle, XCircle, Eye,
  Calendar, Activity, Crown, Gavel, Stethoscope, UserCheck,
  MoreHorizontal
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { 
  UserManagementService, 
  type UserManagementData, 
  type UserRole, 
  type UserStatus,
  type UserPermission,
  type AdminAction
} from '@/lib/services/user-management-service';

// Simple fallback component for when the main component fails
function UserManagementFallback() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          User Management
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center py-8">
          <p className="text-gray-600 mb-4">User management is temporarily unavailable.</p>
          <Button onClick={() => window.location.reload()}>
            Refresh Page
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export function UserManagement() {
  const { user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [users, setUsers] = useState<UserManagementData[]>([]);
  const [adminActions, setAdminActions] = useState<AdminAction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserManagementData | null>(null);
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [quickViewUser, setQuickViewUser] = useState<UserManagementData | null>(null);
  const [actionType, setActionType] = useState<'role' | 'status' | 'permission'>('role');
  const [hasError, setHasError] = useState(false);


  useEffect(() => {
    loadUsers();
    loadAdminActions();
  }, []);

  const loadUsers = async () => {
    try {
      const data = await UserManagementService.getAllUsers();
      // Ensure data is always an array with safe defaults
      const safeData = Array.isArray(data) ? data.map(user => ({
        ...user,
        email: user.email || '',
        display_name: user.display_name || '',
        user_id: user.user_id || '',
        status: user.status || 'active',
        roles: Array.isArray(user.roles) ? user.roles : [],
        permissions: Array.isArray(user.permissions) ? user.permissions : []
      })) : [];
      setUsers(safeData);
      setHasError(false);
    } catch (error) {
      console.error('Error loading users:', error);
      setHasError(true);
      toast({
        title: 'Error',
        description: 'Failed to load users',
        variant: 'destructive',
      });
      setUsers([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  const loadAdminActions = async () => {
    try {
      const actions = await UserManagementService.getAdminActions(20);
      // Ensure actions is always an array with safe defaults
      const safeActions = Array.isArray(actions) ? actions.map(action => ({
        ...action,
        action_type: action.action_type || '',
        admin_id: action.admin_id || '',
        target_user_id: action.target_user_id || '',
        reason: action.reason || ''
      })) : [];
      setAdminActions(safeActions);
    } catch (error) {
      console.error('Failed to load admin actions:', error);
      setHasError(true);
      setAdminActions([]); // Set empty array on error
    }
  };

  const handleUserAction = async (
    targetUserId: string,
    action: 'grant_role' | 'revoke_role' | 'change_status' | 'grant_permission' | 'revoke_permission',
    value: string,
    reason?: string,
    expiresAt?: Date
  ) => {
    if (!user?.uid) return;

    try {
      switch (action) {
        case 'grant_role':
          await UserManagementService.grantRole(targetUserId, value as UserRole, user.uid, reason, expiresAt);
          break;
        case 'revoke_role':
          await UserManagementService.revokeRole(targetUserId, value as UserRole, user.uid, reason);
          break;
        case 'change_status':
          await UserManagementService.changeUserStatus(targetUserId, value as UserStatus, user.uid, reason, expiresAt);
          break;
        case 'grant_permission':
          await UserManagementService.grantPermission(targetUserId, value as UserPermission, user.uid, expiresAt);
          break;
        case 'revoke_permission':
          await UserManagementService.revokePermission(targetUserId, value as UserPermission, user.uid);
          break;
      }

      toast({
        title: 'Success',
        description: 'User action completed successfully',
      });

      // Reload data
      await loadUsers();
      await loadAdminActions();
      setActionDialogOpen(false);
      setSelectedUser(null);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to perform action',
        variant: 'destructive',
      });
    }
  };

  const getStatusColor = (status: UserStatus) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'suspended': return 'bg-yellow-500';
      case 'banned': return 'bg-red-500';
      case 'under_investigation': return 'bg-orange-500';
      case 'pending_verification': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case 'admin': return <Crown className="h-4 w-4" />;
      case 'moderator': return <Gavel className="h-4 w-4" />;
      case 'therapist': return <Stethoscope className="h-4 w-4" />;
      case 'user': return <UserCheck className="h-4 w-4" />;
      case 'suspended': return <XCircle className="h-4 w-4" />;
      case 'banned': return <Ban className="h-4 w-4" />;
      default: return <Users className="h-4 w-4" />;
    }
  };

  // Enhanced search that works across all user data with comprehensive error handling
  const filteredUsers = React.useMemo(() => {
    try {
      if (!Array.isArray(users)) return [];
      
      return users.filter(userData => {
        try {
          if (!userData) return false;
          
          const searchLower = (searchTerm || '').toLowerCase();
          
          // Search in basic user info - add null safety
          const matchesBasicInfo = 
            (userData.email || '').toLowerCase().includes(searchLower) ||
            (userData.display_name || '').toLowerCase().includes(searchLower) ||
            (userData.user_id || '').toLowerCase().includes(searchLower);
          
          // Search in roles - add null safety
          const matchesRoles = userData.roles?.some(roleData => {
            try {
              return (roleData?.role || '').toLowerCase().includes(searchLower);
            } catch {
              return false;
            }
          }) || false;
          
          // Search in permissions - add null safety
          const matchesPermissions = userData.permissions?.some(permission => {
            try {
              return (permission || '').toLowerCase().includes(searchLower);
            } catch {
              return false;
            }
          }) || false;
          
          // Search in status - add null safety
          const matchesStatus = (userData.status || '').toLowerCase().includes(searchLower);
          
          return matchesBasicInfo || matchesRoles || matchesPermissions || matchesStatus;
        } catch (error) {
          console.error('Error filtering user:', error, userData);
          return false;
        }
      });
    } catch (error) {
      console.error('Error in user filtering:', error);
      return [];
    }
  }, [users, searchTerm]);

  // Also filter admin actions for search with comprehensive error handling
  const filteredAdminActions = React.useMemo(() => {
    try {
      if (!Array.isArray(adminActions)) return [];
      
      return adminActions.filter(action => {
        try {
          if (!action) return false;
          
          const searchLower = (searchTerm || '').toLowerCase();
          return (
            (action.action_type || '').toLowerCase().includes(searchLower) ||
            (action.admin_id || '').toLowerCase().includes(searchLower) ||
            (action.target_user_id || '').toLowerCase().includes(searchLower) ||
            (action.reason || '').toLowerCase().includes(searchLower)
          );
        } catch (error) {
          console.error('Error filtering admin action:', error, action);
          return false;
        }
      });
    } catch (error) {
      console.error('Error in admin actions filtering:', error);
      return [];
    }
  }, [adminActions, searchTerm]);

  const availableRoles = UserManagementService.getAvailableRoles();
  const availablePermissions = UserManagementService.getAvailablePermissions();

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            User Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (hasError) {
    return <UserManagementFallback />;
  }

  // Additional safety check for render
  try {
    return (
      <div className="space-y-6">

      
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              User Management
            </CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 w-full"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="users" className="space-y-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="users">Users ({filteredUsers.length})</TabsTrigger>
              <TabsTrigger value="actions">Admin Actions ({filteredAdminActions.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="users" className="space-y-4">
              <div className="grid gap-4">
                {filteredUsers.map((userData) => (
                  <Card key={userData.user_id} className="p-3 sm:p-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
                      <div className="flex items-start gap-3 sm:gap-4 flex-1 min-w-0">
                        {/* Avatar */}
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                          {userData.display_name?.charAt(0)?.toUpperCase() || userData.email?.charAt(0)?.toUpperCase() || '?'}
                        </div>
                        
                        {/* User Info */}
                        <div className="flex flex-col flex-1 min-w-0">
                          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mb-1">
                            <h4 className="font-medium text-sm sm:text-base truncate">{userData.display_name || 'No Name'}</h4>
                            <Badge className={`${getStatusColor(userData.status)} text-white text-xs w-fit`}>
                              {userData.status}
                            </Badge>
                          </div>
                          <p className="text-xs sm:text-sm text-gray-500 truncate mb-2">{userData.email || 'No email'}</p>
                          <div className="flex flex-wrap items-center gap-1 sm:gap-2">
                            {userData.roles?.map((roleData, index) => (
                              <Badge key={index} variant="outline" className="flex items-center gap-1 text-xs">
                                {getRoleIcon(roleData.role)}
                                <span className="hidden xs:inline">{roleData.role || 'Unknown'}</span>
                              </Badge>
                            )) || <Badge variant="outline" className="text-xs">No roles</Badge>}
                          </div>
                        </div>
                      </div>
                      
                      {/* Actions */}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {/* Eye button - Navigate to user detail page */}
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => router.push(`/admin/users/${userData.user_id}`)}
                          className="hidden sm:flex"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>

                        {/* User Actions Dropdown */}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" className="w-full sm:w-auto">
                              <span className="sm:hidden">Menu</span>
                              <span className="hidden sm:inline">Actions</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem
                              onClick={() => {
                                setQuickViewUser(userData);
                              }}
                            >
                              <Shield className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedUser(userData);
                                setActionDialogOpen(true);
                              }}
                            >
                              <Settings className="h-4 w-4 mr-2" />
                              Manage User
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => router.push(`/admin/users/${userData.user_id}`)}
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              Full Details
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="actions" className="space-y-4">
              <div className="space-y-4">
                {filteredAdminActions.map((action) => (
                  <Card key={action.id} className="p-3 sm:p-4">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-full bg-blue-100 flex-shrink-0">
                        <Activity className="h-4 w-4 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm sm:text-base capitalize">
                          {action.action_type.replace('_', ' ')}
                        </h4>
                        <div className="text-xs sm:text-sm text-gray-600 mt-1">
                          <p className="break-all">
                            <span className="font-medium">Admin:</span> {action.admin_id}
                          </p>
                          <p className="break-all">
                            <span className="font-medium">Target:</span> {action.target_user_id || 'System'}
                          </p>
                        </div>
                        {action.reason && (
                          <p className="text-xs sm:text-sm text-gray-500 mt-2 break-words">
                            <span className="font-medium">Reason:</span> {action.reason}
                          </p>
                        )}
                        <div className="text-xs text-gray-400 mt-2">
                          {new Date(action.created_at).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Quick View Dialog */}
      <Dialog 
        open={!!quickViewUser} 
        onOpenChange={(open) => {
          if (!open) {
            setQuickViewUser(null);
          }
        }}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">
              User Details: {quickViewUser?.display_name}
            </DialogTitle>
          </DialogHeader>
          {quickViewUser && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Email</Label>
                  <p className="text-sm break-all">{quickViewUser.email}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Status</Label>
                  <div className="mt-1">
                    <Badge className={`${getStatusColor(quickViewUser.status)} text-white`}>
                      {quickViewUser.status}
                    </Badge>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Created</Label>
                  <p className="text-sm">{new Date(quickViewUser.user_created_at).toLocaleDateString()}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Status Changed</Label>
                  <p className="text-sm">
                    {quickViewUser.status_changed_at 
                      ? new Date(quickViewUser.status_changed_at).toLocaleDateString()
                      : 'Never'
                    }
                  </p>
                </div>
              </div>
              
              <div>
                <Label>Roles</Label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {quickViewUser.roles.map((roleData, index) => (
                    <Badge key={index} variant="outline" className="flex items-center gap-1">
                      {getRoleIcon(roleData.role)}
                      {roleData.role}
                      {roleData.expires_at && (
                        <span className="text-xs">
                          (expires {new Date(roleData.expires_at).toLocaleDateString()})
                        </span>
                      )}
                    </Badge>
                  ))}
                </div>
              </div>
              
              <div>
                <Label>Permissions</Label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {quickViewUser.permissions.map((permission, index) => (
                    <Badge key={index} variant="secondary">
                      {permission}
                    </Badge>
                  ))}
                </div>
              </div>

              {quickViewUser.status_reason && (
                <div>
                  <Label>Status Reason</Label>
                  <p className="text-sm bg-gray-50 p-2 rounded">{quickViewUser.status_reason}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Management Action Dialog */}
      <Dialog 
        open={actionDialogOpen} 
        onOpenChange={(open) => {
          setActionDialogOpen(open);
          if (!open) {
            setSelectedUser(null);
          }
        }}
      >
        <DialogContent className="max-w-md sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">
              Manage User: {selectedUser?.display_name}
            </DialogTitle>
          </DialogHeader>
          <UserActionForm
            user={selectedUser}
            onAction={handleUserAction}
            availableRoles={availableRoles}
            availablePermissions={availablePermissions}
          />
        </DialogContent>
      </Dialog>
    </div>
    );
  } catch (error) {
    console.error('Error rendering UserManagement component:', error);
    return <UserManagementFallback />;
  }
}

// User Action Form Component
function UserActionForm({ 
  user, 
  onAction, 
  availableRoles, 
  availablePermissions 
}: {
  user: UserManagementData | null;
  onAction: (userId: string, action: any, value: string, reason?: string, expiresAt?: Date) => void;
  availableRoles: any[];
  availablePermissions: any[];
}) {
  const [actionType, setActionType] = useState<'role' | 'status' | 'permission'>('role');
  const [selectedValue, setSelectedValue] = useState('');
  const [reason, setReason] = useState('');
  const [expiresAt, setExpiresAt] = useState('');

  if (!user) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedValue) return;

    const expires = expiresAt ? new Date(expiresAt) : undefined;
    
    if (actionType === 'role') {
      onAction(user.user_id, 'grant_role', selectedValue, reason, expires);
    } else if (actionType === 'status') {
      onAction(user.user_id, 'change_status', selectedValue, reason, expires);
    } else if (actionType === 'permission') {
      onAction(user.user_id, 'grant_permission', selectedValue, reason, expires);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label>Action Type</Label>
        <Select value={actionType} onValueChange={(value: any) => setActionType(value)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="role">Manage Roles</SelectItem>
            <SelectItem value="status">Change Status</SelectItem>
            <SelectItem value="permission">Manage Permissions</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {actionType === 'role' && (
        <div>
          <Label>Role</Label>
          <Select value={selectedValue} onValueChange={setSelectedValue}>
            <SelectTrigger>
              <SelectValue placeholder="Select role" />
            </SelectTrigger>
            <SelectContent>
              {availableRoles.map((role) => (
                <SelectItem 
                  key={role.role} 
                  value={role.role}
                  disabled={!role.available}
                >
                  {role.label} {role.comingSoon && '(Coming Soon)'}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {actionType === 'status' && (
        <div>
          <Label>Status</Label>
          <Select value={selectedValue} onValueChange={setSelectedValue}>
            <SelectTrigger>
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="suspended">Suspended</SelectItem>
              <SelectItem value="banned">Banned</SelectItem>
              <SelectItem value="under_investigation">Under Investigation</SelectItem>
              <SelectItem value="pending_verification">Pending Verification</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {actionType === 'permission' && (
        <div>
          <Label>Permission</Label>
          <Select value={selectedValue} onValueChange={setSelectedValue}>
            <SelectTrigger>
              <SelectValue placeholder="Select permission" />
            </SelectTrigger>
            <SelectContent>
              {availablePermissions.map((perm) => (
                <SelectItem 
                  key={perm.permission} 
                  value={perm.permission}
                  disabled={!perm.available}
                >
                  {perm.label} {perm.comingSoon && '(Coming Soon)'}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div>
        <Label>Reason (Optional)</Label>
        <Textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Reason for this action..."
        />
      </div>

      <div>
        <Label>Expires At (Optional)</Label>
        <Input
          type="datetime-local"
          value={expiresAt}
          onChange={(e) => setExpiresAt(e.target.value)}
        />
      </div>

      <Button type="submit" disabled={!selectedValue}>
        Apply Action
      </Button>
    </form>
  );
}