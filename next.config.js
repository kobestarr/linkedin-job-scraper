/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable standalone output for Docker deployments
  output: 'standalone',
  // Exclude legacy src/ folder from Next.js compilation
  webpack: (config) => {
    config.externals = [...(config.externals || []), 'apify-client', 'googleapis', 'node-cron'];
    return config;
  },
  // Enable React strict mode for better development experience
  reactStrictMode: true,
  // Image optimization for company logos
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'logo.clearbit.com',
      },
      {
        protocol: 'https',
        hostname: 'img.logo.dev',
      },
      {
        protocol: 'https',
        hostname: '**.licdn.com',
      },
      {
        protocol: 'https',
        hostname: 'ui-avatars.com',
      },
    ],
  },
};

module.exports = nextConfig;
