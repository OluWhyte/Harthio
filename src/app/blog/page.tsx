"use client";

// Force dynamic rendering
export const dynamic = 'force-dynamic';

import Link from "next/link";
import { Logo } from "@/components/common/logo";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  ArrowRight,
  Calendar,
  User,
  ArrowLeft,
  Heart,
  MessageCircle,
  ExternalLink,
} from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";
import { BlogService } from "@/lib/services/blog-service";
import { BlogPostWithAuthor } from "@/lib/database-types";

export default function BlogPage() {
  const [blogPosts, setBlogPosts] = useState<BlogPostWithAuthor[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());

  const categories = [
    "All",
    "Product Updates",
    "Features",
    "Community",
    "Tips & Tricks",
  ];

  useEffect(() => {
    loadBlogPosts();
  }, [selectedCategory]);

  const loadBlogPosts = async () => {
    try {
      setLoading(true);
      let posts: BlogPostWithAuthor[];

      if (selectedCategory === "All") {
        posts = await BlogService.getPublishedPosts(20);
      } else {
        posts = await BlogService.getPostsByCategory(selectedCategory, 20);
      }

      setBlogPosts(posts);

      // Load liked posts from localStorage (client-side only)
      const savedLikes = localStorage.getItem("harthio-blog-likes");
      if (savedLikes) {
        setLikedPosts(new Set(JSON.parse(savedLikes)));
      }
    } catch (error) {
      console.error("Error loading blog posts:", error);
    } finally {
      setLoading(false);
    }
  };

  const getUserIP = async (): Promise<string> => {
    try {
      const response = await fetch("/api/ip");
      const data = await response.json();
      return data.ip;
    } catch (error) {
      return "127.0.0.1"; // Fallback IP
    }
  };

  const handleLike = async (postId: string) => {
    try {
      const userIP = await getUserIP();
      const hasLiked = likedPosts.has(postId);

      if (hasLiked) {
        await BlogService.unlikePost(postId, userIP);
        setLikedPosts((prev) => {
          const newSet = new Set(prev);
          newSet.delete(postId);
          // Save to localStorage
          localStorage.setItem(
            "harthio-blog-likes",
            JSON.stringify([...newSet])
          );
          return newSet;
        });
      } else {
        await BlogService.likePost(postId, userIP, navigator.userAgent);
        setLikedPosts((prev) => {
          const newSet = new Set(prev).add(postId);
          // Save to localStorage
          localStorage.setItem(
            "harthio-blog-likes",
            JSON.stringify([...newSet])
          );
          return newSet;
        });
      }

      // Refresh posts to get updated like counts
      loadBlogPosts();
    } catch (error) {
      console.error("Error toggling like:", error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Header */}
      <header className="px-4 lg:px-6 h-16 flex items-center border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <Link
          href="/"
          className="flex items-center justify-center"
          prefetch={false}
        >
          <Logo />
        </Link>
        <nav className="ml-auto flex gap-2 sm:gap-4 items-center">
          <Button variant="ghost" asChild className="hidden sm:flex">
            <Link href="/" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Home
            </Link>
          </Button>
          <Button variant="ghost" asChild className="text-sm px-2 sm:px-4">
            <Link href="/login">Log In</Link>
          </Button>
          <Button
            asChild
            className="bg-primary hover:bg-primary/90 text-sm sm:text-base px-3 sm:px-4"
          >
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
        <section className="w-full py-12 md:py-20 bg-background">
          <div className="container px-4 md:px-6">
            <div className="text-center max-w-3xl mx-auto">
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-6 bg-gradient-to-r from-primary via-accent to-primary/80 bg-clip-text text-transparent">
                Harthio News & Updates
              </h1>
              <p className="text-lg sm:text-xl text-gray-600 mb-8 px-4">
                Stay updated with the latest product news, feature releases, and
                community highlights from the Harthio team.
              </p>

              {/* Category Filter */}
              <div className="flex flex-wrap justify-center gap-2 mb-8 px-4">
                {categories.map((category) => (
                  <Button
                    key={category}
                    variant={
                      category === selectedCategory ? "default" : "outline"
                    }
                    size="sm"
                    onClick={() => setSelectedCategory(category)}
                    className={`text-xs sm:text-sm ${
                      category === selectedCategory
                        ? "bg-primary hover:bg-primary/90 text-white"
                        : ""
                    }`}
                  >
                    {category}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Featured Post */}
        {!loading && blogPosts.length > 0 && (
          <section className="w-full py-12">
            <div className="container px-4 md:px-6">
              <div className="mb-8">
                <h2 className="text-2xl font-bold mb-4">Latest Update</h2>
              </div>

              <Card className="overflow-hidden hover:shadow-lg transition-shadow">
                <div className="grid md:grid-cols-2 gap-0">
                  {blogPosts[0].featured_image_url && (
                    <div className="relative h-48 sm:h-64 md:h-full">
                      <Image
                        src={blogPosts[0].featured_image_url}
                        alt={blogPosts[0].title}
                        fill
                        className="object-cover"
                      />
                    </div>
                  )}
                  <CardContent className="p-4 sm:p-6 md:p-8 flex flex-col justify-center">
                    <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-500 mb-4">
                      <span className="bg-primary/10 text-primary px-2 py-1 rounded-full text-xs font-medium">
                        {blogPosts[0].category}
                      </span>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
                        <span className="hidden sm:inline">
                          {formatDate(
                            blogPosts[0].published_at || blogPosts[0].created_at
                          )}
                        </span>
                        <span className="sm:hidden">
                          {new Date(
                            blogPosts[0].published_at || blogPosts[0].created_at
                          ).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                      </div>
                    </div>
                    <h3 className="text-lg sm:text-xl md:text-2xl font-bold mb-3 sm:mb-4 leading-tight">
                      {blogPosts[0].title}
                    </h3>
                    <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6 leading-relaxed">
                      {blogPosts[0].excerpt}
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-gray-400" />
                          <span className="text-sm text-gray-600">
                            {blogPosts[0].author?.full_name || "Harthio Team"}
                          </span>
                        </div>
                        <button
                          onClick={() => handleLike(blogPosts[0].id)}
                          className="flex items-center gap-1 text-sm text-gray-500 hover:text-primary transition-colors"
                        >
                          <Heart
                            className={`h-4 w-4 ${
                              likedPosts.has(blogPosts[0].id)
                                ? "fill-primary text-primary"
                                : ""
                            }`}
                          />
                          {blogPosts[0].like_count || 0}
                        </button>
                      </div>
                      <Button variant="outline" className="group">
                        <Link
                          href={`/blog/${blogPosts[0].slug}`}
                          className="flex items-center"
                        >
                          Read More
                          <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </div>
              </Card>
            </div>
          </section>
        )}

        {/* Blog Grid */}
        <section className="w-full py-12 bg-gray-50">
          <div className="container px-4 md:px-6">
            <div className="mb-8 flex items-center justify-between">
              <h2 className="text-2xl font-bold mb-4">All Updates</h2>
              {blogPosts.length === 0 && !loading && (
                <p className="text-gray-500">
                  No blog posts found. Check back soon for updates!
                </p>
              )}
            </div>

            {loading ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {[...Array(6)].map((_, i) => (
                  <Card key={i} className="overflow-hidden">
                    <div className="h-48 bg-gray-200 animate-pulse" />
                    <CardContent className="p-6">
                      <div className="h-4 bg-gray-200 rounded animate-pulse mb-3" />
                      <div className="h-6 bg-gray-200 rounded animate-pulse mb-3" />
                      <div className="h-16 bg-gray-200 rounded animate-pulse mb-4" />
                      <div className="flex justify-between">
                        <div className="h-4 bg-gray-200 rounded animate-pulse w-24" />
                        <div className="h-4 bg-gray-200 rounded animate-pulse w-20" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                {blogPosts.slice(1).map((post) => (
                  <Card
                    key={post.id}
                    className="overflow-hidden hover:shadow-lg transition-shadow group"
                  >
                    {post.featured_image_url && (
                      <div className="relative h-40 sm:h-48">
                        <Image
                          src={post.featured_image_url}
                          alt={post.title}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    )}
                    <CardContent className="p-4 sm:p-6">
                      <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-500 mb-3">
                        <span className="bg-primary/10 text-primary px-2 py-1 rounded-full text-xs font-medium">
                          {post.category}
                        </span>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span className="hidden sm:inline">
                            {formatDate(post.published_at || post.created_at)}
                          </span>
                          <span className="sm:hidden">
                            {new Date(
                              post.published_at || post.created_at
                            ).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                            })}
                          </span>
                        </div>
                      </div>
                      <Link href={`/blog/${post.slug}`}>
                        <h3 className="text-base sm:text-lg font-semibold mb-3 leading-tight group-hover:text-primary transition-colors cursor-pointer">
                          {post.title}
                        </h3>
                      </Link>
                      <p className="text-gray-600 text-sm mb-4 leading-relaxed line-clamp-3">
                        {post.excerpt}
                      </p>
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div className="flex items-center gap-3 sm:gap-4">
                          <div className="flex items-center gap-2">
                            <User className="h-3 w-3 sm:h-4 sm:w-4 text-gray-400" />
                            <span className="text-xs sm:text-sm text-gray-600 truncate">
                              {post.author?.full_name || "Harthio Team"}
                            </span>
                          </div>
                          <button
                            onClick={() => handleLike(post.id)}
                            className="flex items-center gap-1 text-xs sm:text-sm text-gray-500 hover:text-primary transition-colors"
                          >
                            <Heart
                              className={`h-3 w-3 sm:h-4 sm:w-4 ${
                                likedPosts.has(post.id)
                                  ? "fill-primary text-primary"
                                  : ""
                              }`}
                            />
                            {post.like_count || 0}
                          </button>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            asChild
                            className="text-xs sm:text-sm px-2 sm:px-3"
                          >
                            <Link
                              href={`https://twitter.com/intent/tweet?text=Check out this update from @harthio_: ${post.title}&url=${window.location.origin}/blog/${post.slug}`}
                              target="_blank"
                              className="flex items-center gap-1"
                            >
                              <MessageCircle className="h-3 w-3" />
                              <span className="hidden sm:inline">Ask on X</span>
                              <span className="sm:hidden">X</span>
                              <ExternalLink className="h-3 w-3" />
                            </Link>
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Community CTA */}
        <section className="w-full py-12 sm:py-16 bg-gradient-to-r from-primary via-accent to-primary text-white">
          <div className="container px-4 md:px-6 text-center">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4">
              Join the Conversation
            </h2>
            <p className="text-lg sm:text-xl mb-8 max-w-2xl mx-auto opacity-90 px-4">
              Have questions about our updates? Want to discuss a feature? Join
              our community and connect with others.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-md sm:max-w-none mx-auto">
              <Button
                className="bg-white text-primary hover:bg-gray-100 px-6 py-3 w-full sm:w-auto"
                asChild
              >
                <Link
                  href="/signup"
                  className="flex items-center justify-center"
                >
                  Join Harthio
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button
                variant="outline"
                className="border-white text-white hover:bg-white hover:text-primary px-6 py-3 w-full sm:w-auto"
                asChild
              >
                <Link
                  href="https://twitter.com/harthio_"
                  target="_blank"
                  className="flex items-center justify-center"
                >
                  Follow on X
                  <ExternalLink className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
            <p className="text-xs sm:text-sm opacity-75 mt-4">
              Ask questions directly on X @harthio_
            </p>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col sm:flex-row justify-between items-center">
            <div className="flex items-center gap-4 mb-4 sm:mb-0">
              <Logo />
              <p className="text-sm text-gray-400">
                &copy; 2025 Stria Technologies All rights reserved.
              </p>
            </div>
            <nav className="flex gap-6 text-sm">
              <Link
                href="/privacy"
                className="text-gray-400 hover:text-white transition-colors"
              >
                Privacy
              </Link>
              <Link
                href="/terms"
                className="text-gray-400 hover:text-white transition-colors"
              >
                Terms
              </Link>
              <Link
                href="/contact"
                className="text-gray-400 hover:text-white transition-colors"
              >
                Contact
              </Link>
            </nav>
          </div>
        </div>
      </footer>
    </div>
  );
}
