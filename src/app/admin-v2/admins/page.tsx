'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Shield, ShieldAlert, ShieldCheck, UserPlus, Trash2, 
  Search, AlertTriangle, CheckCircle2, Clock, Edit, Activity
} from 'lucide-react';
import { AdminService } from '@/lib/services/admin-service';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { LoadingSpinner } from '@/components/common/loading-spinner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert';

export default function AdminManagementPage() {
  const [admins, setAdmins] = useState<any[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showRevokeDialog, setShowRevokeDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedRole, setSelectedRole] = useState<'admin' | 'editor'>('admin');
  const [editRole, setEditRole] = useState<'admin' | 'editor'>('admin');
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [adminData, userData] = await Promise.all([
        AdminService.getAllAdmins(),
        AdminService.getAllUsers(100)
      ]);
      setAdmins(adminData);
      setAllUsers(userData);
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load admin data.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGrantAdmin = async () => {
    if (!selectedUserId) {
      toast({
        title: 'Error',
        description: 'Please select a user.',
        variant: 'destructive'
      });
      return;
    }

    try {
      await AdminService.grantAdminRole(selectedUserId, selectedRole);
      toast({
        title: 'Success',
        description: `Admin role granted successfully.`
      });
      setShowAddDialog(false);
      setSelectedUserId('');
      loadData();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to grant admin role.',
        variant: 'destructive'
      });
    }
  };

  const handleRevokeAdmin = async () => {
    if (!selectedAdmin) return;

    try {
      await AdminService.revokeAdminRole(selectedAdmin.user_id);
      toast({
        title: 'Success',
        description: 'Admin role revoked successfully.'
      });
      setShowRevokeDialog(false);
      setSelectedAdmin(null);
      loadData();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to revoke admin role.',
        variant: 'destructive'
      });
    }
  };

  const handleEditRole = async () => {
    if (!selectedAdmin) return;

    try {
      await AdminService.grantAdminRole(selectedAdmin.user_id, editRole);
      toast({
        title: 'Success',
        description: `Admin role updated to ${editRole === 'admin' ? 'Full Admin' : 'Editor'} successfully.`
      });
      setShowEditDialog(false);
      setSelectedAdmin(null);
      loadData();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update admin role.',
        variant: 'destructive'
      });
    }
  };

  const filteredUsers = allUsers.filter(u => {
    const isAlreadyAdmin = admins.some(a => a.user_id === u.id);
    if (isAlreadyAdmin) return false;
    
    if (!searchQuery) return true;
    
    const query = searchQuery.toLowerCase();
    return (
      u.email?.toLowerCase().includes(query) ||
      u.display_name?.toLowerCase().includes(query) ||
      u.first_name?.toLowerCase().includes(query) ||
      u.last_name?.toLowerCase().includes(query)
    );
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return <LoadingSpinner size="lg" text="Loading admin users..." />;
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 max-w-7xl space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Admin Management</h2>
          <p className="text-sm text-gray-600 mt-1">
            Manage administrator roles and permissions
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline"
            onClick={loadData}
            disabled={loading}
          >
            <Activity className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button 
            onClick={() => setShowAddDialog(true)}
            className="bg-gradient-to-r from-primary to-accent"
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Add Admin
          </Button>
        </div>
      </div>

      {/* Security Warning */}
      <Alert className="border-amber-200 bg-amber-50">
        <AlertTriangle className="h-4 w-4 text-amber-600" />
        <AlertTitle className="text-amber-900">Security Notice</AlertTitle>
        <AlertDescription className="text-amber-800">
          Admin roles grant full access to the platform. Only grant admin privileges to trusted individuals.
          All admin actions are logged for security auditing.
        </AlertDescription>
      </Alert>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Admins</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{admins.length}</p>
              </div>
              <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Shield className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Full Admins</p>
                <p className="text-3xl font-bold text-purple-600 mt-2">
                  {admins.filter(a => a.role === 'admin').length}
                </p>
              </div>
              <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <ShieldCheck className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Editors</p>
                <p className="text-3xl font-bold text-blue-600 mt-2">
                  {admins.filter(a => a.role === 'editor').length}
                </p>
              </div>
              <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <ShieldAlert className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Admins List */}
      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Current Administrators</h3>
          
          {admins.length === 0 ? (
            <div className="text-center py-12">
              <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No administrators</h3>
              <p className="text-gray-600 mb-4">Add your first administrator to get started</p>
              <Button onClick={() => setShowAddDialog(true)}>
                <UserPlus className="h-4 w-4 mr-2" />
                Add Admin
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {admins.map((admin) => (
                <div 
                  key={admin.id} 
                  className="border border-gray-200 rounded-lg p-4 sm:p-6 hover:shadow-md transition-all"
                >
                  <div className="flex flex-col sm:flex-row items-start gap-4">
                    {/* Avatar */}
                    <div className="flex-shrink-0 mx-auto sm:mx-0">
                      {admin.user?.avatar_url ? (
                        <img 
                          src={admin.user.avatar_url} 
                          alt={admin.user.display_name || admin.user.email}
                          className="h-16 w-16 sm:h-12 sm:w-12 rounded-full object-cover"
                        />
                      ) : (
                        <div className="h-16 w-16 sm:h-12 sm:w-12 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center text-white font-semibold text-xl sm:text-lg">
                          {(admin.user?.display_name || admin.user?.email || 'A').charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0 w-full">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4 mb-2">
                        <div className="text-center sm:text-left">
                          <div className="flex flex-col sm:flex-row items-center sm:items-center gap-2 mb-1">
                            <h3 className="text-base sm:text-lg font-semibold text-gray-900 break-words">
                              {admin.user?.display_name || 
                               `${admin.user?.first_name || ''} ${admin.user?.last_name || ''}`.trim() || 
                               'Unknown User'}
                            </h3>
                            <Badge className={
                              admin.role === 'admin' 
                                ? 'bg-purple-100 text-purple-800' 
                                : 'bg-blue-100 text-blue-800'
                            }>
                              {admin.role === 'admin' ? (
                                <>
                                  <ShieldCheck className="h-3 w-3 mr-1" />
                                  <span className="text-xs">Full Admin</span>
                                </>
                              ) : (
                                <>
                                  <ShieldAlert className="h-3 w-3 mr-1" />
                                  <span className="text-xs">Editor</span>
                                </>
                              )}
                            </Badge>
                          </div>
                          <p className="text-xs sm:text-sm text-gray-600 break-all">{admin.user?.email}</p>
                        </div>

                        {/* Action Buttons */}
                        {admin.user_id === user?.uid ? (
                          <Badge variant="outline" className="text-blue-600 border-blue-200 text-xs whitespace-normal text-center">
                            You (Cannot modify)
                          </Badge>
                        ) : (
                          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                            <Button 
                              variant="outline" 
                              size="sm"
                              className="w-full sm:w-auto text-xs"
                              onClick={() => {
                                setSelectedAdmin(admin);
                                setEditRole(admin.role);
                                setShowEditDialog(true);
                              }}
                            >
                              <Edit className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                              <span className="hidden sm:inline">Edit Role</span>
                              <span className="sm:hidden">Edit</span>
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              className="w-full sm:w-auto text-xs text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                              onClick={() => {
                                setSelectedAdmin(admin);
                                setShowRevokeDialog(true);
                              }}
                            >
                              <Trash2 className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                              Revoke
                            </Button>
                          </div>
                        )}
                      </div>

                      {/* Metadata */}
                      <div className="flex items-center justify-center sm:justify-start gap-4 text-xs sm:text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
                          <span>Granted {formatDate(admin.created_at)}</span>
                        </div>
                      </div>

                      {/* Permissions */}
                      <div className="mt-3 pt-3 border-t">
                        <p className="text-xs font-medium text-gray-700 mb-2 text-center sm:text-left">Permissions:</p>
                        <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                          {admin.role === 'admin' ? (
                            <>
                              <Badge variant="outline" className="text-xs">Full Access</Badge>
                              <Badge variant="outline" className="text-xs">User Mgmt</Badge>
                              <Badge variant="outline" className="text-xs">Content</Badge>
                              <Badge variant="outline" className="text-xs">Analytics</Badge>
                              <Badge variant="outline" className="text-xs">Settings</Badge>
                            </>
                          ) : (
                            <>
                              <Badge variant="outline" className="text-xs">Content</Badge>
                              <Badge variant="outline" className="text-xs">Analytics</Badge>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Admin Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Administrator</DialogTitle>
            <DialogDescription>
              Grant admin privileges to a user. This action should only be performed for trusted individuals.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Role Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Admin Role
              </label>
              <Select value={selectedRole} onValueChange={(value: 'admin' | 'editor') => setSelectedRole(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4 text-purple-600" />
                      <div>
                        <p className="font-medium">Full Admin</p>
                        <p className="text-xs text-gray-600">Complete access to all features</p>
                      </div>
                    </div>
                  </SelectItem>
                  <SelectItem value="editor">
                    <div className="flex items-center gap-2">
                      <ShieldAlert className="h-4 w-4 text-blue-600" />
                      <div>
                        <p className="font-medium">Editor</p>
                        <p className="text-xs text-gray-600">Content management only</p>
                      </div>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* User Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search Users
              </label>
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* User List */}
            <div className="border rounded-lg max-h-64 overflow-y-auto">
              {filteredUsers.length === 0 ? (
                <div className="p-8 text-center text-gray-600">
                  {searchQuery ? 'No users found matching your search' : 'All users are already admins'}
                </div>
              ) : (
                <div className="divide-y">
                  {filteredUsers.slice(0, 10).map((u) => (
                    <div
                      key={u.id}
                      onClick={() => setSelectedUserId(u.id)}
                      className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                        selectedUserId === u.id ? 'bg-primary/5 border-l-4 border-primary' : ''
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {u.avatar_url ? (
                          <img 
                            src={u.avatar_url} 
                            alt={u.display_name || u.email}
                            className="h-10 w-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-semibold">
                            {(u.display_name || u.email).charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 truncate">
                            {u.display_name || `${u.first_name || ''} ${u.last_name || ''}`.trim() || 'Unnamed User'}
                          </p>
                          <p className="text-sm text-gray-600 truncate">{u.email}</p>
                        </div>
                        {selectedUserId === u.id && (
                          <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleGrantAdmin}
              disabled={!selectedUserId}
              className="bg-gradient-to-r from-primary to-accent"
            >
              <Shield className="h-4 w-4 mr-2" />
              Grant Admin Access
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Role Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Admin Role</DialogTitle>
            <DialogDescription>
              Change the admin role for this user
            </DialogDescription>
          </DialogHeader>

          {selectedAdmin && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                {selectedAdmin.user?.avatar_url ? (
                  <img 
                    src={selectedAdmin.user.avatar_url} 
                    alt={selectedAdmin.user.display_name || selectedAdmin.user.email}
                    className="h-12 w-12 rounded-full object-cover"
                  />
                ) : (
                  <div className="h-12 w-12 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center text-white font-semibold text-lg">
                    {(selectedAdmin.user?.display_name || selectedAdmin.user?.email || 'A').charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <p className="font-medium text-gray-900">
                    {selectedAdmin.user?.display_name || 
                     `${selectedAdmin.user?.first_name || ''} ${selectedAdmin.user?.last_name || ''}`.trim() || 
                     'Unknown User'}
                  </p>
                  <p className="text-sm text-gray-600">{selectedAdmin.user?.email}</p>
                  <Badge className="mt-1 bg-gray-100 text-gray-800">
                    Current: {selectedAdmin.role === 'admin' ? 'Full Admin' : 'Editor'}
                  </Badge>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  New Role
                </label>
                <Select value={editRole} onValueChange={(value: 'admin' | 'editor') => setEditRole(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="h-4 w-4 text-purple-600" />
                        <div>
                          <p className="font-medium">Full Admin</p>
                          <p className="text-xs text-gray-600">Complete access to all features</p>
                        </div>
                      </div>
                    </SelectItem>
                    <SelectItem value="editor">
                      <div className="flex items-center gap-2">
                        <ShieldAlert className="h-4 w-4 text-blue-600" />
                        <div>
                          <p className="font-medium">Editor</p>
                          <p className="text-xs text-gray-600">Content management only</p>
                        </div>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {editRole !== selectedAdmin.role && (
                <Alert className="border-blue-200 bg-blue-50">
                  <AlertTriangle className="h-4 w-4 text-blue-600" />
                  <AlertDescription className="text-blue-800">
                    {editRole === 'admin' 
                      ? 'This user will gain full admin access to all features.'
                      : 'This user will be limited to content management only.'}
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleEditRole}
              disabled={editRole === selectedAdmin?.role}
              className="bg-gradient-to-r from-primary to-accent"
            >
              <Shield className="h-4 w-4 mr-2" />
              Update Role
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Revoke Admin Dialog */}
      <Dialog open={showRevokeDialog} onOpenChange={setShowRevokeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Revoke Admin Access</DialogTitle>
            <DialogDescription>
              Are you sure you want to revoke admin privileges from this user?
            </DialogDescription>
          </DialogHeader>

          {selectedAdmin && (
            <div className="py-4">
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                {selectedAdmin.user?.avatar_url ? (
                  <img 
                    src={selectedAdmin.user.avatar_url} 
                    alt={selectedAdmin.user.display_name || selectedAdmin.user.email}
                    className="h-12 w-12 rounded-full object-cover"
                  />
                ) : (
                  <div className="h-12 w-12 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center text-white font-semibold text-lg">
                    {(selectedAdmin.user?.display_name || selectedAdmin.user?.email || 'A').charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <p className="font-medium text-gray-900">
                    {selectedAdmin.user?.display_name || 
                     `${selectedAdmin.user?.first_name || ''} ${selectedAdmin.user?.last_name || ''}`.trim() || 
                     'Unknown User'}
                  </p>
                  <p className="text-sm text-gray-600">{selectedAdmin.user?.email}</p>
                  <Badge className="mt-1 bg-purple-100 text-purple-800">
                    {selectedAdmin.role === 'admin' ? 'Full Admin' : 'Editor'}
                  </Badge>
                </div>
              </div>
              
              <Alert className="mt-4 border-red-200 bg-red-50">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">
                  This user will immediately lose all admin privileges and access to admin features.
                </AlertDescription>
              </Alert>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRevokeDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleRevokeAdmin}
              variant="destructive"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Revoke Access
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
