import { Metadata } from 'next'

interface SEOConfig {
  title?: string
  description?: string
  keywords?: string[]
  image?: string
  url?: string
  type?: 'website' | 'article' | 'profile'
  publishedTime?: string
  modifiedTime?: string
  author?: string
}

const defaultConfig = {
  siteName: 'Harthio',
  domain: 'https://harthio.com',
  defaultTitle: 'Harthio - Find Someone Who Truly Gets It',
  defaultDescription: 'Connect with people who understand your struggles. Schedule meaningful conversations about business stress, life changes, and personal growth with perfect matches, not random strangers.',
  defaultImage: '/og-image.jpg',
  twitterHandle: '@harthio_'
}

export function generateMetadata(config: SEOConfig = {}): Metadata {
  const title = config.title 
    ? `${config.title} | ${defaultConfig.siteName}`
    : defaultConfig.defaultTitle

  const description = config.description || defaultConfig.defaultDescription
  const image = config.image || defaultConfig.defaultImage
  const url = config.url ? `${defaultConfig.domain}${config.url}` : defaultConfig.domain

  return {
    title,
    description,
    keywords: config.keywords?.join(', '),
    authors: config.author ? [{ name: config.author }] : undefined,
    openGraph: {
      title,
      description,
      url,
      siteName: defaultConfig.siteName,
      images: [{
        url: image,
        width: 1200,
        height: 630,
        alt: title
      }],
      type: config.type || 'website',
      publishedTime: config.publishedTime,
      modifiedTime: config.modifiedTime
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [image],
      creator: defaultConfig.twitterHandle,
      site: defaultConfig.twitterHandle
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1
      }
    },
    verification: {
      google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
    }
  }
}

// Page-specific SEO configs
export const seoConfigs = {
  home: {
    title: 'Find Someone Who Truly Gets It',
    description: 'Connect with people who understand your struggles. Schedule meaningful conversations about business stress, life changes, and personal growth with perfect matches.',
    keywords: ['meaningful conversations', 'emotional support', 'video calls', 'mental health', 'peer support', 'loneliness', 'connection']
  },
  login: {
    title: 'Login',
    description: 'Sign in to your Harthio account and continue your meaningful conversations.',
    keywords: ['login', 'sign in', 'account access']
  },
  signup: {
    title: 'Join Free',
    description: 'Create your free Harthio account and start connecting with people who truly understand your journey.',
    keywords: ['sign up', 'register', 'join', 'free account', 'meaningful connections']
  },
  about: {
    title: 'About Us',
    description: 'Learn about Harthio\'s mission to create meaningful connections and end loneliness through intentional conversations.',
    keywords: ['about harthio', 'mission', 'meaningful connections', 'company story']
  },
  blog: {
    title: 'Blog',
    description: 'Insights on building meaningful connections, overcoming loneliness, and creating supportive communities.',
    keywords: ['blog', 'meaningful connections', 'mental health', 'community', 'support']
  }
}