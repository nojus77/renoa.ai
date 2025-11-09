/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  async redirects() {
    return [
      {
        source: '/blog/:path*',
        destination: 'https://slategrey-weasel-593990.hostingersite.com/blog/:path*',
        permanent: false,
      },
    ];
  },
};

export default nextConfig;

