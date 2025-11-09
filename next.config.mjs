/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  async rewrites() {
    return [
      {
        source: '/blog/:path*',
        destination: 'https://blog.renoa.ai/blog/:path*',
      },
    ];
  },
};

export default nextConfig;