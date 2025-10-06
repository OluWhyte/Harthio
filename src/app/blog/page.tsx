'use client';

import Link from 'next/link';
import { Logo } from '@/components/common/logo';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowRight, Calendar, User, ArrowLeft } from 'lucide-react';
import Image from 'next/image';

export default function BlogPage() {
  const blogPosts = [
    {
      id: 1,
      title: "Breaking the Silence: Why Loneliness is the Hidden Epidemic of Our Time",
      excerpt: "Explore the science behind loneliness and how meaningful conversations can be the antidote to isolation in our hyper-connected world.",
      author: "Dr. Sarah Chen",
      date: "December 15, 2024",
      readTime: "8 min read",
      image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      category: "Mental Health"
    },
    {
      id: 2,
      title: "From Startup Stress to Success: How Peer Support Changed Everything",
      excerpt: "A founder's journey from burnout to breakthrough, and how finding the right conversation partners made all the difference.",
      author: "Marcus Rodriguez",
      date: "December 12, 2024",
      readTime: "6 min read",
      image: "https://images.unsplash.com/photo-1556761175-b413da4baf72?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      category: "Entrepreneurship"
    },
    {
      id: 3,
      title: "The Art of Deep Listening: How to Be the Friend Everyone Needs",
      excerpt: "Master the skills that turn ordinary conversations into life-changing connections. Learn the techniques that make people feel truly heard.",
      author: "Emma Thompson",
      date: "December 10, 2024",
      readTime: "5 min read",
      image: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      category: "Communication"
    },
    {
      id: 4,
      title: "Career Transitions at 40+: Finding Your Tribe in Uncertain Times",
      excerpt: "Navigating career changes later in life doesn't have to be lonely. Discover how peer support groups are revolutionizing professional pivots.",
      author: "David Kim",
      date: "December 8, 2024",
      readTime: "7 min read",
      image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      category: "Career"
    },
    {
      id: 5,
      title: "Digital Detox Conversations: Rediscovering Human Connection",
      excerpt: "In a world of endless notifications, learn how intentional, scheduled conversations are bringing back the lost art of deep human connection.",
      author: "Lisa Park",
      date: "December 5, 2024",
      readTime: "4 min read",
      image: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      category: "Digital Wellness"
    },
    {
      id: 6,
      title: "The Science of Empathy: Why Some Conversations Heal and Others Hurt",
      excerpt: "Neuroscience reveals what makes conversations therapeutic. Discover the biological basis of emotional support and healing through dialogue.",
      author: "Dr. Michael Foster",
      date: "December 3, 2024",
      readTime: "9 min read",
      image: "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      category: "Psychology"
    }
  ];

  const categories = ["All", "Mental Health", "Entrepreneurship", "Communication", "Career", "Digital Wellness", "Psychology"];

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Header */}
      <header className="px-4 lg:px-6 h-16 flex items-center border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <Link href="/" className="flex items-center justify-center" prefetch={false}>
          <Logo />
        </Link>
        <nav className="ml-auto flex gap-4 sm:gap-6 items-center">
          <Button variant="ghost" asChild>
            <Link href="/" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Home
            </Link>
          </Button>
          <Button variant="ghost" asChild>
            <Link href="/login">Log In</Link>
          </Button>
          <Button asChild className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
            <Link href="/signup">Join Free <ArrowRight className="ml-2 h-4 w-4" /></Link>
          </Button>
        </nav>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="w-full py-12 md:py-20 bg-gradient-to-br from-purple-50 via-pink-50 to-indigo-50">
          <div className="container px-4 md:px-6">
            <div className="text-center max-w-3xl mx-auto">
              <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 bg-clip-text text-transparent">
                Stories of Connection
              </h1>
              <p className="text-xl text-gray-600 mb-8">
                Insights, stories, and research on building meaningful relationships and overcoming loneliness in the modern world.
              </p>
              
              {/* Category Filter */}
              <div className="flex flex-wrap justify-center gap-2 mb-8">
                {categories.map((category) => (
                  <Button
                    key={category}
                    variant={category === "All" ? "default" : "outline"}
                    size="sm"
                    className={category === "All" ? "bg-purple-600 hover:bg-purple-700" : ""}
                  >
                    {category}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Featured Post */}
        <section className="w-full py-12">
          <div className="container px-4 md:px-6">
            <div className="mb-8">
              <h2 className="text-2xl font-bold mb-4">Featured Article</h2>
            </div>
            
            <Card className="overflow-hidden hover:shadow-lg transition-shadow">
              <div className="grid md:grid-cols-2 gap-0">
                <div className="relative h-64 md:h-full">
                  <Image
                    src={blogPosts[0].image}
                    alt={blogPosts[0].title}
                    fill
                    className="object-cover"
                  />
                </div>
                <CardContent className="p-8 flex flex-col justify-center">
                  <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                    <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-xs font-medium">
                      {blogPosts[0].category}
                    </span>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {blogPosts[0].date}
                    </div>
                    <span>{blogPosts[0].readTime}</span>
                  </div>
                  <h3 className="text-2xl font-bold mb-4 leading-tight">
                    {blogPosts[0].title}
                  </h3>
                  <p className="text-gray-600 mb-6 leading-relaxed">
                    {blogPosts[0].excerpt}
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-600">{blogPosts[0].author}</span>
                    </div>
                    <Button variant="outline" className="group">
                      Read More
                      <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </div>
                </CardContent>
              </div>
            </Card>
          </div>
        </section>

        {/* Blog Grid */}
        <section className="w-full py-12 bg-gray-50">
          <div className="container px-4 md:px-6">
            <div className="mb-8">
              <h2 className="text-2xl font-bold mb-4">Latest Articles</h2>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {blogPosts.slice(1).map((post) => (
                <Card key={post.id} className="overflow-hidden hover:shadow-lg transition-shadow group cursor-pointer">
                  <div className="relative h-48">
                    <Image
                      src={post.image}
                      alt={post.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                      <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-xs font-medium">
                        {post.category}
                      </span>
                      <span>{post.readTime}</span>
                    </div>
                    <h3 className="text-lg font-semibold mb-3 leading-tight group-hover:text-purple-600 transition-colors">
                      {post.title}
                    </h3>
                    <p className="text-gray-600 text-sm mb-4 leading-relaxed">
                      {post.excerpt}
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-600">{post.author}</span>
                      </div>
                      <div className="flex items-center gap-1 text-sm text-gray-500">
                        <Calendar className="h-4 w-4" />
                        {post.date}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Newsletter Signup */}
        <section className="w-full py-16 bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 text-white">
          <div className="container px-4 md:px-6 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Never Miss a Story
            </h2>
            <p className="text-xl mb-8 max-w-2xl mx-auto opacity-90">
              Get weekly insights on building meaningful connections and overcoming loneliness delivered to your inbox.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-4 py-3 rounded-lg text-gray-900 placeholder-gray-500"
              />
              <Button className="bg-white text-purple-600 hover:bg-gray-100 px-6 py-3">
                Subscribe
              </Button>
            </div>
            <p className="text-sm opacity-75 mt-4">No spam, unsubscribe anytime</p>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col sm:flex-row justify-between items-center">
            <div className="flex items-center gap-4 mb-4 sm:mb-0">
              <Logo className="text-white" />
              <p className="text-sm text-gray-400">&copy; 2024 Harthio Inc. All rights reserved.</p>
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