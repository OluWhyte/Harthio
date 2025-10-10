'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ResponsiveAdminHeader } from '@/components/admin/responsive-admin-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  Search, 
  Filter, 
  MoreHorizontal, 
  Star,
  MessageSquare,
  Calendar,
  Shield,
  ShieldCheck,
  Eye,
  UserCheck,
  UserX,
  Mail,
  Phone
} from 'lucide-react';
import { AdminService } from '@/lib/services/admin-service';
import { FilterComponent } from '@/components/admin/filters';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import type { UserWithStats } from '@/lib/database-types';

export default function UserManagementPage() {
  const [users, setUsers] = useState<UserWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<any>({});
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
      checkAdminAndLoadUsers();
    }
  }, [user, mounted]);

  const checkAdminAndLoadUsers = async () => {
    if (!user) {
      router.push('/admin/login?redirect=' + encodeURIComponent('/admin/users'));
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
      await loadUsers();
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

  const loadUsers = async () => {
    try {
      const combinedFilters = { ...filters };
      if (searchQuery.trim()) {
        combinedFilters.search_query = searchQuery.trim();
      }
      
      const userData = Object.keys(combinedFilters).length > 0 
        ? await AdminService.getFilteredUsers(combinedFilters, 100)
        : await AdminService.getAllUsers(100);
      
      setUsers(userData);
    } catch (error) {
      console.error('Error loading users:', error);
      toast({
        title: 'Error',
        description: 'Failed to load users.',
        variant: 'destructive'
      });
    }
  };

  const handleSearch = async () => {
    await loadUsers();
  };

  const handleFiltersChange = async (newFilters: any) => {
    setFilters(newFilters);
    // Auto-apply filters
    try {
      const combinedFilters = { ...newFilters };
      if (searchQuery.trim()) {
        combinedFilters.search_query = searchQuery.trim();
      }
      
      const userData = Object.keys(combinedFilters).length > 0 
        ? await AdminService.getFilteredUsers(combinedFilters, 100)
        : await AdminService.getAllUsers(100);
      
      setUsers(userData);
    } catch (error) {
      console.error('Error applying filters:', error);
      toast({
        title: 'Error',
        description: 'Failed to apply filters.',
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

  const getDisplayName = (user: UserWithStats) => {
    if (user.display_name) return user.display_name;
    if (user.first_name && user.last_name) return `${user.first_name} ${user.last_name}`;
    if (user.first_name) return user.first_name;
    return user.email.split('@')[0];
  };

  const getRatingColor = (rating: number) => {
    if (rating >= 4.5) return 'text-green-600';
    if (rating >= 4.0) return 'text-blue-600';
    if (rating >= 3.5) return 'text-yellow-600';
    if (rating >= 3.0) return 'text-orange-600';
    return 'text-red-600';
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
        title="User Management"
        actions={[]}
      />

      {/* Search and Filter Bar */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 flex-1">
              <Input
                placeholder="Search by name, email, or phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="w-full sm:w-80"
              />
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleSearch} className="flex-1 sm:flex-none">
                  <Search className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Search</span>
                </Button>
                {searchQuery && (
                  <Button variant="ghost" onClick={() => { setSearchQuery(''); loadUsers(); }} className="flex-1 sm:flex-none">
                    Clear
                  </Button>
                )}
              </div>
              <FilterComponent 
                type="users" 
                onFiltersChange={handleFiltersChange}
                className="shrink-0"
              />
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Users</p>
                  <p className="text-3xl font-bold text-blue-600">{users.length}</p>
                </div>
                <Users className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">With Profiles</p>
                  <p className="text-3xl font-bold text-green-600">
                    {users.filter(u => u.display_name || u.first_name).length}
                  </p>
                </div>
                <UserCheck className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Users</p>
                  <p className="text-3xl font-bold text-purple-600">
                    {users.filter(u => u.topic_count && u.topic_count > 0).length}
                  </p>
                </div>
                <MessageSquare className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Avg Rating</p>
                  <p className="text-3xl font-bold text-yellow-600">
                    {users.length > 0 
                      ? (users.reduce((sum, u) => sum + (u.rating_stats?.overall_average || 0), 0) / users.length).toFixed(1)
                      : '0.0'
                    }
                  </p>
                </div>
                <Star className="h-8 w-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Users List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>All Users ({users.length})</span>
              <Button variant="outline" size="sm" onClick={loadUsers}>
                Refresh
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {users.length === 0 ? (
              <div className="text-center py-12">
                <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No users found</h3>
                <p className="text-gray-600">
                  {searchQuery ? 'Try adjusting your search query.' : 'No users have registered yet.'}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {users.map((user) => (
                  <div key={user.id} className="border border-gray-200 rounded-lg p-4 sm:p-6 hover:shadow-md transition-shadow">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                      <div className="flex items-start gap-4 flex-1">
                        {/* Avatar */}
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center text-white font-semibold text-sm sm:text-base">
                          {user.avatar_url ? (
                            <img src={user.avatar_url} alt={getDisplayName(user)} className="w-12 h-12 rounded-full object-cover" />
                          ) : (
                            getDisplayName(user).charAt(0).toUpperCase()
                          )}
                        </div>

                        {/* User Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-lg font-semibold text-gray-900 truncate">
                              {getDisplayName(user)}
                            </h3>
                            {user.rating_stats && user.rating_stats.total_ratings > 0 && (
                              <div className="flex items-center gap-1">
                                <Star className="h-4 w-4 text-yellow-500 fill-current" />
                                <span className={`text-sm font-medium ${getRatingColor(user.rating_stats.overall_average)}`}>
                                  {user.rating_stats.overall_average.toFixed(1)}
                                </span>
                                <span className="text-xs text-gray-500">
                                  ({user.rating_stats.total_ratings})
                                </span>
                              </div>
                            )}
                          </div>

                          <div className="flex items-center gap-1 mb-2">
                            <Mail className="h-4 w-4 text-gray-400" />
                            <span className="text-sm text-gray-600">{user.email}</span>
                          </div>

                          {user.phone_number && (
                            <div className="flex items-center gap-1 mb-2">
                              <Phone className="h-4 w-4 text-gray-400" />
                              <span className="text-sm text-gray-600">
                                {user.phone_country_code}{user.phone_number}
                              </span>
                              {user.phone_verified && (
                                <Badge variant="secondary" className="ml-2">Verified</Badge>
                              )}
                            </div>
                          )}

                          {user.headline && (
                            <p className="text-sm text-gray-600 mb-2">{user.headline}</p>
                          )}

                          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              Joined {formatDate(user.created_at)}
                            </div>
                            <div className="flex items-center gap-1">
                              <MessageSquare className="h-4 w-4" />
                              {user.topic_count || 0} sessions
                            </div>
                            <div className="flex items-center gap-1">
                              <Users className="h-4 w-4" />
                              {user.message_count || 0} messages
                            </div>
                            {user.country && (
                              <Badge variant="outline">{user.country}</Badge>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/admin/users/${user.id}`}>
                            <Eye className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Shield className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Rating Breakdown */}
                    {user.rating_stats && user.rating_stats.total_ratings > 0 && (
                      <div className="mt-4 pt-4 border-t border-gray-100">
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                          <div className="text-center">
                            <p className="font-medium text-gray-900">{user.rating_stats.average_politeness.toFixed(1)}</p>
                            <p className="text-gray-500">Politeness</p>
                          </div>
                          <div className="text-center">
                            <p className="font-medium text-gray-900">{user.rating_stats.average_relevance.toFixed(1)}</p>
                            <p className="text-gray-500">Relevance</p>
                          </div>
                          <div className="text-center">
                            <p className="font-medium text-gray-900">{user.rating_stats.average_problem_solved.toFixed(1)}</p>
                            <p className="text-gray-500">Problem Solving</p>
                          </div>
                          <div className="text-center">
                            <p className="font-medium text-gray-900">{user.rating_stats.average_communication.toFixed(1)}</p>
                            <p className="text-gray-500">Communication</p>
                          </div>
                          <div className="text-center">
                            <p className="font-medium text-gray-900">{user.rating_stats.average_professionalism.toFixed(1)}</p>
                            <p className="text-gray-500">Professionalism</p>
                          </div>
                        </div>
                      </div>
                    )}
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