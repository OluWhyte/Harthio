/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Simplified webpack configuration
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
      };
    }
    return config;
  },
  // Ensure proper asset loading for mobile/ngrok
  generateEtags: false,
  experimental: {
    serverActions: {
      allowedOrigins: [
        'localhost:3000', 
        'harthio.com', 
        '*.local', 
        '192.168.*', 
        '172.*', 
        '10.*',
        // Add HTTPS variants for mobile testing
        'https://localhost:3000',
        'https://192.168.*:3000',
        'https://172.*:3000',
        'https://10.*:3000',
        // Add ngrok domains
        '*.ngrok.io',
        '*.ngrok-free.app'
      ],
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'i.imgur.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'raw.githubusercontent.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
  // Security and mobile support headers
  async headers() {
    return process.env.NODE_ENV === 'development' ? [
      {
        source: '/(.*)',
        headers: [
          // OWASP Security headers for development
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          // Relaxed CSP for development
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self' 'unsafe-eval' 'unsafe-inline' data: blob:",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://vercel.live https://*.ngrok-free.app https://*.ngrok.io https://session.harthio.com https://www.googletagmanager.com https://www.google-analytics.com https://*.googletagmanager.com https://*.google-analytics.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "img-src 'self' data: blob: https: http:",
              "font-src 'self' data: https://fonts.gstatic.com",
              "connect-src 'self' https: wss: ws: https://session.harthio.com wss://session.harthio.com https://www.google-analytics.com https://analytics.google.com https://stats.g.doubleclick.net",
              "media-src 'self' blob: data: https://session.harthio.com https://*.daily.co",
              "frame-src 'self' https://session.harthio.com https://*.daily.co",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'"
            ].join('; '),
          },
          // Allow camera/microphone access
          {
            key: 'Permissions-Policy',
            value: 'camera=*, microphone=*, display-capture=*',
          },
        ],
      },
    ] : [
      {
        source: '/(.*)',
        headers: [
          // OWASP Enhanced Security Headers for Production
          {
            key: 'X-Frame-Options',
            value: 'DENY', // Stronger than SAMEORIGIN - prevents all framing
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin', // More secure
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on', // Performance + Security
          },
          {
            key: 'X-Download-Options',
            value: 'noopen', // Prevent IE from executing downloads
          },
          {
            key: 'X-Permitted-Cross-Domain-Policies',
            value: 'none', // Restrict Adobe Flash/PDF cross-domain
          },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self' https://*.ngrok-free.app https://*.ngrok.io",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://vercel.live https://js.stripe.com https://*.ngrok-free.app https://*.ngrok.io https://session.harthio.com https://www.googletagmanager.com https://www.google-analytics.com https://*.googletagmanager.com https://*.google-analytics.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://*.ngrok-free.app https://*.ngrok.io",
              "img-src 'self' data: https://images.unsplash.com https://res.cloudinary.com https://i.imgur.com https://raw.githubusercontent.com https://placehold.co https://*.supabase.co",
              "font-src 'self' data: https://fonts.gstatic.com",
              "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://vercel.live https://api.resend.com https://*.ngrok-free.app https://*.ngrok.io https://session.harthio.com wss://session.harthio.com https://www.google-analytics.com https://analytics.google.com https://stats.g.doubleclick.net",
              "media-src 'self' blob: https://session.harthio.com https://*.daily.co",
              "frame-src 'self' https://session.harthio.com https://*.daily.co",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "frame-ancestors 'none'"
            ].join('; '),
          },
          // Allow camera/microphone access
          {
            key: 'Permissions-Policy',
            value: 'camera=*, microphone=*, display-capture=*',
          },
        ],
      },
      {
        source: '/api/(.*)',
        headers: [
          // API-specific security headers
          {
            key: 'Cache-Control',
            value: 'no-store, no-cache, must-revalidate',
          },
          {
            key: 'Pragma',
            value: 'no-cache',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
