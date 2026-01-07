/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',           // <— важно для Docker/Dokploy
  reactStrictMode: true,
  poweredByHeader: false,         // убрать X-Powered-By
  trailingSlash: false,

  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
      { protocol: 'https', hostname: 'res.cloudinary.com' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
    ],
  },

  experimental: {
    serverActions: {},            // если используешь Server Actions
  },

  // В продакшне полезно: сорсмапы на сервере выключить (по желанию)
  productionBrowserSourceMaps: false,

  // CORS headers для мобильного приложения
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: 'http://app-app-0yooux-1c3358-176-124-197-94.traefik.me',
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type, Authorization, X-Requested-With, Accept, Origin, X-CSRF-Token',
          },
          {
            key: 'Access-Control-Allow-Credentials',
            value: 'true',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
