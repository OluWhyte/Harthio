/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
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
    ],
  },
  // Headers for better mobile support
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          // Allow camera/microphone access from local network
          {
            key: 'Permissions-Policy',
            value: 'camera=*, microphone=*, display-capture=*',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
