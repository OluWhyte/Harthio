import { supabase } from '@/lib/supabase';
import { BlogPost, BlogLike, BlogPostWithAuthor } from '@/lib/database-types';
import { sanitizeBlogContent, sanitizeInput, sanitizeUrl } from '@/lib/security-sanitization';

export interface CreateBlogPostData {
  title: string;
  excerpt?: string;
  content: string;
  featured_image_url?: string;
  category?: string;
  status?: 'draft' | 'published';
}

export interface UpdateBlogPostData extends Partial<CreateBlogPostData> {
  id: string;
}

export class BlogService {
  // Public methods - no auth required
  static async getPublishedPosts(limit = 10, offset = 0): Promise<BlogPostWithAuthor[]> {
    const { data, error } = await supabase
      .from('blog_posts')
      .select('*')
      .eq('status', 'published')
      .order('published_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;
    
    // Return posts with basic author info
    return (data || []).map((post: any) => ({
      ...post,
      author: { id: post.author_id, email: 'Unknown', full_name: 'Harthio Team' },
      like_count: 0
    }));
  }

  static async getPostBySlug(slug: string): Promise<BlogPostWithAuthor | null> {
    const { data, error } = await supabase
      .from('blog_posts')
      .select('*')
      .eq('slug', slug)
      .eq('status', 'published')
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    
    if (!data) return null;
    
    const postData = data as any;
    return {
      ...postData,
      author: { id: postData.author_id, email: 'Unknown', full_name: 'Harthio Team' },
      like_count: 0
    };
  }

  static async getPostsByCategory(category: string, limit = 10): Promise<BlogPostWithAuthor[]> {
    const { data, error } = await supabase
      .from('blog_posts')
      .select('*')
      .eq('category', category)
      .eq('status', 'published')
      .order('published_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    
    return (data || []).map((post: any) => ({
      ...post,
      author: { id: post.author_id, email: 'Unknown', full_name: 'Harthio Team' },
      like_count: 0
    }));
  }

  static async likePost(postId: string, ipAddress: string, userAgent?: string): Promise<void> {
    const { error } = await supabase
      .from('blog_likes')
      .insert({
        blog_post_id: postId,
        ip_address: ipAddress,
        user_agent: userAgent
      } as any);

    if (error && error.code !== '23505') { // Ignore duplicate key error
      throw error;
    }
  }

  static async unlikePost(postId: string, ipAddress: string): Promise<void> {
    const { error } = await supabase
      .from('blog_likes')
      .delete()
      .eq('blog_post_id', postId)
      .eq('ip_address', ipAddress);

    if (error) throw error;
  }

  static async hasUserLiked(postId: string, ipAddress: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('blog_likes')
      .select('id')
      .eq('blog_post_id', postId)
      .eq('ip_address', ipAddress)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return !!data;
  }

  static async getLikeCount(postId: string): Promise<number> {
    const { count, error } = await supabase
      .from('blog_likes')
      .select('*', { count: 'exact', head: true })
      .eq('blog_post_id', postId);

    if (error) throw error;
    return count || 0;
  }

  // Admin methods - require authentication
  static async isUserAdmin(userId: string): Promise<boolean> {
    // Delegate to central admin service
    const { AdminAuthService } = await import('./admin-auth-service');
    return AdminAuthService.isUserAdmin(userId);
  }

  static async getAllPosts(limit = 50, offset = 0): Promise<BlogPostWithAuthor[]> {
    const { data, error } = await supabase
      .from('blog_posts')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;
    
    // For now, return posts without author info to avoid the join issue
    // Add null safety for all fields
    return (data || []).map((post: any) => ({
      ...post,
      title: post.title || 'Untitled',
      content: post.content || '',
      status: post.status || 'draft',
      author: { id: post.author_id, email: 'Unknown', full_name: 'Harthio Team' },
      like_count: 0
    }));
  }

  static async createPost(postData: CreateBlogPostData, userId?: string): Promise<BlogPostWithAuthor> {
    // Verify admin role if userId provided
    if (userId) {
      const isAdmin = await this.isUserAdmin(userId);
      if (!isAdmin) {
        throw new Error('Unauthorized: Admin access required');
      }
    }

    const slug = this.generateSlug(postData.title);
    
    const { data, error } = await supabase
      .from('blog_posts')
      .insert({
        ...postData,
        slug,
        author_id: userId,
        published_at: postData.status === 'published' ? new Date().toISOString() : null
      } as any)
      .select('*')
      .single();

    if (error) throw error;
    
    return {
      ...(data as any),
      author: { id: (data as any).author_id, email: 'Unknown', full_name: 'Harthio Team' },
      like_count: 0
    };
  }

  static async updatePost(postData: UpdateBlogPostData, userId?: string): Promise<BlogPostWithAuthor> {
    // Verify admin role if userId provided
    if (userId) {
      const isAdmin = await this.isUserAdmin(userId);
      if (!isAdmin) {
        throw new Error('Unauthorized: Admin access required');
      }
    }

    const updateData: any = { ...postData };
    delete updateData.id;

    // Update slug if title changed
    if (postData.title) {
      updateData.slug = this.generateSlug(postData.title);
    }

    // Set published_at if status changed to published
    if (postData.status === 'published') {
      updateData.published_at = new Date().toISOString();
    }

    const { data, error } = await (supabase as any)
      .from('blog_posts')
      .update(updateData)
      .eq('id', postData.id)
      .select('*')
      .single();

    if (error) throw error;
    
    return {
      ...(data as any),
      author: { id: (data as any).author_id, email: 'Unknown', full_name: 'Harthio Team' },
      like_count: 0
    };
  }

  static async deletePost(postId: string, userId?: string): Promise<void> {
    // Verify admin role if userId provided
    if (userId) {
      const isAdmin = await this.isUserAdmin(userId);
      if (!isAdmin) {
        throw new Error('Unauthorized: Admin access required');
      }
    }

    const { error } = await supabase
      .from('blog_posts')
      .delete()
      .eq('id', postId);

    if (error) throw error;
  }

  private static generateSlug(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '-')
      .trim();
  }
}