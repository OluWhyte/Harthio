'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ResponsiveAdminHeader } from '@/components/admin/responsive-admin-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Save, Eye } from 'lucide-react';
import { BlogService, CreateBlogPostData } from '@/lib/services/blog-service';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { useEffect } from 'react';

export default function NewBlogPost() {
  const [formData, setFormData] = useState<CreateBlogPostData>({
    title: '',
    excerpt: '',
    content: '',
    featured_image_url: '',
    category: 'Product Updates',
    status: 'draft'
  });
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
        router.push('/admin/login?redirect=' + encodeURIComponent('/admin/blog/new'));
      }
    }
  }, [user, mounted, router]);

  const checkAdminAccess = async () => {
    if (!user) {
      router.push('/admin/login?redirect=' + encodeURIComponent('/admin/blog/new'));
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
    } catch (error) {
      console.error('Error checking admin status:', error);
      router.push('/');
    }
  };

  const handleSubmit = async (e: React.FormEvent, saveAs: 'draft' | 'published' = formData.status as 'draft' | 'published') => {
    e.preventDefault();
    
    if (!user) {
      router.push('/admin/login?redirect=' + encodeURIComponent('/admin/blog/new'));
      return;
    }

    try {
      setSaving(true);
      const postData = { ...formData, status: saveAs };
      const newPost = await BlogService.createPost(postData);
      
      toast({
        title: 'Success',
        description: `Blog post ${saveAs === 'published' ? 'published' : 'saved as draft'} successfully.`
      });

      router.push('/admin/blog');
    } catch (error) {
      console.error('Error saving post:', error);
      toast({
        title: 'Error',
        description: 'Failed to save blog post.',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  // Show loading during hydration or while checking admin status
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

  return (
    <div className="min-h-screen bg-gray-50">
      <ResponsiveAdminHeader
        title="New Post"
        backHref="/admin/blog"
        backLabel="Back to Posts"
        actions={[
          {
            label: 'Save Draft',
            icon: <Save className="h-4 w-4" />,
            onClick: (e) => handleSubmit(e, 'draft'),
            disabled: saving || !formData.title || !formData.content,
            variant: 'outline'
          },
          {
            label: 'Publish',
            icon: <Eye className="h-4 w-4" />,
            onClick: (e) => handleSubmit(e, 'published'),
            disabled: saving || !formData.title || !formData.content,
            variant: 'default',
            className: 'bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90'
          }
        ]}
      />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Create New Blog Post</CardTitle>
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
                <p className="text-xs text-gray-500 mt-1">
                  This will be shown in the blog listing and social media previews
                </p>
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
                <p className="text-xs text-gray-500 mt-1">
                  Write in plain text. Line breaks will be preserved.
                </p>
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
                <p className="text-xs text-gray-500 mt-1">
                  Optional. Use a high-quality image (recommended: 1200x600px)
                </p>
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

              {/* Preview Section */}
              {formData.title && (
                <div className="border-t pt-6">
                  <h3 className="text-lg font-semibold mb-4">Preview</h3>
                  <div className="bg-gray-50 p-6 rounded-lg">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="bg-primary/10 text-primary px-2 py-1 rounded-full text-xs font-medium">
                        {formData.category}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        formData.status === 'published' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {formData.status}
                      </span>
                    </div>
                    <h2 className="text-2xl font-bold mb-3">{formData.title}</h2>
                    {formData.excerpt && (
                      <p className="text-gray-600 mb-4">{formData.excerpt}</p>
                    )}
                    {formData.content && (
                      <div className="text-sm text-gray-700">
                        <p className="font-medium mb-2">Content preview:</p>
                        <p className="line-clamp-3">{formData.content}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}