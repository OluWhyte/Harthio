
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from "@/components/ui/toaster"
import { AuthProvider } from '@/components/harthio/auth-provider';
import { AppPerformanceProvider } from '@/components/common/app-performance-provider';
import { Analytics } from '@/components/seo/analytics';
import { ProactiveAIMonitor } from '@/components/harthio/proactive-ai-monitor';
import { SWRProvider } from '@/components/common/swr-provider';
import { PerformanceMonitor } from '@/components/common/performance-monitor';

// Optimize font loading with next/font
const inter = Inter({
  subsets: ['latin'],
  display: 'swap', // Show fallback font immediately
  preload: true,
  variable: '--font-inter',
  weight: ['300', '400', '500', '600', '700', '800', '900'],
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
        {/* Preconnect to external domains for faster loading */}
        <link rel="preconnect" href="https://images.unsplash.com" />
        <link rel="dns-prefetch" href="https://api.supabase.co" />
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
