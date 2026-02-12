/** @type {import('next').NextConfig} */
const isHttps = (process.env.NEXTAUTH_URL ?? '').startsWith('https');
// When CSP_STRICT=1, nonce-based CSP is injected per-request in middleware.ts.
// Static CSP from headers() would override it and break nonce enforcement.
const cspStrict = process.env.CSP_STRICT === '1';

const nextConfig = {
  output: 'standalone',           // <— важно для Docker/Dokploy
  reactStrictMode: true,
  poweredByHeader: false,         // убрать X-Powered-By
  trailingSlash: false,

  // Strip ALL console.* in production builds.
  // logger.ts must NOT use console.* directly — use process.stdout.write or a transport.
  // NOTE: if logger.ts still calls console.error internally, switch it before enabling this.
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production'
      ? { exclude: ['error'] }   // keep 'error' until logger.ts is decoupled from console
      : false,
  },

  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
      { protocol: 'https', hostname: 'res.cloudinary.com' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'i.pravatar.cc' },
    ],
  },

  experimental: {
    serverActions: {},            // если используешь Server Actions
  },

  // В продакшне полезно: сорсмапы на сервере выключить (по желанию)
  productionBrowserSourceMaps: false,

  // Security headers + CORS (только /api/)
  async headers() {
    const securityHeaders = [
      { key: 'X-Content-Type-Options',   value: 'nosniff' },
      { key: 'X-Frame-Options',          value: 'DENY' },
      { key: 'Referrer-Policy',          value: 'strict-origin-when-cross-origin' },
      { key: 'Permissions-Policy',       value: 'camera=(), microphone=(), geolocation=()' },
      // HSTS only when the app is actually served over HTTPS
      ...(isHttps ? [{
        key: 'Strict-Transport-Security',
        value: 'max-age=63072000; includeSubDomains; preload',
      }] : []),
      // Static CSP (unsafe-inline/unsafe-eval required by Next.js hydration).
      // Set CSP_STRICT=1 to enable nonce-based CSP via middleware.ts instead.
      ...(!cspStrict ? [{
        key: 'Content-Security-Policy',
        value: [
          "default-src 'self'",
          "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://api-maps.yandex.ru",
          "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
          "font-src 'self' data: https://fonts.googleapis.com https://fonts.gstatic.com",
          "img-src 'self' data: https://res.cloudinary.com https://lh3.googleusercontent.com https://images.unsplash.com https://i.pravatar.cc https://*.yandex.ru https://*.yandex.net",
          "connect-src 'self' https://*.yandex.ru https://*.yandex.net",
          "frame-src 'self' https://yandex.ru https://maps.yandex.ru",
        ].join('; '),
      }] : []),
    ];

    const corsHeaders = [
      { key: 'Access-Control-Allow-Origin',     value: 'https://nikropolis.ru' },
      { key: 'Access-Control-Allow-Methods',    value: 'GET, POST, PUT, DELETE, PATCH, OPTIONS' },
      { key: 'Access-Control-Allow-Headers',    value: 'Content-Type, Authorization, X-Requested-With, Accept, Origin' },
      { key: 'Access-Control-Allow-Credentials', value: 'true' },
    ];

    return [
      {
        // Security headers на все маршруты
        source: '/:path*',
        headers: securityHeaders,
      },
      {
        // CORS только для API
        source: '/api/:path*',
        headers: corsHeaders,
      },
    ];
  },
};

export default nextConfig;
