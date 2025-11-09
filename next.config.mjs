/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  async rewrites() {
    return [
      {
        source: '/blog/:path*',
        destination: 'https://slategrey-weasel-593990.hostingersite.com/blog/:path*',
      },
    ];
  },
};

export default nextConfig;