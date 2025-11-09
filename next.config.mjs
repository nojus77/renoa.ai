/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  async rewrites() {
    return [
      {
        source: '/blog/:path*',
        destination: 'https://195.179.239.120/blog/:path*',
      },
    ];
  },
};

export default nextConfig;