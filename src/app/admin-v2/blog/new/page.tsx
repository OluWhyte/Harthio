'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Save, Eye, ArrowLeft, Image as ImageIcon, 
  FileText, Tag, Calendar, AlertCircle 
} from 'lucide-react';
import { BlogService, CreateBlogPostData } from '@/lib/services/blog-service';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { formatContentForDisplay } from '@/lib/blog-formatter';
import { BlogFormattingGuide } from '@/components/admin/blog-formatting-guide';

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
  const [showPreview, setShowPreview] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const handleSubmit = async (saveAs: 'draft' | 'published') => {
    if (!user) {
      toast({
        title: 'Error',
        description: 'You must be logged in to create posts.',
        variant: 'destructive'
      });
      return;
    }

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
      const postData = { ...formData, status: saveAs };
      await BlogService.createPost(postData, user.uid);
      
      toast({
        title: 'Success',
        description: `Blog post ${saveAs === 'published' ? 'published' : 'saved as draft'} successfully.`
      });

      router.push('/admin-v2/blog');
    } catch (error: any) {
      console.error('Error saving post:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to save blog post.',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
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
  const readingTime = Math.ceil(wordCount / 200); // Average reading speed

  const categories = ['Product Updates', 'Features', 'Community', 'Tips & Tricks'];

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 max-w-7xl space-y-6">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" asChild size="sm">
            <Link href="/admin-v2/blog">
              <ArrowLeft className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Back to Posts</span>
              <span className="sm:hidden">Back</span>
            </Link>
          </Button>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Create New Post</h2>
            <p className="text-sm text-gray-600 mt-1 hidden sm:block">
              Write and publish a new blog post
            </p>
          </div>
        </div>
        
        {/* Action Buttons - Full width on mobile */}
        <div className="flex flex-col sm:flex-row gap-2 w-full">
          <Button 
            variant="outline" 
            onClick={() => setShowPreview(!showPreview)}
            className="w-full sm:w-auto"
          >
            <Eye className="h-4 w-4 mr-2" />
            {showPreview ? 'Edit' : 'Preview'}
          </Button>
          <Button 
            variant="outline"
            onClick={() => handleSubmit('draft')}
            disabled={saving || !formData.title || !formData.content}
            className="w-full sm:w-auto"
          >
            <Save className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Save Draft</span>
            <span className="sm:hidden">Draft</span>
          </Button>
          <Button 
            onClick={() => handleSubmit('published')}
            disabled={saving || !formData.title || !formData.content}
            className="bg-gradient-to-r from-primary to-accent w-full sm:w-auto"
          >
            <Eye className="h-4 w-4 mr-2" />
            Publish
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-4 lg:space-y-6 order-2 lg:order-1">
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
- Internal link: [Sign up now](/signup)
- External link: [Follow us](https://twitter.com/harthio_)

Tips:
- Use ## for major sections
- Use ### for subsections
- Add links to guide readers to actions"
                    rows={15}
                    className="resize-y min-h-[300px] lg:min-h-[400px] font-mono text-sm"
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
                  <span>{new Date().toLocaleDateString()}</span>
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
        <div className="space-y-4 lg:space-y-6 order-1 lg:order-2">
          {/* Settings */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Tag className="h-4 w-4" />
                Post Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-0">
              <div className="grid grid-cols-2 lg:grid-cols-1 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category
                  </label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData({ ...formData, category: value })}
                  >
                    <SelectTrigger className="h-9">
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <Select
                    value={formData.status}
                    onValueChange={(value: 'draft' | 'published') => setFormData({ ...formData, status: value })}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="published">Published</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
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
                  harthio.com/blog/{formData.title ? generateSlug(formData.title) : 'post-slug'}
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
                Publishing
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Created:</span>
                <span className="font-medium">Just now</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Author:</span>
                <span className="font-medium">Harthio Team</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Reading Time:</span>
                <span className="font-medium">{readingTime} min</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Formatting Guide - Moved to bottom */}
      <div className="mt-8">
        <BlogFormattingGuide />
      </div>
    </div>
  );
}
