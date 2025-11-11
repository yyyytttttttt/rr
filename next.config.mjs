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
    ],
  },

  experimental: {
    serverActions: {},            // если используешь Server Actions
  },

  // В продакшне полезно: сорсмапы на сервере выключить (по желанию)
  productionBrowserSourceMaps: false,
};

export default nextConfig;
