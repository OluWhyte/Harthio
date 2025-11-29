'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Logo } from '@/components/common/logo';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, Calendar, User, ExternalLink, ArrowRight } from 'lucide-react';
import { BlogService } from '@/lib/services/blog-service';
import { BlogPostWithAuthor } from '@/lib/database-types';
import { formatContentForDisplay } from '@/lib/blog-formatter';
import { LoadingSpinner } from '@/components/common/loading-spinner';

export default function BlogPostPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [post, setPost] = useState<BlogPostWithAuthor | null>(null);
  const [loading, setLoading] = useState(true);
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

      // Load related posts from same category
      const related = await BlogService.getPostsByCategory(postData.category, 4);
      setRelatedPosts(related.filter(p => p.id !== postData.id).slice(0, 3));
    } catch (error) {
      console.error('Error loading post:', error);
    } finally {
      setLoading(false);
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
      <div className="flex items-center justify-center min-h-screen px-4">
        <LoadingSpinner size="lg" text="Loading blog post..." />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="flex flex-col min-h-screen bg-background">
        <header className="px-4 lg:px-6 h-14 sm:h-16 flex items-center border-b bg-white/80 backdrop-blur-sm">
          <Link href="/" className="flex items-center justify-center" prefetch={false}>
            <Logo />
          </Link>
        </header>
        <main className="flex-1 flex items-center justify-center px-4">
          <div className="text-center max-w-md mx-auto">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4">Post Not Found</h1>
            <p className="text-sm sm:text-base text-gray-600 mb-6 sm:mb-8">The blog post you're looking for doesn't exist.</p>
            <Button asChild className="w-full sm:w-auto">
              <Link href="/blog" className="flex items-center justify-center">
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
      <header className="px-3 sm:px-4 lg:px-6 h-14 sm:h-16 flex items-center border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <Link href="/" className="flex items-center justify-center" prefetch={false}>
          <Logo />
        </Link>
        <nav className="ml-auto flex gap-1 sm:gap-2 md:gap-4 items-center">
          <Button variant="ghost" asChild className="hidden md:flex text-sm">
            <Link href="/blog" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Blog
            </Link>
          </Button>
          <Button variant="ghost" asChild className="md:hidden p-1.5 sm:p-2" size="sm">
            <Link href="/blog">
              <ArrowLeft className="h-3 w-3 sm:h-4 sm:w-4" />
            </Link>
          </Button>
          <Button variant="ghost" asChild className="text-xs sm:text-sm px-2 sm:px-3 md:px-4" size="sm">
            <Link href="/login">Log In</Link>
          </Button>
          <Button asChild className="bg-primary hover:bg-primary/90 text-xs sm:text-sm md:text-base px-2 sm:px-3 md:px-4 py-1.5 sm:py-2" size="sm">
            <Link href="/signup" className="flex items-center">
              <span className="hidden xs:inline">Join Free</span>
              <span className="xs:hidden">Join</span>
              <ArrowRight className="ml-1 sm:ml-2 h-3 w-3 sm:h-4 sm:w-4" />
            </Link>
          </Button>
        </nav>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="w-full py-4 sm:py-6 md:py-8 lg:py-12 xl:py-20 bg-gradient-to-br from-primary/5 via-accent/5 to-background">
          <div className="container px-3 sm:px-4 md:px-6 max-w-4xl mx-auto">
            {/* Meta Information */}
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 md:gap-3 text-xs text-gray-500 mb-3 sm:mb-4 md:mb-6">
              <span className="bg-primary/10 text-primary px-2 py-0.5 sm:py-1 rounded-full font-medium text-xs">
                {post.category}
              </span>
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                <span className="hidden sm:inline text-xs">{formatDate(post.published_at || post.created_at)}</span>
                <span className="sm:hidden text-xs">{new Date(post.published_at || post.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' })}</span>
              </div>
              <div className="flex items-center gap-1">
                <User className="h-3 w-3" />
                <span className="truncate max-w-[80px] xs:max-w-[120px] sm:max-w-none text-xs">{post.author?.full_name || 'Harthio Team'}</span>
              </div>
            </div>
            
            {/* Title */}
            <h1 className="text-lg xs:text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold mb-2 sm:mb-3 md:mb-4 lg:mb-6 leading-tight break-words">
              {post.title}
            </h1>
            
            {/* Excerpt */}
            {post.excerpt && (
              <p className="text-sm sm:text-base md:text-lg lg:text-xl text-gray-600 mb-3 sm:mb-4 md:mb-6 lg:mb-8 leading-relaxed">
                {post.excerpt}
              </p>
            )}

            {/* Share Action */}
            <div className="flex gap-2 mb-3 sm:mb-4 md:mb-6 lg:mb-8">
              <button
                onClick={shareOnTwitter}
                className="flex items-center justify-center xs:justify-start gap-1.5 sm:gap-2 px-2.5 sm:px-3 md:px-4 py-1.5 sm:py-2 rounded-lg border hover:bg-gray-50 transition-colors text-xs sm:text-sm"
              >
                <ExternalLink className="h-3 w-3 sm:h-4 sm:w-4 text-gray-500" />
                <span>Share on X</span>
              </button>
            </div>
          </div>
        </section>

        {/* Featured Image */}
        {post.featured_image_url && (
          <section className="w-full py-3 sm:py-4 md:py-6 lg:py-8">
            <div className="container px-3 sm:px-4 md:px-6 max-w-4xl mx-auto">
              <div className="relative h-40 xs:h-48 sm:h-56 md:h-64 lg:h-80 xl:h-96 rounded-md sm:rounded-lg md:rounded-xl lg:rounded-2xl overflow-hidden shadow-md sm:shadow-lg">
                <Image
                  src={post.featured_image_url}
                  alt={post.title}
                  fill
                  className="object-cover"
                  priority
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1200px"
                />
              </div>
            </div>
          </section>
        )}

        {/* Content */}
        <section className="w-full py-4 sm:py-6 md:py-8 lg:py-12">
          <div className="container px-3 sm:px-4 md:px-6 max-w-4xl mx-auto">
            <article className="prose prose-sm sm:prose-base md:prose-lg max-w-none prose-gray prose-headings:font-bold prose-headings:text-gray-900 prose-p:text-gray-700 prose-p:leading-relaxed prose-a:text-primary prose-a:no-underline hover:prose-a:underline prose-strong:text-gray-900 prose-blockquote:border-primary prose-blockquote:bg-primary/5 prose-blockquote:px-3 prose-blockquote:py-2 prose-blockquote:rounded-lg">
              {formatContentForDisplay(post.content)}
            </article>
          </div>
        </section>

        {/* Related Posts */}
        {relatedPosts.length > 0 && (
          <section className="w-full py-6 sm:py-8 md:py-12 lg:py-16 bg-gray-50">
            <div className="container px-3 sm:px-4 md:px-6 max-w-6xl mx-auto">
              <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold mb-4 sm:mb-6 md:mb-8">Related Updates</h2>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6 lg:gap-8">
                {relatedPosts.map((relatedPost) => (
                  <Card key={relatedPost.id} className="overflow-hidden hover:shadow-lg transition-shadow group">
                    {relatedPost.featured_image_url && (
                      <div className="relative h-28 xs:h-32 sm:h-36 md:h-40 lg:h-48">
                        <Image
                          src={relatedPost.featured_image_url}
                          alt={relatedPost.title}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        />
                      </div>
                    )}
                    <CardContent className="p-3 sm:p-4 md:p-5 lg:p-6">
                      <div className="flex flex-wrap items-center gap-1 sm:gap-1.5 text-xs text-gray-500 mb-2">
                        <span className="bg-primary/10 text-primary px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-xs font-medium">
                          {relatedPost.category}
                        </span>
                        <div className="flex items-center gap-0.5 sm:gap-1">
                          <Calendar className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                          <span className="text-xs">{new Date(relatedPost.published_at || relatedPost.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                        </div>
                      </div>
                      <Link href={`/blog/${relatedPost.slug}`}>
                        <h3 className="text-sm sm:text-base md:text-lg font-semibold mb-1.5 sm:mb-2 md:mb-3 leading-tight group-hover:text-primary transition-colors cursor-pointer line-clamp-2 break-words">
                          {relatedPost.title}
                        </h3>
                      </Link>
                      {relatedPost.excerpt && (
                        <p className="text-gray-600 text-xs sm:text-sm leading-relaxed line-clamp-2 break-words">
                          {relatedPost.excerpt}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* CTA Section */}
        <section className="w-full py-6 sm:py-8 md:py-12 lg:py-16 bg-gradient-to-r from-primary via-accent to-primary/90 text-white">
          <div className="container px-3 sm:px-4 md:px-6 text-center max-w-4xl mx-auto">
            <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl font-bold mb-2 sm:mb-3 md:mb-4">
              Join the Conversation
            </h2>
            <p className="text-xs sm:text-sm md:text-base lg:text-lg xl:text-xl mb-4 sm:mb-6 md:mb-8 max-w-2xl mx-auto opacity-90 px-2 leading-relaxed">
              Have questions about this update? Join Harthio and connect with our community.
            </p>
            <div className="flex flex-col xs:flex-row gap-2 sm:gap-3 md:gap-4 justify-center max-w-xs xs:max-w-sm sm:max-w-none mx-auto">
              <Button className="bg-white text-primary hover:bg-gray-100 px-3 sm:px-4 md:px-6 py-2 sm:py-2.5 md:py-3 w-full xs:w-auto text-xs sm:text-sm md:text-base" asChild>
                <Link href="/signup" className="flex items-center justify-center">
                  Join Harthio
                  <ArrowRight className="ml-1.5 sm:ml-2 h-3 w-3 sm:h-4 sm:w-4" />
                </Link>
              </Button>
              <Button 
                variant="outline" 
                className="border-white text-white hover:bg-white hover:text-primary px-3 sm:px-4 md:px-6 py-2 sm:py-2.5 md:py-3 w-full xs:w-auto text-xs sm:text-sm md:text-base"
                onClick={shareOnTwitter}
              >
                <span className="flex items-center justify-center">
                  Ask on X
                  <ExternalLink className="ml-1.5 sm:ml-2 h-3 w-3 sm:h-4 sm:w-4" />
                </span>
              </Button>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-4 sm:py-6 md:py-8">
        <div className="container px-3 sm:px-4 md:px-6">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-4">
            <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3 md:gap-4 text-center sm:text-left">
              <Logo />
              <p className="text-xs text-gray-400 break-words">&copy; 2025 Stria Technologies All rights reserved.</p>
            </div>
            <nav className="flex gap-3 sm:gap-4 md:gap-6 text-xs">
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