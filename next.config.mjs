/** @type {import('next').NextConfig} */
const nextConfig = {
  // output: 'export', // Disabled because we need Server Actions
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'img.youtube.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
