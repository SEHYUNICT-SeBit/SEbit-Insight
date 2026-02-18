/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // output: 'export', // 동적 라우트([id]) 사용으로 제거 - Cloudflare Pages에서 SSR 지원
  images: {
    unoptimized: true,
  },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8800',
  },
};

module.exports = nextConfig;
