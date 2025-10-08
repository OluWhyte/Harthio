'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Logo } from '@/components/common/logo';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, Calendar, User, Heart, MessageCircle, ExternalLink, ArrowRight } from 'lucide-react';
import { BlogService } from '@/lib/services/blog-service';
import { BlogPostWithAuthor } from '@/lib/database-types';

export default function BlogPostPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [post, setPost] = useState<BlogPostWithAuthor | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasLiked, setHasLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [relatedPosts, setRelatedPosts] = useState<BlogPostWithAuthor[]>([]);

  useEffect(() => {
    if (slug) {
      loadPost();
    }
  }, [slug]);

  const loadPost = async () => {
    try {
      setLoading(true);
      const postData = await BlogService.getPostBySlug(slug);
      
      if (!postData) {
        // Handle 404
        return;
      }

      setPost(postData);
      setLikeCount(postData.like_count || 0);

      // Check if user has liked this post
      const userIP = await getUserIP();
      const liked = await BlogService.hasUserLiked(postData.id, userIP);
      setHasLiked(liked);

      // Load related posts from same category
      const related = await BlogService.getPostsByCategory(postData.category, 4);
      setRelatedPosts(related.filter(p => p.id !== postData.id).slice(0, 3));
    } catch (error) {
      console.error('Error loading post:', error);
    } finally {
      setLoading(false);
    }
  };

  const getUserIP = async (): Promise<string> => {
    try {
      const response = await fetch('/api/ip');
      const data = await response.json();
      return data.ip;
    } catch (error) {
      return '127.0.0.1';
    }
  };

  const handleLike = async () => {
    if (!post) return;

    try {
      const userIP = await getUserIP();
      
      if (hasLiked) {
        await BlogService.unlikePost(post.id, userIP);
        setHasLiked(false);
        setLikeCount(prev => prev - 1);
      } else {
        await BlogService.likePost(post.id, userIP, navigator.userAgent);
        setHasLiked(true);
        setLikeCount(prev => prev + 1);
      }
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const shareOnTwitter = () => {
    if (!post) return;
    const text = `Check out this update from @harthio_: ${post.title}`;
    const url = `${window.location.origin}/blog/${post.slug}`;
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="flex flex-col min-h-screen bg-background">
        <header className="px-4 lg:px-6 h-16 flex items-center border-b bg-white/80 backdrop-blur-sm">
          <Link href="/" className="flex items-center justify-center" prefetch={false}>
            <Logo />
          </Link>
        </header>
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-4">Post Not Found</h1>
            <p className="text-gray-600 mb-8">The blog post you're looking for doesn't exist.</p>
            <Button asChild>
              <Link href="/blog">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Blog
              </Link>
            </Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Header */}
      <header className="px-4 lg:px-6 h-16 flex items-center border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <Link href="/" className="flex items-center justify-center" prefetch={false}>
          <Logo />
        </Link>
        <nav className="ml-auto flex gap-4 items-center">
          <Button variant="ghost" asChild>
            <Link href="/blog" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Blog
            </Link>
          </Button>
          <Button variant="ghost" asChild>
            <Link href="/login">Log In</Link>
          </Button>
          <Button asChild className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90">
            <Link href="/signup">Join Free <ArrowRight className="ml-2 h-4 w-4" /></Link>
          </Button>
        </nav>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="w-full py-8 sm:py-12 md:py-20 bg-gradient-to-br from-primary/5 via-accent/5 to-background">
          <div className="container px-4 md:px-6">
            <div className="max-w-4xl mx-auto">
              <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-500 mb-6">
                <span className="bg-primary/10 text-primary px-2 sm:px-3 py-1 rounded-full font-medium">
                  {post.category}
                </span>
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">{formatDate(post.published_at || post.created_at)}</span>
                  <span className="sm:hidden">{new Date(post.published_at || post.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                </div>
                <div className="flex items-center gap-1">
                  <User className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="truncate">{post.author?.full_name || 'Harthio Team'}</span>
                </div>
              </div>
              
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold mb-4 sm:mb-6 leading-tight">
                {post.title}
              </h1>
              
              {post.excerpt && (
                <p className="text-lg sm:text-xl text-gray-600 mb-6 sm:mb-8 leading-relaxed">
                  {post.excerpt}
                </p>
              )}

              {/* Engagement Actions */}
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-6 sm:mb-8">
                <button
                  onClick={handleLike}
                  className="flex items-center justify-center sm:justify-start gap-2 px-4 py-2 rounded-lg border hover:bg-gray-50 transition-colors"
                >
                  <Heart className={`h-4 w-4 sm:h-5 sm:w-5 ${hasLiked ? 'fill-primary text-primary' : 'text-gray-500'}`} />
                  <span className="font-medium">{likeCount}</span>
                  <span className="text-sm text-gray-500">likes</span>
                </button>
                
                <button
                  onClick={shareOnTwitter}
                  className="flex items-center justify-center sm:justify-start gap-2 px-4 py-2 rounded-lg border hover:bg-gray-50 transition-colors"
                >
                  <MessageCircle className="h-4 w-4 sm:h-5 sm:w-5 text-gray-500" />
                  <span className="text-sm">Ask on X</span>
                  <ExternalLink className="h-3 w-3 sm:h-4 sm:w-4 text-gray-400" />
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Featured Image */}
        {post.featured_image_url && (
          <section className="w-full py-8">
            <div className="container px-4 md:px-6">
              <div className="max-w-4xl mx-auto">
                <div className="relative h-64 md:h-96 rounded-2xl overflow-hidden shadow-lg">
                  <Image
                    src={post.featured_image_url}
                    alt={post.title}
                    fill
                    className="object-cover"
                  />
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Content */}
        <section className="w-full py-12">
          <div className="container px-4 md:px-6">
            <div className="max-w-4xl mx-auto">
              <div className="prose prose-lg max-w-none">
                {post.content.split('\n').map((paragraph, index) => (
                  <p key={index} className="mb-6 text-gray-700 leading-relaxed">
                    {paragraph}
                  </p>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Related Posts */}
        {relatedPosts.length > 0 && (
          <section className="w-full py-16 bg-gray-50">
            <div className="container px-4 md:px-6">
              <div className="max-w-6xl mx-auto">
                <h2 className="text-3xl font-bold mb-8">Related Updates</h2>
                
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                  {relatedPosts.map((relatedPost) => (
                    <Card key={relatedPost.id} className="overflow-hidden hover:shadow-lg transition-shadow group">
                      {relatedPost.featured_image_url && (
                        <div className="relative h-40 sm:h-48">
                          <Image
                            src={relatedPost.featured_image_url}
                            alt={relatedPost.title}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        </div>
                      )}
                      <CardContent className="p-4 sm:p-6">
                        <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm text-gray-500 mb-3">
                          <span className="bg-primary/10 text-primary px-2 py-1 rounded-full text-xs font-medium">
                            {relatedPost.category}
                          </span>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            <span className="hidden sm:inline">{formatDate(relatedPost.published_at || relatedPost.created_at)}</span>
                            <span className="sm:hidden">{new Date(relatedPost.published_at || relatedPost.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                          </div>
                        </div>
                        <Link href={`/blog/${relatedPost.slug}`}>
                          <h3 className="text-base sm:text-lg font-semibold mb-3 leading-tight group-hover:text-primary transition-colors cursor-pointer">
                            {relatedPost.title}
                          </h3>
                        </Link>
                        {relatedPost.excerpt && (
                          <p className="text-gray-600 text-sm leading-relaxed line-clamp-3">
                            {relatedPost.excerpt}
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* CTA Section */}
        <section className="w-full py-12 sm:py-16 bg-gradient-to-r from-primary via-accent to-primary/90 text-white">
          <div className="container px-4 md:px-6 text-center">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4">
              Join the Conversation
            </h2>
            <p className="text-lg sm:text-xl mb-8 max-w-2xl mx-auto opacity-90 px-4">
              Have questions about this update? Join Harthio and connect with our community.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-md sm:max-w-none mx-auto">
              <Button className="bg-white text-primary hover:bg-gray-100 px-6 py-3 w-full sm:w-auto" asChild>
                <Link href="/signup" className="flex items-center justify-center">
                  Join Harthio
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button 
                variant="outline" 
                className="border-white text-white hover:bg-white hover:text-primary px-6 py-3 w-full sm:w-auto"
                onClick={shareOnTwitter}
              >
                <span className="flex items-center justify-center">
                  Ask on X
                  <ExternalLink className="ml-2 h-4 w-4" />
                </span>
              </Button>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col sm:flex-row justify-between items-center">
            <div className="flex items-center gap-4 mb-4 sm:mb-0">
              <Logo className="text-white" />
              <p className="text-sm text-gray-400">&copy; 2025 Stria Technologies All rights reserved.</p>
            </div>
            <nav className="flex gap-6 text-sm">
              <Link href="/privacy" className="text-gray-400 hover:text-white transition-colors">Privacy</Link>
              <Link href="/terms" className="text-gray-400 hover:text-white transition-colors">Terms</Link>
              <Link href="/contact" className="text-gray-400 hover:text-white transition-colors">Contact</Link>
            </nav>
          </div>
        </div>
      </footer>
    </div>
  );
}