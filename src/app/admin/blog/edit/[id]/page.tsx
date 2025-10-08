'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Logo } from '@/components/common/logo';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Save, Eye, Trash2 } from 'lucide-react';
import { BlogService, CreateBlogPostData } from '@/lib/services/blog-service';
import { BlogPostWithAuthor } from '@/lib/database-types';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';

export default function EditBlogPost() {
  const params = useParams();
  const postId = params.id as string;
  const [post, setPost] = useState<BlogPostWithAuthor | null>(null);
  const [formData, setFormData] = useState<CreateBlogPostData>({
    title: '',
    excerpt: '',
    content: '',
    featured_image_url: '',
    category: 'Product Updates',
    status: 'draft'
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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
    if (mounted) {
      if (user) {
        checkAdminAccess();
      } else {
        // If no user after mounting, redirect to login
        router.push('/admin/login?redirect=' + encodeURIComponent(`/admin/blog/edit/${postId}`));
      }
    }
  }, [user, mounted, router, postId]);

  const checkAdminAccess = async () => {
    if (!user) {
      router.push('/admin/login?redirect=' + encodeURIComponent(`/admin/blog/edit/${postId}`));
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
      loadPost();
    } catch (error) {
      console.error('Error checking admin status:', error);
      router.push('/');
    }
  };

  // Remove the old useEffect since we now call loadPost from checkAdminAccess

  const loadPost = async () => {
    try {
      setLoading(true);
      const posts = await BlogService.getAllPosts();
      const foundPost = posts.find(p => p.id === postId);
      
      if (!foundPost) {
        toast({
          title: 'Error',
          description: 'Blog post not found.',
          variant: 'destructive'
        });
        router.push('/admin/blog');
        return;
      }

      setPost(foundPost);
      setFormData({
        title: foundPost.title,
        excerpt: foundPost.excerpt || '',
        content: foundPost.content,
        featured_image_url: foundPost.featured_image_url || '',
        category: foundPost.category,
        status: foundPost.status
      });
    } catch (error) {
      console.error('Error loading post:', error);
      toast({
        title: 'Error',
        description: 'Failed to load blog post.',
        variant: 'destructive'
      });
      router.push('/admin/blog');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent, saveAs: 'draft' | 'published' = formData.status as 'draft' | 'published') => {
    e.preventDefault();
    
    if (!user || !post) return;

    try {
      setSaving(true);
      const updateData = { ...formData, status: saveAs, id: post.id };
      await BlogService.updatePost(updateData);
      
      toast({
        title: 'Success',
        description: `Blog post ${saveAs === 'published' ? 'published' : 'updated'} successfully.`
      });

      router.push('/admin/blog');
    } catch (error) {
      console.error('Error updating post:', error);
      toast({
        title: 'Error',
        description: 'Failed to update blog post.',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!post || !confirm('Are you sure you want to delete this post? This action cannot be undone.')) return;

    try {
      await BlogService.deletePost(post.id);
      toast({
        title: 'Success',
        description: 'Blog post deleted successfully.'
      });
      router.push('/admin/blog');
    } catch (error) {
      console.error('Error deleting post:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete blog post.',
        variant: 'destructive'
      });
    }
  };

  // Show loading during hydration
  if (!mounted) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Show loading while checking admin status
  if (mounted && !isAdmin && user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  // If mounted but no user and no admin status, redirect will happen in useEffect
  if (mounted && !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  // If we reach here, user should be admin
  if (mounted && !isAdmin) {
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

  if (!post) {
    return null;
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
                  <Link href="/admin/blog">
                    <ArrowLeft className="h-4 w-4 mr-1" />
                    Back to Posts
                  </Link>
                </Button>
                <span className="text-gray-400">/</span>
                <h1 className="text-xl font-semibold text-gray-900">Edit Post</h1>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {post.status === 'published' && (
                <Button variant="outline" asChild>
                  <Link href={`/blog/${post.slug}`} target="_blank">
                    <Eye className="h-4 w-4 mr-2" />
                    View Live
                  </Link>
                </Button>
              )}
              <Button 
                variant="outline" 
                onClick={(e) => handleSubmit(e, 'draft')}
                disabled={saving || !formData.title || !formData.content}
              >
                <Save className="h-4 w-4 mr-2" />
                Save Draft
              </Button>
              <Button 
                onClick={(e) => handleSubmit(e, 'published')}
                disabled={saving || !formData.title || !formData.content}
                className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90"
              >
                <Eye className="h-4 w-4 mr-2" />
                {post.status === 'published' ? 'Update' : 'Publish'}
              </Button>
              <Button 
                variant="outline"
                onClick={handleDelete}
                className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Edit Blog Post</CardTitle>
            <div className="flex items-center gap-2">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                post.status === 'published' 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-yellow-100 text-yellow-800'
              }`}>
                {post.status}
              </span>
              <span className="text-sm text-gray-500">
                Created {new Date(post.created_at).toLocaleDateString()}
              </span>
              {post.published_at && (
                <span className="text-sm text-gray-500">
                  • Published {new Date(post.published_at).toLocaleDateString()}
                </span>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={(e) => handleSubmit(e)} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title *
                </label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Enter an engaging title for your post"
                  required
                  className="text-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Excerpt
                </label>
                <Textarea
                  value={formData.excerpt}
                  onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                  placeholder="Brief description that will appear in the blog listing (optional)"
                  rows={3}
                  className="resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Content *
                </label>
                <Textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="Write your blog post content here..."
                  rows={12}
                  required
                  className="resize-y min-h-[300px] font-mono text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Featured Image URL
                </label>
                <Input
                  value={formData.featured_image_url}
                  onChange={(e) => setFormData({ ...formData, featured_image_url: e.target.value })}
                  placeholder="https://example.com/image.jpg"
                  type="url"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category
                  </label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData({ ...formData, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Product Updates">Product Updates</SelectItem>
                      <SelectItem value="Features">Features</SelectItem>
                      <SelectItem value="Community">Community</SelectItem>
                      <SelectItem value="Tips & Tricks">Tips & Tricks</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <Select
                    value={formData.status}
                    onValueChange={(value: 'draft' | 'published') => setFormData({ ...formData, status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="published">Published</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}