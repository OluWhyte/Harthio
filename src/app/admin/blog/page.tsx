'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ResponsiveAdminHeader } from '@/components/admin/responsive-admin-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Edit, Trash2, Eye, Calendar, User } from 'lucide-react';
import { BlogService } from '@/lib/services/blog-service';
import { BlogPostWithAuthor } from '@/lib/database-types';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';

export default function AdminBlogManagement() {
  const [blogPosts, setBlogPosts] = useState<BlogPostWithAuthor[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && user) {
      checkAdminAndLoadPosts();
    }
  }, [user, mounted]);

  const checkAdminAndLoadPosts = async () => {
    if (!user) {
      router.push('/admin/login?redirect=' + encodeURIComponent('/admin/blog'));
      return;
    }

    try {
      const adminStatus = await BlogService.isUserAdmin(user.uid);
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
      const posts = await BlogService.getAllPosts();
      setBlogPosts(posts);
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

  const handleDelete = async (postId: string) => {
    if (!confirm('Are you sure you want to delete this post?')) return;

    try {
      await BlogService.deletePost(postId, user?.uid);
      toast({
        title: 'Success',
        description: 'Blog post deleted successfully.'
      });
      checkAdminAndLoadPosts();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete blog post.',
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

  // Prevent hydration mismatch
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
        title="Blog Management"
        actions={[
          {
            label: 'View Blog',
            icon: <Eye className="h-4 w-4" />,
            onClick: () => window.open('/blog', '_blank'),
            variant: 'outline'
          },
          {
            label: 'New Post',
            icon: <Plus className="h-4 w-4" />,
            onClick: () => router.push('/admin/blog/new'),
            variant: 'default',
            className: 'bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90'
          }
        ]}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-gray-900">{blogPosts.length}</p>
                <p className="text-sm text-gray-600">Total Posts</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-green-600">
                  {blogPosts.filter(p => p && p.status === 'published').length}
                </p>
                <p className="text-sm text-gray-600">Published</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-yellow-600">
                  {blogPosts.filter(p => p && p.status === 'draft').length}
                </p>
                <p className="text-sm text-gray-600">Drafts</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Posts List */}
        <Card>
          <CardHeader>
            <CardTitle>All Blog Posts</CardTitle>
          </CardHeader>
          <CardContent>
            {blogPosts.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Plus className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No blog posts yet</h3>
                <p className="text-gray-600 mb-6">Create your first blog post to get started.</p>
                <Button asChild className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90">
                  <Link href="/admin/blog/new">
                    <Plus className="h-4 w-4 mr-2" />
                    Create First Post
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {blogPosts.map((post) => (
                  <div key={post.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            post.status === 'published' 
                              ? 'bg-green-100 text-green-800' 
                              : post.status === 'draft'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {post.status}
                          </span>
                          <span className="bg-primary/10 text-primary px-2 py-1 rounded-full text-xs font-medium">
                            {post.category}
                          </span>
                        </div>
                        
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">{post.title}</h3>
                        
                        {post.excerpt && (
                          <p className="text-gray-600 text-sm mb-3 line-clamp-2">{post.excerpt}</p>
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
                            <div className="flex items-center gap-1">
                              <Eye className="h-4 w-4" />
                              Published {formatDate(post.published_at)}
                            </div>
                          )}
                          {post.like_count && post.like_count > 0 && (
                            <div className="text-red-600 font-medium">
                              {post.like_count} likes
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {post.status === 'published' && (
                          <Button variant="ghost" size="sm" asChild>
                            <Link href={`/blog/${post.slug}`} target="_blank">
                              <Eye className="h-4 w-4" />
                            </Link>
                          </Button>
                        )}
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/admin/blog/edit/${post.id}`}>
                            <Edit className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleDelete(post.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
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
