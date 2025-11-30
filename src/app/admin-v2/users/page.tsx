'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Search, Filter, Download, MoreVertical, Mail, Phone, 
  Calendar, MapPin, Star, MessageSquare, Users as UsersIcon,
  Shield, Ban, CheckCircle2, XCircle, Eye, Edit, Trash2,
  Activity, TrendingUp, Clock, Award, AlertCircle, RefreshCw, Package
} from 'lucide-react';
import { AdminService } from '@/lib/services/admin-service';
import { UserWithStats } from '@/lib/database-types';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { SuspendUserDialog, UpgradeUserDialog, SendEmailDialog } from '@/components/admin/user-action-dialogs';
import { LoadingSpinner } from '@/components/common/loading-spinner';

type ViewMode = 'grid' | 'list' | 'detailed';
type FilterType = 'all' | 'active' | 'new' | 'top_rated' | 'inactive';
type TierFilter = 'all' | 'free' | 'pro' | 'trial' | 'credits';

export default function UsersPage() {
  const [users, setUsers] = useState<UserWithStats[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserWithStats[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('detailed');
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [tierFilter, setTierFilter] = useState<TierFilter>('all');
  const [sortBy, setSortBy] = useState<string>('newest');
  const [selectedUser, setSelectedUser] = useState<UserWithStats | null>(null);
  const [showUserDetails, setShowUserDetails] = useState(false);
  const [actionType, setActionType] = useState<'suspend' | 'upgrade' | 'email' | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    filterAndSortUsers();
  }, [users, search, filterType, tierFilter, sortBy]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await AdminService.getAllUsers(100);
      setUsers(data);
    } catch (error) {
      console.error('Error loading users:', error);
      toast({
        title: 'Error',
        description: 'Failed to load users.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortUsers = () => {
    let filtered = [...users];

    // Search filter
    if (search) {
      const query = search.toLowerCase();
      filtered = filtered.filter(u => 
        u.email?.toLowerCase().includes(query) ||
        u.display_name?.toLowerCase().includes(query) ||
        u.first_name?.toLowerCase().includes(query) ||
        u.last_name?.toLowerCase().includes(query)
      );
    }

    // Tier filter
    switch (tierFilter) {
      case 'free':
        filtered = filtered.filter(u => 
          (u as any).subscription_tier === 'free' && !(u as any).is_trial_active
        );
        break;
      case 'pro':
        filtered = filtered.filter(u => 
          (u as any).subscription_tier === 'pro' && !(u as any).is_trial_active
        );
        break;
      case 'trial':
        filtered = filtered.filter(u => (u as any).is_trial_active);
        break;
      case 'credits':
        filtered = filtered.filter(u => (u as any).ai_credits > 0);
        break;
    }

    // Type filter
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    switch (filterType) {
      case 'active':
        filtered = filtered.filter(u => (u.topic_count || 0) > 0 || (u.message_count || 0) > 0);
        break;
      case 'new':
        filtered = filtered.filter(u => new Date(u.created_at) > sevenDaysAgo);
        break;
      case 'top_rated':
        filtered = filtered.filter(u => u.rating_stats && u.rating_stats.overall_average >= 4);
        break;
      case 'inactive':
        filtered = filtered.filter(u => u.topic_count === 0 && u.message_count === 0);
        break;
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'oldest':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case 'name':
          return (a.display_name || a.email).localeCompare(b.display_name || b.email);
        case 'most_active':
          return ((b.topic_count || 0) + (b.message_count || 0)) - ((a.topic_count || 0) + (a.message_count || 0));
        case 'highest_rated':
          return (b.rating_stats?.overall_average || 0) - (a.rating_stats?.overall_average || 0);
        default:
          return 0;
      }
    });

    setFilteredUsers(filtered);
  };

  const exportUsers = () => {
    const csv = [
      ['Name', 'Email', 'Phone', 'Country', 'Sessions', 'Messages', 'Rating', 'Joined'],
      ...filteredUsers.map(u => [
        u.display_name || `${u.first_name || ''} ${u.last_name || ''}`.trim() || 'N/A',
        u.email,
        u.phone_number || 'N/A',
        u.country || 'N/A',
        (u.topic_count || 0).toString(),
        (u.message_count || 0).toString(),
        u.rating_stats?.overall_average?.toFixed(1) || 'N/A',
        new Date(u.created_at).toLocaleDateString()
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `harthio-users-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    
    toast({
      title: 'Success',
      description: `Exported ${filteredUsers.length} users to CSV.`
    });
  };

  const getUserStatus = (user: UserWithStats) => {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const createdAt = new Date(user.created_at);

    if (createdAt > sevenDaysAgo) {
      return { label: 'New', color: 'bg-blue-100 text-blue-800' };
    }
    if ((user.topic_count || 0) > 0 || (user.message_count || 0) > 0) {
      return { label: 'Active', color: 'bg-green-100 text-green-800' };
    }
    return { label: 'Inactive', color: 'bg-gray-100 text-gray-800' };
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Calculate stats for tier buttons (always from all users)
  const tierStats = {
    total: users.length,
    free: users.filter(u => (u as any).subscription_tier === 'free' && !(u as any).is_trial_active).length,
    pro: users.filter(u => (u as any).subscription_tier === 'pro' && !(u as any).is_trial_active).length,
    trial: users.filter(u => (u as any).is_trial_active).length,
    credits: users.filter(u => (u as any).ai_credits > 0).length
  };

  // Calculate stats for cards (based on tier filter)
  const getTierFilteredUsers = () => {
    switch (tierFilter) {
      case 'free':
        return users.filter(u => (u as any).subscription_tier === 'free' && !(u as any).is_trial_active);
      case 'pro':
        return users.filter(u => (u as any).subscription_tier === 'pro' && !(u as any).is_trial_active);
      case 'trial':
        return users.filter(u => (u as any).is_trial_active);
      case 'credits':
        return users.filter(u => (u as any).ai_credits > 0);
      default:
        return users;
    }
  };

  const tierFilteredUsers = getTierFilteredUsers();

  const stats = {
    total: tierFilteredUsers.length,
    active: tierFilteredUsers.filter(u => (u.topic_count || 0) > 0 || (u.message_count || 0) > 0).length,
    new: tierFilteredUsers.filter(u => {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      return new Date(u.created_at) > sevenDaysAgo;
    }).length,
    topRated: tierFilteredUsers.filter(u => u.rating_stats && u.rating_stats.overall_average >= 4).length
  };

  if (loading) {
    return <LoadingSpinner size="lg" text="Loading users..." />;
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 max-w-7xl">
      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">User Management</h1>
            <p className="mt-1 text-sm text-gray-600">
              Manage and monitor all platform users
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Button variant="outline" size="sm" onClick={loadUsers} className="gap-2">
              <RefreshCw className="h-4 w-4" />
              <span className="hidden sm:inline">Refresh</span>
            </Button>
            <Button variant="outline" size="sm" onClick={exportUsers} className="gap-2">
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">Export</span>
            </Button>
          </div>
        </div>
      </div>

      <div className="space-y-6">

      {/* Tier Tabs */}
      <div className="grid grid-cols-2 sm:flex sm:flex-row gap-2">
        <Button
          variant={tierFilter === 'all' ? 'default' : 'outline'}
          onClick={() => setTierFilter('all')}
          className="whitespace-nowrap text-xs sm:text-sm"
        >
          All Users
        </Button>
        <Button
          variant={tierFilter === 'free' ? 'default' : 'outline'}
          onClick={() => setTierFilter('free')}
          className="whitespace-nowrap text-xs sm:text-sm"
        >
          Free
        </Button>
        <Button
          variant={tierFilter === 'pro' ? 'default' : 'outline'}
          onClick={() => setTierFilter('pro')}
          className="whitespace-nowrap text-xs sm:text-sm bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700"
        >
          Pro
        </Button>
        <Button
          variant={tierFilter === 'trial' ? 'default' : 'outline'}
          onClick={() => setTierFilter('trial')}
          className="whitespace-nowrap text-xs sm:text-sm"
        >
          Trial
        </Button>
        <Button
          variant={tierFilter === 'credits' ? 'default' : 'outline'}
          onClick={() => setTierFilter('credits')}
          className="whitespace-nowrap text-xs sm:text-sm bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-600 hover:to-emerald-700"
        >
          <Package className="h-4 w-4 mr-1" />
          Credits
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Users</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.total}</p>
              </div>
              <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <UsersIcon className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Users</p>
                <p className="text-3xl font-bold text-green-600 mt-2">{stats.active}</p>
              </div>
              <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Activity className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">New (7 days)</p>
                <p className="text-3xl font-bold text-blue-600 mt-2">{stats.new}</p>
              </div>
              <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Top Rated</p>
                <p className="text-3xl font-bold text-yellow-600 mt-2">{stats.topRated}</p>
              </div>
              <div className="h-12 w-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Award className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-4 sm:p-6">
          <div className="space-y-3 sm:space-y-0 sm:grid sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-4 sm:gap-4">
            {/* Search */}
            <div className="lg:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by name, email..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10 text-sm"
                />
              </div>
            </div>

            {/* Filter */}
            <Select value={filterType} onValueChange={(value: FilterType) => setFilterType(value)}>
              <SelectTrigger className="text-sm">
                <SelectValue placeholder="Filter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Users</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="new">New (7 days)</SelectItem>
                <SelectItem value="top_rated">Top Rated</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>

            {/* Sort */}
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="text-sm">
                <SelectValue placeholder="Sort" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="oldest">Oldest First</SelectItem>
                <SelectItem value="name">Name A-Z</SelectItem>
                <SelectItem value="most_active">Most Active</SelectItem>
                <SelectItem value="highest_rated">Highest Rated</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between mt-4 pt-4 border-t">
            <p className="text-xs sm:text-sm text-gray-600">
              Showing {filteredUsers.length} of {users.length} users
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Users List */}
      <Card>
        <CardContent className="p-6">
          {filteredUsers.length === 0 ? (
            <div className="text-center py-12">
              <UsersIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No users found</h3>
              <p className="text-gray-600">Try adjusting your search or filters</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredUsers.map((user) => {
                const status = getUserStatus(user);
                
                return (
                  <div 
                    key={user.id} 
                    className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-all hover:border-primary/50"
                  >
                    <div className="flex items-start gap-4">
                      {/* Avatar */}
                      <div className="flex-shrink-0">
                        {user.avatar_url ? (
                          <img 
                            src={user.avatar_url} 
                            alt={user.display_name || user.email}
                            className="h-12 w-12 rounded-full object-cover"
                          />
                        ) : (
                          <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-semibold text-lg">
                            {(user.display_name || user.email).charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>

                      {/* User Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4 mb-2">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="text-lg font-semibold text-gray-900">
                                {user.display_name || `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'Unnamed User'}
                              </h3>
                              <Badge className={status.color}>
                                {status.label}
                              </Badge>
                              {/* Tier Badge */}
                              {(user as any).subscription_tier === 'pro' ? (
                                <Badge className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">
                                  Pro
                                </Badge>
                              ) : (user as any).is_trial_active ? (
                                <Badge className="bg-blue-100 text-blue-800">
                                  Trial
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="text-gray-600">
                                  Free
                                </Badge>
                              )}
                              {user.rating_stats && user.rating_stats.overall_average >= 4.5 && (
                                <Badge variant="outline" className="text-yellow-600 border-yellow-200">
                                  <Star className="h-3 w-3 mr-1 fill-yellow-600" />
                                  Top Rated
                                </Badge>
                              )}
                            </div>
                            {user.headline && (
                              <p className="text-sm text-gray-600 mb-2">{user.headline}</p>
                            )}
                          </div>

                          {/* Actions Menu */}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => {
                                setSelectedUser(user);
                                setShowUserDetails(true);
                              }}>
                                <Eye className="h-4 w-4 mr-2" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => {
                                setSelectedUser(user);
                                setActionType('email');
                              }}>
                                <Mail className="h-4 w-4 mr-2" />
                                Send Email
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => {
                                setSelectedUser(user);
                                setActionType('upgrade');
                              }}>
                                <TrendingUp className="h-4 w-4 mr-2" />
                                Manage Tier
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-red-600" onClick={() => {
                                setSelectedUser(user);
                                setActionType('suspend');
                              }}>
                                <Ban className="h-4 w-4 mr-2" />
                                Suspend User
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>

                        {/* Contact Info */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Mail className="h-4 w-4 flex-shrink-0" />
                            <span className="truncate">{user.email}</span>
                          </div>
                          {user.phone_number && (
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Phone className="h-4 w-4 flex-shrink-0" />
                              <span>{user.phone_country_code} {user.phone_number}</span>
                            </div>
                          )}
                          {user.country && (
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <MapPin className="h-4 w-4 flex-shrink-0" />
                              <span>{user.country}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Calendar className="h-4 w-4 flex-shrink-0" />
                            <span>Joined {formatDate(user.created_at)}</span>
                          </div>
                        </div>

                        {/* Activity Stats */}
                        <div className="flex flex-wrap items-center gap-4 text-sm">
                          <div className="flex items-center gap-1">
                            <MessageSquare className="h-4 w-4 text-blue-600" />
                            <span className="font-medium">{user.topic_count}</span>
                            <span className="text-gray-600">sessions</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <MessageSquare className="h-4 w-4 text-green-600" />
                            <span className="font-medium">{user.message_count}</span>
                            <span className="text-gray-600">messages</span>
                          </div>
                          {user.rating_stats && user.rating_stats.total_ratings > 0 && (
                            <div className="flex items-center gap-1">
                              <Star className="h-4 w-4 text-yellow-600 fill-yellow-600" />
                              <span className="font-medium">{user.rating_stats.overall_average.toFixed(1)}</span>
                              <span className="text-gray-600">({user.rating_stats.total_ratings} ratings)</span>
                            </div>
                          )}
                          <div className="flex items-center gap-1 px-2 py-1 bg-green-50 rounded-md border border-green-200">
                            <Package className="h-4 w-4 text-green-600" />
                            <span className="font-medium text-green-700">{(user as any).ai_credits || 0}</span>
                            <span className="text-green-600">credits</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* User Details Dialog */}
      <Dialog open={showUserDetails} onOpenChange={setShowUserDetails}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto p-0">
          <div className="sticky top-0 bg-white z-10 border-b px-4 sm:px-6 py-4">
            <DialogHeader>
              <DialogTitle className="text-xl sm:text-2xl">User Details</DialogTitle>
              <DialogDescription className="text-sm">
                Complete information about this user
              </DialogDescription>
            </DialogHeader>
          </div>
          
          {selectedUser && (
            <div className="px-4 sm:px-6 py-4 space-y-6">
              {/* Profile Section */}
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 p-4 bg-gradient-to-br from-primary/5 to-accent/5 rounded-lg">
                {selectedUser.avatar_url ? (
                  <img 
                    src={selectedUser.avatar_url} 
                    alt={selectedUser.display_name || selectedUser.email}
                    className="h-20 w-20 sm:h-24 sm:w-24 rounded-full object-cover ring-4 ring-white shadow-lg"
                  />
                ) : (
                  <div className="h-20 w-20 sm:h-24 sm:w-24 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-semibold text-2xl sm:text-3xl ring-4 ring-white shadow-lg">
                    {(selectedUser.display_name || selectedUser.email).charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="flex-1 text-center sm:text-left">
                  <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">
                    {selectedUser.display_name || `${selectedUser.first_name || ''} ${selectedUser.last_name || ''}`.trim() || 'Unnamed User'}
                  </h3>
                  {selectedUser.headline && (
                    <p className="text-sm sm:text-base text-gray-600 mb-3">{selectedUser.headline}</p>
                  )}
                  <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                    <Badge className={getUserStatus(selectedUser).color}>
                      {getUserStatus(selectedUser).label}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-3 text-base sm:text-lg">Contact Information</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-gray-600 text-xs mb-1">Email</p>
                    <p className="font-medium break-all">{selectedUser.email}</p>
                  </div>
                  {selectedUser.phone_number && (
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-gray-600 text-xs mb-1">Phone</p>
                      <p className="font-medium">{selectedUser.phone_country_code} {selectedUser.phone_number}</p>
                    </div>
                  )}
                  {selectedUser.country && (
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-gray-600 text-xs mb-1">Country</p>
                      <p className="font-medium">{selectedUser.country}</p>
                    </div>
                  )}
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-gray-600 text-xs mb-1">Member Since</p>
                    <p className="font-medium">{formatDate(selectedUser.created_at)}</p>
                  </div>
                </div>
              </div>

              {/* Activity Stats */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-3 text-base sm:text-lg">Activity Statistics</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                  <Card className="border-blue-100 bg-blue-50/50">
                    <CardContent className="p-4 text-center">
                      <p className="text-2xl sm:text-3xl font-bold text-blue-600">{selectedUser.topic_count}</p>
                      <p className="text-xs sm:text-sm text-gray-600 mt-1">Sessions Created</p>
                    </CardContent>
                  </Card>
                  <Card className="border-green-100 bg-green-50/50">
                    <CardContent className="p-4 text-center">
                      <p className="text-2xl sm:text-3xl font-bold text-green-600">{selectedUser.message_count}</p>
                      <p className="text-xs sm:text-sm text-gray-600 mt-1">Messages Sent</p>
                    </CardContent>
                  </Card>
                  <Card className="border-yellow-100 bg-yellow-50/50">
                    <CardContent className="p-4 text-center">
                      <p className="text-2xl sm:text-3xl font-bold text-yellow-600">
                        {selectedUser.rating_stats?.overall_average.toFixed(1) || 'N/A'}
                      </p>
                      <p className="text-xs sm:text-sm text-gray-600 mt-1">Avg Rating</p>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Rating Breakdown */}
              {selectedUser.rating_stats && selectedUser.rating_stats.total_ratings > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3 text-base sm:text-lg">Rating Breakdown</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <span className="text-gray-600">Politeness</span>
                      <span className="font-bold text-lg">{selectedUser.rating_stats.average_politeness.toFixed(1)}<span className="text-gray-400 text-sm">/5</span></span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <span className="text-gray-600">Relevance</span>
                      <span className="font-bold text-lg">{selectedUser.rating_stats.average_relevance.toFixed(1)}<span className="text-gray-400 text-sm">/5</span></span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <span className="text-gray-600">Problem Solved</span>
                      <span className="font-bold text-lg">{selectedUser.rating_stats.average_problem_solved.toFixed(1)}<span className="text-gray-400 text-sm">/5</span></span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <span className="text-gray-600">Communication</span>
                      <span className="font-bold text-lg">{selectedUser.rating_stats.average_communication.toFixed(1)}<span className="text-gray-400 text-sm">/5</span></span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg sm:col-span-2">
                      <span className="text-gray-600">Professionalism</span>
                      <span className="font-bold text-lg">{selectedUser.rating_stats.average_professionalism.toFixed(1)}<span className="text-gray-400 text-sm">/5</span></span>
                    </div>
                  </div>
                </div>
              )}

              {/* Subscription Info */}
              {((selectedUser as any).subscription_tier || (selectedUser as any).is_trial_active) && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3 text-base sm:text-lg">Subscription</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-gray-600 text-xs mb-1">Tier</p>
                      <p className="font-medium">
                        {(selectedUser as any).subscription_tier === 'pro' ? 'Pro' : 'Free'}
                      </p>
                    </div>
                    {(selectedUser as any).is_trial_active && (
                      <>
                        <div className="p-3 bg-blue-50 rounded-lg">
                          <p className="text-gray-600 text-xs mb-1">Trial Status</p>
                          <p className="font-medium text-blue-600">Active</p>
                        </div>
                        {(selectedUser as any).trial_end_date && (
                          <div className="p-3 bg-gray-50 rounded-lg">
                            <p className="text-gray-600 text-xs mb-1">Trial Ends</p>
                            <p className="font-medium">
                              {formatDate((selectedUser as any).trial_end_date)}
                            </p>
                          </div>
                        )}
                      </>
                    )}
                    {(selectedUser as any).subscription_start_date && (
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <p className="text-gray-600 text-xs mb-1">Subscribed Since</p>
                        <p className="font-medium">
                          {formatDate((selectedUser as any).subscription_start_date)}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Credits Balance */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-3 text-base sm:text-lg">Credits</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  <div className="p-3 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg border border-green-200">
                    <p className="text-gray-600 text-xs mb-1">Current Balance</p>
                    <p className="text-2xl font-bold text-green-600">
                      {(selectedUser as any).ai_credits || 0}
                    </p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-gray-600 text-xs mb-1">Expires At</p>
                    <p className="text-sm font-medium text-gray-900">
                      {(selectedUser as any).credits_expire_at 
                        ? formatDate((selectedUser as any).credits_expire_at)
                        : 'No expiry'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="sticky bottom-0 bg-white border-t pt-4 -mx-4 sm:-mx-6 px-4 sm:px-6 pb-4 mt-6">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
                  <Button variant="outline" className="w-full" onClick={() => {
                    setActionType('email');
                  }}>
                    <Mail className="h-4 w-4 mr-2" />
                    <span className="hidden sm:inline">Send Email</span>
                    <span className="sm:hidden">Email</span>
                  </Button>
                  <Button variant="outline" className="w-full" onClick={() => {
                    setActionType('upgrade');
                  }}>
                    <TrendingUp className="h-4 w-4 mr-2" />
                    <span className="hidden sm:inline">Manage Tier</span>
                    <span className="sm:hidden">Tier</span>
                  </Button>
                  <Button variant="outline" className="w-full text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => {
                    setActionType('suspend');
                  }}>
                    <Ban className="h-4 w-4 mr-2" />
                    <span className="hidden sm:inline">Suspend User</span>
                    <span className="sm:hidden">Suspend</span>
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Action Dialogs */}
      {actionType === 'suspend' && (
        <SuspendUserDialog
          user={selectedUser}
          onClose={() => {
            setActionType(null);
            setSelectedUser(null);
          }}
          onSuccess={() => {
            loadUsers();
          }}
        />
      )}

      {actionType === 'upgrade' && (
        <UpgradeUserDialog
          user={selectedUser}
          onClose={() => {
            setActionType(null);
            setSelectedUser(null);
          }}
          onSuccess={() => {
            loadUsers();
          }}
        />
      )}

      {actionType === 'email' && (
        <SendEmailDialog
          user={selectedUser}
          onClose={() => {
            setActionType(null);
            setSelectedUser(null);
          }}
          onSuccess={() => {
            // Email sent, no need to reload users
          }}
        />
      )}
      </div>
    </div>
  );
}
