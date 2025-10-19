import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://harthio.com'
  
  // Static pages
  const staticPages = [
    '',
    '/about',
    '/login',
    '/signup',
    '/blog',
    '/features',
    '/pricing',
    '/contact',
    '/privacy',
    '/terms',
    '/security',
    '/help'
  ]

  const staticRoutes = staticPages.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: route === '' ? 'daily' as const : 'weekly' as const,
    priority: route === '' ? 1 : route === '/blog' ? 0.8 : 0.7,
  }))

  // TODO: Add dynamic blog posts when blog service is ready
  // const blogPosts = await getBlogPosts()
  // const blogRoutes = blogPosts.map((post) => ({
  //   url: `${baseUrl}/blog/${post.slug}`,
  //   lastModified: new Date(post.updated_at),
  //   changeFrequency: 'monthly' as const,
  //   priority: 0.6,
  // }))

  return [
    ...staticRoutes,
    // ...blogRoutes
  ]
}