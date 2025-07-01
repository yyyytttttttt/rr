/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  experimental: {
    serverActions: {}, // ⬅️ теперь без ошибки
  },

  trailingSlash: true,
};

module.exports = nextConfig;
