'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Save, Eye, ArrowLeft, Image as ImageIcon, 
  FileText, Tag, Calendar, AlertCircle, Trash2, ExternalLink 
} from 'lucide-react';
import { BlogService, CreateBlogPostData } from '@/lib/services/blog-service';
import { BlogPostWithAuthor } from '@/lib/database-types';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { formatContentForDisplay } from '@/lib/blog-formatter';
import { BlogFormattingGuide } from '@/components/admin/blog-formatting-guide';
import { LoadingSpinner } from '@/components/common/loading-spinner';

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
  const [showPreview, setShowPreview] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      loadPost();
    }
  }, [user, postId]);

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
        router.push('/admin-v2/blog');
        return;
      }

      setPost(foundPost);
      setFormData({
        title: foundPost.title,
        excerpt: foundPost.excerpt || '',
        content: foundPost.content,
        featured_image_url: foundPost.featured_image_url || '',
        category: foundPost.category,
        status: (foundPost.status === 'archived' ? 'draft' : foundPost.status) as 'draft' | 'published'
      });
    } catch (error) {
      console.error('Error loading post:', error);
      toast({
        title: 'Error',
        description: 'Failed to load blog post.',
        variant: 'destructive'
      });
      router.push('/admin-v2/blog');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (saveAs: 'draft' | 'published') => {
    if (!user || !post) return;

    if (!formData.title.trim() || !formData.content.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Title and content are required.',
        variant: 'destructive'
      });
      return;
    }

    try {
      setSaving(true);
      const updateData = { ...formData, status: saveAs, id: post.id };
      await BlogService.updatePost(updateData, user.uid);
      
      toast({
        title: 'Success',
        description: `Blog post ${saveAs === 'published' ? 'published' : 'updated'} successfully.`
      });

      router.push('/admin-v2/blog');
    } catch (error: any) {
      console.error('Error updating post:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to update blog post.',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!post || !confirm('Are you sure you want to delete this post? This action cannot be undone.')) return;

    try {
      await BlogService.deletePost(post.id, user?.uid);
      toast({
        title: 'Success',
        description: 'Blog post deleted successfully.'
      });
      router.push('/admin-v2/blog');
    } catch (error: any) {
      console.error('Error deleting post:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete blog post.',
        variant: 'destructive'
      });
    }
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '-')
      .trim();
  };

  const wordCount = formData.content.trim().split(/\s+/).filter(w => w).length;
  const readingTime = Math.ceil(wordCount / 200);

  const categories = ['Product Updates', 'Features', 'Community', 'Tips & Tricks'];

  if (loading) {
    return <LoadingSpinner size="lg" text="Loading blog post..." />;
  }

  if (!post) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 max-w-7xl space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" asChild>
            <Link href="/admin-v2/blog">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Posts
            </Link>
          </Button>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Edit Post</h2>
            <div className="flex items-center gap-2 mt-1">
              <Badge 
                variant={post.status === 'published' ? 'default' : 'secondary'}
                className={post.status === 'published' ? 'bg-green-600' : 'bg-yellow-600'}
              >
                {post.status}
              </Badge>
              <span className="text-sm text-gray-600">
                Created {new Date(post.created_at).toLocaleDateString()}
              </span>
              {post.published_at && (
                <span className="text-sm text-gray-600">
                  • Published {new Date(post.published_at).toLocaleDateString()}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          {post.status === 'published' && (
            <Button variant="outline" asChild>
              <Link href={`/blog/${post.slug}`} target="_blank">
                <ExternalLink className="h-4 w-4 mr-2" />
                View Live
              </Link>
            </Button>
          )}
          <Button 
            variant="outline" 
            onClick={() => setShowPreview(!showPreview)}
          >
            <Eye className="h-4 w-4 mr-2" />
            {showPreview ? 'Edit' : 'Preview'}
          </Button>
          <Button 
            variant="outline"
            onClick={() => handleSubmit('draft')}
            disabled={saving || !formData.title || !formData.content}
          >
            <Save className="h-4 w-4 mr-2" />
            Save Draft
          </Button>
          <Button 
            onClick={() => handleSubmit('published')}
            disabled={saving || !formData.title || !formData.content}
            className="bg-gradient-to-r from-primary to-accent"
          >
            <Eye className="h-4 w-4 mr-2" />
            {post.status === 'published' ? 'Update' : 'Publish'}
          </Button>
          <Button 
            variant="outline"
            onClick={handleDelete}
            className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Validation Alert */}
      {(!formData.title || !formData.content) && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Title and content are required to publish your post.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {!showPreview ? (
            <>
              {/* Title */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Post Title
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Enter an engaging title for your post"
                    className="text-lg font-semibold"
                  />
                  {formData.title && (
                    <p className="text-xs text-gray-500 mt-2">
                      Slug: {generateSlug(formData.title)}
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Excerpt */}
              <Card>
                <CardHeader>
                  <CardTitle>Excerpt</CardTitle>
                  <p className="text-sm text-gray-600">
                    Brief description shown in blog listing and social media
                  </p>
                </CardHeader>
                <CardContent>
                  <Textarea
                    value={formData.excerpt}
                    onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                    placeholder="Write a compelling excerpt (optional but recommended)"
                    rows={3}
                    className="resize-none"
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    {formData.excerpt?.length || 0} characters
                  </p>
                </CardContent>
              </Card>

              {/* Content */}
              <Card>
                <CardHeader>
                  <CardTitle>Content</CardTitle>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <span>{wordCount} words</span>
                    <span>•</span>
                    <span>{readingTime} min read</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <Textarea
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    placeholder="Write your blog post content here...

You can use simple formatting:
## Main Heading (use ## at start of line)
### Subheading (use ### at start of line)
[link text](url) - for links

Examples:
- Internal: [Sign up](/signup)
- External: [Twitter](https://twitter.com/harthio_)"
                    rows={20}
                    className="resize-y min-h-[400px] font-mono text-sm"
                  />
                </CardContent>
              </Card>
            </>
          ) : (
            /* Preview */
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="outline">{formData.category}</Badge>
                  <Badge 
                    variant={formData.status === 'published' ? 'default' : 'secondary'}
                    className={formData.status === 'published' ? 'bg-green-600' : 'bg-yellow-600'}
                  >
                    {formData.status}
                  </Badge>
                  {post.like_count && post.like_count > 0 && (
                    <Badge variant="outline" className="text-red-600 border-red-200">
                      {post.like_count} likes
                    </Badge>
                  )}
                </div>
                <CardTitle className="text-3xl">{formData.title || 'Untitled Post'}</CardTitle>
                {formData.excerpt && (
                  <p className="text-lg text-gray-600 mt-2">{formData.excerpt}</p>
                )}
                <div className="flex items-center gap-4 text-sm text-gray-500 mt-4">
                  <span>{wordCount} words</span>
                  <span>•</span>
                  <span>{readingTime} min read</span>
                  <span>•</span>
                  <span>{new Date(post.published_at || post.created_at).toLocaleDateString()}</span>
                </div>
              </CardHeader>
              <CardContent>
                {formData.featured_image_url && (
                  <div className="mb-6">
                    <img 
                      src={formData.featured_image_url} 
                      alt={formData.title}
                      className="w-full h-64 object-cover rounded-lg"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  </div>
                )}
                <div className="prose prose-lg max-w-none">
                  {formatContentForDisplay(formData.content)}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Tag className="h-5 w-5" />
                Post Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
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
                    {categories.map(cat => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
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
            </CardContent>
          </Card>

          {/* Featured Image */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ImageIcon className="h-5 w-5" />
                Featured Image
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Input
                value={formData.featured_image_url}
                onChange={(e) => setFormData({ ...formData, featured_image_url: e.target.value })}
                placeholder="https://example.com/image.jpg"
                type="url"
              />
              <p className="text-xs text-gray-500 mt-2">
                Recommended: 1240x800px, high quality. Supports any image URL (Unsplash, Cloudinary, Imgur, direct URLs, etc.)
              </p>
              {formData.featured_image_url && (
                <div className="mt-4">
                  <img 
                    src={formData.featured_image_url} 
                    alt="Preview"
                    className="w-full h-32 object-cover rounded-lg"
                    onError={(e) => {
                      e.currentTarget.src = '';
                      e.currentTarget.alt = 'Invalid image URL';
                    }}
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* SEO Preview */}
          <Card>
            <CardHeader>
              <CardTitle>SEO Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="text-sm text-blue-600 truncate">
                  harthio.com/blog/{formData.title ? generateSlug(formData.title) : post.slug}
                </div>
                <div className="text-lg text-blue-800 font-medium line-clamp-1">
                  {formData.title || 'Your Post Title'}
                </div>
                <div className="text-sm text-gray-600 line-clamp-2">
                  {formData.excerpt || 'Your post excerpt will appear here...'}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Publishing Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Publishing Info
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Created:</span>
                <span className="font-medium">
                  {new Date(post.created_at).toLocaleDateString()}
                </span>
              </div>
              {post.published_at && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Published:</span>
                  <span className="font-medium">
                    {new Date(post.published_at).toLocaleDateString()}
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-600">Author:</span>
                <span className="font-medium">
                  {post.author?.full_name || 'Harthio Team'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Reading Time:</span>
                <span className="font-medium">{readingTime} min</span>
              </div>
              {post.like_count !== undefined && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Likes:</span>
                  <span className="font-medium text-red-600">{post.like_count}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Formatting Guide */}
          <BlogFormattingGuide />
        </div>
      </div>
    </div>
  );
}
