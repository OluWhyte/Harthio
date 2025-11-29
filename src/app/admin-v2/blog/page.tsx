'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { 
  Plus, Edit, Trash2, Eye, Calendar, User, Search, 
  Filter, Heart, TrendingUp, FileText, Clock, CheckCircle2,
  XCircle, MoreVertical, ExternalLink, Copy
} from 'lucide-react';
import { BlogService } from '@/lib/services/blog-service';
import { BlogPostWithAuthor } from '@/lib/database-types';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { LoadingSpinner } from '@/components/common/loading-spinner';
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
import { Badge } from '@/components/ui/badge';

export default function AdminBlogManagement() {
  const [blogPosts, setBlogPosts] = useState<BlogPostWithAuthor[]>([]);
  const [filteredPosts, setFilteredPosts] = useState<BlogPostWithAuthor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('newest');
  const [selectedPosts, setSelectedPosts] = useState<Set<string>>(new Set());
  const { user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      loadPosts();
    }
  }, [user]);

  useEffect(() => {
    filterAndSortPosts();
  }, [blogPosts, searchQuery, statusFilter, categoryFilter, sortBy]);

  const loadPosts = async () => {
    try {
      setLoading(true);
      const posts = await BlogService.getAllPosts(100);
      setBlogPosts(posts);
    } catch (error) {
      console.error('Error loading posts:', error);
      toast({
        title: 'Error',
        description: 'Failed to load blog posts.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortPosts = () => {
    let filtered = [...blogPosts];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(post => 
        post.title.toLowerCase().includes(query) ||
        post.excerpt?.toLowerCase().includes(query) ||
        post.content.toLowerCase().includes(query)
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(post => post.status === statusFilter);
    }

    // Category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(post => post.category === categoryFilter);
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'oldest':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case 'title':
          return a.title.localeCompare(b.title);
        case 'likes':
          return (b.like_count || 0) - (a.like_count || 0);
        default:
          return 0;
      }
    });

    setFilteredPosts(filtered);
  };

  const handleDelete = async (postId: string) => {
    if (!confirm('Are you sure you want to delete this post?')) return;

    try {
      await BlogService.deletePost(postId, user?.uid);
      toast({
        title: 'Success',
        description: 'Blog post deleted successfully.'
      });
      loadPosts();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete blog post.',
        variant: 'destructive'
      });
    }
  };

  const handleBulkPublish = async () => {
    if (selectedPosts.size === 0) return;
    
    try {
      for (const postId of selectedPosts) {
        const post = blogPosts.find(p => p.id === postId);
        if (post && post.status === 'draft') {
          await BlogService.updatePost({ id: postId, status: 'published' }, user?.uid);
        }
      }
      toast({
        title: 'Success',
        description: `Published ${selectedPosts.size} post(s).`
      });
      setSelectedPosts(new Set());
      loadPosts();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to publish posts.',
        variant: 'destructive'
      });
    }
  };

  const handleBulkUnpublish = async () => {
    if (selectedPosts.size === 0) return;
    
    try {
      for (const postId of selectedPosts) {
        const post = blogPosts.find(p => p.id === postId);
        if (post && post.status === 'published') {
          await BlogService.updatePost({ id: postId, status: 'draft' }, user?.uid);
        }
      }
      toast({
        title: 'Success',
        description: `Unpublished ${selectedPosts.size} post(s).`
      });
      setSelectedPosts(new Set());
      loadPosts();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to unpublish posts.',
        variant: 'destructive'
      });
    }
  };

  const copyPostUrl = (slug: string) => {
    const url = `${window.location.origin}/blog/${slug}`;
    navigator.clipboard.writeText(url);
    toast({
      title: 'Copied',
      description: 'Post URL copied to clipboard.'
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const stats = {
    total: blogPosts.length,
    published: blogPosts.filter(p => p.status === 'published').length,
    drafts: blogPosts.filter(p => p.status === 'draft').length,
    totalLikes: blogPosts.reduce((sum, p) => sum + (p.like_count || 0), 0)
  };

  const categories = ['Product Updates', 'Features', 'Community', 'Tips & Tricks'];

  if (loading) {
    return <LoadingSpinner size="lg" text="Loading blog posts..." />;
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 max-w-7xl space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Blog Management</h2>
          <p className="text-sm text-gray-600 mt-1">
            Create and manage blog posts for your platform
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/blog" target="_blank">
              <ExternalLink className="h-4 w-4 mr-2" />
              View Blog
            </Link>
          </Button>
          <Button asChild className="bg-gradient-to-r from-primary to-accent">
            <Link href="/admin-v2/blog/new">
              <Plus className="h-4 w-4 mr-2" />
              New Post
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Posts</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.total}</p>
              </div>
              <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Published</p>
                <p className="text-3xl font-bold text-green-600 mt-2">{stats.published}</p>
              </div>
              <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle2 className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Drafts</p>
                <p className="text-3xl font-bold text-yellow-600 mt-2">{stats.drafts}</p>
              </div>
              <div className="h-12 w-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Likes</p>
                <p className="text-3xl font-bold text-red-600 mt-2">{stats.totalLikes}</p>
              </div>
              <div className="h-12 w-12 bg-red-100 rounded-lg flex items-center justify-center">
                <Heart className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div className="lg:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search posts..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="published">Published</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
              </SelectContent>
            </Select>

            {/* Category Filter */}
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map(cat => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Sort and Bulk Actions */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mt-4 pt-4 border-t">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Sort by:</span>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest First</SelectItem>
                  <SelectItem value="oldest">Oldest First</SelectItem>
                  <SelectItem value="title">Title A-Z</SelectItem>
                  <SelectItem value="likes">Most Liked</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {selectedPosts.size > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">
                  {selectedPosts.size} selected
                </span>
                <Button size="sm" variant="outline" onClick={handleBulkPublish}>
                  Publish
                </Button>
                <Button size="sm" variant="outline" onClick={handleBulkUnpublish}>
                  Unpublish
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => setSelectedPosts(new Set())}
                >
                  Clear
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Posts List */}
      <Card>
        <CardContent className="p-6">
          {filteredPosts.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {searchQuery || statusFilter !== 'all' || categoryFilter !== 'all'
                  ? 'No posts found'
                  : 'No blog posts yet'}
              </h3>
              <p className="text-gray-600 mb-6">
                {searchQuery || statusFilter !== 'all' || categoryFilter !== 'all'
                  ? 'Try adjusting your filters'
                  : 'Create your first blog post to get started'}
              </p>
              {!searchQuery && statusFilter === 'all' && categoryFilter === 'all' && (
                <Button asChild className="bg-gradient-to-r from-primary to-accent">
                  <Link href="/admin-v2/blog/new">
                    <Plus className="h-4 w-4 mr-2" />
                    Create First Post
                  </Link>
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredPosts.map((post) => (
                <div 
                  key={post.id} 
                  className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-all hover:border-primary/50"
                >
                  <div className="flex items-start gap-4">
                    {/* Checkbox */}
                    <input
                      type="checkbox"
                      checked={selectedPosts.has(post.id)}
                      onChange={(e) => {
                        const newSelected = new Set(selectedPosts);
                        if (e.target.checked) {
                          newSelected.add(post.id);
                        } else {
                          newSelected.delete(post.id);
                        }
                        setSelectedPosts(newSelected);
                      }}
                      className="mt-1 h-4 w-4 rounded border-gray-300"
                    />

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <Badge 
                          variant={post.status === 'published' ? 'default' : 'secondary'}
                          className={post.status === 'published' ? 'bg-green-600' : 'bg-yellow-600'}
                        >
                          {post.status}
                        </Badge>
                        <Badge variant="outline">{post.category}</Badge>
                        {post.like_count && post.like_count > 0 && (
                          <Badge variant="outline" className="text-red-600 border-red-200">
                            <Heart className="h-3 w-3 mr-1 fill-red-600" />
                            {post.like_count}
                          </Badge>
                        )}
                      </div>
                      
                      <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-1">
                        {post.title}
                      </h3>
                      
                      {post.excerpt && (
                        <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                          {post.excerpt}
                        </p>
                      )}
                      
                      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <User className="h-4 w-4" />
                          {post.author?.full_name || 'Harthio Team'}
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {formatDate(post.created_at)}
                        </div>
                        {post.published_at && (
                          <div className="flex items-center gap-1 text-green-600">
                            <CheckCircle2 className="h-4 w-4" />
                            Published {formatDate(post.published_at)}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/admin-v2/blog/edit/${post.id}`}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </Link>
                        </DropdownMenuItem>
                        {post.status === 'published' && (
                          <>
                            <DropdownMenuItem asChild>
                              <Link href={`/blog/${post.slug}`} target="_blank">
                                <Eye className="h-4 w-4 mr-2" />
                                View Live
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => copyPostUrl(post.slug)}>
                              <Copy className="h-4 w-4 mr-2" />
                              Copy URL
                            </DropdownMenuItem>
                          </>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onClick={() => handleDelete(post.id)}
                          className="text-red-600"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
