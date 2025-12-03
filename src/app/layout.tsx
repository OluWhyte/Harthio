
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import dynamic from 'next/dynamic';
import { Toaster } from "@/components/ui/toaster"
import { AuthProvider } from '@/components/harthio/auth-provider';
import { SWRProvider } from '@/components/common/swr-provider';

// Lazy load non-critical components
const AppPerformanceProvider = dynamic(() => import('@/components/common/app-performance-provider').then(mod => ({ default: mod.AppPerformanceProvider })), { ssr: false });
const Analytics = dynamic(() => import('@/components/seo/analytics').then(mod => ({ default: mod.Analytics })), { ssr: false });
const ProactiveAIMonitor = dynamic(() => import('@/components/harthio/proactive-ai-monitor').then(mod => ({ default: mod.ProactiveAIMonitor })), { ssr: false });
const PerformanceMonitor = dynamic(() => import('@/components/common/performance-monitor').then(mod => ({ default: mod.PerformanceMonitor })), { ssr: false });

// Optimize font loading with next/font - only load weights you actually use
const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  preload: true,
  variable: '--font-inter',
  weight: ['400', '500', '600', '700'], // Reduced from 7 to 4 weights
  fallback: ['system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
});

export const metadata: Metadata = {
  title: 'Harthio - Find Someone Who Truly Gets It',
  description: 'Connect with people who understand your struggles. Schedule meaningful conversations about business stress, life changes, and personal growth with perfect matches, not random strangers.',
  keywords: 'meaningful conversations, emotional support, video calls, mental health, peer support, loneliness, connection, safe space',
  authors: [{ name: 'Harthio Team' }],
  creator: 'Harthio',
  publisher: 'Harthio',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://harthio.com'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'Harthio - Find Someone Who Truly Gets It',
    description: 'Connect with people who understand your struggles. Schedule meaningful conversations with perfect matches, not random strangers.',
    url: 'https://harthio.com',
    siteName: 'Harthio',
    images: [{
      url: '/og-image.jpg',
      width: 1200,
      height: 630,
      alt: 'Harthio - Meaningful Conversations Platform'
    }],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Harthio - Find Someone Who Truly Gets It',
    description: 'Connect with people who understand your struggles. Schedule meaningful conversations with perfect matches.',
    creator: '@harthio_',
    site: '@harthio_',
    images: ['/og-image.jpg'],
  },
  robots: {
    index: true,
    follow: true,
    nocache: true,
    googleBot: {
      index: true,
      follow: true,
      noimageindex: false,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={inter.variable}>
      <head>
        {/* Critical resource hints */}
        <link rel="preconnect" href={process.env.NEXT_PUBLIC_SUPABASE_URL || ''} crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://fonts.googleapis.com" />
        <link rel="dns-prefetch" href="https://fonts.gstatic.com" />
        <link rel="dns-prefetch" href="https://www.google-analytics.com" />
      </head>
      <body className={`${inter.className} antialiased`}>
        <SWRProvider>
          <AppPerformanceProvider>
            <AuthProvider>
              <ProactiveAIMonitor />
              {children}
            </AuthProvider>
            <Toaster />
          </AppPerformanceProvider>
        </SWRProvider>
        <PerformanceMonitor />
        <Analytics />
      </body>
    </html>
  );
}
